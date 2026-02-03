'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowRight, ArrowLeft, Loader2, Check } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { usePhoneMask } from '@/lib/hooks/usePhoneMask';

const TOM_COMUNICACAO_OPTIONS = [
  'Formal',
  'Informal',
  'Descontraido',
  'Profissional',
  'Institucional',
  'Humoristico',
  'Inspiracional',
];

const ESTRUTURAS_PAUTA_OPTIONS = [
  'Carrossel Educativo',
  'Post de Dica',
  'Bastidores',
  'Depoimento de Cliente',
  'Promocao/Oferta',
  'Lancamento de Produto',
  'Conteudo Interativo (enquete, quiz)',
  'Reels/Video Curto',
  'Stories',
  'Outro',
];

interface FormData {
  nome_empresa: string;
  segmento: string;
  contexto_negocio: string;
  cs_responsavel: string;
  cs_whatsapp: string;
  ceo_nome: string;
  ceo_whatsapp: string;
  gerente_nome: string;
  gerente_whatsapp: string;
  tom_comunicacao: string;
  servicos_prestados: string;
  informacoes_projeto: string;
  prompt_especifico: string;
  estruturas_pautas: string[];
  estrutura_outro: string;
}

export default function ClientePage() {
  const [currentStep, setCurrentStep] = useState(-1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    nome_empresa: '',
    segmento: '',
    contexto_negocio: '',
    cs_responsavel: '',
    cs_whatsapp: '',
    ceo_nome: '',
    ceo_whatsapp: '',
    gerente_nome: '',
    gerente_whatsapp: '',
    tom_comunicacao: '',
    servicos_prestados: '',
    informacoes_projeto: '',
    prompt_especifico: '',
    estruturas_pautas: [],
    estrutura_outro: '',
  });

  const { applyPhoneMask, removeMask } = usePhoneMask();

  const totalSteps = 14;
  const progress = currentStep === -1 ? 0 : ((currentStep + 1) / totalSteps) * 100;

  const updateField = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleEstrutura = (value: string) => {
    setFormData((prev) => {
      const current = prev.estruturas_pautas;
      if (current.includes(value)) {
        return { ...prev, estruturas_pautas: current.filter((v) => v !== value) };
      } else {
        return { ...prev, estruturas_pautas: [...current, value] };
      }
    });
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else if (currentStep === 0) {
      setCurrentStep(-1);
    }
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return formData.nome_empresa.trim().length > 0;
      case 1:
        return true; // segmento is optional
      case 2:
        return formData.contexto_negocio.trim().length >= 50;
      case 3:
        return formData.cs_responsavel.trim().length > 0;
      case 4:
        return removeMask(formData.cs_whatsapp).length >= 10;
      case 5:
        return true; // ceo_nome is optional
      case 6:
        return true; // ceo_whatsapp is optional
      case 7:
        return true; // gerente_nome is optional
      case 8:
        return true; // gerente_whatsapp is optional
      case 9:
        return formData.servicos_prestados.trim().length > 0;
      case 10:
        return formData.tom_comunicacao.trim().length > 0;
      case 11:
        return formData.informacoes_projeto.trim().length >= 100;
      case 12:
        return true; // prompt_especifico is optional
      case 13:
        return true; // estruturas_pautas can be empty
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (currentStep === -1) {
      setCurrentStep(0);
      return;
    }

    if (validateCurrentStep()) {
      if (currentStep < totalSteps - 1) {
        setCurrentStep((prev) => prev + 1);
      }
    } else {
      if (currentStep === 2) {
        toast.error('Por favor, descreva o negocio com pelo menos 50 caracteres');
      } else if (currentStep === 11) {
        toast.error('Por favor, descreva o projeto com pelo menos 100 caracteres');
      } else {
        toast.error('Por favor, preencha este campo antes de continuar');
      }
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      toast.error('Por favor, preencha todos os campos obrigatorios');
      return;
    }

    setIsSubmitting(true);

    try {
      // Build estruturas_pautas array, including "Outro" text if selected
      const estruturas = [...formData.estruturas_pautas];
      if (estruturas.includes('Outro') && formData.estrutura_outro.trim()) {
        const outroIndex = estruturas.indexOf('Outro');
        estruturas[outroIndex] = `Outro: ${formData.estrutura_outro}`;
      }

      const payload = {
        nome_empresa: formData.nome_empresa,
        segmento: formData.segmento || null,
        contexto_negocio: formData.contexto_negocio,
        cs_responsavel: formData.cs_responsavel,
        cs_whatsapp: removeMask(formData.cs_whatsapp),
        ceo_nome: formData.ceo_nome || null,
        ceo_whatsapp: formData.ceo_whatsapp ? removeMask(formData.ceo_whatsapp) : null,
        gerente_nome: formData.gerente_nome || null,
        gerente_whatsapp: formData.gerente_whatsapp ? removeMask(formData.gerente_whatsapp) : null,
        tom_comunicacao: formData.tom_comunicacao,
        servicos_prestados: formData.servicos_prestados,
        informacoes_projeto: formData.informacoes_projeto,
        prompt_especifico: formData.prompt_especifico || null,
        estruturas_pautas: estruturas,
      };

      const response = await fetch('/api/cliente/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao cadastrar cliente');
      }

      setIsSuccess(true);
      toast.success('Cliente cadastrado com sucesso!');
    } catch (error: any) {
      console.error('Error submitting cliente:', error);
      toast.error(error.message || 'Erro ao cadastrar cliente');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitting) {
      if (currentStep === totalSteps - 1) {
        handleSubmit();
      } else {
        nextStep();
      }
    }
  };

  // Welcome Screen
  if (currentStep === -1) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6 py-8 font-[Roboto,sans-serif]">
        <div className="max-w-xl w-full text-center space-y-6 animate-in fade-in duration-500">
          <div className="flex justify-center mb-6">
            <Logo width={120} height={44} />
          </div>
          <h1 className="text-2xl md:text-4xl font-normal">Cadastro de Cliente</h1>
          <p className="text-base text-muted-foreground max-w-md mx-auto">
            Preencha as informacoes do cliente para configurar o sistema
          </p>
          <Button size="default" onClick={nextStep} className="text-sm px-6 py-5">
            Comecar
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Thank You Screen
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6 py-8 font-[Roboto,sans-serif]">
        <div className="max-w-xl w-full text-center space-y-6 animate-in fade-in duration-500">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl md:text-4xl font-normal">Cliente Cadastrado!</h1>
          <p className="text-base text-muted-foreground max-w-md mx-auto">
            As informacoes do cliente foram enviadas com sucesso para processamento.
          </p>
          <Button
            size="lg"
            onClick={() => {
              setCurrentStep(-1);
              setIsSuccess(false);
              setFormData({
                nome_empresa: '',
                segmento: '',
                contexto_negocio: '',
                cs_responsavel: '',
                cs_whatsapp: '',
                ceo_nome: '',
                ceo_whatsapp: '',
                gerente_nome: '',
                gerente_whatsapp: '',
                tom_comunicacao: '',
                servicos_prestados: '',
                informacoes_projeto: '',
                prompt_especifico: '',
                estruturas_pautas: [],
                estrutura_outro: '',
              });
            }}
            className="text-sm px-6 py-5"
          >
            Cadastrar Outro Cliente
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Single choice button for tom_comunicacao
  const SingleChoiceButton = ({
    label,
    value,
    index,
  }: {
    label: string;
    value: string;
    index: number;
  }) => (
    <button
      onClick={() => {
        updateField('tom_comunicacao', value);
        setTimeout(() => setCurrentStep((prev) => prev + 1), 300);
      }}
      className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all flex items-center gap-3 group"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-md bg-muted group-hover:bg-primary/80 group-hover:text-primary-foreground flex items-center justify-center text-sm font-medium">
        {String.fromCharCode(65 + index)}
      </div>
      <span className="text-sm">{label}</span>
    </button>
  );

  // Multiple choice button for estruturas
  const MultiChoiceButton = ({
    label,
    selected,
    onClick,
    index,
  }: {
    label: string;
    selected: boolean;
    onClick: () => void;
    index: number;
  }) => (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-all flex items-center gap-3 group ${
        selected
          ? 'border-primary bg-primary/10'
          : 'border-border hover:border-primary/50 hover:bg-accent/50'
      }`}
    >
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-sm font-medium ${
          selected
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted group-hover:bg-primary/80 group-hover:text-primary-foreground'
        }`}
      >
        {selected ? <Check className="h-4 w-4" /> : String.fromCharCode(65 + index)}
      </div>
      <span className="text-sm">{label}</span>
    </button>
  );

  const renderQuestion = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-normal">Qual e o nome da empresa?</h2>
            <Input
              value={formData.nome_empresa}
              onChange={(e) => updateField('nome_empresa', e.target.value)}
              placeholder="Digite o nome da empresa..."
              className="text-base h-12 bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary px-0"
              autoFocus
            />
            <div className="flex items-center gap-3">
              <Button size="default" variant="outline" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <Button size="default" onClick={nextStep} disabled={!formData.nome_empresa}>
                OK <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-normal">Qual e o segmento/nicho da empresa?</h2>
            <p className="text-muted-foreground">Opcional - pressione OK para pular</p>
            <Input
              value={formData.segmento}
              onChange={(e) => updateField('segmento', e.target.value)}
              placeholder="Ex: Odontologia, E-commerce, Restaurante..."
              className="text-base h-12 bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary px-0"
              autoFocus
            />
            <div className="flex items-center gap-3">
              <Button size="default" variant="outline" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <Button size="default" onClick={nextStep}>
                OK <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-normal">Descreva o contexto do negocio</h2>
            <p className="text-muted-foreground">Minimo 50 caracteres</p>
            <Textarea
              value={formData.contexto_negocio}
              onChange={(e) => updateField('contexto_negocio', e.target.value)}
              placeholder="Descreva o negocio do cliente, produtos/servicos oferecidos, diferenciais, etc."
              className="text-sm min-h-[120px] bg-transparent border-border focus-visible:ring-0 focus-visible:border-primary"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              {formData.contexto_negocio.length}/50 caracteres
            </p>
            <div className="flex items-center gap-3">
              <Button size="default" variant="outline" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <Button
                size="default"
                onClick={nextStep}
                disabled={formData.contexto_negocio.length < 50}
              >
                OK <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-normal">Qual e o nome do CS responsavel?</h2>
            <Input
              value={formData.cs_responsavel}
              onChange={(e) => updateField('cs_responsavel', e.target.value)}
              placeholder="Digite o nome do CS..."
              className="text-base h-12 bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary px-0"
              autoFocus
            />
            <div className="flex items-center gap-3">
              <Button size="default" variant="outline" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <Button size="default" onClick={nextStep} disabled={!formData.cs_responsavel}>
                OK <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-normal">Qual e o WhatsApp do CS?</h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 h-12 border-b border-border">
                <span className="text-xl">🇧🇷</span>
                <span className="text-muted-foreground">+55</span>
              </div>
              <Input
                value={formData.cs_whatsapp}
                onChange={(e) => updateField('cs_whatsapp', applyPhoneMask(e.target.value))}
                placeholder="(11) 99999-9999"
                className="text-base h-12 bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary px-0 flex-1"
                autoFocus
                maxLength={15}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button size="default" variant="outline" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <Button
                size="default"
                onClick={nextStep}
                disabled={removeMask(formData.cs_whatsapp).length < 10}
              >
                OK <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-normal">Qual e o nome do CEO/Proprietario?</h2>
            <p className="text-muted-foreground">Opcional - pressione OK para pular</p>
            <Input
              value={formData.ceo_nome}
              onChange={(e) => updateField('ceo_nome', e.target.value)}
              placeholder="Digite o nome do CEO..."
              className="text-base h-12 bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary px-0"
              autoFocus
            />
            <div className="flex items-center gap-3">
              <Button size="default" variant="outline" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <Button size="default" onClick={nextStep}>
                OK <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-normal">Qual e o WhatsApp do CEO?</h2>
            <p className="text-muted-foreground">Opcional - pressione OK para pular</p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 h-12 border-b border-border">
                <span className="text-xl">🇧🇷</span>
                <span className="text-muted-foreground">+55</span>
              </div>
              <Input
                value={formData.ceo_whatsapp}
                onChange={(e) => updateField('ceo_whatsapp', applyPhoneMask(e.target.value))}
                placeholder="(11) 99999-9999"
                className="text-base h-12 bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary px-0 flex-1"
                autoFocus
                maxLength={15}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button size="default" variant="outline" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <Button size="default" onClick={nextStep}>
                OK <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-normal">Qual e o nome do Gerente/Responsavel?</h2>
            <p className="text-muted-foreground">Opcional - pressione OK para pular</p>
            <Input
              value={formData.gerente_nome}
              onChange={(e) => updateField('gerente_nome', e.target.value)}
              placeholder="Digite o nome do gerente..."
              className="text-base h-12 bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary px-0"
              autoFocus
            />
            <div className="flex items-center gap-3">
              <Button size="default" variant="outline" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <Button size="default" onClick={nextStep}>
                OK <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-normal">Qual e o WhatsApp do Gerente?</h2>
            <p className="text-muted-foreground">Opcional - pressione OK para pular</p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 h-12 border-b border-border">
                <span className="text-xl">🇧🇷</span>
                <span className="text-muted-foreground">+55</span>
              </div>
              <Input
                value={formData.gerente_whatsapp}
                onChange={(e) => updateField('gerente_whatsapp', applyPhoneMask(e.target.value))}
                placeholder="(11) 99999-9999"
                className="text-base h-12 bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary px-0 flex-1"
                autoFocus
                maxLength={15}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button size="default" variant="outline" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <Button size="default" onClick={nextStep}>
                OK <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 9:
        return (
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-normal">Quais servicos sao prestados?</h2>
            <Textarea
              value={formData.servicos_prestados}
              onChange={(e) => updateField('servicos_prestados', e.target.value)}
              placeholder="Ex: Gestao de redes sociais (Instagram, Facebook), Trafego pago (Meta Ads), Design grafico..."
              className="text-sm min-h-[100px] bg-transparent border-border focus-visible:ring-0 focus-visible:border-primary"
              autoFocus
            />
            <div className="flex items-center gap-3">
              <Button size="default" variant="outline" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <Button size="default" onClick={nextStep} disabled={!formData.servicos_prestados}>
                OK <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 10:
        return (
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-normal">Qual e o tom de comunicacao?</h2>
            <div className="space-y-3">
              {TOM_COMUNICACAO_OPTIONS.map((tom, index) => (
                <SingleChoiceButton key={tom} label={tom} value={tom} index={index} />
              ))}
            </div>
            <Button size="default" variant="outline" onClick={prevStep}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
          </div>
        );

      case 11:
        return (
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-normal">Descreva as informacoes do projeto</h2>
            <p className="text-muted-foreground">
              Publico-alvo, objetivos, metas, particularidades do cliente... (min 100 caracteres)
            </p>
            <Textarea
              value={formData.informacoes_projeto}
              onChange={(e) => updateField('informacoes_projeto', e.target.value)}
              placeholder="Descreva o publico-alvo, objetivos, metas, particularidades do cliente, preferencias de conteudo, etc."
              className="text-sm min-h-[150px] bg-transparent border-border focus-visible:ring-0 focus-visible:border-primary"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              {formData.informacoes_projeto.length}/100 caracteres
            </p>
            <div className="flex items-center gap-3">
              <Button size="default" variant="outline" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <Button
                size="default"
                onClick={nextStep}
                disabled={formData.informacoes_projeto.length < 100}
              >
                OK <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 12:
        return (
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-normal">Prompt especifico para a IA</h2>
            <p className="text-muted-foreground">Opcional - pressione OK para pular</p>
            <Textarea
              value={formData.prompt_especifico}
              onChange={(e) => updateField('prompt_especifico', e.target.value)}
              placeholder="Instrucoes especiais para o RAG/IA ao gerar conteudo. Ex: 'Sempre mencionar sustentabilidade', 'Evitar termos tecnicos', 'Focar em beneficios emocionais'..."
              className="text-sm min-h-[100px] bg-transparent border-border focus-visible:ring-0 focus-visible:border-primary"
              autoFocus
            />
            <div className="flex items-center gap-3">
              <Button size="default" variant="outline" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <Button size="default" onClick={nextStep}>
                OK <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 13:
        return (
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-normal">Quais estruturas de pauta sao utilizadas?</h2>
            <p className="text-muted-foreground">Selecione todas que se aplicam - opcional</p>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {ESTRUTURAS_PAUTA_OPTIONS.map((estrutura, index) => (
                <MultiChoiceButton
                  key={estrutura}
                  label={estrutura}
                  selected={formData.estruturas_pautas.includes(estrutura)}
                  onClick={() => toggleEstrutura(estrutura)}
                  index={index}
                />
              ))}
            </div>

            {formData.estruturas_pautas.includes('Outro') && (
              <Input
                value={formData.estrutura_outro}
                onChange={(e) => updateField('estrutura_outro', e.target.value)}
                placeholder="Descreva o outro tipo de pauta..."
                className="text-base h-12 bg-transparent border border-border rounded-lg focus-visible:ring-0 focus-visible:border-primary px-3"
              />
            )}

            <div className="flex items-center gap-3">
              <Button size="default" variant="outline" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <Button size="default" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    Cadastrar Cliente <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-background font-[Roboto,sans-serif]">
      {/* Fixed Logo */}
      <div className="fixed top-4 left-4 md:top-6 md:left-6 z-50">
        <Logo width={100} height={36} />
      </div>

      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-muted z-50">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question Content */}
      <div className="flex items-center justify-center min-h-screen px-6 py-8 pt-16">
        <div className="max-w-lg w-full animate-in fade-in duration-300" onKeyPress={handleKeyPress}>
          {/* Question Number */}
          <div className="mb-3">
            <span className="text-xs text-muted-foreground">
              {currentStep + 1} → {totalSteps}
            </span>
          </div>

          {renderQuestion()}
        </div>
      </div>
    </div>
  );
}

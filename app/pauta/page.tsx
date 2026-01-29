'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowRight, ArrowLeft, Loader2, Check, Plus, Trash2 } from 'lucide-react';
import {
  TipoPauta,
  MetricaComValor,
  SOCIAL_MEDIA_OBJETIVOS,
  SOCIAL_MEDIA_PLATAFORMAS,
  SOCIAL_MEDIA_QUANTIDADE_POSTS,
  SOCIAL_MEDIA_FORMATOS,
  TRAFEGO_OBJETIVOS,
  TRAFEGO_PLATAFORMAS,
  TIPOS_CAMPANHA_POR_PLATAFORMA,
  EXEMPLOS_METRICAS,
} from '@/types/pauta';
import { Logo } from '@/components/Logo';

interface FormData {
  tipo_pauta?: TipoPauta;
  nome_cs: string;
  nome_cliente: string;
  objetivos: string[];
  plataformas: string[];
  quantidade_posts?: string;
  formatos_conteudo: string[];
  precisa_copy?: 'sim' | 'nao';
  precisa_legenda?: 'sim' | 'nao';
  tipo_campanha?: string;
  metricas: MetricaComValor[];
  campanha_especifica?: string;
  observacoes?: string;
}

export default function PautaPage() {
  const [currentStep, setCurrentStep] = useState(-1); // -1 = welcome screen
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    nome_cs: '',
    nome_cliente: '',
    objetivos: [],
    plataformas: [],
    formatos_conteudo: [],
    metricas: [{ id: crypto.randomUUID(), nome: '', valor: '' }],
  });

  // Define steps based on tipo_pauta
  const getTotalSteps = () => {
    if (!formData.tipo_pauta) return 1; // Just the tipo selection
    if (formData.tipo_pauta === 'social_media') return 10; // tipo + 9 questions
    return 9; // tipo + 8 questions for trafego (inclui tipo_campanha e métricas com valores)
  };

  const totalSteps = getTotalSteps();
  const progress = currentStep === -1 ? 0 : ((currentStep + 1) / totalSteps) * 100;

  const updateField = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayField = (field: 'objetivos' | 'plataformas' | 'formatos_conteudo', value: string) => {
    setFormData((prev) => {
      const currentArray = prev[field] || [];
      if (currentArray.includes(value)) {
        return { ...prev, [field]: currentArray.filter((v) => v !== value) };
      } else {
        return { ...prev, [field]: [...currentArray, value] };
      }
    });
  };

  // Funções para manipular métricas dinâmicas
  const addMetrica = () => {
    setFormData((prev) => ({
      ...prev,
      metricas: [...prev.metricas, { id: crypto.randomUUID(), nome: '', valor: '' }],
    }));
  };

  const removeMetrica = (id: string) => {
    if (formData.metricas.length > 1) {
      setFormData((prev) => ({
        ...prev,
        metricas: prev.metricas.filter((m) => m.id !== id),
      }));
    }
  };

  const updateMetrica = (id: string, field: 'nome' | 'valor', value: string) => {
    setFormData((prev) => ({
      ...prev,
      metricas: prev.metricas.map((m) => (m.id === id ? { ...m, [field]: value } : m)),
    }));
  };

  const preencherExemploMetrica = (index: number) => {
    const exemplo = EXEMPLOS_METRICAS[index % EXEMPLOS_METRICAS.length];
    const metricaId = formData.metricas[index]?.id;
    if (metricaId) {
      setFormData((prev) => ({
        ...prev,
        metricas: prev.metricas.map((m) =>
          m.id === metricaId ? { ...m, nome: exemplo.nome, valor: exemplo.valor } : m
        ),
      }));
    }
  };

  // Função para voltar
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else if (currentStep === 0) {
      setCurrentStep(-1);
    }
  };

  const validateCurrentStep = () => {
    // Step 0: tipo_pauta selection
    if (currentStep === 0) {
      return !!formData.tipo_pauta;
    }

    if (formData.tipo_pauta === 'social_media') {
      switch (currentStep) {
        case 1: return !!formData.nome_cs;
        case 2: return !!formData.nome_cliente;
        case 3: return formData.objetivos.length > 0;
        case 4: return formData.plataformas.length > 0;
        case 5: return !!formData.quantidade_posts;
        case 6: return formData.formatos_conteudo.length > 0;
        case 7: return !!formData.precisa_copy;
        case 8: return !!formData.precisa_legenda;
        case 9: return true; // observacoes is optional
        default: return true;
      }
    } else {
      // trafego
      switch (currentStep) {
        case 1: return !!formData.nome_cliente;
        case 2: return !!formData.nome_cs;
        case 3: return formData.objetivos.length > 0;
        case 4: return formData.plataformas.length > 0;
        case 5: return !!formData.tipo_campanha; // tipo de campanha obrigatório
        case 6: return formData.metricas.some((m) => m.nome.trim() && m.valor.trim()); // pelo menos 1 métrica com nome e valor
        case 7: return true; // campanha_especifica is optional
        case 8: return true; // observacoes is optional
        default: return true;
      }
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
      toast.error('Por favor, preencha este campo antes de continuar');
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/pauta/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao enviar pauta');
      }

      setIsSuccess(true);
      toast.success('Pauta enviada com sucesso!');
    } catch (error: any) {
      console.error('Error submitting pauta:', error);
      toast.error(error.message || 'Erro ao enviar pauta');
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
          <h1 className="text-2xl md:text-4xl font-normal">
            Nova Pauta
          </h1>
          <p className="text-base text-muted-foreground max-w-md mx-auto">
            Preencha as informações da pauta para o time de execução
          </p>
          <Button size="default" onClick={nextStep} className="text-sm px-6 py-5">
            Começar
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
          <h1 className="text-2xl md:text-4xl font-normal">
            Pauta Enviada!
          </h1>
          <p className="text-base text-muted-foreground max-w-md mx-auto">
            Sua pauta foi registrada com sucesso. O time de execução será notificado.
          </p>
          <Button
            size="lg"
            onClick={() => {
              setCurrentStep(-1);
              setIsSuccess(false);
              setFormData({
                nome_cs: '',
                nome_cliente: '',
                objetivos: [],
                plataformas: [],
                formatos_conteudo: [],
                metricas: [{ id: crypto.randomUUID(), nome: '', valor: '' }],
              });
            }}
            className="text-sm px-6 py-5"
          >
            Criar Nova Pauta
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Multiple choice button component
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

  // Single choice button component (auto advances)
  const SingleChoiceButton = ({
    label,
    value,
    field,
    index,
    autoSubmit = false,
  }: {
    label: string;
    value: string;
    field: keyof FormData;
    index: number;
    autoSubmit?: boolean;
  }) => (
    <button
      onClick={() => {
        updateField(field, value);
        if (autoSubmit) {
          setTimeout(() => handleSubmit(), 300);
        } else {
          setTimeout(() => setCurrentStep((prev) => prev + 1), 300);
        }
      }}
      className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all flex items-center gap-3 group"
      disabled={isSubmitting}
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-md bg-muted group-hover:bg-primary/80 group-hover:text-primary-foreground flex items-center justify-center text-sm font-medium">
        {String.fromCharCode(65 + index)}
      </div>
      <span className="text-sm">{label}</span>
      {isSubmitting && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
    </button>
  );

  // Render question based on current step
  const renderQuestion = () => {
    // Step 0: Select tipo_pauta
    if (currentStep === 0) {
      return (
        <div className="space-y-4">
          <h2 className="text-xl md:text-2xl font-normal">
            Qual é o tipo da pauta?
          </h2>
          <div className="space-y-3">
            <SingleChoiceButton
              label="Social Media"
              value="social_media"
              field="tipo_pauta"
              index={0}
            />
            <SingleChoiceButton
              label="Tráfego Pago"
              value="trafego"
              field="tipo_pauta"
              index={1}
            />
          </div>
        </div>
      );
    }

    // ============ SOCIAL MEDIA QUESTIONS ============
    if (formData.tipo_pauta === 'social_media') {
      switch (currentStep) {
        case 1:
          return (
            <div className="space-y-4">
              <h2 className="text-xl md:text-2xl font-normal">
                Qual é o nome do CS responsável?
              </h2>
              <Input
                value={formData.nome_cs}
                onChange={(e) => updateField('nome_cs', e.target.value)}
                placeholder="Digite o nome do CS..."
                className="text-base h-12 bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary px-0"
                autoFocus
              />
              <div className="flex items-center gap-3">
                <Button size="default" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button size="default" onClick={nextStep} disabled={!formData.nome_cs}>
                  OK <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          );

        case 2:
          return (
            <div className="space-y-4">
              <h2 className="text-xl md:text-2xl font-normal">
                Qual é o nome do cliente/empresa?
              </h2>
              <Input
                value={formData.nome_cliente}
                onChange={(e) => updateField('nome_cliente', e.target.value)}
                placeholder="Digite o nome do cliente..."
                className="text-base h-12 bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary px-0"
                autoFocus
              />
              <div className="flex items-center gap-3">
                <Button size="default" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button size="default" onClick={nextStep} disabled={!formData.nome_cliente}>
                  OK <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          );

        case 3:
          return (
            <div className="space-y-4">
              <h2 className="text-xl md:text-2xl font-normal">
                Qual é o objetivo principal da pauta?
              </h2>
              <p className="text-muted-foreground">Pode marcar mais de um</p>
              <div className="space-y-3">
                {SOCIAL_MEDIA_OBJETIVOS.map((objetivo, index) => (
                  <MultiChoiceButton
                    key={objetivo}
                    label={objetivo}
                    selected={formData.objetivos.includes(objetivo)}
                    onClick={() => toggleArrayField('objetivos', objetivo)}
                    index={index}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <Button size="default" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button size="default" onClick={nextStep} disabled={formData.objetivos.length === 0}>
                  OK <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          );

        case 4:
          return (
            <div className="space-y-4">
              <h2 className="text-xl md:text-2xl font-normal">
                Quais plataformas serão trabalhadas?
              </h2>
              <p className="text-muted-foreground">Pode marcar mais de uma</p>
              <div className="space-y-3">
                {SOCIAL_MEDIA_PLATAFORMAS.map((plataforma, index) => (
                  <MultiChoiceButton
                    key={plataforma}
                    label={plataforma}
                    selected={formData.plataformas.includes(plataforma)}
                    onClick={() => toggleArrayField('plataformas', plataforma)}
                    index={index}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <Button size="default" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button size="default" onClick={nextStep} disabled={formData.plataformas.length === 0}>
                  OK <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          );

        case 5:
          return (
            <div className="space-y-4">
              <h2 className="text-xl md:text-2xl font-normal">
                Qual a quantidade de posts solicitada?
              </h2>
              <div className="space-y-3">
                {SOCIAL_MEDIA_QUANTIDADE_POSTS.map((qtd, index) => (
                  <SingleChoiceButton
                    key={qtd}
                    label={qtd}
                    value={qtd}
                    field="quantidade_posts"
                    index={index}
                  />
                ))}
              </div>
            </div>
          );

        case 6:
          return (
            <div className="space-y-4">
              <h2 className="text-xl md:text-2xl font-normal">
                Quais formatos de conteúdo serão produzidos?
              </h2>
              <p className="text-muted-foreground">Pode marcar mais de um</p>
              <div className="space-y-3">
                {SOCIAL_MEDIA_FORMATOS.map((formato, index) => (
                  <MultiChoiceButton
                    key={formato}
                    label={formato}
                    selected={formData.formatos_conteudo.includes(formato)}
                    onClick={() => toggleArrayField('formatos_conteudo', formato)}
                    index={index}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <Button size="default" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button size="default" onClick={nextStep} disabled={formData.formatos_conteudo.length === 0}>
                  OK <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          );

        case 7:
          return (
            <div className="space-y-4">
              <h2 className="text-xl md:text-2xl font-normal">
                O conteúdo precisa de copy (texto)?
              </h2>
              <div className="space-y-3">
                <SingleChoiceButton label="Sim" value="sim" field="precisa_copy" index={0} />
                <SingleChoiceButton label="Não" value="nao" field="precisa_copy" index={1} />
              </div>
              <Button size="default" variant="outline" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
            </div>
          );

        case 8:
          return (
            <div className="space-y-4">
              <h2 className="text-xl md:text-2xl font-normal">
                O post precisa de descrição/legenda?
              </h2>
              <div className="space-y-3">
                <SingleChoiceButton label="Sim" value="sim" field="precisa_legenda" index={0} />
                <SingleChoiceButton label="Não" value="nao" field="precisa_legenda" index={1} />
              </div>
              <Button size="default" variant="outline" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
            </div>
          );

        case 9:
          return (
            <div className="space-y-4">
              <h2 className="text-xl md:text-2xl font-normal">
                Observações importantes do CS
              </h2>
              <p className="text-muted-foreground">Opcional - pressione OK para finalizar</p>
              <Textarea
                value={formData.observacoes || ''}
                onChange={(e) => updateField('observacoes', e.target.value)}
                placeholder="Digite suas observações..."
                className="text-sm min-h-[100px] bg-transparent border-border focus-visible:ring-0 focus-visible:border-primary"
                autoFocus
              />
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
                      Enviar Pauta <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
      }
    }

    // ============ TRÁFEGO PAGO QUESTIONS ============
    if (formData.tipo_pauta === 'trafego') {
      // Obter tipos de campanha baseado na plataforma selecionada
      const getTiposCampanha = () => {
        if (formData.plataformas.length === 0) return [];
        // Se selecionou apenas uma plataforma, mostra os tipos dela
        if (formData.plataformas.length === 1) {
          return TIPOS_CAMPANHA_POR_PLATAFORMA[formData.plataformas[0]] || [];
        }
        // Se selecionou mais de uma, mostra opção genérica
        return TIPOS_CAMPANHA_POR_PLATAFORMA['Mais de uma'] || [];
      };

      switch (currentStep) {
        case 1:
          return (
            <div className="space-y-4">
              <h2 className="text-xl md:text-2xl font-normal">
                Nome do cliente
              </h2>
              <Input
                value={formData.nome_cliente}
                onChange={(e) => updateField('nome_cliente', e.target.value)}
                placeholder="Digite o nome do cliente..."
                className="text-base h-12 bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary px-0"
                autoFocus
              />
              <div className="flex items-center gap-3">
                <Button size="default" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button size="default" onClick={nextStep} disabled={!formData.nome_cliente}>
                  OK <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          );

        case 2:
          return (
            <div className="space-y-4">
              <h2 className="text-xl md:text-2xl font-normal">
                CS responsável
              </h2>
              <p className="text-muted-foreground">Ex: Rodrigo, Ana, João</p>
              <Input
                value={formData.nome_cs}
                onChange={(e) => updateField('nome_cs', e.target.value)}
                placeholder="Digite o nome do CS..."
                className="text-base h-12 bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary px-0"
                autoFocus
              />
              <div className="flex items-center gap-3">
                <Button size="default" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button size="default" onClick={nextStep} disabled={!formData.nome_cs}>
                  OK <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          );

        case 3:
          return (
            <div className="space-y-4">
              <h2 className="text-xl md:text-2xl font-normal">
                Qual é o objetivo da pauta?
              </h2>
              <p className="text-muted-foreground">Pode marcar mais de um</p>
              <div className="space-y-3">
                {TRAFEGO_OBJETIVOS.map((objetivo, index) => (
                  <MultiChoiceButton
                    key={objetivo}
                    label={objetivo}
                    selected={formData.objetivos.includes(objetivo)}
                    onClick={() => toggleArrayField('objetivos', objetivo)}
                    index={index}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <Button size="default" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button size="default" onClick={nextStep} disabled={formData.objetivos.length === 0}>
                  OK <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          );

        case 4:
          return (
            <div className="space-y-4">
              <h2 className="text-xl md:text-2xl font-normal">
                Plataforma envolvida
              </h2>
              <p className="text-muted-foreground">Pode marcar mais de uma</p>
              <div className="space-y-3">
                {TRAFEGO_PLATAFORMAS.map((plataforma, index) => (
                  <MultiChoiceButton
                    key={plataforma}
                    label={plataforma}
                    selected={formData.plataformas.includes(plataforma)}
                    onClick={() => toggleArrayField('plataformas', plataforma)}
                    index={index}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <Button size="default" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button size="default" onClick={nextStep} disabled={formData.plataformas.length === 0}>
                  OK <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          );

        case 5:
          return (
            <div className="space-y-4">
              <h2 className="text-xl md:text-2xl font-normal">
                Qual tipo de campanha?
              </h2>
              <p className="text-muted-foreground">
                Selecione o tipo específico para {formData.plataformas.join(', ')}
              </p>
              <div className="space-y-3">
                {getTiposCampanha().map((tipo, index) => (
                  <button
                    key={tipo.value}
                    onClick={() => {
                      updateField('tipo_campanha', tipo.value);
                      setTimeout(() => setCurrentStep((prev) => prev + 1), 300);
                    }}
                    className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all flex items-center gap-3 group"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-md bg-muted group-hover:bg-primary/80 group-hover:text-primary-foreground flex items-center justify-center text-sm font-medium">
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="text-sm">{tipo.label}</span>
                  </button>
                ))}
              </div>
              <Button size="default" variant="outline" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
            </div>
          );

        case 6:
          return (
            <div className="space-y-4">
              <h2 className="text-xl md:text-2xl font-normal">
                📊 Quais métricas você quer analisar?
              </h2>
              <p className="text-muted-foreground">
                Adicione as métricas e seus valores atuais. Mínimo 1 métrica obrigatória.
              </p>

              <div className="space-y-4">
                {formData.metricas.map((metrica, index) => (
                  <div
                    key={metrica.id}
                    className="p-4 rounded-lg border bg-card/50 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Métrica {index + 1}
                      </span>
                      {formData.metricas.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMetrica(metrica.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nome da métrica</label>
                        <Input
                          placeholder="Ex: CTR, CPA, ROAS..."
                          value={metrica.nome}
                          onChange={(e) => updateMetrica(metrica.id, 'nome', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Valor atual</label>
                        <Input
                          placeholder="Ex: 2.5%, R$ 45,00"
                          value={metrica.valor}
                          onChange={(e) => updateMetrica(metrica.id, 'valor', e.target.value)}
                        />
                      </div>
                    </div>

                    {!metrica.nome && !metrica.valor && (
                      <button
                        type="button"
                        onClick={() => preencherExemploMetrica(index)}
                        className="text-xs text-primary hover:underline"
                      >
                        Preencher com exemplo
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={addMetrica}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar mais métrica
              </Button>

              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <p className="font-medium mb-2">💡 Exemplos de métricas comuns:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-muted-foreground">
                  {EXEMPLOS_METRICAS.map((ex) => (
                    <span key={ex.nome}>
                      {ex.nome}: {ex.valor}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button size="default" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button
                  size="default"
                  onClick={nextStep}
                  disabled={!formData.metricas.some((m) => m.nome.trim() && m.valor.trim())}
                >
                  OK <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          );

        case 7:
          return (
            <div className="space-y-4">
              <h2 className="text-xl md:text-2xl font-normal">
                Existe alguma campanha, produto ou funil específico?
              </h2>
              <p className="text-muted-foreground">Opcional - pressione OK para pular</p>
              <Input
                value={formData.campanha_especifica || ''}
                onChange={(e) => updateField('campanha_especifica', e.target.value)}
                placeholder="Descreva a campanha..."
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
              <h2 className="text-xl md:text-2xl font-normal">
                Observações importantes do CS
              </h2>
              <p className="text-muted-foreground">Opcional - pressione OK para finalizar</p>
              <Textarea
                value={formData.observacoes || ''}
                onChange={(e) => updateField('observacoes', e.target.value)}
                placeholder="Digite suas observações..."
                className="text-sm min-h-[100px] bg-transparent border-border focus-visible:ring-0 focus-visible:border-primary"
                autoFocus
              />
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
                      Enviar Pauta <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
      }
    }

    return null;
  };

  // Question Screens
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

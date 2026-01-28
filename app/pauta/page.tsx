'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowRight, Loader2, Check } from 'lucide-react';
import {
  TipoPauta,
  SOCIAL_MEDIA_OBJETIVOS,
  SOCIAL_MEDIA_PLATAFORMAS,
  SOCIAL_MEDIA_QUANTIDADE_POSTS,
  SOCIAL_MEDIA_FORMATOS,
  TRAFEGO_OBJETIVOS,
  TRAFEGO_PLATAFORMAS,
  TRAFEGO_METRICAS,
} from '@/types/pauta';

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
  metricas: string[];
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
    metricas: [],
  });

  // Define steps based on tipo_pauta
  const getTotalSteps = () => {
    if (!formData.tipo_pauta) return 1; // Just the tipo selection
    if (formData.tipo_pauta === 'social_media') return 10; // tipo + 9 questions
    return 8; // tipo + 7 questions for trafego (inclui métricas)
  };

  const totalSteps = getTotalSteps();
  const progress = currentStep === -1 ? 0 : ((currentStep + 1) / totalSteps) * 100;

  const updateField = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayField = (field: 'objetivos' | 'plataformas' | 'formatos_conteudo' | 'metricas', value: string) => {
    setFormData((prev) => {
      const currentArray = prev[field] || [];
      if (currentArray.includes(value)) {
        return { ...prev, [field]: currentArray.filter((v) => v !== value) };
      } else {
        return { ...prev, [field]: [...currentArray, value] };
      }
    });
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
        case 5: return formData.metricas.length > 0; // métricas obrigatório
        case 6: return true; // campanha_especifica is optional
        case 7: return true; // observacoes is optional
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center space-y-8 animate-in fade-in duration-500">
          <div className="flex justify-center mb-8">
            <h1 className="text-3xl font-semibold">
              vend<span className="text-primary">.</span>AI
            </h1>
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold">
            Nova Pauta
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Preencha as informações da pauta para o time de execução
          </p>
          <Button size="lg" onClick={nextStep} className="text-base px-8 py-6">
            Começar
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    );
  }

  // Thank You Screen
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center space-y-8 animate-in fade-in duration-500">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold">
            Pauta Enviada!
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
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
                metricas: [],
              });
            }}
            className="text-base px-8 py-6"
          >
            Criar Nova Pauta
            <ArrowRight className="ml-2 h-5 w-5" />
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
      className={`w-full text-left p-4 rounded-lg border-2 transition-all flex items-center gap-4 group ${
        selected
          ? 'border-primary bg-primary/10'
          : 'border-border hover:border-primary hover:bg-accent'
      }`}
    >
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-semibold ${
          selected
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted group-hover:bg-primary group-hover:text-primary-foreground'
        }`}
      >
        {selected ? <Check className="h-5 w-5" /> : String.fromCharCode(65 + index)}
      </div>
      <span className="text-lg">{label}</span>
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
          // Avança direto sem validação - o clique já é a seleção válida
          setTimeout(() => setCurrentStep((prev) => prev + 1), 300);
        }
      }}
      className="w-full text-left p-4 rounded-lg border-2 border-border hover:border-primary hover:bg-accent transition-all flex items-center gap-4 group"
      disabled={isSubmitting}
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center font-semibold">
        {String.fromCharCode(65 + index)}
      </div>
      <span className="text-lg">{label}</span>
      {isSubmitting && <Loader2 className="ml-auto h-5 w-5 animate-spin" />}
    </button>
  );

  // Render question based on current step
  const renderQuestion = () => {
    // Step 0: Select tipo_pauta
    if (currentStep === 0) {
      return (
        <div className="space-y-6">
          <h2 className="text-3xl md:text-4xl font-medium">
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
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-medium">
                Qual é o nome do CS responsável?
              </h2>
              <Input
                value={formData.nome_cs}
                onChange={(e) => updateField('nome_cs', e.target.value)}
                placeholder="Digite o nome do CS..."
                className="text-xl h-14 bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary px-0"
                autoFocus
              />
              <Button size="lg" onClick={nextStep} disabled={!formData.nome_cs}>
                OK <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          );

        case 2:
          return (
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-medium">
                Qual é o nome do cliente/empresa?
              </h2>
              <Input
                value={formData.nome_cliente}
                onChange={(e) => updateField('nome_cliente', e.target.value)}
                placeholder="Digite o nome do cliente..."
                className="text-xl h-14 bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary px-0"
                autoFocus
              />
              <Button size="lg" onClick={nextStep} disabled={!formData.nome_cliente}>
                OK <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          );

        case 3:
          return (
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-medium">
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
              <Button size="lg" onClick={nextStep} disabled={formData.objetivos.length === 0}>
                OK <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          );

        case 4:
          return (
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-medium">
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
              <Button size="lg" onClick={nextStep} disabled={formData.plataformas.length === 0}>
                OK <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          );

        case 5:
          return (
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-medium">
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
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-medium">
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
              <Button size="lg" onClick={nextStep} disabled={formData.formatos_conteudo.length === 0}>
                OK <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          );

        case 7:
          return (
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-medium">
                O conteúdo precisa de copy (texto)?
              </h2>
              <div className="space-y-3">
                <SingleChoiceButton label="Sim" value="sim" field="precisa_copy" index={0} />
                <SingleChoiceButton label="Não" value="nao" field="precisa_copy" index={1} />
              </div>
            </div>
          );

        case 8:
          return (
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-medium">
                O post precisa de descrição/legenda?
              </h2>
              <div className="space-y-3">
                <SingleChoiceButton label="Sim" value="sim" field="precisa_legenda" index={0} />
                <SingleChoiceButton label="Não" value="nao" field="precisa_legenda" index={1} />
              </div>
            </div>
          );

        case 9:
          return (
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-medium">
                Observações importantes do CS
              </h2>
              <p className="text-muted-foreground">Opcional - pressione OK para finalizar</p>
              <Textarea
                value={formData.observacoes || ''}
                onChange={(e) => updateField('observacoes', e.target.value)}
                placeholder="Digite suas observações..."
                className="text-lg min-h-[120px] bg-transparent border-border focus-visible:ring-0 focus-visible:border-primary"
                autoFocus
              />
              <Button size="lg" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    Enviar Pauta <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
          );
      }
    }

    // ============ TRÁFEGO PAGO QUESTIONS ============
    if (formData.tipo_pauta === 'trafego') {
      switch (currentStep) {
        case 1:
          return (
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-medium">
                Nome do cliente
              </h2>
              <Input
                value={formData.nome_cliente}
                onChange={(e) => updateField('nome_cliente', e.target.value)}
                placeholder="Digite o nome do cliente..."
                className="text-xl h-14 bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary px-0"
                autoFocus
              />
              <Button size="lg" onClick={nextStep} disabled={!formData.nome_cliente}>
                OK <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          );

        case 2:
          return (
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-medium">
                CS responsável
              </h2>
              <p className="text-muted-foreground">Ex: Rodrigo, Ana, João</p>
              <Input
                value={formData.nome_cs}
                onChange={(e) => updateField('nome_cs', e.target.value)}
                placeholder="Digite o nome do CS..."
                className="text-xl h-14 bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary px-0"
                autoFocus
              />
              <Button size="lg" onClick={nextStep} disabled={!formData.nome_cs}>
                OK <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          );

        case 3:
          return (
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-medium">
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
              <Button size="lg" onClick={nextStep} disabled={formData.objetivos.length === 0}>
                OK <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          );

        case 4:
          return (
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-medium">
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
              <Button size="lg" onClick={nextStep} disabled={formData.plataformas.length === 0}>
                OK <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          );

        case 5:
          return (
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-medium">
                Quais métricas serão analisadas?
              </h2>
              <p className="text-muted-foreground">Pode marcar mais de uma</p>
              <div className="space-y-3">
                {TRAFEGO_METRICAS.map((metrica, index) => (
                  <MultiChoiceButton
                    key={metrica}
                    label={metrica}
                    selected={formData.metricas.includes(metrica)}
                    onClick={() => toggleArrayField('metricas', metrica)}
                    index={index}
                  />
                ))}
              </div>
              <Button size="lg" onClick={nextStep} disabled={formData.metricas.length === 0}>
                OK <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          );

        case 6:
          return (
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-medium">
                Existe alguma campanha, produto ou funil específico?
              </h2>
              <p className="text-muted-foreground">Opcional - pressione OK para pular</p>
              <Input
                value={formData.campanha_especifica || ''}
                onChange={(e) => updateField('campanha_especifica', e.target.value)}
                placeholder="Descreva a campanha..."
                className="text-xl h-14 bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary px-0"
                autoFocus
              />
              <Button size="lg" onClick={nextStep}>
                OK <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          );

        case 7:
          return (
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-medium">
                Observações importantes do CS
              </h2>
              <p className="text-muted-foreground">Opcional - pressione OK para finalizar</p>
              <Textarea
                value={formData.observacoes || ''}
                onChange={(e) => updateField('observacoes', e.target.value)}
                placeholder="Digite suas observações..."
                className="text-lg min-h-[120px] bg-transparent border-border focus-visible:ring-0 focus-visible:border-primary"
                autoFocus
              />
              <Button size="lg" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    Enviar Pauta <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
          );
      }
    }

    return null;
  };

  // Question Screens
  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Logo */}
      <div className="fixed top-6 left-6 z-50">
        <h1 className="text-2xl font-bold">
          vend<span className="text-primary">.</span>AI
        </h1>
      </div>

      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-muted z-50">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question Content */}
      <div className="flex items-center justify-center min-h-screen p-4 pt-20">
        <div className="max-w-2xl w-full animate-in fade-in duration-300" onKeyPress={handleKeyPress}>
          {/* Question Number */}
          <div className="mb-4">
            <span className="text-sm text-muted-foreground">
              {currentStep + 1} → {totalSteps}
            </span>
          </div>

          {renderQuestion()}
        </div>
      </div>
    </div>
  );
}

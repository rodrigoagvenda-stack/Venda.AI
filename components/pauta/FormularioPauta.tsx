'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MetricasInput, type Metrica } from './MetricasInput'
import { PlataformaContext, type PlataformaType, getPlataformaLabel } from './PlataformaContext'
import { NavigationButtons } from './NavigationButtons'

// Tipos de objetivo
type ObjetivoType =
  | 'analisar_resultados'
  | 'otimizar_campanha'
  | 'criar_relatorio'
  | 'identificar_problemas'
  | 'planejar_estrategia'

// Dados do formulário
export interface PautaFormData {
  objetivo: ObjetivoType | ''
  plataforma: PlataformaType | ''
  tipoCampanha: string
  metricas: Metrica[]
  periodo: string
  orcamento: string
  contextoAdicional: string
  nomeCampanha: string
}

interface FormularioPautaProps {
  onSubmit: (data: PautaFormData) => Promise<void>
}

const objetivos: { value: ObjetivoType; label: string; descricao: string }[] = [
  {
    value: 'analisar_resultados',
    label: 'Analisar Resultados',
    descricao: 'Quero entender como minha campanha está performando',
  },
  {
    value: 'otimizar_campanha',
    label: 'Otimizar Campanha',
    descricao: 'Quero melhorar os resultados da minha campanha',
  },
  {
    value: 'criar_relatorio',
    label: 'Criar Relatório',
    descricao: 'Quero gerar um relatório para apresentar resultados',
  },
  {
    value: 'identificar_problemas',
    label: 'Identificar Problemas',
    descricao: 'Quero descobrir o que está dando errado na campanha',
  },
  {
    value: 'planejar_estrategia',
    label: 'Planejar Estratégia',
    descricao: 'Quero planejar próximos passos e ajustes',
  },
]

const plataformas: { value: PlataformaType; label: string }[] = [
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'meta_ads', label: 'Meta Ads (Facebook/Instagram)' },
  { value: 'tiktok_ads', label: 'TikTok Ads' },
  { value: 'linkedin_ads', label: 'LinkedIn Ads' },
  { value: 'twitter_ads', label: 'Twitter/X Ads' },
  { value: 'outro', label: 'Outra plataforma' },
]

const TOTAL_STEPS = 6

export function FormularioPauta({ onSubmit }: FormularioPautaProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<PautaFormData>({
    objetivo: '',
    plataforma: '',
    tipoCampanha: '',
    metricas: [{ id: crypto.randomUUID(), nome: '', valor: '' }],
    periodo: '',
    orcamento: '',
    contextoAdicional: '',
    nomeCampanha: '',
  })

  const updateFormData = useCallback(<K extends keyof PautaFormData>(
    field: K,
    value: PautaFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  const progress = (currentStep / TOTAL_STEPS) * 100

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return formData.objetivo !== ''
      case 2:
        return formData.plataforma !== ''
      case 3:
        return formData.tipoCampanha !== ''
      case 4:
        return formData.metricas.some((m) => m.nome.trim() && m.valor.trim())
      case 5:
        return true // Campos opcionais
      case 6:
        return true // Revisão
      default:
        return false
    }
  }

  const handleNext = async () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1)
    } else {
      setIsSubmitting(true)
      try {
        await onSubmit(formData)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🎯</span>
              <h3 className="text-lg font-semibold">Qual é o seu objetivo?</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Selecione o que você deseja fazer com os dados da sua campanha.
            </p>
            <div className="grid gap-3">
              {objetivos.map((obj) => (
                <label
                  key={obj.value}
                  className={`
                    flex flex-col p-4 rounded-lg border cursor-pointer
                    transition-all duration-200
                    ${
                      formData.objetivo === obj.value
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-input hover:border-primary/50 hover:bg-accent/50'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="objetivo"
                    value={obj.value}
                    checked={formData.objetivo === obj.value}
                    onChange={(e) =>
                      updateFormData('objetivo', e.target.value as ObjetivoType)
                    }
                    className="sr-only"
                  />
                  <span className="font-medium">{obj.label}</span>
                  <span className="text-sm text-muted-foreground mt-1">
                    {obj.descricao}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">📱</span>
              <h3 className="text-lg font-semibold">Qual plataforma de anúncio?</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Selecione onde sua campanha está rodando.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {plataformas.map((plat) => (
                <label
                  key={plat.value}
                  className={`
                    flex items-center gap-3 p-4 rounded-lg border cursor-pointer
                    transition-all duration-200
                    ${
                      formData.plataforma === plat.value
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-input hover:border-primary/50 hover:bg-accent/50'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="plataforma"
                    value={plat.value}
                    checked={formData.plataforma === plat.value}
                    onChange={(e) =>
                      updateFormData('plataforma', e.target.value as PlataformaType)
                    }
                    className="sr-only"
                  />
                  <div
                    className={`
                      w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                      ${
                        formData.plataforma === plat.value
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground'
                      }
                    `}
                  >
                    {formData.plataforma === plat.value && (
                      <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                    )}
                  </div>
                  <span className="text-sm font-medium">{plat.label}</span>
                </label>
              ))}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">⚙️</span>
              <h3 className="text-lg font-semibold">
                Detalhes da campanha em {getPlataformaLabel(formData.plataforma as PlataformaType)}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Selecione o tipo ou objetivo específico da sua campanha.
            </p>
            <PlataformaContext
              plataforma={formData.plataforma as PlataformaType}
              tipoCampanha={formData.tipoCampanha}
              onChange={(value) => updateFormData('tipoCampanha', value)}
            />
          </div>
        )

      case 4:
        return (
          <MetricasInput
            metricas={formData.metricas}
            onChange={(metricas) => updateFormData('metricas', metricas)}
          />
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">📝</span>
              <h3 className="text-lg font-semibold">Informações adicionais</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Adicione contexto para uma análise mais precisa (opcional).
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nomeCampanha">Nome da campanha</Label>
                <Input
                  id="nomeCampanha"
                  placeholder="Ex: Black Friday 2024"
                  value={formData.nomeCampanha}
                  onChange={(e) => updateFormData('nomeCampanha', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="periodo">Período de análise</Label>
                <Input
                  id="periodo"
                  placeholder="Ex: Últimos 30 dias, Janeiro/2024"
                  value={formData.periodo}
                  onChange={(e) => updateFormData('periodo', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="orcamento">Orçamento investido</Label>
                <Input
                  id="orcamento"
                  placeholder="Ex: R$ 5.000,00"
                  value={formData.orcamento}
                  onChange={(e) => updateFormData('orcamento', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contextoAdicional">Contexto adicional</Label>
                <Textarea
                  id="contextoAdicional"
                  placeholder="Descreva qualquer informação relevante sobre a campanha, público-alvo, produto, etc..."
                  value={formData.contextoAdicional}
                  onChange={(e) => updateFormData('contextoAdicional', e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">✅</span>
              <h3 className="text-lg font-semibold">Revise suas informações</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Confirme se todos os dados estão corretos antes de gerar a análise.
            </p>

            <div className="space-y-4">
              <div className="p-4 rounded-lg border bg-card/50">
                <span className="text-sm text-muted-foreground">Objetivo</span>
                <p className="font-medium">
                  {objetivos.find((o) => o.value === formData.objetivo)?.label}
                </p>
              </div>

              <div className="p-4 rounded-lg border bg-card/50">
                <span className="text-sm text-muted-foreground">Plataforma</span>
                <p className="font-medium">
                  {getPlataformaLabel(formData.plataforma as PlataformaType)}
                </p>
              </div>

              <div className="p-4 rounded-lg border bg-card/50">
                <span className="text-sm text-muted-foreground">Tipo de campanha</span>
                <p className="font-medium capitalize">
                  {formData.tipoCampanha.replace(/_/g, ' ')}
                </p>
              </div>

              <div className="p-4 rounded-lg border bg-card/50">
                <span className="text-sm text-muted-foreground">Métricas</span>
                <div className="mt-2 space-y-2">
                  {formData.metricas
                    .filter((m) => m.nome && m.valor)
                    .map((metrica) => (
                      <div key={metrica.id} className="flex justify-between">
                        <span>{metrica.nome}</span>
                        <span className="font-mono text-primary">{metrica.valor}</span>
                      </div>
                    ))}
                </div>
              </div>

              {(formData.nomeCampanha || formData.periodo || formData.orcamento) && (
                <div className="p-4 rounded-lg border bg-card/50">
                  <span className="text-sm text-muted-foreground">Informações adicionais</span>
                  <div className="mt-2 space-y-1 text-sm">
                    {formData.nomeCampanha && <p><strong>Campanha:</strong> {formData.nomeCampanha}</p>}
                    {formData.periodo && <p><strong>Período:</strong> {formData.periodo}</p>}
                    {formData.orcamento && <p><strong>Orçamento:</strong> {formData.orcamento}</p>}
                  </div>
                </div>
              )}

              {formData.contextoAdicional && (
                <div className="p-4 rounded-lg border bg-card/50">
                  <span className="text-sm text-muted-foreground">Contexto</span>
                  <p className="mt-1 text-sm">{formData.contextoAdicional}</p>
                </div>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const getStepTitle = () => {
    const titles = [
      'Objetivo',
      'Plataforma',
      'Tipo de campanha',
      'Métricas',
      'Informações adicionais',
      'Revisão',
    ]
    return titles[currentStep - 1] || ''
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <CardTitle>Nova Pauta de Análise</CardTitle>
          <span className="text-sm text-muted-foreground">
            Etapa {currentStep} de {TOTAL_STEPS}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
        <CardDescription className="mt-2">{getStepTitle()}</CardDescription>
      </CardHeader>

      <CardContent>
        {renderStep()}

        <NavigationButtons
          onBack={handleBack}
          onNext={handleNext}
          showBack={currentStep > 1}
          nextLabel={currentStep === TOTAL_STEPS ? 'Gerar Análise' : 'Continuar'}
          nextDisabled={!canProceed()}
          isLoading={isSubmitting}
        />
      </CardContent>
    </Card>
  )
}

'use client'

import { useState } from 'react'
import { FormularioPauta, type PautaFormData } from '@/components/pauta'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, RotateCcw } from 'lucide-react'

export default function PautaPage() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submittedData, setSubmittedData] = useState<PautaFormData | null>(null)

  const handleSubmit = async (data: PautaFormData) => {
    // Simular envio - aqui você pode integrar com API ou Supabase
    console.log('Dados da pauta:', data)
    
    // Simular delay de processamento
    await new Promise((resolve) => setTimeout(resolve, 1500))
    
    setSubmittedData(data)
    setIsSubmitted(true)
  }

  const handleReset = () => {
    setIsSubmitted(false)
    setSubmittedData(null)
  }

  if (isSubmitted && submittedData) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle>Pauta Criada com Sucesso!</CardTitle>
            <CardDescription>
              Sua pauta de análise foi registrada e está pronta para ser processada.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-lg bg-muted/50 space-y-3">
              <h4 className="font-medium">Resumo da Pauta</h4>
              <div className="text-sm space-y-2">
                <p><strong>Objetivo:</strong> {submittedData.objetivo}</p>
                <p><strong>Plataforma:</strong> {submittedData.plataforma}</p>
                <p><strong>Tipo de Campanha:</strong> {submittedData.tipoCampanha}</p>
                <p><strong>Métricas:</strong> {submittedData.metricas.filter(m => m.nome).length} configuradas</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleReset} variant="outline" className="flex-1">
                <RotateCcw className="h-4 w-4 mr-2" />
                Criar Nova Pauta
              </Button>
              <Button className="flex-1">
                Ver Análise
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold mb-2">Criar Pauta de Análise</h1>
        <p className="text-muted-foreground">
          Preencha as informações abaixo para gerar uma análise personalizada da sua campanha.
        </p>
      </div>
      
      <FormularioPauta onSubmit={handleSubmit} />
    </div>
  )
}

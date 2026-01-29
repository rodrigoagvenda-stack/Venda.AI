'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface Metrica {
  id: string
  nome: string
  valor: string
}

interface MetricasInputProps {
  metricas: Metrica[]
  onChange: (metricas: Metrica[]) => void
}

const exemplosMetricas = [
  { nome: 'CTR', valor: '2.5%' },
  { nome: 'CPA', valor: 'R$ 45,00' },
  { nome: 'ROAS', valor: '3.2x' },
  { nome: 'CPM', valor: 'R$ 15,00' },
  { nome: 'Taxa de Conversão', valor: '4.8%' },
  { nome: 'Impressões', valor: '150.000' },
]

export function MetricasInput({ metricas, onChange }: MetricasInputProps) {
  const addMetrica = () => {
    onChange([...metricas, { id: crypto.randomUUID(), nome: '', valor: '' }])
  }

  const removeMetrica = (id: string) => {
    if (metricas.length > 1) {
      onChange(metricas.filter((m) => m.id !== id))
    }
  }

  const updateMetrica = (id: string, field: 'nome' | 'valor', value: string) => {
    onChange(
      metricas.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    )
  }

  const preencherExemplo = (index: number) => {
    const exemplo = exemplosMetricas[index % exemplosMetricas.length]
    const metricaId = metricas[index]?.id
    if (metricaId) {
      onChange(
        metricas.map((m) =>
          m.id === metricaId ? { ...m, nome: exemplo.nome, valor: exemplo.valor } : m
        )
      )
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">📊</span>
        <h3 className="text-lg font-semibold">Quais métricas você quer analisar?</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Adicione as métricas e seus valores atuais. Mínimo 1 métrica obrigatória.
      </p>

      <div className="space-y-4">
        {metricas.map((metrica, index) => (
          <div
            key={metrica.id}
            className="p-4 rounded-lg border bg-card/50 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Métrica {index + 1}
              </span>
              {metricas.length > 1 && (
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
                <Label htmlFor={`nome-${metrica.id}`}>Nome da métrica</Label>
                <Input
                  id={`nome-${metrica.id}`}
                  placeholder="Ex: CTR, CPA, ROAS..."
                  value={metrica.nome}
                  onChange={(e) => updateMetrica(metrica.id, 'nome', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`valor-${metrica.id}`}>Valor atual</Label>
                <Input
                  id={`valor-${metrica.id}`}
                  placeholder="Ex: 2.5%, R$ 45,00"
                  value={metrica.valor}
                  onChange={(e) => updateMetrica(metrica.id, 'valor', e.target.value)}
                />
              </div>
            </div>

            {!metrica.nome && !metrica.valor && (
              <button
                type="button"
                onClick={() => preencherExemplo(index)}
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

      <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm">
        <p className="font-medium mb-2">💡 Exemplos de métricas comuns:</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-muted-foreground">
          {exemplosMetricas.map((ex) => (
            <span key={ex.nome}>
              {ex.nome}: {ex.valor}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

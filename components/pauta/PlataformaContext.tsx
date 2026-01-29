'use client'

export type PlataformaType =
  | 'google_ads'
  | 'meta_ads'
  | 'tiktok_ads'
  | 'linkedin_ads'
  | 'twitter_ads'
  | 'outro'

interface TipoCampanha {
  value: string
  label: string
}

const tiposCampanhaPorPlataforma: Record<PlataformaType, TipoCampanha[]> = {
  google_ads: [
    { value: 'search', label: 'Search (Pesquisa)' },
    { value: 'display', label: 'Display' },
    { value: 'shopping', label: 'Shopping' },
    { value: 'performance_max', label: 'Performance Max' },
    { value: 'video', label: 'Vídeo (YouTube)' },
    { value: 'discovery', label: 'Discovery' },
    { value: 'app', label: 'Campanhas de App' },
    { value: 'outro', label: 'Outro' },
  ],
  meta_ads: [
    { value: 'reconhecimento', label: 'Reconhecimento' },
    { value: 'trafego', label: 'Tráfego' },
    { value: 'engajamento', label: 'Engajamento' },
    { value: 'leads', label: 'Leads' },
    { value: 'promocao_app', label: 'Promoção de App' },
    { value: 'vendas', label: 'Vendas' },
    { value: 'outro', label: 'Outro' },
  ],
  tiktok_ads: [
    { value: 'alcance', label: 'Alcance' },
    { value: 'trafego', label: 'Tráfego' },
    { value: 'visualizacoes_video', label: 'Visualizações de Vídeo' },
    { value: 'interacoes_comunidade', label: 'Interações com a Comunidade' },
    { value: 'instalacoes_app', label: 'Instalações de App' },
    { value: 'conversoes', label: 'Conversões' },
    { value: 'vendas_catalogo', label: 'Vendas de Catálogo' },
    { value: 'outro', label: 'Outro' },
  ],
  linkedin_ads: [
    { value: 'reconhecimento_marca', label: 'Reconhecimento de Marca' },
    { value: 'visitas_site', label: 'Visitas ao Site' },
    { value: 'engajamento', label: 'Engajamento' },
    { value: 'visualizacoes_video', label: 'Visualizações de Vídeo' },
    { value: 'geracao_leads', label: 'Geração de Leads' },
    { value: 'conversoes_site', label: 'Conversões no Site' },
    { value: 'candidatos_emprego', label: 'Candidatos a Emprego' },
    { value: 'outro', label: 'Outro' },
  ],
  twitter_ads: [
    { value: 'alcance', label: 'Alcance' },
    { value: 'engajamento', label: 'Engajamento' },
    { value: 'seguidores', label: 'Seguidores' },
    { value: 'trafego_site', label: 'Tráfego para Site' },
    { value: 'instalacoes_app', label: 'Instalações de App' },
    { value: 'conversoes', label: 'Conversões' },
    { value: 'outro', label: 'Outro' },
  ],
  outro: [
    { value: 'reconhecimento', label: 'Reconhecimento/Awareness' },
    { value: 'consideracao', label: 'Consideração' },
    { value: 'conversao', label: 'Conversão' },
    { value: 'retencao', label: 'Retenção' },
    { value: 'outro', label: 'Outro' },
  ],
}

const plataformaLabels: Record<PlataformaType, string> = {
  google_ads: 'Google Ads',
  meta_ads: 'Meta Ads',
  tiktok_ads: 'TikTok Ads',
  linkedin_ads: 'LinkedIn Ads',
  twitter_ads: 'Twitter/X Ads',
  outro: 'Outra Plataforma',
}

export function getPlataformaLabel(plataforma: PlataformaType): string {
  return plataformaLabels[plataforma] || plataforma
}

interface PlataformaContextProps {
  plataforma: PlataformaType
  tipoCampanha: string
  onChange: (tipoCampanha: string) => void
}

export function PlataformaContext({
  plataforma,
  tipoCampanha,
  onChange,
}: PlataformaContextProps) {
  const tiposCampanha = tiposCampanhaPorPlataforma[plataforma] || []

  return (
    <div className="space-y-3">
      {tiposCampanha.map((tipo) => (
        <label
          key={tipo.value}
          className={
            tipoCampanha === tipo.value
              ? 'flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all duration-200 border-primary bg-primary/5 ring-1 ring-primary'
              : 'flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all duration-200 border-input hover:border-primary/50 hover:bg-accent/50'
          }
        >
          <input
            type="radio"
            name="tipoCampanha"
            value={tipo.value}
            checked={tipoCampanha === tipo.value}
            onChange={(e) => onChange(e.target.value)}
            className="sr-only"
          />
          <div
            className={
              tipoCampanha === tipo.value
                ? 'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 border-primary bg-primary'
                : 'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 border-muted-foreground'
            }
          >
            {tipoCampanha === tipo.value && (
              <div className="w-2 h-2 rounded-full bg-primary-foreground" />
            )}
          </div>
          <span className="text-sm font-medium">{tipo.label}</span>
        </label>
      ))}
    </div>
  )
}

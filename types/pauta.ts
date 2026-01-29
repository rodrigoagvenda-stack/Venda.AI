export type TipoPauta = 'social_media' | 'trafego';

// ============ SOCIAL MEDIA ============
export interface PautaSocialMediaFormData {
  tipo_pauta: 'social_media';
  nome_cs: string;
  nome_cliente: string;
  objetivos: string[]; // múltipla escolha
  plataformas: string[]; // múltipla escolha
  quantidade_posts: string;
  formatos_conteudo: string[]; // múltipla escolha
  precisa_copy: 'sim' | 'nao';
  precisa_legenda: 'sim' | 'nao';
  observacoes?: string;
}

// ============ TRÁFEGO PAGO ============
export interface MetricaComValor {
  id: string;
  nome: string;
  valor: string;
}

export interface PautaTrafegoFormData {
  tipo_pauta: 'trafego';
  nome_cliente: string;
  nome_cs: string;
  objetivos: string[]; // múltipla escolha
  plataformas: string[]; // múltipla escolha
  tipo_campanha?: string; // tipo específico por plataforma
  metricas: MetricaComValor[]; // métricas com nome e valor
  campanha_especifica?: string;
  observacoes?: string;
}

// Union type para form data
export type PautaFormData = PautaSocialMediaFormData | PautaTrafegoFormData;

// Response from database
export interface PautaResponse {
  id: number;
  tipo_pauta: TipoPauta;
  nome_cs: string;
  nome_cliente: string;
  objetivos: string[];
  plataformas: string[];
  // Social Media specific
  quantidade_posts?: string;
  formatos_conteudo?: string[];
  precisa_copy?: 'sim' | 'nao';
  precisa_legenda?: 'sim' | 'nao';
  // Tráfego specific
  tipo_campanha?: string;
  metricas?: MetricaComValor[];
  campanha_especifica?: string;
  // Common
  observacoes?: string;
  submitted_at: string;
  webhook_sent: boolean;
  webhook_sent_at?: string;
  created_at: string;
}

// Config for webhook
export interface PautaConfig {
  id: number;
  webhook_url?: string;
  webhook_secret?: string;
  is_active: boolean;
  last_test_at?: string;
  last_test_status?: 'success' | 'failed';
  created_at: string;
  updated_at: string;
}

// Options for forms
export const SOCIAL_MEDIA_OBJETIVOS = [
  'Criação de conteúdo',
  'Planejamento de conteúdo',
  'Análise de posts',
  'Ajustes de identidade visual',
  'Aumento de engajamento',
  'Outro',
] as const;

export const SOCIAL_MEDIA_PLATAFORMAS = [
  'Instagram',
  'Facebook',
  'TikTok',
  'LinkedIn',
] as const;

export const SOCIAL_MEDIA_QUANTIDADE_POSTS = [
  '1 a 3',
  '4 a 7',
  '8 a 12',
  'Mais de 12',
] as const;

export const SOCIAL_MEDIA_FORMATOS = [
  'Estático',
  'Vídeo',
  'Carrossel',
  'Reels',
  'Stories',
] as const;

export const TRAFEGO_OBJETIVOS = [
  'Criar nova campanha',
  'Otimizar campanhas existentes',
  'Analisar resultados',
  'Ajustar segmentação',
  'Ajustar criativos',
  'Ajustar orçamento',
  'Outro',
] as const;

export const TRAFEGO_PLATAFORMAS = [
  'Meta Ads',
  'Google Ads',
  'TikTok Ads',
  'Mais de uma',
] as const;

export const TRAFEGO_METRICAS = [
  'CPA (Custo por Aquisição)',
  'CPL (Custo por Lead)',
  'CPC (Custo por Clique)',
  'CPM (Custo por Mil)',
  'CTR (Taxa de Cliques)',
  'ROAS (Retorno sobre Investimento)',
  'Conversões',
  'Impressões',
  'Alcance',
  'Frequência',
] as const;

// Tipos de campanha por plataforma
export const TIPOS_CAMPANHA_POR_PLATAFORMA: Record<string, { value: string; label: string }[]> = {
  'Google Ads': [
    { value: 'search', label: 'Search (Pesquisa)' },
    { value: 'display', label: 'Display' },
    { value: 'shopping', label: 'Shopping' },
    { value: 'performance_max', label: 'Performance Max' },
    { value: 'video', label: 'Vídeo (YouTube)' },
    { value: 'discovery', label: 'Discovery' },
    { value: 'outro', label: 'Outro' },
  ],
  'Meta Ads': [
    { value: 'reconhecimento', label: 'Reconhecimento' },
    { value: 'trafego', label: 'Tráfego' },
    { value: 'engajamento', label: 'Engajamento' },
    { value: 'leads', label: 'Leads' },
    { value: 'vendas', label: 'Vendas' },
    { value: 'outro', label: 'Outro' },
  ],
  'TikTok Ads': [
    { value: 'alcance', label: 'Alcance' },
    { value: 'trafego', label: 'Tráfego' },
    { value: 'visualizacoes_video', label: 'Visualizações de Vídeo' },
    { value: 'instalacoes_app', label: 'Instalações de App' },
    { value: 'conversoes', label: 'Conversões' },
    { value: 'outro', label: 'Outro' },
  ],
  'Mais de uma': [
    { value: 'multiplas', label: 'Múltiplas plataformas' },
    { value: 'outro', label: 'Outro' },
  ],
};

// Exemplos de métricas para ajudar o usuário
export const EXEMPLOS_METRICAS = [
  { nome: 'CTR', valor: '2.5%' },
  { nome: 'CPA', valor: 'R$ 45,00' },
  { nome: 'ROAS', valor: '3.2x' },
  { nome: 'CPM', valor: 'R$ 15,00' },
  { nome: 'Taxa de Conversão', valor: '4.8%' },
  { nome: 'Impressões', valor: '150.000' },
];

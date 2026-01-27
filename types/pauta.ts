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
export interface PautaTrafegoFormData {
  tipo_pauta: 'trafego';
  nome_cliente: string;
  nome_cs: string;
  objetivos: string[]; // múltipla escolha
  plataformas: string[]; // múltipla escolha
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

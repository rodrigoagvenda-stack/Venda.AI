import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nome_empresa,
      segmento,
      contexto_negocio,
      cs_responsavel,
      cs_whatsapp,
      ceo_nome,
      ceo_whatsapp,
      gerente_nome,
      gerente_whatsapp,
      tom_comunicacao,
      servicos_prestados,
      informacoes_projeto,
      prompt_especifico,
      estruturas_pautas,
    } = body;

    // Validate required fields
    if (!nome_empresa || !contexto_negocio || !cs_responsavel || !cs_whatsapp || !tom_comunicacao || !servicos_prestados || !informacoes_projeto) {
      return NextResponse.json(
        { success: false, message: 'Campos obrigatorios nao preenchidos' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch webhook config from database
    const { data: config, error: configError } = await supabase
      .from('cliente_config')
      .select('*')
      .single();

    if (configError && configError.code !== 'PGRST116') {
      console.error('Error fetching cliente config:', configError);
      return NextResponse.json(
        { success: false, message: 'Erro ao buscar configuracao' },
        { status: 500 }
      );
    }

    if (!config || !config.webhook_url || !config.is_active) {
      return NextResponse.json(
        { success: false, message: 'Webhook de cliente nao configurado ou inativo' },
        { status: 400 }
      );
    }

    // Build payload
    const payload = {
      nome_empresa,
      segmento: segmento || null,
      contexto_negocio,
      cs_responsavel,
      cs_whatsapp: cs_whatsapp.startsWith('55') ? cs_whatsapp : `55${cs_whatsapp}`,
      ceo_nome: ceo_nome || null,
      ceo_whatsapp: ceo_whatsapp ? (ceo_whatsapp.startsWith('55') ? ceo_whatsapp : `55${ceo_whatsapp}`) : null,
      gerente_nome: gerente_nome || null,
      gerente_whatsapp: gerente_whatsapp ? (gerente_whatsapp.startsWith('55') ? gerente_whatsapp : `55${gerente_whatsapp}`) : null,
      tom_comunicacao,
      servicos_prestados,
      informacoes_projeto,
      prompt_especifico: prompt_especifico || null,
      estruturas_pautas: estruturas_pautas || [],
      timestamp: new Date().toISOString(),
    };

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add webhook secret if configured
    if (config.webhook_secret) {
      headers['x-webhook-secret'] = config.webhook_secret;
    }

    // Send to webhook
    const response = await fetch(config.webhook_url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Webhook error:', response.status, errorText);
      return NextResponse.json(
        { success: false, message: 'Erro ao enviar dados para o webhook' },
        { status: 500 }
      );
    }

    // Update last_used_at in config
    await supabase
      .from('cliente_config')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', config.id);

    return NextResponse.json({
      success: true,
      message: 'Cliente cadastrado com sucesso!',
    });
  } catch (error: any) {
    console.error('Error submitting cliente:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Erro ao cadastrar cliente' },
      { status: 500 }
    );
  }
}

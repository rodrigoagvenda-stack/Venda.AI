import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

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

    const supabase = createServiceClient();

    // Prepare data for insertion
    const insertData = {
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
    };

    // 1. Save to database
    const { data: response, error: insertError } = await supabase
      .from('cliente_responses')
      .insert([insertData])
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting cliente:', insertError);
      throw insertError;
    }

    // 2. Fetch webhook config
    const { data: config, error: configError } = await supabase
      .from('cliente_config')
      .select('webhook_url, webhook_secret, is_active')
      .single();

    if (!configError && config?.is_active && config?.webhook_url) {
      // 3. Call webhook
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (config.webhook_secret) {
          headers['x-webhook-secret'] = config.webhook_secret;
        }

        await fetch(config.webhook_url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            event: 'cliente_created',
            response_id: response.id,
            submitted_at: response.submitted_at,
            ...insertData,
          }),
        });

        // Mark as sent
        await supabase
          .from('cliente_responses')
          .update({ webhook_sent: true, webhook_sent_at: new Date().toISOString() })
          .eq('id', response.id);
      } catch (webhookError) {
        console.error('Webhook call failed:', webhookError);
        // Don't fail the request if webhook fails
      }
    }

    return NextResponse.json({
      success: true,
      response_id: response.id,
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

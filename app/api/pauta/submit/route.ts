import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();

    // Validar tipo_pauta
    if (!formData.tipo_pauta || !['social_media', 'trafego'].includes(formData.tipo_pauta)) {
      return NextResponse.json(
        { success: false, message: 'Tipo de pauta inválido' },
        { status: 400 }
      );
    }

    // Validar campos obrigatórios comuns
    const commonRequired = ['nome_cs', 'nome_cliente', 'objetivos', 'plataformas'];
    for (const field of commonRequired) {
      if (!formData[field] || (Array.isArray(formData[field]) && formData[field].length === 0)) {
        return NextResponse.json(
          { success: false, message: `Campo obrigatório: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validar campos específicos de social_media
    if (formData.tipo_pauta === 'social_media') {
      const socialRequired = ['quantidade_posts', 'formatos_conteudo', 'precisa_copy', 'precisa_legenda'];
      for (const field of socialRequired) {
        if (!formData[field] || (Array.isArray(formData[field]) && formData[field].length === 0)) {
          return NextResponse.json(
            { success: false, message: `Campo obrigatório: ${field}` },
            { status: 400 }
          );
        }
      }
    }

    const supabase = createServiceClient();

    // Preparar dados para inserção
    const insertData = {
      tipo_pauta: formData.tipo_pauta,
      nome_cs: formData.nome_cs,
      nome_cliente: formData.nome_cliente,
      objetivos: formData.objetivos,
      plataformas: formData.plataformas,
      observacoes: formData.observacoes || null,
      // Social Media specific
      quantidade_posts: formData.quantidade_posts || null,
      formatos_conteudo: formData.formatos_conteudo || null,
      precisa_copy: formData.precisa_copy || null,
      precisa_legenda: formData.precisa_legenda || null,
      // Tráfego specific
      metricas: formData.metricas || null,
      campanha_especifica: formData.campanha_especifica || null,
    };

    // 1. Salvar no banco
    const { data: response, error: insertError } = await supabase
      .from('pauta_responses')
      .insert([insertData])
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting pauta:', insertError);
      throw insertError;
    }

    // 2. Buscar configuração do webhook
    const { data: config, error: configError } = await supabase
      .from('pauta_config')
      .select('webhook_url, webhook_secret, is_active')
      .single();

    if (!configError && config?.is_active && config?.webhook_url) {
      // 3. Chamar webhook
      try {
        await fetch(config.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-webhook-secret': config.webhook_secret || '',
          },
          body: JSON.stringify({
            event: 'pauta_created',
            response_id: response.id,
            submitted_at: response.submitted_at,
            ...insertData,
          }),
        });

        // Marcar como enviado
        await supabase
          .from('pauta_responses')
          .update({ webhook_sent: true, webhook_sent_at: new Date().toISOString() })
          .eq('id', response.id);
      } catch (webhookError) {
        console.error('Webhook call failed:', webhookError);
        // Não falhar a request se o webhook falhar
      }
    }

    return NextResponse.json({
      success: true,
      response_id: response.id,
      message: 'Pauta enviada com sucesso!',
    });
  } catch (error: any) {
    console.error('Error submitting pauta:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Erro ao enviar pauta' },
      { status: 500 }
    );
  }
}

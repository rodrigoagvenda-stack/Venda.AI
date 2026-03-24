import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// GET /api/briefing/public/[slug]
// Retorna config + perguntas ativas ordenadas
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createServiceClient();

    const { data: config, error: configError } = await supabase
      .from('briefing_company_config')
      .select('id, slug, company_name, logo_url, primary_color, welcome_title, welcome_message, success_message')
      .eq('slug', params.slug)
      .eq('is_active', true)
      .single();

    if (configError || !config) {
      return NextResponse.json({ success: false, message: 'Formulário não encontrado' }, { status: 404 });
    }

    const { data: questions, error: questionsError } = await supabase
      .from('briefing_questions')
      .select('id, label, field_key, question_type, options, placeholder, is_required, order_index')
      .eq('config_id', config.id)
      .order('order_index', { ascending: true });

    if (questionsError) throw questionsError;

    return NextResponse.json({ success: true, config, questions: questions ?? [] });
  } catch (error: any) {
    console.error('GET /api/briefing/public/[slug]:', error);
    return NextResponse.json({ success: false, message: 'Erro interno' }, { status: 500 });
  }
}

// POST /api/briefing/public/[slug]
// Salva respostas e dispara webhook
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { answers } = await request.json();

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({ success: false, message: 'Respostas inválidas' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Busca empresa pelo slug
    const { data: config, error: configError } = await supabase
      .from('briefing_company_config')
      .select('id, webhook_url, webhook_secret, is_active')
      .eq('slug', params.slug)
      .eq('is_active', true)
      .single();

    if (configError || !config) {
      return NextResponse.json({ success: false, message: 'Formulário não encontrado' }, { status: 404 });
    }

    // Tenta match de lead pelo WhatsApp (RPC opcional)
    let leadId: string | null = null;
    const whatsappValue = answers['whatsapp'] as string | undefined;
    if (whatsappValue) {
      const phone = whatsappValue.replace(/\D/g, '');
      const { data: matchResult } = await supabase.rpc('match_lead_by_phone', { phone_number: phone });
      if (matchResult) leadId = matchResult;
    }

    // Salva resposta
    const { data: response, error: insertError } = await supabase
      .from('briefing_mt_responses')
      .insert([{ company_id: config.id, answers, lead_id: leadId }])
      .select('id, submitted_at')
      .single();

    if (insertError) throw insertError;

    // Dispara webhook se configurado
    if (config.webhook_url) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        await fetch(config.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(config.webhook_secret ? { 'x-webhook-secret': config.webhook_secret } : {}),
          },
          body: JSON.stringify({
            event: 'briefing_completed',
            response_id: response.id,
            submitted_at: response.submitted_at,
            slug: params.slug,
            answers,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        await supabase
          .from('briefing_mt_responses')
          .update({ webhook_sent: true, webhook_sent_at: new Date().toISOString() })
          .eq('id', response.id);
      } catch (webhookError) {
        console.error('Webhook failed:', webhookError);
      }
    }

    return NextResponse.json({ success: true, response_id: response.id });
  } catch (error: any) {
    console.error('POST /api/briefing/public/[slug]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Erro interno' }, { status: 500 });
  }
}

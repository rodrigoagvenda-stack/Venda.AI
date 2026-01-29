import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const serviceClient = createServiceClient();

    // Verificar autenticação admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 });
    }

    const { data: adminUser } = await serviceClient
      .from('admin_users')
      .select('*')
      .eq('auth_user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (!adminUser) {
      return NextResponse.json({ success: false, message: 'Acesso negado' }, { status: 403 });
    }

    // Buscar configuração
    const { data: config, error: configError } = await serviceClient
      .from('briefing_config')
      .select('id, webhook_url, webhook_secret')
      .maybeSingle();

    if (configError) throw configError;

    if (!config?.webhook_url) {
      return NextResponse.json(
        { success: false, message: 'Webhook URL não configurada' },
        { status: 400 }
      );
    }

    // Enviar payload de teste
    let testStatus = 'failed';
    try {
      const response = await fetch(config.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': config.webhook_secret || '',
        },
        body: JSON.stringify({
          event: 'test',
          message: 'Teste de webhook do vend.AI',
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        testStatus = 'success';
      }
    } catch (error) {
      console.error('Webhook test failed:', error);
    }

    // Salvar resultado
    if (config.id) {
      await serviceClient
        .from('briefing_config')
        .update({
          last_test_at: new Date().toISOString(),
          last_test_status: testStatus,
        })
        .eq('id', config.id);
    }

    return NextResponse.json({
      success: testStatus === 'success',
      message: testStatus === 'success' ? 'Webhook testado com sucesso!' : 'Falha ao testar webhook',
      status: testStatus,
    });
  } catch (error: any) {
    console.error('Error testing webhook:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Erro ao testar webhook' },
      { status: 500 }
    );
  }
}

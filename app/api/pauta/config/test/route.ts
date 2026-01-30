import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticação admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 });
    }

    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('*')
      .eq('auth_user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!adminUser) {
      return NextResponse.json({ success: false, message: 'Acesso negado' }, { status: 403 });
    }

    // Buscar configuração
    const { data: config, error: configError } = await supabase
      .from('pauta_config')
      .select('webhook_url, webhook_secret')
      .single();

    if (configError) throw configError;

    if (!config?.webhook_url) {
      return NextResponse.json(
        { success: false, message: 'Webhook URL não configurada' },
        { status: 400 }
      );
    }

    // Enviar payload de teste
    let testStatus = 'failed';
    let errorMessage = '';
    try {
      const response = await fetch(config.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': config.webhook_secret || '',
        },
        body: JSON.stringify({
          event: 'test',
          message: 'Teste de webhook de pauta do vend.AI',
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        testStatus = 'success';
      } else {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        console.error('Pauta webhook test failed with status:', response.status, response.statusText);
      }
    } catch (error: any) {
      errorMessage = error.message || 'Erro de conexão';
      console.error('Pauta webhook test failed:', error);
    }

    // Salvar resultado (buscar id dinamicamente)
    const { data: existingConfig } = await supabase
      .from('pauta_config')
      .select('id')
      .single();

    if (existingConfig) {
      await supabase
        .from('pauta_config')
        .update({
          last_test_at: new Date().toISOString(),
          last_test_status: testStatus,
        })
        .eq('id', existingConfig.id);
    }

    return NextResponse.json({
      success: testStatus === 'success',
      message: testStatus === 'success'
        ? 'Webhook testado com sucesso!'
        : `Falha ao testar webhook${errorMessage ? `: ${errorMessage}` : ''}`,
      status: testStatus,
      error: errorMessage || undefined,
    });
  } catch (error: any) {
    console.error('Error testing pauta webhook:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Erro ao testar webhook' },
      { status: 500 }
    );
  }
}

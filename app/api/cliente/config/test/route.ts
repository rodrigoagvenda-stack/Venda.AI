import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify admin authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Nao autorizado' }, { status: 401 });
    }

    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!adminUser) {
      return NextResponse.json({ success: false, message: 'Acesso negado' }, { status: 403 });
    }

    // Fetch config
    const { data: config, error: configError } = await supabase
      .from('cliente_config')
      .select('webhook_url, webhook_secret')
      .single();

    if (configError && configError.code !== 'PGRST116') {
      throw configError;
    }

    if (!config?.webhook_url) {
      return NextResponse.json(
        { success: false, message: 'Webhook URL nao configurada' },
        { status: 400 }
      );
    }

    // Send test payload
    let testStatus = 'failed';
    let errorMessage = '';
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (config.webhook_secret) {
        headers['x-webhook-secret'] = config.webhook_secret;
      }

      const response = await fetch(config.webhook_url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          event: 'test',
          message: 'Teste de webhook de cadastro de cliente do vend.AI',
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        testStatus = 'success';
      } else {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        console.error('Cliente webhook test failed with status:', response.status, response.statusText);
      }
    } catch (error: any) {
      errorMessage = error.message || 'Erro de conexao';
      console.error('Cliente webhook test failed:', error);
    }

    // Save result
    const { data: existingConfig } = await supabase
      .from('cliente_config')
      .select('id')
      .single();

    if (existingConfig) {
      await supabase
        .from('cliente_config')
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
    console.error('Error testing cliente webhook:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Erro ao testar webhook' },
      { status: 500 }
    );
  }
}

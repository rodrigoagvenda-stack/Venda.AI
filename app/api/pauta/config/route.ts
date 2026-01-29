import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
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

    // Buscar configuração (usa maybeSingle para não dar erro se não existir registro)
    const { data, error } = await serviceClient.from('pauta_config').select('*').maybeSingle();

    if (error) throw error;

    // Se não existir configuração, retorna objeto vazio
    return NextResponse.json({
      success: true,
      data: data || {
        webhook_url: '',
        webhook_secret: '',
        is_active: false,
      },
    });
  } catch (error: any) {
    console.error('Error fetching pauta config:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Erro ao buscar configuração' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { webhook_url, webhook_secret, is_active } = body;

    // Verificar se já existe uma configuração
    const { data: existing } = await serviceClient
      .from('pauta_config')
      .select('id')
      .maybeSingle();

    let data;
    let error;

    if (existing) {
      // Atualizar configuração existente
      const result = await serviceClient
        .from('pauta_config')
        .update({
          webhook_url,
          webhook_secret,
          is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else {
      // Criar nova configuração
      const result = await serviceClient
        .from('pauta_config')
        .insert({
          webhook_url,
          webhook_secret,
          is_active,
        })
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Webhook de pauta configurado com sucesso!',
      data,
    });
  } catch (error: any) {
    console.error('Error updating pauta config:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Erro ao atualizar configuração' },
      { status: 500 }
    );
  }
}

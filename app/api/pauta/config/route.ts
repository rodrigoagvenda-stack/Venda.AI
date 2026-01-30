import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
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
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!adminUser) {
      return NextResponse.json({ success: false, message: 'Acesso negado' }, { status: 403 });
    }

    // Buscar configuração
    const { data, error } = await supabase.from('pauta_config').select('*').single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned - isso é OK, retornamos objeto vazio
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: data || {},
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
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!adminUser) {
      return NextResponse.json({ success: false, message: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const { webhook_url, webhook_secret, is_active } = body;

    // Verificar se já existe uma configuração
    const { data: existingConfig } = await supabase
      .from('pauta_config')
      .select('id')
      .single();

    let data;
    let error;

    if (existingConfig) {
      // Atualizar configuração existente
      const result = await supabase
        .from('pauta_config')
        .update({
          webhook_url,
          webhook_secret,
          is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingConfig.id)
        .select()
        .single();

      data = result.data;
      error = result.error;
    } else {
      // Criar nova configuração
      const result = await supabase
        .from('pauta_config')
        .insert({
          webhook_url,
          webhook_secret,
          is_active,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      data = result.data;
      error = result.error;
    }

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Configuração da pauta salva com sucesso!',
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

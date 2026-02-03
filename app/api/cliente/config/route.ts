import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
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
    const { data, error } = await supabase.from('cliente_config').select('*').single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: data || {},
    });
  } catch (error: any) {
    console.error('Error fetching cliente config:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Erro ao buscar configuracao' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { webhook_url, webhook_secret, is_active } = body;

    // Check if config already exists
    const { data: existingConfig } = await supabase
      .from('cliente_config')
      .select('id')
      .single();

    let data;
    let error;

    if (existingConfig) {
      // Update existing config
      const result = await supabase
        .from('cliente_config')
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
      // Create new config
      const result = await supabase
        .from('cliente_config')
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
      message: 'Configuracao do cliente salva com sucesso!',
      data,
    });
  } catch (error: any) {
    console.error('Error updating cliente config:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Erro ao atualizar configuracao' },
      { status: 500 }
    );
  }
}

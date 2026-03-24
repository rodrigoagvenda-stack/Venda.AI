import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

async function assertAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from('admin_users').select('id').eq('user_id', user.id).eq('is_active', true).single();
  return !!data;
}

// GET /api/admin/briefing/mt — lista todas as configs
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    if (!(await assertAdmin(supabase))) {
      return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 });
    }

    const service = createServiceClient();
    const { data, error } = await service
      .from('briefing_company_config')
      .select('id, slug, company_name, primary_color, is_active, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// POST /api/admin/briefing/mt — cria nova config
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    if (!(await assertAdmin(supabase))) {
      return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const service = createServiceClient();

    const { data, error } = await service
      .from('briefing_company_config')
      .insert([{
        slug: body.slug,
        company_name: body.company_name,
        logo_url: body.logo_url || null,
        primary_color: body.primary_color ?? '#000000',
        welcome_title: body.welcome_title,
        welcome_message: body.welcome_message,
        success_message: body.success_message,
        webhook_url: body.webhook_url || null,
        webhook_secret: body.webhook_secret || null,
        is_active: body.is_active ?? true,
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

async function assertAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from('admin_users').select('id').eq('user_id', user.id).eq('is_active', true).single();
  return !!data;
}

// GET /api/admin/briefing/mt/responses?search=&page=1
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    if (!(await assertAdmin(supabase))) {
      return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 });
    }

    const service = createServiceClient();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') ?? '';

    let query = service
      .from('briefing_mt_responses')
      .select('id, answers, submitted_at, webhook_sent, company_id, briefing_company_config(company_name, slug)', { count: 'exact' })
      .order('submitted_at', { ascending: false });

    if (search) {
      query = query.ilike('answers::text', `%${search}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data: data ?? [], total: count ?? 0 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// DELETE /api/admin/briefing/mt/responses?id=uuid
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    if (!(await assertAdmin(supabase))) {
      return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'id obrigatório' }, { status: 400 });

    const service = createServiceClient();
    const { error } = await service.from('briefing_mt_responses').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

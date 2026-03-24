import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

async function assertAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from('admin_users').select('id').eq('user_id', user.id).eq('is_active', true).single();
  return !!data;
}

// GET /api/admin/briefing/mt/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    if (!(await assertAdmin(supabase))) {
      return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 });
    }

    const service = createServiceClient();

    const { data: config, error: configErr } = await service
      .from('briefing_company_config')
      .select('*')
      .eq('id', params.id)
      .single();

    if (configErr || !config) {
      return NextResponse.json({ success: false, message: 'Não encontrado' }, { status: 404 });
    }

    const { data: questions, error: qErr } = await service
      .from('briefing_questions')
      .select('*')
      .eq('config_id', params.id)
      .order('order_index', { ascending: true });

    if (qErr) throw qErr;

    return NextResponse.json({ success: true, config, questions: questions ?? [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// PATCH /api/admin/briefing/mt/[id]
// Body pode conter { config } e/ou { questions }
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    if (!(await assertAdmin(supabase))) {
      return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const service = createServiceClient();

    // --- Update config ---
    if (body.config) {
      const { config } = body;
      const { error } = await service
        .from('briefing_company_config')
        .update({
          slug: config.slug,
          company_name: config.company_name,
          logo_url: config.logo_url || null,
          primary_color: config.primary_color,
          welcome_title: config.welcome_title,
          welcome_message: config.welcome_message,
          success_message: config.success_message,
          webhook_url: config.webhook_url || null,
          webhook_secret: config.webhook_secret || null,
          is_active: config.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id);
      if (error) throw error;
    }

    // --- Upsert questions ---
    if (body.questions) {
      const questions: any[] = body.questions;

      // Delete questions that are no longer in the list
      const existingIds = questions.filter((q) => q.id && !q._new).map((q) => q.id);
      if (existingIds.length > 0) {
        await service
          .from('briefing_questions')
          .delete()
          .eq('config_id', params.id)
          .not('id', 'in', `(${existingIds.join(',')})`);
      } else {
        // All are new — delete everything for this config first
        await service.from('briefing_questions').delete().eq('config_id', params.id);
      }

      // Upsert all questions
      const rows = questions.map((q, idx) => ({
        ...(q.id && !q._new ? { id: q.id } : {}),
        config_id: params.id,
        label: q.label,
        field_key: q.field_key,
        question_type: q.question_type,
        options: q.options?.length ? q.options : null,
        placeholder: q.placeholder || null,
        is_required: q.is_required,
        order_index: idx,
      }));

      const { data: savedQ, error: qErr } = await service
        .from('briefing_questions')
        .upsert(rows, { onConflict: 'id' })
        .select();

      if (qErr) throw qErr;

      return NextResponse.json({ success: true, questions: savedQ });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// DELETE /api/admin/briefing/mt/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    if (!(await assertAdmin(supabase))) {
      return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 });
    }

    const service = createServiceClient();
    const { error } = await service.from('briefing_company_config').delete().eq('id', params.id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

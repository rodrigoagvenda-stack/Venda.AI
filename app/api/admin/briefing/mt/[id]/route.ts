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

    // --- Salvar questions: update existentes, insert novas, delete removidas ---
    if (body.questions) {
      const questions: any[] = body.questions;

      // IDs que vieram do frontend (existentes)
      const sentIds = questions.filter((q) => q.id && !q._new).map((q) => q.id as string);

      // Deleta apenas as que foram removidas pelo usuário
      const { data: currentQ } = await service
        .from('briefing_questions')
        .select('id')
        .eq('config_id', params.id);

      const toDelete = (currentQ ?? [])
        .map((q: any) => q.id as string)
        .filter((id) => !sentIds.includes(id));

      if (toDelete.length > 0) {
        await service.from('briefing_questions').delete().in('id', toDelete);
      }

      // Update existentes
      const toUpdate = questions.filter((q) => q.id && !q._new);
      for (const q of toUpdate) {
        await service
          .from('briefing_questions')
          .update({
            label: q.label,
            field_key: q.field_key,
            question_type: q.question_type,
            options: q.options?.length ? q.options : null,
            placeholder: q.placeholder || null,
            is_required: q.is_required,
            order_index: questions.indexOf(q),
          })
          .eq('id', q.id);
      }

      // Insert novas
      const toInsert = questions.filter((q) => !q.id || q._new);
      if (toInsert.length > 0) {
        const rows = toInsert.map((q) => ({
          config_id: params.id,
          label: q.label,
          field_key: q.field_key,
          question_type: q.question_type,
          options: q.options?.length ? q.options : null,
          placeholder: q.placeholder || null,
          is_required: q.is_required,
          order_index: questions.indexOf(q),
        }));
        const { error: insertErr } = await service.from('briefing_questions').insert(rows);
        if (insertErr) throw insertErr;
      }

      // Retorna lista atualizada
      const { data: savedQ } = await service
        .from('briefing_questions')
        .select('*')
        .eq('config_id', params.id)
        .order('order_index', { ascending: true });

      return NextResponse.json({ success: true, questions: savedQ ?? [] });
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

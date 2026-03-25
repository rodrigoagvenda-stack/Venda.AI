import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 });

    const { data: adminUser } = await supabase
      .from('admin_users').select('id').eq('user_id', user.id).eq('is_active', true).single();
    if (!adminUser) return NextResponse.json({ success: false, message: 'Acesso negado' }, { status: 403 });

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const configId = formData.get('configId') as string;

    if (!file) return NextResponse.json({ success: false, message: 'Nenhum arquivo enviado' }, { status: 400 });
    if (!configId) return NextResponse.json({ success: false, message: 'configId obrigatório' }, { status: 400 });

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowed.includes(file.type))
      return NextResponse.json({ success: false, message: 'Use JPG, PNG, WEBP ou SVG' }, { status: 400 });

    if (file.size > 2 * 1024 * 1024)
      return NextResponse.json({ success: false, message: 'Máximo 2MB' }, { status: 400 });

    const ext = file.name.split('.').pop();
    const filePath = `briefing-logos/${configId}-${Date.now()}.${ext}`;

    // Usa service role para bypassar RLS do storage
    const service = createServiceClient();

    const { error: uploadError } = await service.storage
      .from('user-uploads')
      .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = service.storage.from('user-uploads').getPublicUrl(filePath);

    await service
      .from('briefing_company_config')
      .update({ logo_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', configId);

    return NextResponse.json({ success: true, logo_url: publicUrl });
  } catch (error: any) {
    console.error('upload-logo error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Erro interno' }, { status: 500 });
  }
}

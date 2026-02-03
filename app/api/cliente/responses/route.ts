import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    let query = supabase
      .from('cliente_responses')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`nome_empresa.ilike.%${search}%,cs_responsavel.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching clientes:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      total: count || 0,
    });
  } catch (error: any) {
    console.error('Error in cliente responses API:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Erro ao buscar clientes' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendWhatsAppMessage } from '@/lib/n8n/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, phoneNumber, message, companyId, userId, messageType, mediaUrl, caption, filename } = body;

    if (!conversationId || !phoneNumber || !companyId) {
      return NextResponse.json(
        { success: false, message: 'Dados obrigatórios faltando' },
        { status: 400 }
      );
    }

    // Validação específica por tipo de mensagem
    const type = messageType || 'text';
    if (type === 'text' && !message) {
      return NextResponse.json(
        { success: false, message: 'Mensagem de texto não pode estar vazia' },
        { status: 400 }
      );
    }
    if (type !== 'text' && !mediaUrl) {
      return NextResponse.json(
        { success: false, message: 'URL da mídia é obrigatória' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. Paralelizar queries iniciais (conversa + company) para reduzir latência
    const [
      { data: conversation, error: convCheckError },
      { data: company, error: companyError }
    ] = await Promise.all([
      // Buscar conversa com lead_id (2 queries em 1)
      supabase
        .from('conversas_do_whatsapp')
        .select('id, company_id, id_do_lead')
        .eq('id', conversationId)
        .eq('company_id', companyId)
        .single(),
      // Buscar credenciais WhatsApp da empresa
      supabase
        .from('companies')
        .select('whatsapp_instance, whatsapp_token, n8n_webhook_url')
        .eq('id', companyId)
        .single()
    ]);

    // Validações de segurança
    if (convCheckError || !conversation) {
      return NextResponse.json(
        { success: false, message: 'Conversa não encontrada ou acesso negado' },
        { status: 403 }
      );
    }

    if (companyError || !company?.whatsapp_instance || !company?.whatsapp_token) {
      return NextResponse.json(
        { success: false, message: 'Credenciais WhatsApp não configuradas' },
        { status: 400 }
      );
    }

    const leadId = conversation.id_do_lead || null;

    // 4. Preparar dados da mensagem
    const messageData: any = {
      company_id: companyId, // 🔒 Segurança: isolamento por empresa
      id_da_conversacao: conversationId,
      texto_da_mensagem: message || (type === 'image' ? '📷 Imagem' : type === 'document' ? '📄 Documento' : type === 'audio' ? '🎵 Áudio' : type === 'video' ? '🎥 Vídeo' : ''),
      tipo_de_mensagem: type,
      direcao: 'outbound',
      sender_type: 'human',
      sender_user_id: userId,
      status: 'sent',
      carimbo_de_data_e_hora: new Date().toISOString(),
      url_da_midia: mediaUrl || null,
    };

    // Adicionar lead_id apenas se existir (nem todas conversas têm lead)
    if (leadId) {
      messageData.id_do_lead = leadId;
    }

    // 6. Paralelizar: salvar mensagem + atualizar conversa (reduz latência)
    const [
      { data: savedMessage, error: messageError },
      { error: conversationError }
    ] = await Promise.all([
      supabase
        .from('mensagens_do_whatsapp')
        .insert(messageData)
        .select()
        .single(),
      supabase
        .from('conversas_do_whatsapp')
        .update({
          ultima_mensagem: message,
          hora_da_ultima_mensagem: new Date().toISOString(),
        })
        .eq('id', conversationId)
        .eq('company_id', companyId) // 🔒 Segurança: garante isolamento
    ]);

    if (messageError) throw messageError;
    if (conversationError) throw conversationError;

    // 6. Disparar webhook N8N em fire-and-forget (não bloqueia a resposta)
    sendWhatsAppMessage({
      number: phoneNumber,
      text: message || '',
      messageType: type,
      mediaUrl: mediaUrl || '',
      caption: caption || '',
      filename: filename || '',
      company_id: parseInt(companyId),
      url_instancia: company.whatsapp_instance,
      token: company.whatsapp_token,
      n8n_webhook_url: (company as any).n8n_webhook_url || '',
      conversa_id: conversationId.toString(),
      lead_id: leadId ? leadId.toString() : '',
      message_id: savedMessage?.id?.toString() || '',
    }).catch((err) => console.error('[WhatsApp] Webhook fire-and-forget error:', err));

    // 7. Registrar log de forma assíncrona (não bloqueia resposta)
    supabase.from('system_logs').insert({
      company_id: companyId,
      type: 'user_action',
      severity: 'info',
      message: `Mensagem enviada para ${phoneNumber}`,
      metadata: {
        user_id: userId,
        conversation_id: conversationId,
        message_length: message.length,
      },
    }).then(
      () => {},
      (err) => console.error('Error logging message send:', err)
    );

    return NextResponse.json({
      success: true,
      message: 'Mensagem enviada com sucesso',
      data: savedMessage,
    });
  } catch (error: any) {
    console.error('Error sending WhatsApp message:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Erro ao enviar mensagem' },
      { status: 500 }
    );
  }
}

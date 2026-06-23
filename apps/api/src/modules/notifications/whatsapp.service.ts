import { Injectable } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../common/supabase.module';
import { Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class WhatsAppService {
  constructor(@Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient) {}

  async sendOrderUpdate(phone: string, message: string) {
    try {
      await this.supabase.from('whatsapp_logs').insert({
        phone,
        message,
        status: 'sent',
      });
    } catch {}
    return { sent: true, phone };
  }

  async getTemplates() {
    return [
      { id: 'order_confirmed', name: 'Pedido confirmado', template: 'Tu pedido #{order_id} ha sido confirmado. Total: ${total}' },
      { id: 'order_shipped', name: 'Pedido enviado', template: 'Tu pedido #{order_id} ha sido enviado. Seguimiento: {tracking}' },
      { id: 'order_delivered', name: 'Pedido entregado', template: 'Tu pedido #{order_id} ha sido entregado. ¡Gracias por tu compra!' },
    ];
  }
}

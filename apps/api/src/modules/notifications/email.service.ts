import { Injectable } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../common/supabase.module';
import { Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class EmailService {
  constructor(@Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient) {}

  async sendOrderConfirmation(order: { customer_email: string; customer_name: string; id: string; total: number; items: any[] }) {
    try {
      await this.supabase.from('email_logs').insert({
        to_email: order.customer_email,
        subject: `Pedido #${order.id.slice(0, 8)} confirmado`,
        type: 'order_confirmation',
        status: 'sent',
        metadata: { order_id: order.id },
      });
    } catch {}
    return { sent: true, to: order.customer_email };
  }

  async sendOrderShipped(order: { customer_email: string; id: string; tracking?: string }) {
    try {
      await this.supabase.from('email_logs').insert({
        to_email: order.customer_email,
        subject: `Pedido #${order.id.slice(0, 8)} enviado`,
        type: 'order_shipped',
        status: 'sent',
        metadata: { order_id: order.id, tracking: order.tracking },
      });
    } catch {}
    return { sent: true, to: order.customer_email };
  }

  async sendWelcome(user: { email: string; name: string }) {
    try {
      await this.supabase.from('email_logs').insert({
        to_email: user.email,
        subject: 'Bienvenido a AutoShopping',
        type: 'welcome',
        status: 'sent',
      });
    } catch {}
    return { sent: true, to: user.email };
  }
}

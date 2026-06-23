import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../common/supabase.module';
import { Inject as NestInject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class InvoicingService {
  constructor(@NestInject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient) {}

  async listInvoices(tenantId: string) {
    const { data, error } = await this.supabase
      .from('invoices')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async generateInvoice(tenantId: string, orderId: string) {
    const { data: order, error: orderError } = await this.supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('tenant_id', tenantId)
      .single();
    if (orderError || !order) throw new BadRequestException('Orden no encontrada');

    const existingInvoice = await this.supabase
      .from('invoices')
      .select('id')
      .eq('order_id', orderId)
      .single();
    if (existingInvoice.data) throw new BadRequestException('La orden ya tiene un documento asociado');

    const isFactura = !!order.customer_rut;
    const siiCode = this.generateSiiCode();

    const { data, error } = await this.supabase
      .from('invoices')
      .insert({
        tenant_id: tenantId,
        order_id: orderId,
        type: isFactura ? 'factura' : 'boleta',
        sii_code: siiCode,
        status: 'pending',
        total: order.total,
        customer_name: order.customer_name,
        customer_rut: order.customer_rut || null,
        customer_email: order.customer_email,
      })
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  private generateSiiCode(): string {
    const now = new Date();
    const year = now.getFullYear();
    const seq = Math.floor(Math.random() * 99999999).toString().padStart(8, '0');
    return `${year}${seq}`;
  }
}

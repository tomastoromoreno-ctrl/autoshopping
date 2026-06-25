import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../common/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class InvoicingService {
  constructor(@Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient) {}

  async listInvoices(tenantId: string) {
    const { data, error } = await this.supabase
      .from('invoices')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async getConfig(tenantId: string) {
    const { data } = await this.supabase
      .from('invoicing_configs')
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (!data) {
      // Create default config
      const { data: created, error } = await this.supabase
        .from('invoicing_configs')
        .insert({
          tenant_id: tenantId,
          sii_environment: 'certification',
          folio_start: 1,
          folio_current: 1,
          auto_generate_boleta: false,
          auto_generate_factura: false,
        })
        .select()
        .single();

      if (error) throw new BadRequestException(error.message);
      return created;
    }

    return data;
  }

  async updateConfig(tenantId: string, dto: {
    razon_social?: string;
    rut_empresa?: string;
    giro?: string;
    direccion?: string;
    comuna?: string;
    ciudad?: string;
    actividad_economica?: string;
    sii_environment?: string;
    folio_start?: number;
    auto_generate_boleta?: boolean;
    auto_generate_factura?: boolean;
  }) {
    const { data, error } = await this.supabase
      .from('invoicing_configs')
      .upsert(
        { tenant_id: tenantId, ...dto, updated_at: new Date().toISOString() },
        { onConflict: 'tenant_id' },
      )
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
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

    // Get invoicing config for the tenant
    const config = await this.getConfig(tenantId);

    const isFactura = !!order.customer_rut;
    const docType = isFactura ? 33 : 39; // SII: 33 = Factura Electrónica, 39 = Boleta Electrónica

    // Calculate tax breakdown (IVA 19%)
    const totalAmount = Number(order.total);
    const netAmount = Math.round(totalAmount / 1.19);
    const taxAmount = totalAmount - netAmount;

    // Get order items for DTE
    const { data: orderItems } = await this.supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    // Get current folio and increment
    const folio = config.folio_current || 1;
    await this.supabase
      .from('invoicing_configs')
      .update({ folio_current: folio + 1, updated_at: new Date().toISOString() })
      .eq('tenant_id', tenantId);

    // Generate XML DTE structure (simplified simulation)
    const xmlContent = this.generateDteXml({
      tipoDte: docType,
      folio,
      fechaEmision: new Date().toISOString().split('T')[0],
      rutEmisor: config.rut_empresa || '00.000.000-0',
      razonSocialEmisor: config.razon_social || 'Sin configurar',
      giroEmisor: config.giro || 'Sin configurar',
      direccionEmisor: config.direccion || 'Sin configurar',
      comunaEmisor: config.comuna || 'Sin configurar',
      rutReceptor: order.customer_rut || '66.666.666-6',
      razonSocialReceptor: order.customer_name,
      montoNeto: netAmount,
      iva: taxAmount,
      montoTotal: totalAmount,
      items: (orderItems || []).map((item: any) => ({
        nombre: item.product_name,
        cantidad: item.quantity,
        precioUnitario: item.price,
        montoItem: item.quantity * item.price,
      })),
    });

    const { data, error } = await this.supabase
      .from('invoices')
      .insert({
        tenant_id: tenantId,
        order_id: orderId,
        type: isFactura ? 'factura' : 'boleta',
        sii_code: `${docType}-${folio}`,
        folio,
        status: 'pending',
        total: totalAmount,
        net_amount: netAmount,
        tax_amount: taxAmount,
        customer_name: order.customer_name,
        customer_rut: order.customer_rut || null,
        customer_email: order.customer_email,
        rut_emisor: config.rut_empresa || null,
        razon_social_emisor: config.razon_social || null,
        xml_content: xmlContent,
        items: orderItems || [],
      })
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  private generateDteXml(params: {
    tipoDte: number;
    folio: number;
    fechaEmision: string;
    rutEmisor: string;
    razonSocialEmisor: string;
    giroEmisor: string;
    direccionEmisor: string;
    comunaEmisor: string;
    rutReceptor: string;
    razonSocialReceptor: string;
    montoNeto: number;
    iva: number;
    montoTotal: number;
    items: { nombre: string; cantidad: number; precioUnitario: number; montoItem: number }[];
  }): string {
    const itemsXml = params.items
      .map(
        (item, idx) => `
      <Detalle>
        <NroLinDet>${idx + 1}</NroLinDet>
        <NmbItem>${this.escapeXml(item.nombre)}</NmbItem>
        <QtyItem>${item.cantidad}</QtyItem>
        <PrcItem>${item.precioUnitario}</PrcItem>
        <MontoItem>${item.montoItem}</MontoItem>
      </Detalle>`,
      )
      .join('');

    return `<?xml version="1.0" encoding="ISO-8859-1"?>
<DTE version="1.0">
  <Documento ID="DTE-${params.tipoDte}-${params.folio}">
    <Encabezado>
      <IdDoc>
        <TipoDTE>${params.tipoDte}</TipoDTE>
        <Folio>${params.folio}</Folio>
        <FchEmis>${params.fechaEmision}</FchEmis>
      </IdDoc>
      <Emisor>
        <RUTEmisor>${params.rutEmisor}</RUTEmisor>
        <RznSoc>${this.escapeXml(params.razonSocialEmisor)}</RznSoc>
        <GiroEmis>${this.escapeXml(params.giroEmisor)}</GiroEmis>
        <DirOrigen>${this.escapeXml(params.direccionEmisor)}</DirOrigen>
        <CmnaOrigen>${this.escapeXml(params.comunaEmisor)}</CmnaOrigen>
      </Emisor>
      <Receptor>
        <RUTRecep>${params.rutReceptor}</RUTRecep>
        <RznSocRecep>${this.escapeXml(params.razonSocialReceptor)}</RznSocRecep>
      </Receptor>
      <Totales>
        <MntNeto>${params.montoNeto}</MntNeto>
        <TasaIVA>19</TasaIVA>
        <IVA>${params.iva}</IVA>
        <MntTotal>${params.montoTotal}</MntTotal>
      </Totales>
    </Encabezado>
    ${itemsXml}
  </Documento>
</DTE>`;
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

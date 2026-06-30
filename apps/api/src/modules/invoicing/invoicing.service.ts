import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../common/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';
import { InvoicePdfService } from './invoice-pdf.service';
import * as crypto from 'crypto';

@Injectable()
export class InvoicingService {
  private encryptionKey: string;

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    private readonly invoicePdfService: InvoicePdfService,
  ) {
    this.encryptionKey = process.env.CERTIFICATE_ENCRYPTION_KEY;
    if (!this.encryptionKey) {
      this.encryptionKey = crypto.randomBytes(32).toString('hex');
      console.warn(
        'WARNING: CERTIFICATE_ENCRYPTION_KEY not set. Generated random key. ' +
        'Certificate passwords will NOT be recoverable after restart. ' +
        'Set CERTIFICATE_ENCRYPTION_KEY in your environment for production.',
      );
    }
  }

  private encryptPassword(password: string): string {
    const key = Buffer.from(this.encryptionKey, 'hex');
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = cipher.update(password, 'utf8', 'hex') + cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

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
    sii_invoicing_enabled?: boolean;
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
    const docType = isFactura ? 33 : 39; // SII: 33 = Factura, 39 = Boleta

    // Calculate tax breakdown (IVA 19%)
    const totalAmount = Number(order.total);
    const netAmount = Math.round(totalAmount / 1.19);
    const taxAmount = totalAmount - netAmount;

    // Get order items for DTE
    const { data: orderItems } = await this.supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (!config.sii_invoicing_enabled) {
      // General fallback to simple receipt (Recibo)
      const folio = config.folio_current || 1;
      await this.supabase
        .from('invoicing_configs')
        .update({ folio_current: folio + 1, updated_at: new Date().toISOString() })
        .eq('tenant_id', tenantId);

      const { data, error } = await this.supabase
        .from('invoices')
        .insert({
          tenant_id: tenantId,
          order_id: orderId,
          type: 'recibo',
          sii_code: `RECIBO-${folio}`,
          folio,
          status: 'completed',
          total: totalAmount,
          net_amount: netAmount,
          tax_amount: taxAmount,
          customer_name: order.customer_name,
          customer_rut: order.customer_rut || null,
          customer_email: order.customer_email,
          xml_content: null,
          items: orderItems || [],
        })
        .select()
        .single();

      if (error) throw new BadRequestException(error.message);
      await this.generateAndUploadPdf(data, config, tenantId);
      return data;
    }

    // SII Invoicing is Enabled: consume folio from active CAF
    const { data: activeCafs } = await this.supabase
      .from('tenant_cafs')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('dte_type', docType)
      .eq('is_active', true)
      .order('folio_start', { ascending: true });

    // Find the first CAF that has folios available
    const caf = (activeCafs || []).find((c) => c.folio_current <= c.folio_end);

    if (!caf) {
      throw new BadRequestException(
        `No tienes folios autorizados (CAF) disponibles para emitir ${
          docType === 33 ? 'Facturas' : 'Boletas'
        }. Por favor, carga un nuevo archivo CAF en la configuración de Facturación SII.`
      );
    }

    const folio = caf.folio_current;

    // Increment current folio in CAF and update status
    await this.supabase
      .from('tenant_cafs')
      .update({
        folio_current: folio + 1,
        is_active: folio + 1 <= caf.folio_end,
        updated_at: new Date().toISOString(),
      })
      .eq('id', caf.id);

    // Sync folio in config
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
        precioUnitario: item.unit_price,
        montoItem: item.quantity * item.unit_price,
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
    await this.generateAndUploadPdf(data, config, tenantId);
    return data;
  }

  private async generateAndUploadPdf(invoice: any, config: any, tenantId: string) {
    try {
      const pdfBuffer = await this.invoicePdfService.generateInvoicePdf(invoice, config);
      const fileName = `invoices/${tenantId}/${invoice.id}.pdf`;
      const { error: uploadError } = await this.supabase.storage
        .from('store-assets')
        .upload(fileName, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true,
        });
      if (uploadError) throw uploadError;
      const { data: publicUrl } = this.supabase.storage
        .from('store-assets')
        .getPublicUrl(fileName);
      await this.supabase
        .from('invoices')
        .update({ pdf_url: publicUrl.publicUrl })
        .eq('id', invoice.id);
    } catch (err) {
      console.error('Error generating or uploading PDF:', err);
    }
  }

  async downloadInvoicePdf(tenantId: string, invoiceId: string): Promise<Buffer> {
    const { data: invoice, error } = await this.supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !invoice) throw new BadRequestException('Documento no encontrado');

    const fileName = `invoices/${tenantId}/${invoiceId}.pdf`;
    const { data, error: downloadError } = await this.supabase.storage
      .from('store-assets')
      .download(fileName);

    if (downloadError || !data) {
      throw new BadRequestException('No se pudo descargar el PDF');
    }

    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async uploadCertificate(tenantId: string, base64: string, filename: string, password?: string) {
    const { data, error } = await this.supabase
      .from('invoicing_configs')
      .upsert(
        {
          tenant_id: tenantId,
          certificate_uploaded: true,
          certificate_path: `tenants/${tenantId}/certificates/${filename}`,
          certificate_password_encrypted: password ? this.encryptPassword(password) : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'tenant_id' },
      )
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async uploadCaf(tenantId: string, xmlContent: string) {
    // Extract range, tipo dte, and headers using regex to avoid external xml parser issues
    const tdMatch = xmlContent.match(/<TD>([^<]+)<\/TD>/i);
    const dMatch = xmlContent.match(/<D>([^<]+)<\/D>/i);
    const hMatch = xmlContent.match(/<H>([^<]+)<\/H>/i);

    if (!tdMatch || !dMatch || !hMatch) {
      throw new BadRequestException('El archivo CAF XML provisto no tiene un formato válido del SII.');
    }

    const dteType = parseInt(tdMatch[1].trim(), 10);
    const folioStart = parseInt(dMatch[1].trim(), 10);
    const folioEnd = parseInt(hMatch[1].trim(), 10);

    if (isNaN(dteType) || isNaN(folioStart) || isNaN(folioEnd)) {
      throw new BadRequestException('No se pudieron extraer los rangos numéricos del archivo CAF XML.');
    }

    const { data, error } = await this.supabase
      .from('tenant_cafs')
      .upsert(
        {
          tenant_id: tenantId,
          dte_type: dteType,
          folio_start: folioStart,
          folio_end: folioEnd,
          folio_current: folioStart,
          xml_content: xmlContent,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'tenant_id,dte_type,folio_start' },
      )
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async listCafs(tenantId: string) {
    const { data, error } = await this.supabase
      .from('tenant_cafs')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return data || [];
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

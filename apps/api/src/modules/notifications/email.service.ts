import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { SUPABASE_CLIENT } from '../../common/supabase.module';

interface OrderEmailData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  items: { name: string; quantity: number; price: number }[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  storeName: string;
  storeUrl: string;
}

interface ShippedEmailData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  tracking?: string;
  storeName: string;
  storeUrl: string;
}

interface StatusEmailData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  newStatus: string;
  storeName: string;
  storeUrl: string;
}

interface MerchantOrderEmailData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: { name: string; quantity: number; price: number }[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  storeName: string;
  merchantEmail: string;
  shippingType?: string;
  shippingBranch?: string;
}

@Injectable()
export class EmailService {
  private readonly resend: Resend;
  private readonly fromEmail: string;
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly config: ConfigService,
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {
    this.resend = new Resend(this.config.get<string>('RESEND_API_KEY'));
    this.fromEmail = this.config.get<string>('EMAIL_FROM') || 'AutoShopping <noreply@autoshopping.cl>';
  }

  async sendOrderConfirmation(data: OrderEmailData): Promise<{ sent: boolean; id?: string; error?: string }> {
    try {
      const html = this.buildOrderConfirmationHtml(data);
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: [data.customerEmail],
        subject: `Pedido #${data.orderId.slice(0, 8)} confirmado - ${data.storeName}`,
        html,
      });

      if (result.error) {
        this.logger.error(`Failed to send order confirmation: ${result.error.message}`);
        await this.logEmail(data.customerEmail, `Pedido #${data.orderId.slice(0, 8)} confirmado - ${data.storeName}`, 'order_confirmation', 'failed', { error: result.error.message });
        return { sent: false, error: result.error.message };
      }

      this.logger.log(`Order confirmation sent to ${data.customerEmail} (id: ${result.data?.id})`);
      await this.logEmail(data.customerEmail, `Pedido #${data.orderId.slice(0, 8)} confirmado - ${data.storeName}`, 'order_confirmation', 'sent', { id: result.data?.id });
      return { sent: true, id: result.data?.id };
    } catch (error) {
      this.logger.error(`Order confirmation error: ${error.message}`);
      await this.logEmail(data.customerEmail, `Pedido #${data.orderId.slice(0, 8)} confirmado - ${data.storeName}`, 'order_confirmation', 'failed', { error: error.message });
      return { sent: false, error: error.message };
    }
  }

  async sendOrderShipped(data: ShippedEmailData): Promise<{ sent: boolean; id?: string; error?: string }> {
    try {
      const html = this.buildOrderShippedHtml(data);
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: [data.customerEmail],
        subject: `Tu pedido #${data.orderId.slice(0, 8)} fue enviado - ${data.storeName}`,
        html,
      });

      if (result.error) {
        this.logger.error(`Failed to send shipping notification: ${result.error.message}`);
        await this.logEmail(data.customerEmail, `Tu pedido #${data.orderId.slice(0, 8)} fue enviado - ${data.storeName}`, 'order_shipped', 'failed', { error: result.error.message });
        return { sent: false, error: result.error.message };
      }

      this.logger.log(`Shipping notification sent to ${data.customerEmail} (id: ${result.data?.id})`);
      await this.logEmail(data.customerEmail, `Tu pedido #${data.orderId.slice(0, 8)} fue enviado - ${data.storeName}`, 'order_shipped', 'sent', { id: result.data?.id });
      return { sent: true, id: result.data?.id };
    } catch (error) {
      this.logger.error(`Shipping notification error: ${error.message}`);
      await this.logEmail(data.customerEmail, `Tu pedido #${data.orderId.slice(0, 8)} fue enviado - ${data.storeName}`, 'order_shipped', 'failed', { error: error.message });
      return { sent: false, error: error.message };
    }
  }

  async sendWelcome(name: string, email: string, storeName: string): Promise<{ sent: boolean; id?: string; error?: string }> {
    try {
      const html = this.buildWelcomeHtml(name, storeName);
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: [email],
        subject: `Bienvenido a ${storeName}`,
        html,
      });

      if (result.error) {
        this.logger.error(`Failed to send welcome email: ${result.error.message}`);
        return { sent: false, error: result.error.message };
      }

      this.logger.log(`Welcome email sent to ${email} (id: ${result.data?.id})`);
      return { sent: true, id: result.data?.id };
    } catch (error) {
      this.logger.error(`Welcome email error: ${error.message}`);
      return { sent: false, error: error.message };
    }
  }

  async sendOrderStatusChanged(data: StatusEmailData): Promise<{ sent: boolean; id?: string; error?: string }> {
    const statusLabels: Record<string, string> = {
      confirmed: 'confirmado',
      processing: 'en preparación',
      shipped: 'enviado',
      delivered: 'entregado',
      cancelled: 'cancelado',
      refunded: 'reembolsado',
    };

    const label = statusLabels[data.newStatus] || data.newStatus;
    const subject = `Pedido #${data.orderId.slice(0, 8)} ${label} - ${data.storeName}`;

    try {
      const html = this.buildStatusChangedHtml(data, label);
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: [data.customerEmail],
        subject,
        html,
      });

      if (result.error) {
        this.logger.error(`Failed to send status email: ${result.error.message}`);
        await this.logEmail(data.customerEmail, subject, `order_${data.newStatus}`, 'failed', { error: result.error.message });
        return { sent: false, error: result.error.message };
      }

      this.logger.log(`Status email sent to ${data.customerEmail} (id: ${result.data?.id})`);
      await this.logEmail(data.customerEmail, subject, `order_${data.newStatus}`, 'sent', { id: result.data?.id });
      return { sent: true, id: result.data?.id };
    } catch (error) {
      this.logger.error(`Status email error: ${error.message}`);
      await this.logEmail(data.customerEmail, subject, `order_${data.newStatus}`, 'failed', { error: error.message });
      return { sent: false, error: error.message };
    }
  }

  private buildOrderConfirmationHtml(data: OrderEmailData): string {
    const itemsHtml = data.items
      .map(
        (item) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#334155;">${item.name}</td>
          <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#64748b;text-align:center;">${item.quantity}</td>
          <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#334155;text-align:right;">$${item.price.toLocaleString('es-CL')}</td>
        </tr>`,
      )
      .join('');

    return `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
        <div style="text-align:center;margin-bottom:32px;">
          <h1 style="font-size:24px;font-weight:700;color:#0f172a;margin:0;">${data.storeName}</h1>
        </div>
        <div style="background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;padding:32px;margin-bottom:16px;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="width:56px;height:56px;background:#dcfce7;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
              <span style="font-size:28px;">✓</span>
            </div>
            <h2 style="font-size:20px;font-weight:600;color:#0f172a;margin:0 0 8px;">Pedido confirmado</h2>
            <p style="font-size:14px;color:#64748b;margin:0;">Pedido #${data.orderId.slice(0, 8)}</p>
          </div>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            <thead>
              <tr>
                <th style="padding:8px 0;border-bottom:2px solid #e2e8f0;font-size:12px;font-weight:600;color:#94a3b8;text-align:left;text-transform:uppercase;letter-spacing:0.05em;">Producto</th>
                <th style="padding:8px 0;border-bottom:2px solid #e2e8f0;font-size:12px;font-weight:600;color:#94a3b8;text-align:center;text-transform:uppercase;letter-spacing:0.05em;">Cant.</th>
                <th style="padding:8px 0;border-bottom:2px solid #e2e8f0;font-size:12px;font-weight:600;color:#94a3b8;text-align:right;text-transform:uppercase;letter-spacing:0.05em;">Precio</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div style="border-top:2px solid #e2e8f0;padding-top:16px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
              <span style="font-size:14px;color:#64748b;">Subtotal</span>
              <span style="font-size:14px;color:#334155;">$${data.subtotal.toLocaleString('es-CL')}</span>
            </div>
            ${data.discount > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:8px;">
              <span style="font-size:14px;color:#64748b;">Descuento</span>
              <span style="font-size:14px;color:#dc2626;">-$${data.discount.toLocaleString('es-CL')}</span>
            </div>` : ''}
            <div style="display:flex;justify-content:space-between;margin-bottom:16px;">
              <span style="font-size:14px;color:#64748b;">Envío</span>
              <span style="font-size:14px;color:#334155;">${data.shippingCost > 0 ? '$' + data.shippingCost.toLocaleString('es-CL') : 'Gratis'}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding-top:16px;border-top:2px solid #e2e8f0;">
              <span style="font-size:16px;font-weight:700;color:#0f172a;">Total</span>
              <span style="font-size:16px;font-weight:700;color:#2563eb;">$${data.total.toLocaleString('es-CL')}</span>
            </div>
          </div>
        </div>
        <div style="text-align:center;margin-bottom:16px;">
          <a href="${data.storeUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;font-size:14px;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;">Ver mi pedido</a>
        </div>
        <p style="text-align:center;font-size:12px;color:#94a3b8;">Gracias por tu compra en ${data.storeName}</p>
      </div>
    </body>
    </html>`;
  }

  private buildOrderShippedHtml(data: ShippedEmailData): string {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
        <div style="text-align:center;margin-bottom:32px;">
          <h1 style="font-size:24px;font-weight:700;color:#0f172a;margin:0;">${data.storeName}</h1>
        </div>
        <div style="background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;padding:32px;margin-bottom:16px;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="width:56px;height:56px;background:#dbeafe;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
              <span style="font-size:28px;">🚚</span>
            </div>
            <h2 style="font-size:20px;font-weight:600;color:#0f172a;margin:0 0 8px;">Tu pedido fue enviado</h2>
            <p style="font-size:14px;color:#64748b;margin:0;">Pedido #${data.orderId.slice(0, 8)}</p>
          </div>
          ${data.tracking ? `
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:24px;">
            <p style="font-size:12px;color:#94a3b8;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em;">Código de seguimiento</p>
            <p style="font-size:18px;font-weight:600;color:#2563eb;margin:0;font-family:monospace;">${data.tracking}</p>
          </div>` : ''}
        </div>
        <div style="text-align:center;margin-bottom:16px;">
          <a href="${data.storeUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;font-size:14px;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;">Ver mi pedido</a>
        </div>
        <p style="text-align:center;font-size:12px;color:#94a3b8;">Gracias por tu compra en ${data.storeName}</p>
      </div>
    </body>
    </html>`;
  }

  private buildStatusChangedHtml(data: StatusEmailData, label: string): string {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
        <div style="text-align:center;margin-bottom:32px;">
          <h1 style="font-size:24px;font-weight:700;color:#0f172a;margin:0;">${data.storeName}</h1>
        </div>
        <div style="background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;padding:32px;margin-bottom:16px;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="width:56px;height:56px;background:#dbeafe;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
              <span style="font-size:28px;">🔄</span>
            </div>
            <h2 style="font-size:20px;font-weight:600;color:#0f172a;margin:0 0 8px;">Pedido ${label}</h2>
            <p style="font-size:14px;color:#64748b;margin:0;">Pedido #${data.orderId.slice(0, 8)}</p>
          </div>
          <p style="font-size:14px;color:#334155;line-height:1.6;text-align:center;">
            Hola ${data.customerName}, tu pedido #${data.orderId.slice(0, 8)} ha sido <strong>${label}</strong>.
          </p>
          <div style="text-align:center;margin-top:24px;">
            <a href="${data.storeUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#ffffff;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">Visitar tienda</a>
          </div>
        </div>
        <p style="text-align:center;font-size:12px;color:#94a3b8;">Gracias por tu preferencia</p>
      </div>
    </body>
    </html>`;
  }

  private buildWelcomeHtml(name: string, storeName: string): string {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
        <div style="text-align:center;margin-bottom:32px;">
          <h1 style="font-size:24px;font-weight:700;color:#0f172a;margin:0;">${storeName}</h1>
        </div>
        <div style="background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;padding:32px;margin-bottom:16px;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="width:56px;height:56px;background:#dcfce7;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
              <span style="font-size:28px;">👋</span>
            </div>
            <h2 style="font-size:20px;font-weight:600;color:#0f172a;margin:0 0 8px;">¡Hola ${name}!</h2>
            <p style="font-size:14px;color:#64748b;margin:0;">Tu cuenta ha sido creada exitosamente</p>
          </div>
          <p style="font-size:14px;color:#334155;line-height:1.6;text-align:center;">Ya puedes explorar nuestros productos y realizar tu primera compra en <strong>${storeName}</strong>.</p>
        </div>
        <p style="text-align:center;font-size:12px;color:#94a3b8;">${storeName} - Powered by AutoShopping</p>
      </div>
    </body>
    </html>`;
  }

  async sendMerchantNewOrderNotification(data: MerchantOrderEmailData): Promise<{ sent: boolean; id?: string; error?: string }> {
    try {
      const html = this.buildMerchantOrderHtml(data);
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: [data.merchantEmail],
        subject: `🛍️ [Nueva Venta] Pedido #${data.orderId.slice(0, 8)} - ${data.customerName}`,
        html,
      });

      if (result.error) {
        this.logger.error(`Failed to send merchant order notification: ${result.error.message}`);
        await this.logEmail(data.merchantEmail, `[Nueva Venta] Pedido #${data.orderId.slice(0, 8)} - ${data.customerName}`, 'merchant_notification', 'failed', { error: result.error.message });
        return { sent: false, error: result.error.message };
      }

      await this.logEmail(data.merchantEmail, `[Nueva Venta] Pedido #${data.orderId.slice(0, 8)} - ${data.customerName}`, 'merchant_notification', 'sent', { id: result.data?.id });
      return { sent: true, id: result.data?.id };
    } catch (error) {
      this.logger.error(`Merchant order notification error: ${error.message}`);
      await this.logEmail(data.merchantEmail, `[Nueva Venta] Pedido #${data.orderId.slice(0, 8)} - ${data.customerName}`, 'merchant_notification', 'failed', { error: error.message });
      return { sent: false, error: error.message };
    }
  }

  private async logEmail(to: string, subject: string, type: string, status: string, metadata?: any) {
    try {
      await this.supabase.from('email_logs').insert({
        to_email: to,
        subject,
        type,
        status,
        metadata: metadata || null,
      });
    } catch (err) {
      this.logger.error(`Failed to log email: ${err.message}`);
    }
  }

  private buildMerchantOrderHtml(data: MerchantOrderEmailData): string {
    const itemsHtml = data.items
      .map(
        (item) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#334155;">${item.name}</td>
          <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#64748b;text-align:center;">${item.quantity}</td>
          <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#334155;text-align:right;">$${item.price.toLocaleString('es-CL')}</td>
        </tr>`,
      )
      .join('');

    const formattedPhone = data.customerPhone ? data.customerPhone.replace(/\+/g, '').replace(/\s/g, '') : '';
    const whatsappUrl = formattedPhone 
      ? `https://wa.me/${formattedPhone}?text=Hola%20${encodeURIComponent(data.customerName)}%2C%20te%20escribo%20desde%20${encodeURIComponent(data.storeName)}%20sobre%20tu%20pedido%20%23${data.orderId.slice(0, 8)}.`
      : '';

    return `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
        <div style="text-align:center;margin-bottom:32px;">
          <h1 style="font-size:24px;font-weight:700;color:#0f172a;margin:0;">¡Nueva venta en ${data.storeName}!</h1>
        </div>
        <div style="background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;padding:32px;margin-bottom:16px;">
          <h2 style="font-size:18px;font-weight:600;color:#0f172a;margin:0 0 16px;">Detalles del Cliente</h2>
          <table style="width:100%;margin-bottom:24px;font-size:14px;color:#334155;">
            <tr><td style="padding:4px 0;color:#64748b;width:35%;">Nombre:</td><td style="padding:4px 0;font-weight:600;">${data.customerName}</td></tr>
            <tr><td style="padding:4px 0;color:#64748b;">Email:</td><td style="padding:4px 0;">${data.customerEmail}</td></tr>
            ${data.customerPhone ? `<tr><td style="padding:4px 0;color:#64748b;">Teléfono:</td><td style="padding:4px 0;">${data.customerPhone}</td></tr>` : ''}
            <tr><td style="padding:4px 0;color:#64748b;">Tipo Despacho:</td><td style="padding:4px 0;font-weight:600;">${data.shippingType === 'branch' ? `Retiro en Sucursal (${data.shippingBranch || 'No especificada'})` : 'Despacho a Domicilio'}</td></tr>
          </table>

          ${whatsappUrl ? `
          <div style="text-align:center;margin-bottom:32px;margin-top:16px;">
            <a href="${whatsappUrl}" target="_blank" style="display:inline-block;background:#22c55e;color:#ffffff;font-size:14px;font-weight:700;padding:12px 32px;border-radius:8px;text-decoration:none;">💬 Hablar por WhatsApp</a>
          </div>` : ''}

          <h2 style="font-size:18px;font-weight:600;color:#0f172a;margin:0 0 16px;border-top:1px solid #f1f5f9;padding-top:16px;">Detalles del Pedido</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            <thead>
              <tr>
                <th style="padding:8px 0;border-bottom:2px solid #e2e8f0;font-size:12px;font-weight:600;color:#94a3b8;text-align:left;text-transform:uppercase;letter-spacing:0.05em;">Producto</th>
                <th style="padding:8px 0;border-bottom:2px solid #e2e8f0;font-size:12px;font-weight:600;color:#94a3b8;text-align:center;text-transform:uppercase;letter-spacing:0.05em;">Cant.</th>
                <th style="padding:8px 0;border-bottom:2px solid #e2e8f0;font-size:12px;font-weight:600;color:#94a3b8;text-align:right;text-transform:uppercase;letter-spacing:0.05em;">Precio</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div style="border-top:2px solid #e2e8f0;padding-top:16px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
              <span style="font-size:14px;color:#64748b;">Subtotal</span>
              <span style="font-size:14px;color:#334155;">$${data.subtotal.toLocaleString('es-CL')}</span>
            </div>
            ${data.discount > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:8px;">
              <span style="font-size:14px;color:#64748b;">Descuento</span>
              <span style="font-size:14px;color:#dc2626;">-$${data.discount.toLocaleString('es-CL')}</span>
            </div>` : ''}
            <div style="display:flex;justify-content:space-between;margin-bottom:16px;">
              <span style="font-size:14px;color:#64748b;">Envío</span>
              <span style="font-size:14px;color:#334155;">${data.shippingCost > 0 ? '$' + data.shippingCost.toLocaleString('es-CL') : 'Gratis'}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding-top:16px;border-top:2px solid #e2e8f0;">
              <span style="font-size:16px;font-weight:700;color:#0f172a;">Total Recibido</span>
              <span style="font-size:16px;font-weight:700;color:#2563eb;">$${data.total.toLocaleString('es-CL')}</span>
            </div>
          </div>
        </div>
        <p style="text-align:center;font-size:12px;color:#94a3b8;">Notificación automática de venta para ${data.storeName}</p>
      </div>
    </body>
    </html>`;
  }

  // ─── SuperAdmin & Billing Transactional Emails ────────────────────────

  private buildBaseTemplate(title: string, bodyContent: string): string {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
        <div style="background-color:#022759;padding:24px;border-top-left-radius:12px;border-top-right-radius:12px;text-align:center;">
          <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0;letter-spacing:1px;">AutoGastos</h1>
        </div>
        <div style="background:#ffffff;border-bottom-left-radius:12px;border-bottom-right-radius:12px;border:1px solid #e2e8f0;border-top:none;padding:32px;box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
          <h2 style="font-size:20px;font-weight:600;color:#0f172a;margin-top:0;margin-bottom:18px;">${title}</h2>
          <div style="font-size:15px;line-height:1.6;color:#334155;margin-bottom:24px;">
            ${bodyContent}
          </div>
          <div style="border-top:1px solid #e2e8f0;padding-top:20px;text-align:center;font-size:12px;color:#94a3b8;">
            Este es un correo transaccional automático enviado por AutoGastos.<br/>
            Si tienes dudas, contáctanos en soporte@autogastos.com.
          </div>
        </div>
      </div>
    </body>
    </html>`;
  }

  async sendStoreSuspended(email: string, storeName: string, reason: string): Promise<boolean> {
    const title = 'Tu tienda ha sido suspendida';
    const content = `
      <p>Hola,</p>
      <p>Te informamos que tu tienda <strong>${storeName}</strong> ha sido suspendida por el siguiente motivo:</p>
      <blockquote style="background:#f1f5f9;border-left:4px solid #ef4444;padding:12px 16px;margin:16px 0;font-style:italic;color:#475569;">
        ${reason || 'Incumplimiento de términos o facturación pendiente.'}
      </blockquote>
      <p>Para restaurar el acceso, por favor sigue las instrucciones ingresando a tu panel de configuración o contacta al equipo de soporte.</p>
    `;
    const html = this.buildBaseTemplate(title, content);
    try {
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: [email],
        subject: `⚠️ Tu tienda ${storeName} ha sido suspendida - AutoGastos`,
        html,
      });
      await this.logEmail(email, `Tienda ${storeName} suspendida`, 'store_suspended', !result.error ? 'sent' : 'failed', { error: result.error?.message });
      return !result.error;
    } catch (e) {
      await this.logEmail(email, `Tienda ${storeName} suspendida`, 'store_suspended', 'failed', { error: e.message });
      return false;
    }
  }

  async sendStoreReactivated(email: string, storeName: string): Promise<boolean> {
    const title = 'Tu tienda ha sido reactivada';
    const content = `
      <p>Hola,</p>
      <p>¡Buenas noticias! Tu tienda <strong>${storeName}</strong> ha sido reactivada de forma exitosa y ya se encuentra totalmente funcional.</p>
      <p>Puedes ingresar a tu panel de administración como de costumbre para gestionar tus operaciones.</p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${this.config.get('APP_URL')}/dashboard" style="background:#022759;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px;">Ingresar al Panel</a>
      </div>
    `;
    const html = this.buildBaseTemplate(title, content);
    try {
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: [email],
        subject: `✅ Acceso restablecido: Tienda ${storeName} reactivada - AutoGastos`,
        html,
      });
      await this.logEmail(email, `Tienda ${storeName} reactivada`, 'store_reactivated', !result.error ? 'sent' : 'failed', { error: result.error?.message });
      return !result.error;
    } catch (e) {
      await this.logEmail(email, `Tienda ${storeName} reactivada`, 'store_reactivated', 'failed', { error: e.message });
      return false;
    }
  }

  async sendStoreReset(email: string, storeName: string): Promise<boolean> {
    const title = 'Tu tienda ha sido reiniciada a cero';
    const content = `
      <p>Hola,</p>
      <p>Te confirmamos que todos los productos, órdenes, clientes e historial de tu tienda <strong>${storeName}</strong> han sido eliminados de manera permanente.</p>
      <p>Esta acción fue solicitada y ejecutada por el administrador y es totalmente irreversible.</p>
      <p>Si consideras que esto es un error o requieres ayuda adicional, por favor ponte en contacto con nuestro equipo de soporte técnico inmediatamente.</p>
    `;
    const html = this.buildBaseTemplate(title, content);
    try {
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: [email],
        subject: `🚨 Alerta de seguridad: Tienda ${storeName} reiniciada a cero - AutoGastos`,
        html,
      });
      await this.logEmail(email, `Tienda ${storeName} reiniciada`, 'store_reset', !result.error ? 'sent' : 'failed', { error: result.error?.message });
      return !result.error;
    } catch (e) {
      await this.logEmail(email, `Tienda ${storeName} reiniciada`, 'store_reset', 'failed', { error: e.message });
      return false;
    }
  }

  async sendPasswordResetLink(email: string, resetLink: string): Promise<boolean> {
    const title = 'Restablecer contraseña';
    const content = `
      <p>Hola,</p>
      <p>Se ha solicitado un enlace para restablecer la contraseña de tu cuenta asociada en AutoGastos.</p>
      <p>Haz clic en el siguiente enlace para establecer una nueva contraseña (este enlace es válido por 1 hora):</p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${resetLink}" style="background:#022759;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px;">Restablecer Contraseña</a>
      </div>
      <p style="font-size:12px;color:#94a3b8;word-break:break-all;">Si no puedes hacer clic en el botón anterior, copia y pega esta dirección en tu navegador: <br/>${resetLink}</p>
    `;
    const html = this.buildBaseTemplate(title, content);
    try {
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: [email],
        subject: `🔑 Restablecer tu contraseña - AutoGastos`,
        html,
      });
      await this.logEmail(email, 'Restablecer contraseña', 'password_reset', !result.error ? 'sent' : 'failed', { error: result.error?.message });
      return !result.error;
    } catch (e) {
      await this.logEmail(email, 'Restablecer contraseña', 'password_reset', 'failed', { error: e.message });
      return false;
    }
  }

  async sendTemporaryCredentials(email: string, tempLink: string): Promise<boolean> {
    const title = 'Enlace de acceso temporal';
    const content = `
      <p>Hola,</p>
      <p>Un administrador de soporte ha generado un enlace de inicio de sesión único y de un solo uso para tu cuenta.</p>
      <p>Este enlace es válido durante 1 hora. Úsalo para acceder directamente a tu panel:</p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${tempLink}" style="background:#2563eb;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px;">Ingreso Temporal Único</a>
      </div>
      <p style="font-size:12px;color:#94a3b8;word-break:break-all;">Dirección completa de acceso: <br/>${tempLink}</p>
      <p>Una vez dentro, te recomendamos revisar y actualizar tus credenciales de acceso normales en la configuración de tu perfil.</p>
    `;
    const html = this.buildBaseTemplate(title, content);
    try {
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: [email],
        subject: `⚡ Enlace de ingreso temporal - AutoGastos`,
        html,
      });
      await this.logEmail(email, 'Ingreso temporal', 'temp_login', !result.error ? 'sent' : 'failed', { error: result.error?.message });
      return !result.error;
    } catch (e) {
      await this.logEmail(email, 'Ingreso temporal', 'temp_login', 'failed', { error: e.message });
      return false;
    }
  }

  async sendPaymentFailed(email: string, amount: number, retryLink: string): Promise<boolean> {
    const title = 'Pago rechazado';
    const content = `
      <p>Hola,</p>
      <p>Lamentamos informarte que el cobro automático de tu suscripción de AutoGastos por un monto de <strong>$${amount.toLocaleString('es-CL')}</strong> ha sido rechazado por tu entidad financiera.</p>
      <p>Por favor, actualiza tu método de pago ingresando a tu portal de facturación en el siguiente botón para evitar interrupciones en el servicio:</p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${retryLink}" style="background:#e11d48;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px;">Actualizar Método de Pago</a>
      </div>
    `;
    const html = this.buildBaseTemplate(title, content);
    try {
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: [email],
        subject: `❌ Falló el pago de tu suscripción - AutoGastos`,
        html,
      });
      await this.logEmail(email, 'Pago fallido', 'payment_failed', !result.error ? 'sent' : 'failed', { error: result.error?.message });
      return !result.error;
    } catch (e) {
      await this.logEmail(email, 'Pago fallido', 'payment_failed', 'failed', { error: e.message });
      return false;
    }
  }

  async sendPaymentOverdueWarning(email: string, daysOverdue: number, paymentLink: string): Promise<boolean> {
    const title = `Tu suscripción tiene un retraso de ${daysOverdue} días`;
    const content = `
      <p>Hola,</p>
      <p>Este es un recordatorio amistoso de que tu pago de AutoGastos se encuentra vencido desde hace <strong>${daysOverdue}</strong> días.</p>
      <p>Te solicitamos regularizar tu estado de pagos para asegurar la continuidad del servicio y evitar la suspensión automática de tu tienda.</p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${paymentLink}" style="background:#d97706;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px;">Regularizar Pago</a>
      </div>
    `;
    const html = this.buildBaseTemplate(title, content);
    try {
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: [email],
        subject: `⚠️ Recordatorio de pago atrasado (${daysOverdue} días) - AutoGastos`,
        html,
      });
      await this.logEmail(email, 'Pago atrasado', 'payment_overdue', !result.error ? 'sent' : 'failed', { error: result.error?.message });
      return !result.error;
    } catch (e) {
      await this.logEmail(email, 'Pago atrasado', 'payment_overdue', 'failed', { error: e.message });
      return false;
    }
  }

  async sendSubscriptionSuspensionNotice(email: string, storeName: string): Promise<boolean> {
    const title = 'Aviso de Suspensión por falta de pago';
    const content = `
      <p>Hola,</p>
      <p>Te notificamos que debido a que no hemos recibido el pago de tu suscripción vencida tras vencerse el período de gracia, la tienda <strong>${storeName}</strong> ha sido suspendida automáticamente.</p>
      <p>Tus datos siguen a salvo, pero tu acceso al panel administrativo y las ventas de cara al público se encuentran bloqueados temporalmente.</p>
      <p>Para reactivar tu servicio, ingresa a tu portal y procesa el pago pendiente.</p>
    `;
    const html = this.buildBaseTemplate(title, content);
    try {
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: [email],
        subject: `🚫 Tienda suspendida por no pago: ${storeName} - AutoGastos`,
        html,
      });
      await this.logEmail(email, 'Aviso de suspensión por pago', 'suspension_no_payment', !result.error ? 'sent' : 'failed', { error: result.error?.message });
      return !result.error;
    } catch (e) {
      await this.logEmail(email, 'Aviso de suspensión por pago', 'suspension_no_payment', 'failed', { error: e.message });
      return false;
    }
  }

  async sendPlanChanged(email: string, storeName: string, newPlanName: string, price: number): Promise<boolean> {
    const title = 'Cambio de Plan de Suscripción';
    const content = `
      <p>Hola,</p>
      <p>Te confirmamos que el plan de suscripción de tu tienda <strong>${storeName}</strong> ha sido modificado.</p>
      <p>Tu nuevo plan es: <strong style="text-transform: uppercase;">${newPlanName}</strong> por un costo de <strong>$${price.toLocaleString('es-CL')} / mensual</strong>.</p>
      <p>Este cambio se aplicará a partir de este momento o en tu próximo ciclo de facturación según corresponda.</p>
    `;
    const html = this.buildBaseTemplate(title, content);
    try {
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: [email],
        subject: `🔄 Actualización de suscripción: Nuevo plan ${newPlanName} - AutoGastos`,
        html,
      });
      await this.logEmail(email, `Plan cambiado a ${newPlanName}`, 'plan_changed', !result.error ? 'sent' : 'failed', { error: result.error?.message });
      return !result.error;
    } catch (e) {
      await this.logEmail(email, `Plan cambiado a ${newPlanName}`, 'plan_changed', 'failed', { error: e.message });
      return false;
    }
  }

  async sendGodModeAccessedAlert(email: string, storeName: string, reason: string): Promise<boolean> {
    const title = 'Acceso de soporte a tu cuenta';
    const content = `
      <p>Hola,</p>
      <p>Te informamos que un operador del equipo de soporte de AutoGastos ha accedido de forma temporal a la administración de tu tienda <strong>${storeName}</strong> bajo el Modo Dios.</p>
      <p><strong>Motivo declarado:</strong> ${reason}</p>
      <p>Esta es una notificación de seguridad estándar para asegurar la transparencia e integridad de tus datos. Si no solicitaste asistencia, repórtalo de inmediato.</p>
    `;
    const html = this.buildBaseTemplate(title, content);
    try {
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: [email],
        subject: `⚡ Notificación de seguridad: Acceso de soporte a tu cuenta - AutoGastos`,
        html,
      });
      await this.logEmail(email, 'Acceso Modo Dios', 'god_mode_alert', !result.error ? 'sent' : 'failed', { error: result.error?.message });
      return !result.error;
    } catch (e) {
      await this.logEmail(email, 'Acceso Modo Dios', 'god_mode_alert', 'failed', { error: e.message });
      return false;
    }
  }
}

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
}

import { Injectable, Inject, BadRequestException, NotFoundException, OnModuleInit } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../common/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { WebpayPlus } from 'transbank-sdk';
import * as crypto from 'crypto';

const RETRY_DELAYS_SECONDS = [0, 60, 300, 1800, 7200]; // Intentos: inmediato, 1m, 5m, 30m, 2h

@Injectable()
export class WebhooksService implements OnModuleInit {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  onModuleInit() {
    // Start background webhook delivery check every 30 seconds
    setInterval(() => this.processPendingDeliveries(), 30000);
  }

  // ==========================================
  // INBOUND WEBHOOKS (MercadoPago & Transbank)
  // ==========================================

  async handleMercadoPago(body: any) {
    const { type, data } = body;

    if (type !== 'payment' || !data?.id) {
      return { received: true };
    }

    const { data: config } = await this.supabase
      .from('store_configs')
      .select('mercadopago_access_token')
      .not('mercadopago_access_token', 'is', null)
      .limit(1)
      .maybeSingle();

    if (!config?.mercadopago_access_token) {
      throw new BadRequestException('MercadoPago not configured');
    }

    const client = new MercadoPagoConfig({ accessToken: config.mercadopago_access_token });
    const paymentData = await new Payment(client).get({ id: data.id });

    const orderId = paymentData.external_reference;
    if (!orderId) return { received: true };

    const paymentStatus = paymentData.status === 'approved' ? 'approved' : paymentData.status;

    const updateData: Record<string, any> = {
      payment_id: String(data.id),
      payment_status: paymentStatus,
    };

    if (paymentData.status === 'approved') {
      updateData.status = 'confirmed';
    }

    const { error, data: order } = await this.supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .maybeSingle();

    if (error) throw new BadRequestException(error.message);

    if (order && paymentData.status === 'approved') {
      // Trigger outgoing webhook for paid order!
      await this.dispatch(order.tenant_id, 'order.paid', order);
    }

    return { received: true };
  }

  async handleTransbank(token_ws: string) {
    if (!token_ws) throw new BadRequestException('Missing token_ws');

    const { data: config } = await this.supabase
      .from('store_configs')
      .select('transbank_commerce_code, transbank_api_key')
      .not('transbank_commerce_code', 'is', null)
      .not('transbank_api_key', 'is', null)
      .limit(1)
      .maybeSingle();

    if (!config?.transbank_commerce_code || !config?.transbank_api_key) {
      throw new BadRequestException('Transbank not configured');
    }

    WebpayPlus.configureForIntegration(config.transbank_commerce_code, config.transbank_api_key);
    const result = await WebpayPlus.Transaction.commit(token_ws);

    const orderId = result.buyOrder;

    const updateData: Record<string, any> = {
      payment_status: result.status === 'AUTHORIZED' ? 'approved' : result.status,
    };

    if (result.status === 'AUTHORIZED') {
      updateData.status = 'confirmed';
    }

    const { error, data: order } = await this.supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .maybeSingle();

    if (error) throw new BadRequestException(error.message);

    if (order && result.status === 'AUTHORIZED') {
      // Trigger outgoing webhook for paid order!
      await this.dispatch(order.tenant_id, 'order.paid', order);
    }

    return { received: true, result };
  }

  // ==========================================
  // OUTBOUND WEBHOOKS MANAGEMENT
  // ==========================================

  async createEndpoint(tenantId: string, dto: { url: string; description?: string; events: string[] }) {
    const secret = 'whsec_' + crypto.randomBytes(24).toString('base64url'); // ~32 characters secure key
    const { data, error } = await this.supabase
      .from('webhook_endpoints')
      .insert({
        tenant_id: tenantId,
        url: dto.url,
        description: dto.description,
        secret,
        events: dto.events || [],
        is_active: true,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async listEndpoints(tenantId: string) {
    const { data, error } = await this.supabase
      .from('webhook_endpoints')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async updateEndpoint(tenantId: string, id: string, dto: { url?: string; description?: string; events?: string[]; is_active?: boolean }) {
    const { data, error } = await this.supabase
      .from('webhook_endpoints')
      .update(dto)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async deleteEndpoint(tenantId: string, id: string) {
    const { error } = await this.supabase
      .from('webhook_endpoints')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) throw new BadRequestException(error.message);
    return { success: true };
  }

  async getEndpointDeliveries(tenantId: string, endpointId: string) {
    // Validate owner
    const { data: endpoint } = await this.supabase
      .from('webhook_endpoints')
      .select('id')
      .eq('id', endpointId)
      .eq('tenant_id', tenantId)
      .single();

    if (!endpoint) throw new NotFoundException('Endpoint no encontrado');

    const { data, error } = await this.supabase
      .from('webhook_deliveries')
      .select('*')
      .eq('endpoint_id', endpointId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async getDeliveryDetails(tenantId: string, deliveryId: string) {
    const { data, error } = await this.supabase
      .from('webhook_deliveries')
      .select('*, webhook_endpoints(*)')
      .eq('id', deliveryId)
      .single();

    if (error || !data) throw new NotFoundException('Delivery no encontrado');
    if (data.webhook_endpoints.tenant_id !== tenantId) {
      throw new ForbiddenException('No tienes acceso a este webhook delivery');
    }

    return data;
  }

  async testEndpoint(tenantId: string, id: string) {
    const { data: endpoint } = await this.supabase
      .from('webhook_endpoints')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (!endpoint) throw new NotFoundException('Endpoint no encontrado');

    // Create a mock payload and trigger dispatch
    const testPayload = {
      event: 'webhook.test',
      message: 'Este es un payload de prueba enviado desde tu panel de AutoShopping',
      test: true,
      timestamp: new Date().toISOString(),
    };

    return this.createDeliveryAndSend(endpoint, 'webhook.test', testPayload);
  }

  async retryDelivery(tenantId: string, deliveryId: string) {
    const { data: delivery, error } = await this.supabase
      .from('webhook_deliveries')
      .select('*, webhook_endpoints(*)')
      .eq('id', deliveryId)
      .single();

    if (error || !delivery) throw new NotFoundException('Delivery no encontrado');
    if (delivery.webhook_endpoints.tenant_id !== tenantId) {
      throw new ForbiddenException('No tienes acceso a este webhook delivery');
    }

    // Reset attempts and status
    const { data: updatedDelivery } = await this.supabase
      .from('webhook_deliveries')
      .update({
        status: 'pending',
        attempt_count: 0,
        next_attempt_at: new Date().toISOString(),
      })
      .eq('id', deliveryId)
      .select()
      .single();

    // Trigger async execution
    this.sendWebhookRequest(updatedDelivery, delivery.webhook_endpoints);

    return { success: true, message: 'Reintento encolado' };
  }

  // ==========================================
  // DISPATCHING SYSTEM
  // ==========================================

  async dispatch(tenantId: string, event: string, payloadData: any) {
    try {
      // Find active endpoints subscribed to this event or wildcard '*'
      const { data: endpoints, error } = await this.supabase
        .from('webhook_endpoints')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      if (error || !endpoints || endpoints.length === 0) return;

      const matchedEndpoints = endpoints.filter(ep => 
        ep.events.includes(event) || ep.events.includes('*')
      );

      for (const endpoint of matchedEndpoints) {
        await this.createDeliveryAndSend(endpoint, event, payloadData);
      }
    } catch (err) {
      console.error('Error dispatching webhook event:', err);
    }
  }

  private async createDeliveryAndSend(endpoint: any, event: string, payloadData: any) {
    const payload = {
      id: 'evt_' + crypto.randomBytes(12).toString('hex'),
      type: event,
      created_at: new Date().toISOString(),
      api_version: '2026-06-01',
      tenant_id: endpoint.tenant_id,
      data: payloadData,
    };

    const { data: delivery, error } = await this.supabase
      .from('webhook_deliveries')
      .insert({
        endpoint_id: endpoint.id,
        tenant_id: endpoint.tenant_id,
        event_type: event,
        event_id: crypto.randomUUID(),
        payload,
        status: 'pending',
        attempt_count: 0,
        next_attempt_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating webhook delivery log:', error.message);
      return;
    }

    // Fire request in the background
    this.sendWebhookRequest(delivery, endpoint);
    return delivery;
  }

  private async sendWebhookRequest(delivery: any, endpoint: any) {
    const signature = crypto
      .createHmac('sha256', endpoint.secret)
      .update(JSON.stringify(delivery.payload))
      .digest('hex');

    const startTime = Date.now();
    let status = 'failed';
    let responseStatus: number | null = null;
    let responseBody = '';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout

      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': `sha256=${signature}`,
          'X-Webhook-Event': delivery.event_type,
          'X-Webhook-Delivery': delivery.id,
          'X-Webhook-Timestamp': new Date().toISOString(),
          'User-Agent': 'AutoShopping-Webhooks/1.0',
        },
        body: JSON.stringify(delivery.payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      responseStatus = response.status;
      responseBody = await response.text();

      if (response.status >= 200 && response.status < 300) {
        status = 'success';
      }
    } catch (err) {
      responseBody = err.message || 'Timeout / Connection Error';
    }

    const duration = Date.now() - startTime;

    if (status === 'success') {
      await this.supabase
        .from('webhook_deliveries')
        .update({
          status: 'success',
          attempt_count: delivery.attempt_count + 1,
          last_response_status: responseStatus,
          last_response_body: responseBody.substring(0, 1000),
          last_response_time_ms: duration,
        })
        .eq('id', delivery.id);

      await this.supabase
        .from('webhook_endpoints')
        .update({
          consecutive_failures: 0,
          last_success_at: new Date().toISOString(),
        })
        .eq('id', endpoint.id);

    } else {
      const nextAttemptCount = delivery.attempt_count + 1;
      const willRetry = nextAttemptCount < RETRY_DELAYS_SECONDS.length;

      const finalStatus = willRetry ? 'retrying' : 'abandoned';
      const delay = willRetry ? RETRY_DELAYS_SECONDS[nextAttemptCount] : 0;
      const nextAttemptAt = willRetry 
        ? new Date(Date.now() + delay * 1000).toISOString()
        : null;

      await this.supabase
        .from('webhook_deliveries')
        .update({
          status: finalStatus,
          attempt_count: nextAttemptCount,
          next_attempt_at: nextAttemptAt,
          last_response_status: responseStatus,
          last_response_body: responseBody.substring(0, 1000),
          last_response_time_ms: duration,
        })
        .eq('id', delivery.id);

      // Increment consecutive failures on endpoint
      const consecutiveFailures = (endpoint.consecutive_failures || 0) + 1;
      const updatePayload: Record<string, any> = {
        consecutive_failures: consecutiveFailures,
        last_failure_at: new Date().toISOString(),
      };

      if (consecutiveFailures >= 10) {
        updatePayload.is_active = false; // Auto-deactivate
      }

      await this.supabase
        .from('webhook_endpoints')
        .update(updatePayload)
        .eq('id', endpoint.id);
    }
  }

  private async processPendingDeliveries() {
    try {
      const now = new Date().toISOString();
      const { data: pendingDeliveries } = await this.supabase
        .from('webhook_deliveries')
        .select('*, webhook_endpoints(*)')
        .in('status', ['pending', 'retrying'])
        .lte('next_attempt_at', now)
        .limit(20);

      if (!pendingDeliveries || pendingDeliveries.length === 0) return;

      for (const delivery of pendingDeliveries) {
        const endpoint = delivery.webhook_endpoints;
        if (endpoint && endpoint.is_active) {
          // Fire request in the background
          this.sendWebhookRequest(delivery, endpoint);
        }
      }
    } catch (err) {
      console.error('Error in background webhook deliveries loop:', err);
    }
  }
}

// Dummy exception classes to mock Nest ones if not explicitly loaded
class ForbiddenException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenException';
  }
}

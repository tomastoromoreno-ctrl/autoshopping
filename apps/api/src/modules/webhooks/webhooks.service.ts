import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../common/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { WebpayPlus } from 'transbank-sdk';

@Injectable()
export class WebhooksService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

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

    const { error } = await this.supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (error) throw new BadRequestException(error.message);

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

    const { error } = await this.supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (error) throw new BadRequestException(error.message);

    return { received: true, result };
  }
}

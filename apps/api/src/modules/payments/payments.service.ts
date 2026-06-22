import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SUPABASE_CLIENT } from '../../common/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { WebpayPlus } from 'transbank-sdk';

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    private readonly config: ConfigService,
  ) {}

  async createPreference(dto: {
    order_id: string;
    tenant_id: string;
    payment_provider: 'mercadopago' | 'transbank';
  }) {
    const { data: order, error: orderError } = await this.supabase
      .from('orders')
      .select('*')
      .eq('id', dto.order_id)
      .eq('tenant_id', dto.tenant_id)
      .single();

    if (orderError || !order) throw new NotFoundException('Order not found');

    const { data: items, error: itemsError } = await this.supabase
      .from('order_items')
      .select('*')
      .eq('order_id', dto.order_id);

    if (itemsError) throw new BadRequestException(itemsError.message);

    const { data: config, error: configError } = await this.supabase
      .from('store_configs')
      .select('*')
      .eq('tenant_id', dto.tenant_id)
      .single();

    if (configError || !config) throw new NotFoundException('Store config not found');

    const baseUrl = this.config.get('BASE_URL') || 'http://localhost:3000';

    if (dto.payment_provider === 'mercadopago') {
      const accessToken = config.mercadopago_access_token;
      if (!accessToken) throw new BadRequestException('MercadoPago not configured');

      const client = new MercadoPagoConfig({ accessToken });
      const preferenceBody = {
        items: items.map((item) => ({
          id: item.product_id,
          title: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          currency_id: config.currency || 'CLP',
        })),
        back_urls: {
          success: `${baseUrl}/orders/${dto.order_id}/success`,
          failure: `${baseUrl}/orders/${dto.order_id}/failure`,
          pending: `${baseUrl}/orders/${dto.order_id}/pending`,
        },
        notification_url: `${baseUrl}/webhooks/mercadopago`,
        external_reference: dto.order_id,
      };

      const preference = await new Preference(client).create({ body: preferenceBody });

      const { error: updateError } = await this.supabase
        .from('orders')
        .update({ payment_id: preference.id, payment_provider: 'mercadopago' })
        .eq('id', dto.order_id);

      if (updateError) throw new BadRequestException(updateError.message);

      return {
        payment_id: preference.id,
        init_point: preference.init_point,
        sandbox_init_point: preference.sandbox_init_point,
      };
    }

    if (dto.payment_provider === 'transbank') {
      const commerceCode = config.transbank_commerce_code;
      const apiKey = config.transbank_api_key;
      if (!commerceCode || !apiKey) throw new BadRequestException('Transbank not configured');

      WebpayPlus.configureForIntegration(commerceCode, apiKey);
      const transaction = await WebpayPlus.Transaction.create(
        dto.order_id,
        dto.order_id,
        order.total,
        `${baseUrl}/webhooks/transbank`,
      );

      const { error: updateError } = await this.supabase
        .from('orders')
        .update({ payment_id: transaction.token, payment_provider: 'transbank' })
        .eq('id', dto.order_id);

      if (updateError) throw new BadRequestException(updateError.message);

      return {
        payment_id: transaction.token,
        url: transaction.url,
        token_ws: transaction.token,
      };
    }

    throw new BadRequestException('Invalid payment provider');
  }

  async confirmPayment(dto: {
    order_id: string;
    payment_id: string;
    payment_status: string;
  }) {
    const updateData: Record<string, any> = { payment_id: dto.payment_id, payment_status: dto.payment_status };
    if (dto.payment_status === 'approved') {
      updateData.status = 'confirmed';
    }

    const { data, error } = await this.supabase
      .from('orders')
      .update(updateData)
      .eq('id', dto.order_id)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Order not found');
    return data;
  }

  async getPaymentStatus(orderId: string) {
    const { data: order, error } = await this.supabase
      .from('orders')
      .select('id, payment_id, payment_provider, payment_status, status')
      .eq('id', orderId)
      .single();

    if (error || !order) throw new NotFoundException('Order not found');
    return order;
  }
}

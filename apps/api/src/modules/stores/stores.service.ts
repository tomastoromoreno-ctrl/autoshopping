import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../common/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StoresService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async getConfig(tenantId: string) {
    const { data, error } = await this.supabase
      .from('store_configs')
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (error) throw new BadRequestException(error.message);

    if (!data) {
      const defaults = {
        tenant_id: tenantId,
        currency: 'CLP',
        payment_provider: 'mercadopago',
        shipping_enabled: false,
        shipping_cost: 0,
      };
      const { data: created, error: createError } = await this.supabase
        .from('store_configs')
        .insert(defaults)
        .select()
        .single();
      if (createError) throw new BadRequestException(createError.message);
      return created;
    }

    return data;
  }

  async updateConfig(tenantId: string, dto: {
    currency?: string;
    payment_provider?: string;
    mercadopago_access_token?: string;
    mercadopago_public_key?: string;
    transbank_api_key?: string;
    transbank_commerce_code?: string;
    shipping_enabled?: boolean;
    shipping_cost?: number;
    free_shipping_min?: number | null;
    sales_policy?: string;
    shipping_policy?: string;
  }) {
    const { data, error } = await this.supabase
      .from('store_configs')
      .upsert(
        { tenant_id: tenantId, ...dto },
        { onConflict: 'tenant_id' }
      )
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async updateAppearance(tenantId: string, dto: {
    logo_url?: string;
    favicon_url?: string;
    primary_color?: string;
    slogan?: string;
    name?: string;
  }) {
    const { data, error } = await this.supabase
      .from('tenants')
      .update({
        ...(dto.logo_url !== undefined && { logo_url: dto.logo_url }),
        ...(dto.favicon_url !== undefined && { favicon_url: dto.favicon_url }),
        ...(dto.primary_color !== undefined && { primary_color: dto.primary_color }),
        ...(dto.slogan !== undefined && { slogan: dto.slogan }),
        ...(dto.name !== undefined && { name: dto.name }),
      })
      .eq('id', tenantId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Tenant not found');
    return data;
  }

  async getPublic(idOrSubdomain: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSubdomain);

    let query = this.supabase
      .from('tenants')
      .select('id, name, subdomain, logo_url, favicon_url, primary_color, status, slogan');

    if (isUuid) {
      query = query.eq('id', idOrSubdomain);
    } else {
      query = query.eq('subdomain', idOrSubdomain);
    }

    const { data: tenant, error: tenantError } = await query.single();

    if (tenantError || !tenant) throw new NotFoundException('Store not found');

    const { data: config } = await this.supabase
      .from('store_configs')
      .select('currency, payment_provider, shipping_enabled, shipping_cost, free_shipping_min, sales_policy, shipping_policy')
      .eq('tenant_id', tenant.id)
      .single();

    return { ...tenant, config };
  }

  async getDashboardStats(tenantId: string) {
    const { count: totalProducts } = await this.supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    const { count: totalOrders } = await this.supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    const { data: revenueData } = await this.supabase
      .from('orders')
      .select('total')
      .eq('tenant_id', tenantId)
      .not('status', 'in', '("cancelled","pending")');

    const totalRevenue = (revenueData || []).reduce(
      (sum, row) => sum + Number(row.total || 0), 0,
    );

    const { count: pendingOrders } = await this.supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'pending');

    return {
      totalProducts: totalProducts || 0,
      totalOrders: totalOrders || 0,
      totalRevenue,
      pendingOrders: pendingOrders || 0,
    };
  }
}

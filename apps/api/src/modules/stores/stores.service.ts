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
    font_family?: string;
    bg_color?: string;
    btn_color?: string;
    btn_text_color?: string;
  }) {
    const { data, error } = await this.supabase
      .from('tenants')
      .update({
        ...(dto.logo_url !== undefined && { logo_url: dto.logo_url }),
        ...(dto.favicon_url !== undefined && { favicon_url: dto.favicon_url }),
        ...(dto.primary_color !== undefined && { primary_color: dto.primary_color }),
        ...(dto.slogan !== undefined && { slogan: dto.slogan }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.font_family !== undefined && { font_family: dto.font_family }),
        ...(dto.bg_color !== undefined && { bg_color: dto.bg_color }),
        ...(dto.btn_color !== undefined && { btn_color: dto.btn_color }),
        ...(dto.btn_text_color !== undefined && { btn_text_color: dto.btn_text_color }),
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
      .select('id, name, subdomain, logo_url, favicon_url, primary_color, status, slogan, font_family, bg_color, btn_color, btn_text_color');

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

  async getAnalytics(tenantId: string, days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceISO = since.toISOString();

    // Revenue by day
    const { data: revenueData } = await this.supabase
      .from('orders')
      .select('total, created_at')
      .eq('tenant_id', tenantId)
      .not('status', 'in', '("cancelled","pending")')
      .gte('created_at', sinceISO)
      .order('created_at', { ascending: true });

    // Orders by status
    const { data: ordersByStatus } = await this.supabase
      .from('orders')
      .select('status')
      .eq('tenant_id', tenantId)
      .gte('created_at', sinceISO);

    const statusCounts: Record<string, number> = {};
    (ordersByStatus || []).forEach((o: any) => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });

    // Revenue by day aggregation
    const revenueByDay: { date: string; revenue: number }[] = [];
    (revenueData || []).forEach((row: any) => {
      const day = row.created_at.split('T')[0];
      const existing = revenueByDay.find((r) => r.date === day);
      if (existing) existing.revenue += Number(row.total);
      else revenueByDay.push({ date: day, revenue: Number(row.total) });
    });

    // Total stats
    const totalRevenue = revenueByDay.reduce((sum, r) => sum + r.revenue, 0);
    const totalOrders = (ordersByStatus || []).length;

    // Unique customers
    const { data: customerData } = await this.supabase
      .from('orders')
      .select('customer_email')
      .eq('tenant_id', tenantId)
      .gte('created_at', sinceISO);
    const uniqueCustomers = new Set((customerData || []).map((c: any) => c.customer_email)).size;

    // Top products
    const { data: topProducts } = await this.supabase
      .from('order_items')
      .select('product_name, quantity, price, orders!inner(tenant_id, created_at)')
      .eq('orders.tenant_id', tenantId)
      .gte('orders.created_at', sinceISO);

    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    (topProducts || []).forEach((item: any) => {
      const key = item.product_name;
      if (productSales[key]) {
        productSales[key].quantity += item.quantity;
        productSales[key].revenue += item.quantity * item.price;
      } else {
        productSales[key] = { name: key, quantity: item.quantity, revenue: item.quantity * item.price };
      }
    });

    const topProductsList = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalRevenue,
      totalOrders,
      uniqueCustomers,
      ordersByStatus: statusCounts,
      revenueByDay,
      topProducts: topProductsList,
    };
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

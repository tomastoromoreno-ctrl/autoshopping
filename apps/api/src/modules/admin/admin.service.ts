import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../common/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class AdminService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async getDashboardStats() {
    const { count: total_tenants } = await this.supabase
      .from('tenants')
      .select('*', { count: 'exact', head: true });

    const { count: active_tenants } = await this.supabase
      .from('tenants')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const { count: total_users } = await this.supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: total_orders } = await this.supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    const { data: revenueData } = await this.supabase
      .from('orders')
      .select('total')
      .not('status', 'in', '("cancelled","pending")');

    const total_revenue = (revenueData || []).reduce(
      (sum, row) => sum + Number(row.total || 0), 0,
    );

    const { data: recent_orders } = await this.supabase
      .from('orders')
      .select('*, tenants!inner(name)')
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: ordersByStatus } = await this.supabase
      .from('orders')
      .select('status, count', { count: 'exact' });

    const orders_by_status: Record<string, number> = {};
    if (ordersByStatus) {
      for (const row of ordersByStatus) {
        const s = (row as any).status || 'unknown';
        orders_by_status[s] = (orders_by_status[s] || 0) + 1;
      }
    }

    const { data: tenantsByStatus } = await this.supabase
      .from('tenants')
      .select('status, count', { count: 'exact' });

    const tenants_by_status: Record<string, number> = {};
    if (tenantsByStatus) {
      for (const row of tenantsByStatus) {
        const s = (row as any).status || 'unknown';
        tenants_by_status[s] = (tenants_by_status[s] || 0) + 1;
      }
    }

    return {
      total_tenants,
      active_tenants,
      total_users,
      total_orders,
      total_revenue,
      recent_orders,
      orders_by_status,
      tenants_by_status,
    };
  }

  async listTenants(
    page: number,
    limit: number,
    search?: string,
    status?: string,
  ) {
    let query = this.supabase
      .from('tenants')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,subdomain.ilike.%${search}%`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const offset = (page - 1) * limit;
    const { data: tenants, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new BadRequestException(error.message);

    const enriched = await Promise.all(
      (tenants || []).map(async (tenant) => {
        const { count: userCount } = await this.supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id);

        const { count: orderCount } = await this.supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id);

        return { ...tenant, user_count: userCount, order_count: orderCount };
      }),
    );

    return { data: enriched, total: count, page, limit };
  }

  async getTenantDetail(tenantId: string) {
    const { data: tenant, error: tenantError } = await this.supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) throw new NotFoundException('Tenant not found');

    const { data: storeConfig } = await this.supabase
      .from('store_configs')
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    const { count: userCount } = await this.supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    const { count: orderCount } = await this.supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    const { data: recentOrders } = await this.supabase
      .from('orders')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(10);

    return {
      ...tenant,
      store_config: storeConfig || null,
      user_count: userCount,
      order_count: orderCount,
      recent_orders: recentOrders || [],
    };
  }

  async updateTenantStatus(tenantId: string, status: string) {
    const valid = ['active', 'inactive', 'suspended'];
    if (!valid.includes(status)) {
      throw new BadRequestException(`Invalid status. Must be one of: ${valid.join(', ')}`);
    }

    const { data, error } = await this.supabase
      .from('tenants')
      .update({ status })
      .eq('id', tenantId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Tenant not found');

    return data;
  }

  async deleteTenant(tenantId: string) {
    const tables = [
      'order_items',
      'orders',
      'cart_items',
      'carts',
      'coupons',
      'promotions',
      'product_variants',
      'products',
      'categories',
      'store_configs',
    ];

    for (const table of tables) {
      const fkCol = table === 'store_configs' ? 'tenant_id' : 'tenant_id';
      await this.supabase.from(table).delete().eq(fkCol, tenantId);
    }

    await this.supabase.from('users').delete().eq('tenant_id', tenantId);
    await this.supabase.from('tenants').delete().eq('id', tenantId);

    return { message: 'Tenant and all related data deleted' };
  }

  async listAllOrders(
    page: number,
    limit: number,
    status?: string,
    tenantId?: string,
  ) {
    let query = this.supabase
      .from('orders')
      .select('*, tenants!inner(name)', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const offset = (page - 1) * limit;
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new BadRequestException(error.message);

    return { data: data || [], total: count, page, limit };
  }

  async listAllUsers(page: number, limit: number, role?: string) {
    let query = this.supabase
      .from('users')
      .select('*, tenants(name)', { count: 'exact' });

    if (role) {
      query = query.eq('role', role);
    }

    const offset = (page - 1) * limit;
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new BadRequestException(error.message);

    return { data: data || [], total: count, page, limit };
  }

  async getSystemLogs(days: number) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceISO = since.toISOString();

    const { data: updatedTenants } = await this.supabase
      .from('tenants')
      .select('*')
      .gte('updated_at', sinceISO)
      .order('updated_at', { ascending: false });

    const { data: updatedOrders } = await this.supabase
      .from('orders')
      .select('*, tenants!inner(name)')
      .gte('updated_at', sinceISO)
      .order('updated_at', { ascending: false });

    const { data: updatedUsers } = await this.supabase
      .from('users')
      .select('*, tenants(name)')
      .gte('updated_at', sinceISO)
      .order('updated_at', { ascending: false });

    return {
      tenants: updatedTenants || [],
      orders: updatedOrders || [],
      users: updatedUsers || [],
    };
  }

  async createTenant(name: string, subdomain: string, ownerId: string) {
    const cleanSubdomain = subdomain.trim().toLowerCase();

    // 1. Verificar si el subdominio ya está registrado
    const { data: existingTenant } = await this.supabase
      .from('tenants')
      .select('id')
      .eq('subdomain', cleanSubdomain)
      .maybeSingle();

    if (existingTenant) {
      throw new BadRequestException('El subdominio ya está registrado por otra tienda.');
    }

    // 2. Crear el tenant
    const { data: newTenant, error: tenantError } = await this.supabase
      .from('tenants')
      .insert({
        name,
        subdomain: cleanSubdomain,
        status: 'active'
      })
      .select()
      .single();

    if (tenantError || !newTenant) {
      throw new BadRequestException(tenantError?.message || 'Error al crear la tienda.');
    }

    // 3. Crear la configuración inicial de la tienda
    const { error: configError } = await this.supabase
      .from('store_configs')
      .insert({
        tenant_id: newTenant.id,
        currency: 'CLP',
        payment_provider: 'mercadopago',
        shipping_enabled: true,
        shipping_cost: 0,
        free_shipping_min: 0,
        sales_policy: '',
        shipping_policy: ''
      });

    if (configError) {
      await this.supabase.from('tenants').delete().eq('id', newTenant.id);
      throw new BadRequestException(configError.message);
    }

    // 4. Asociar el usuario dueño y cambiar su rol a store_owner
    const { error: userError } = await this.supabase
      .from('users')
      .update({
        tenant_id: newTenant.id,
        role: 'store_owner'
      })
      .eq('id', ownerId);

    if (userError) {
      await this.supabase.from('store_configs').delete().eq('tenant_id', newTenant.id);
      await this.supabase.from('tenants').delete().eq('id', newTenant.id);
      throw new BadRequestException(userError.message);
    }

    return newTenant;
  }
}

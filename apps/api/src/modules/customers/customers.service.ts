import { Inject, Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../common/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class CustomersService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async register(subdomain: string, dto: { email: string; password: string; name: string; phone?: string }) {
    const tenant = await this.resolveTenant(subdomain);

    const { data: existing } = await this.supabase
      .from('customers')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('email', dto.email)
      .maybeSingle();

    if (existing) {
      throw new BadRequestException('El cliente ya existe en esta tienda');
    }

    const { data: authData, error: authError } = await this.supabase.auth.signUp({
      email: dto.email,
      password: dto.password,
      options: {
        data: { name: dto.name, tenant_id: tenant.id },
      },
    });

    if (authError) {
      throw new BadRequestException(authError.message);
    }

    const { data: customer, error: insertError } = await this.supabase
      .from('customers')
      .insert({
        id: authData.user!.id,
        tenant_id: tenant.id,
        email: dto.email,
        name: dto.name,
        phone: dto.phone || null,
      })
      .select()
      .single();

    if (insertError) {
      throw new BadRequestException(insertError.message);
    }

    return {
      customer,
      token: authData.session?.access_token || null,
      session: authData.session,
    };
  }

  async login(subdomain: string, dto: { email: string; password: string }) {
    const tenant = await this.resolveTenant(subdomain);

    const { data: customer } = await this.supabase
      .from('customers')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('email', dto.email)
      .single();

    if (!customer) {
      throw new NotFoundException('Cliente no encontrado en esta tienda');
    }

    const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (authError) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return {
      customer,
      token: authData.session.access_token,
      session: authData.session,
    };
  }

  async getProfile(customerId: string) {
    const { data: customer, error } = await this.supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (error || !customer) {
      throw new NotFoundException('Cliente no encontrado');
    }

    return customer;
  }

  async updateProfile(customerId: string, dto: { name?: string; phone?: string; default_address?: any }) {
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (dto.name !== undefined) updates.name = dto.name;
    if (dto.phone !== undefined) updates.phone = dto.phone;
    if (dto.default_address !== undefined) updates.default_address = dto.default_address;

    const { data: customer, error } = await this.supabase
      .from('customers')
      .update(updates)
      .eq('id', customerId)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return customer;
  }

  async getOrders(customerId: string, tenantId: string) {
    const { data: orders, error } = await this.supabase
      .from('orders')
      .select('*')
      .eq('customer_id', customerId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new BadRequestException(error.message);
    }

    if (!orders || orders.length === 0) {
      return [];
    }

    const orderIds = orders.map((o: any) => o.id);
    const { data: items } = await this.supabase
      .from('order_items')
      .select('*')
      .in('order_id', orderIds);

    const itemsByOrder: Record<string, any[]> = {};
    if (items) {
      for (const item of items) {
        if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
        itemsByOrder[item.order_id].push(item);
      }
    }

    return orders.map((order: any) => ({
      ...order,
      items: itemsByOrder[order.id] || [],
    }));
  }

  async getOrderDetail(customerId: string, orderId: string, tenantId: string) {
    const { data: order, error } = await this.supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('customer_id', customerId)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    const { data: items } = await this.supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    return {
      ...order,
      items: items || [],
    };
  }

  private async resolveTenant(subdomain: string) {
    const { data: tenant, error } = await this.supabase
      .from('tenants')
      .select('id')
      .eq('subdomain', subdomain)
      .single();

    if (error || !tenant) {
      throw new NotFoundException('Tienda no encontrada');
    }

    return tenant;
  }
}

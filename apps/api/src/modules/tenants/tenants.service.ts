import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../common/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class TenantsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async create(dto: {
    name: string;
    subdomain: string;
    userId: string;
  }) {
    const { data: existing, error: lookupError } = await this.supabase
      .from('tenants')
      .select('id')
      .eq('subdomain', dto.subdomain)
      .maybeSingle();

    if (lookupError) throw new BadRequestException(lookupError.message);
    if (existing) throw new BadRequestException('Subdomain already taken');

    const { data: tenant, error: tenantError } = await this.supabase
      .from('tenants')
      .insert({
        name: dto.name,
        subdomain: dto.subdomain,
        status: 'active',
      })
      .select()
      .single();

    if (tenantError) throw new BadRequestException(tenantError.message);

    const { error: configError } = await this.supabase
      .from('store_configs')
      .insert({
        tenant_id: tenant.id,
        currency: 'CLP',
        payment_provider: 'mercadopago',
        shipping_enabled: false,
        shipping_cost: 0,
        free_shipping_min: null,
      });

    if (configError) throw new BadRequestException(configError.message);

    const { error: userError } = await this.supabase
      .from('users')
      .update({ role: 'store_owner', tenant_id: tenant.id })
      .eq('id', dto.userId);

    if (userError) throw new BadRequestException(userError.message);

    // Also update auth user metadata in Supabase Auth so that token refreshes contain the tenant_id
    await this.supabase.auth.admin.updateUserById(dto.userId, {
      user_metadata: { role: 'store_owner', tenant_id: tenant.id },
    });

    return tenant;
  }

  async findById(id: string) {
    const { data, error } = await this.supabase
      .from('tenants')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('Tenant not found');
    return data;
  }

  async update(id: string, dto: {
    name?: string;
    logo_url?: string;
    favicon_url?: string;
    primary_color?: string;
    subdomain?: string;
    custom_domain?: string;
  }) {
    const { data, error } = await this.supabase
      .from('tenants')
      .update(dto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Tenant not found');
    return data;
  }

  async verifySubdomain(subdomain: string) {
    const { data, error } = await this.supabase
      .from('tenants')
      .select('id')
      .eq('subdomain', subdomain)
      .maybeSingle();

    if (error) throw new BadRequestException(error.message);
    return { available: !data };
  }
}

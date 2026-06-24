import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../common/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class BannersService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async create(tenantId: string, dto: {
    title: string;
    subtitle?: string;
    image_url?: string;
    link_url?: string;
    btn_text?: string;
    bg_color?: string;
    text_color?: string;
    sort_order?: number;
    is_active?: boolean;
  }) {
    const { data, error } = await this.supabase
      .from('store_banners')
      .insert({ tenant_id: tenantId, ...dto })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async list(tenantId: string) {
    const { data, error } = await this.supabase
      .from('store_banners')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('sort_order', { ascending: true });

    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async getActive(tenantId: string) {
    const { data, error } = await this.supabase
      .from('store_banners')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async update(id: string, tenantId: string, dto: {
    title?: string;
    subtitle?: string;
    image_url?: string;
    link_url?: string;
    btn_text?: string;
    bg_color?: string;
    text_color?: string;
    sort_order?: number;
    is_active?: boolean;
  }) {
    const { data, error } = await this.supabase
      .from('store_banners')
      .update(dto)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Banner no encontrado');
    return data;
  }

  async delete(id: string, tenantId: string) {
    const { error } = await this.supabase
      .from('store_banners')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) throw new BadRequestException(error.message);
    return { message: 'Banner eliminado' };
  }

  async toggleActive(id: string, tenantId: string) {
    const { data: current, error: fetchError } = await this.supabase
      .from('store_banners')
      .select('is_active')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !current) throw new NotFoundException('Banner no encontrado');

    const { data, error } = await this.supabase
      .from('store_banners')
      .update({ is_active: !current.is_active })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }
}

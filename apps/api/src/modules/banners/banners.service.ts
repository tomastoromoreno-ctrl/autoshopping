import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../common/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class BannersService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  private async insertWithFallback(payload: any) {
    const { data, error } = await this.supabase
      .from('store_banners')
      .insert(payload)
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  private async updateWithFallback(id: string, tenantId: string, dto: any) {
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

  async create(tenantId: string, dto: any) {
    try {
      return await this.insertWithFallback({ tenant_id: tenantId, ...dto });
    } catch (e: any) {
      if (dto.canvas_json && e.message?.includes('column')) {
        delete dto.canvas_json;
        return await this.insertWithFallback({ tenant_id: tenantId, ...dto });
      }
      throw e;
    }
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

  async update(id: string, tenantId: string, dto: any) {
    try {
      return await this.updateWithFallback(id, tenantId, dto);
    } catch (e: any) {
      if (dto.canvas_json && e.message?.includes('column')) {
        delete dto.canvas_json;
        return await this.updateWithFallback(id, tenantId, dto);
      }
      throw e;
    }
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

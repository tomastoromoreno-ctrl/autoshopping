import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../common/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class CategoriesService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async create(dto: {
    tenant_id: string;
    name: string;
    slug: string;
    description?: string;
    image_url?: string;
    parent_id?: string;
    sort_order?: number;
    is_active?: boolean;
  }) {
    const { data, error } = await this.supabase
      .from('categories')
      .insert(dto)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new BadRequestException('Ya existe una categoría con ese nombre o slug en esta tienda');
      throw new BadRequestException(error.message);
    }
    return data;
  }

  async findByTenant(tenantId: string, parentId?: string) {
    let query = this.supabase
      .from('categories')
      .select('*')
      .eq('tenant_id', tenantId);

    if (parentId !== undefined) {
      query = query.eq('parent_id', parentId);
    }

    const { data, error } = await query.order('sort_order', { ascending: true });

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async findById(id: string) {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('Category not found');
    return data;
  }

  async update(id: string, dto: {
    name?: string;
    slug?: string;
    description?: string;
    image_url?: string;
    parent_id?: string;
    sort_order?: number;
    is_active?: boolean;
  }) {
    const { data, error } = await this.supabase
      .from('categories')
      .update(dto)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new BadRequestException('Ya existe una categoría con ese nombre o slug en esta tienda');
      throw new BadRequestException(error.message);
    }
    if (!data) throw new NotFoundException('Category not found');
    return data;
  }

  async delete(id: string) {
    const { error } = await this.supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw new BadRequestException(error.message);
    return { message: 'Category deleted successfully' };
  }

  async getTree(tenantId: string) {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('sort_order', { ascending: true });

    if (error) throw new BadRequestException(error.message);

    const map = new Map<string, any>();
    const roots: any[] = [];

    for (const item of data) {
      map.set(item.id, { ...item, children: [] });
    }

    for (const item of data) {
      if (item.parent_id && map.has(item.parent_id)) {
        map.get(item.parent_id).children.push(map.get(item.id));
      } else if (!item.parent_id) {
        roots.push(map.get(item.id));
      }
    }

    return roots;
  }
}

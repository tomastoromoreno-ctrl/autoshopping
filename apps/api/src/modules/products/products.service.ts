import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../common/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class ProductsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async create(dto: {
    tenant_id: string;
    category_id?: string;
    name: string;
    slug: string;
    description?: string;
    price: number;
    compare_at_price?: number;
    cost_price?: number;
    stock?: number;
    sku?: string;
    images?: string[];
    is_active?: boolean;
  }) {
    const { data, error } = await this.supabase
      .from('products')
      .insert(dto)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new BadRequestException('Ya existe un producto con ese nombre o slug en esta tienda');
      throw new BadRequestException(error.message);
    }
    return data;
  }

  async findByTenant(
    tenantId: string,
    filters: {
      category_id?: string;
      search?: string;
      min_price?: number;
      max_price?: number;
      is_active?: boolean;
      page?: number;
      limit?: number;
    },
  ) {
    let query = this.supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId);

    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id);
    }

    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    if (filters.min_price !== undefined) {
      query = query.gte('price', filters.min_price);
    }

    if (filters.max_price !== undefined) {
      query = query.lte('price', filters.max_price);
    }

    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new BadRequestException(error.message);
    return { data, total: count, page, limit };
  }

  async findById(id: string) {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('Product not found');
    return data;
  }

  async findByIdWithVariants(id: string) {
    const { data: product, error: productError } = await this.supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (productError || !product) throw new NotFoundException('Product not found');

    const { data: variants, error: variantsError } = await this.supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', id);

    if (variantsError) throw new BadRequestException(variantsError.message);

    return { ...product, variants: variants || [] };
  }

  async update(id: string, dto: {
    category_id?: string;
    name?: string;
    slug?: string;
    description?: string;
    price?: number;
    compare_at_price?: number;
    cost_price?: number;
    stock?: number;
    sku?: string;
    images?: string[];
    is_active?: boolean;
  }) {
    const { data, error } = await this.supabase
      .from('products')
      .update(dto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Product not found');
    return data;
  }

  async delete(id: string) {
    const { error } = await this.supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw new BadRequestException(error.message);
    return { message: 'Product deleted successfully' };
  }

  async addVariant(productId: string, dto: {
    name: string;
    price?: number;
    stock?: number;
    sku?: string;
    attributes?: Record<string, any>;
  }) {
    const { data, error } = await this.supabase
      .from('product_variants')
      .insert({ product_id: productId, ...dto })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async getVariants(productId: string) {
    const { data, error } = await this.supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', productId);

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async updateVariant(variantId: string, dto: {
    name?: string;
    price?: number;
    stock?: number;
    sku?: string;
    attributes?: Record<string, any>;
  }) {
    const { data, error } = await this.supabase
      .from('product_variants')
      .update(dto)
      .eq('id', variantId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Variant not found');
    return data;
  }

  async deleteVariant(variantId: string) {
    const { error } = await this.supabase
      .from('product_variants')
      .delete()
      .eq('id', variantId);

    if (error) throw new BadRequestException(error.message);
    return { message: 'Variant deleted successfully' };
  }

  async getFeatured(tenantId: string) {
    const { data, error } = await this.supabase
      .from('v_products_with_discount')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return data;
  }
}

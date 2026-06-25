import { Injectable, Inject, BadRequestException, NotFoundException, Optional } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../common/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';
import { WebhooksService } from '../webhooks/webhooks.service';

@Injectable()
export class ProductsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    @Optional() private readonly webhooks?: WebhooksService,
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
    has_buy_now?: boolean;
    technical_specs?: Record<string, any>;
    has_shipping_info?: boolean;
    vertical_gallery?: boolean;
    has_zoom?: boolean;
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

    if (this.webhooks) {
      await this.webhooks.dispatch(data.tenant_id, 'product.created', data);
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
      sort?: string;
      page?: number;
      limit?: number;
      lang?: string;
      currency?: string;
    },
  ) {
    let query = this.supabase
      .from('products')
      .select('*, category:categories(id,name)', { count: 'exact' })
      .eq('tenant_id', tenantId);

    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id);
    }

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
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
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;

    let sortField = 'created_at';
    let sortAsc = false;

    switch (filters.sort) {
      case 'price_asc': sortField = 'price'; sortAsc = true; break;
      case 'price_desc': sortField = 'price'; sortAsc = false; break;
      case 'name_asc': sortField = 'name'; sortAsc = true; break;
      case 'name_desc': sortField = 'name'; sortAsc = false; break;
      case 'oldest': sortField = 'created_at'; sortAsc = true; break;
      default: sortField = 'created_at'; sortAsc = false; break;
    }

    const { data, error, count } = await query
      .order(sortField, { ascending: sortAsc })
      .range(offset, offset + limit - 1);

    if (error) throw new BadRequestException(error.message);

    // Dynamic translation and currency conversion
    const processedData = await this.translateAndConvert(tenantId, data || [], filters.lang, filters.currency);

    return { data: processedData, total: count, page, limit };
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

  async findBySlug(tenantId: string, slug: string, lang?: string, currency?: string) {
    const { data, error } = await this.supabase
      .from('products')
      .select('*, category:categories(id,name)')
      .eq('tenant_id', tenantId)
      .eq('slug', slug)
      .single();

    if (error || !data) throw new NotFoundException('Product not found');

    const processed = await this.translateAndConvert(tenantId, [data], lang, currency);
    return processed[0];
  }

  async findByIdWithVariants(id: string, lang?: string, currency?: string) {
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

    const fullProduct = { ...product, variants: variants || [] };
    const processed = await this.translateAndConvert(product.tenant_id, [fullProduct], lang, currency);
    return processed[0];
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
    is_featured?: boolean;
    is_new?: boolean;
    has_buy_now?: boolean;
    technical_specs?: Record<string, any>;
    has_shipping_info?: boolean;
    vertical_gallery?: boolean;
    has_zoom?: boolean;
  }) {
    const { data, error } = await this.supabase
      .from('products')
      .update(dto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Product not found');

    if (this.webhooks) {
      await this.webhooks.dispatch(data.tenant_id, 'product.updated', data);
      if (dto.stock !== undefined && dto.stock === 0) {
        await this.webhooks.dispatch(data.tenant_id, 'product.out_of_stock', data);
      }
    }

    return data;
  }

  async delete(id: string) {
    // Select tenant_id first before deleting
    const { data: prod } = await this.supabase
      .from('products')
      .select('tenant_id')
      .eq('id', id)
      .maybeSingle();

    const { error } = await this.supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw new BadRequestException(error.message);

    if (this.webhooks && prod) {
      await this.webhooks.dispatch(prod.tenant_id, 'product.deleted', { id });
    }

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

  async getFeatured(tenantId: string, limit: number = 10) {
    const { data, error } = await this.supabase
      .from('products')
      .select('*, category:categories(id,name)')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async getNewArrivals(tenantId: string, limit: number = 10) {
    const { data, error } = await this.supabase
      .from('products')
      .select('*, category:categories(id,name)')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .eq('is_new', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async getBestSellers(tenantId: string, limit: number = 10) {
    const { data, error } = await this.supabase
      .from('products')
      .select('*, category:categories(id,name)')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  async bulkCreate(tenantId: string, products: any[]) {
    const results = [];
    for (const p of products) {
      let existingProduct = null;
      if (p.sku) {
        const { data } = await this.supabase
          .from('products')
          .select('id, slug')
          .eq('tenant_id', tenantId)
          .eq('sku', p.sku)
          .maybeSingle();
        existingProduct = data;
      }

      if (existingProduct) {
        const { data, error } = await this.supabase
          .from('products')
          .update({
            name: p.name,
            description: p.description,
            price: p.price,
            cost_price: p.cost_price,
            stock: p.stock !== undefined ? p.stock : 999,
            is_active: p.is_active !== undefined ? p.is_active : true,
          })
          .eq('id', existingProduct.id)
          .select()
          .single();
        if (error) {
          throw new BadRequestException(`Error actualizando producto con SKU ${p.sku}: ${error.message}`);
        }
        results.push({ action: 'updated', product: data });
      } else {
        let baseSlug = this.slugify(p.name);
        if (!baseSlug) baseSlug = 'producto';
        let uniqueSlug = baseSlug;
        let counter = 1;
        let isUnique = false;

        while (!isUnique) {
          const { data } = await this.supabase
            .from('products')
            .select('id')
            .eq('tenant_id', tenantId)
            .eq('slug', uniqueSlug)
            .maybeSingle();
          if (!data) {
            isUnique = true;
          } else {
            uniqueSlug = `${baseSlug}-${counter}`;
            counter++;
          }
        }

        const { data, error } = await this.supabase
          .from('products')
          .insert({
            tenant_id: tenantId,
            category_id: p.category_id || null,
            name: p.name,
            slug: uniqueSlug,
            description: p.description || '',
            price: p.price,
            cost_price: p.cost_price || 0,
            stock: p.stock !== undefined ? p.stock : 999,
            sku: p.sku || null,
            is_active: p.is_active !== undefined ? p.is_active : true,
          })
          .select()
          .single();

        if (error) {
          throw new BadRequestException(`Error creando producto ${p.name}: ${error.message}`);
        }
        results.push({ action: 'created', product: data });
      }
    }
    return { success: true, count: results.length, data: results };
  }

  async trackView(productId: string, visitorId: string) {
    // Check if already viewed today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { data: existing } = await this.supabase
      .from('product_views')
      .select('id')
      .eq('product_id', productId)
      .eq('visitor_id', visitorId)
      .gte('viewed_at', todayStart.toISOString())
      .maybeSingle();

    if (!existing) {
      // Insert new view
      await this.supabase.from('product_views').insert({
        product_id: productId,
        visitor_id: visitorId,
        viewed_at: new Date().toISOString(),
      });
    }

    // Always increment view_count on products
    const { data } = await this.supabase
      .from('products')
      .select('view_count')
      .eq('id', productId)
      .single();
    if (data) {
      await this.supabase
        .from('products')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', productId);
    }

    return { ok: true };
  }

  async getProductStats(productId: string) {
    // Get view count
    const { data: product } = await this.supabase
      .from('products')
      .select('view_count, sales_count, stock')
      .eq('id', productId)
      .single();

    // Get unique viewers in last 24h
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: recentViewers } = await this.supabase
      .from('product_views')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId)
      .gte('viewed_at', since);

    // Get sales in last 48h
    const since48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { count: recentSales } = await this.supabase
      .from('order_items')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId)
      .gte('created_at', since48h);

    return {
      view_count: product?.view_count || 0,
      sales_count: product?.sales_count || 0,
      stock: product?.stock ?? null,
      recent_viewers: recentViewers || 0,
      recent_sales: recentSales || 0,
    };
  }

  async getPrevNext(productId: string) {
    // Get current product's tenant and name
    const { data: current } = await this.supabase
      .from('products')
      .select('id, tenant_id, name, slug, price, compare_at_price, images')
      .eq('id', productId)
      .single();

    if (!current) return { prev: null, next: null };

    // Get prev (product before, by name)
    const { data: prev } = await this.supabase
      .from('products')
      .select('id, name, slug, price, compare_at_price, images')
      .eq('tenant_id', current.tenant_id)
      .eq('is_active', true)
      .lt('name', current.name)
      .order('name', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get next (product after, by name)
    const { data: next } = await this.supabase
      .from('products')
      .select('id, name, slug, price, compare_at_price, images')
      .eq('tenant_id', current.tenant_id)
      .eq('is_active', true)
      .gt('name', current.name)
      .order('name', { ascending: true })
      .limit(1)
      .maybeSingle();

    return { prev: prev || null, next: next || null };
  }

  private async translateAndConvert(
    tenantId: string,
    products: any[],
    lang?: string,
    currency?: string,
  ) {
    if (!products || products.length === 0) return products;

    // 1. Apply Translation if lang is provided
    if (lang) {
      const productIds = products.map(p => p.id);
      if (productIds.length > 0) {
        const { data: translations } = await this.supabase
          .from('product_translations')
          .select('*')
          .in('product_id', productIds)
          .eq('language_code', lang);

        if (translations && translations.length > 0) {
          const transMap = new Map(translations.map(t => [t.product_id, t]));
          products.forEach(p => {
            const trans: any = transMap.get(p.id);
            if (trans) {
              p.name = trans.name || p.name;
              p.description = trans.description || p.description;
              p.slug = trans.slug || p.slug;
              p.translated = true;
            } else {
              p.translated = false;
            }
          });
        } else {
          products.forEach(p => { p.translated = false; });
        }
      }
    }

    // 2. Apply Currency Conversion if currency is provided
    if (currency) {
      const { data: currConfig } = await this.supabase
        .from('tenant_currencies')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('currency_code', currency)
        .eq('is_active', true)
        .maybeSingle();

      if (currConfig && currConfig.exchange_rate) {
        const rate = Number(currConfig.exchange_rate);
        const decimals = ['CLP', 'COP'].includes(currency) ? 0 : 2;

        products.forEach(p => {
          if (p.price !== undefined && p.price !== null) {
            p.price = Number((Number(p.price) * rate).toFixed(decimals));
            p.original_currency = 'CLP';
            p.display_currency = currency;
          }
          if (p.compare_at_price !== undefined && p.compare_at_price !== null) {
            p.compare_at_price = Number((Number(p.compare_at_price) * rate).toFixed(decimals));
          }
          if (p.variants) {
            p.variants.forEach((v: any) => {
              if (v.price !== undefined && v.price !== null) {
                v.price = Number((Number(v.price) * rate).toFixed(decimals));
              }
            });
          }
        });
      }
    }

    return products;
  }
}

import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../common/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class PromotionsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async createPromotion(dto: {
    tenant_id: string;
    name: string;
    description?: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    min_purchase?: number;
    starts_at: string;
    ends_at: string;
    is_active?: boolean;
    applicable_product_ids?: string[];
    applicable_category_ids?: string[];
    usage_limit?: number;
  }) {
    const { data, error } = await this.supabase
      .from('promotions')
      .insert(dto)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async listPromotions(
    tenantId: string,
    filters?: { is_active?: boolean },
  ) {
    let query = this.supabase
      .from('promotions')
      .select('*')
      .eq('tenant_id', tenantId);

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async getPromotion(id: string) {
    const { data, error } = await this.supabase
      .from('promotions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('Promotion not found');
    return data;
  }

  async updatePromotion(id: string, dto: {
    name?: string;
    description?: string;
    discount_type?: 'percentage' | 'fixed';
    discount_value?: number;
    min_purchase?: number;
    starts_at?: string;
    ends_at?: string;
    is_active?: boolean;
    applicable_product_ids?: string[];
    applicable_category_ids?: string[];
    usage_limit?: number;
  }) {
    const { data, error } = await this.supabase
      .from('promotions')
      .update(dto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Promotion not found');
    return data;
  }

  async deletePromotion(id: string) {
    const { error } = await this.supabase
      .from('promotions')
      .delete()
      .eq('id', id);

    if (error) throw new BadRequestException(error.message);
    return { message: 'Promotion deleted successfully' };
  }

  async togglePromotion(id: string) {
    const promo = await this.getPromotion(id);
    const { data, error } = await this.supabase
      .from('promotions')
      .update({ is_active: !promo.is_active })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async createCoupon(dto: {
    tenant_id: string;
    promotion_id: string;
    code: string;
    max_uses?: number;
    is_active?: boolean;
  }) {
    const { data, error } = await this.supabase
      .from('coupons')
      .insert(dto)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async listCoupons(tenantId: string) {
    const { data, error } = await this.supabase
      .from('coupons')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async updateCoupon(id: string, dto: {
    code?: string;
    max_uses?: number;
    is_active?: boolean;
  }) {
    const { data, error } = await this.supabase
      .from('coupons')
      .update(dto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Coupon not found');
    return data;
  }

  async deleteCoupon(id: string) {
    const { error } = await this.supabase
      .from('coupons')
      .delete()
      .eq('id', id);

    if (error) throw new BadRequestException(error.message);
    return { message: 'Coupon deleted successfully' };
  }

  async validateCoupon(dto: {
    code: string;
    tenant_id: string;
    subtotal: number;
    product_ids: string[];
  }) {
    const { data: coupon, error } = await this.supabase
      .from('coupons')
      .select('*, promotion:promotion_id(*)')
      .eq('code', dto.code)
      .eq('tenant_id', dto.tenant_id)
      .single();

    if (error || !coupon) throw new NotFoundException('Coupon not found');

    const promotion = coupon.promotion as any;

    if (!promotion) throw new BadRequestException('Associated promotion not found');
    if (!promotion.is_active) throw new BadRequestException('Promotion is not active');
    if (!coupon.is_active) throw new BadRequestException('Coupon is not active');

    const now = new Date().toISOString();
    if (now < promotion.starts_at) throw new BadRequestException('Promotion has not started yet');
    if (now > promotion.ends_at) throw new BadRequestException('Promotion has expired');

    if (promotion.usage_limit !== null && promotion.usage_count >= promotion.usage_limit) {
      throw new BadRequestException('Promotion usage limit reached');
    }

    if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
      throw new BadRequestException('Coupon usage limit reached');
    }

    if (dto.subtotal < (promotion.min_purchase || 0)) {
      throw new BadRequestException(
        `Minimum purchase of ${promotion.min_purchase} required`,
      );
    }

    const applicableProducts: string[] = promotion.applicable_product_ids || [];
    const applicableCategories: string[] = promotion.applicable_category_ids || [];

    if (applicableProducts.length > 0 || applicableCategories.length > 0) {
      let matchesProduct = false;

      if (applicableProducts.length > 0) {
        matchesProduct = dto.product_ids.some((pid) =>
          applicableProducts.includes(pid),
        );
      }

      if (!matchesProduct && applicableCategories.length > 0) {
        const { data: products } = await this.supabase
          .from('products')
          .select('id, category_id')
          .in('id', dto.product_ids);

        if (products) {
          matchesProduct = products.some((p) =>
            applicableCategories.includes(p.category_id),
          );
        }
      }

      if (!matchesProduct) {
        throw new BadRequestException('Coupon not applicable to the selected products');
      }
    }

    let discountAmount: number;
    if (promotion.discount_type === 'percentage') {
      discountAmount = (dto.subtotal * promotion.discount_value) / 100;
    } else {
      discountAmount = promotion.discount_value;
    }

    return {
      valid: true,
      discount_type: promotion.discount_type,
      discount_value: promotion.discount_value,
      discount_amount: discountAmount,
      promotion_name: promotion.name,
      promotion_id: promotion.id,
    };
  }

  async getActivePromotions(tenantId: string) {
    const now = new Date().toISOString();
    const { data, error } = await this.supabase
      .from('promotions')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .lte('starts_at', now)
      .gte('ends_at', now)
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return data;
  }
}

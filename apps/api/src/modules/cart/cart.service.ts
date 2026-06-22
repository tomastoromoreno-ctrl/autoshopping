import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../common/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class CartService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async addItem(dto: {
    tenant_id: string;
    session_id: string;
    product_id: string;
    variant_id?: string;
    quantity: number;
  }) {
    const { data: product, error: productError } = await this.supabase
      .from('products')
      .select('id, price, stock, is_active')
      .eq('id', dto.product_id)
      .single();

    if (productError || !product) throw new NotFoundException('Product not found');
    if (!product.is_active) throw new BadRequestException('Product is not active');
    if (product.stock !== null && product.stock < dto.quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    if (dto.variant_id) {
      const { data: variant, error: variantError } = await this.supabase
        .from('product_variants')
        .select('id, price, stock')
        .eq('id', dto.variant_id)
        .eq('product_id', dto.product_id)
        .single();

      if (variantError || !variant) throw new NotFoundException('Variant not found');
      if (variant.stock !== null && variant.stock < dto.quantity) {
        throw new BadRequestException('Insufficient variant stock');
      }
    }

    const unitPrice = dto.variant_id
      ? await this.getVariantPrice(dto.variant_id)
      : product.price;

    let cart = await this.getOrCreateCart(dto.tenant_id, dto.session_id);

    const { data: existingItem } = await this.supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cart.id)
      .eq('product_id', dto.product_id)
      .eq('variant_id', dto.variant_id || null)
      .maybeSingle();

    if (existingItem) {
      const newQty = existingItem.quantity + dto.quantity;
      const { error: updateError } = await this.supabase
        .from('cart_items')
        .update({ quantity: newQty, total_price: unitPrice * newQty })
        .eq('id', existingItem.id);

      if (updateError) throw new BadRequestException(updateError.message);
    } else {
      const { error: insertError } = await this.supabase
        .from('cart_items')
        .insert({
          cart_id: cart.id,
          product_id: dto.product_id,
          variant_id: dto.variant_id || null,
          quantity: dto.quantity,
          unit_price: unitPrice,
          total_price: unitPrice * dto.quantity,
        });

      if (insertError) throw new BadRequestException(insertError.message);
    }

    await this.recalculateCart(cart.id);
    return this.getCartById(cart.id);
  }

  async getCart(sessionId: string, tenantId: string) {
    const { data: cart, error } = await this.supabase
      .from('carts')
      .select('*')
      .eq('session_id', sessionId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (!cart) return { items: [], subtotal: 0, item_count: 0 };

    return this.getCartById(cart.id);
  }

  async updateItemQuantity(itemId: string, quantity: number) {
    if (quantity < 1) throw new BadRequestException('Quantity must be at least 1');

    const { data: item, error: itemError } = await this.supabase
      .from('cart_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (itemError || !item) throw new NotFoundException('Cart item not found');

    const { error: updateError } = await this.supabase
      .from('cart_items')
      .update({ quantity, total_price: item.unit_price * quantity })
      .eq('id', itemId);

    if (updateError) throw new BadRequestException(updateError.message);

    await this.recalculateCart(item.cart_id);
    return this.getCartById(item.cart_id);
  }

  async removeItem(itemId: string) {
    const { data: item, error: itemError } = await this.supabase
      .from('cart_items')
      .select('cart_id')
      .eq('id', itemId)
      .single();

    if (itemError || !item) throw new NotFoundException('Cart item not found');

    const { error: deleteError } = await this.supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);

    if (deleteError) throw new BadRequestException(deleteError.message);

    await this.recalculateCart(item.cart_id);
    return this.getCartById(item.cart_id);
  }

  async clearCart(sessionId: string) {
    const { data: cart, error } = await this.supabase
      .from('carts')
      .select('id')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (!cart) return { message: 'Cart is already empty' };

    const { error: deleteError } = await this.supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id);

    if (deleteError) throw new BadRequestException(deleteError.message);

    await this.supabase
      .from('carts')
      .update({ coupon_code: null })
      .eq('id', cart.id);

    return { message: 'Cart cleared successfully' };
  }

  async applyCoupon(sessionId: string, tenantId: string, code: string) {
    const cart = await this.getCart(sessionId, tenantId);

    const productIds = cart.items.map((i: any) => i.product_id);

    const { data: coupon, error } = await this.supabase
      .from('coupons')
      .select('*, promotion:promotion_id(*)')
      .eq('code', code)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !coupon) throw new NotFoundException('Coupon not found');

    const promotion = coupon.promotion as any;

    if (!promotion || !promotion.is_active) throw new BadRequestException('Promotion is not active');
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

    if (cart.subtotal < (promotion.min_purchase || 0)) {
      throw new BadRequestException(`Minimum purchase of ${promotion.min_purchase} required`);
    }

    const applicableProducts: string[] = promotion.applicable_product_ids || [];
    const applicableCategories: string[] = promotion.applicable_category_ids || [];

    if (applicableProducts.length > 0 || applicableCategories.length > 0) {
      let matchesProduct = false;

      if (applicableProducts.length > 0) {
        matchesProduct = productIds.some((pid: string) => applicableProducts.includes(pid));
      }

      if (!matchesProduct && applicableCategories.length > 0) {
        const { data: products } = await this.supabase
          .from('products')
          .select('id, category_id')
          .in('id', productIds);

        if (products) {
          matchesProduct = products.some((p) => applicableCategories.includes(p.category_id));
        }
      }

      if (!matchesProduct) {
        throw new BadRequestException('Coupon not applicable to the selected products');
      }
    }

    const { error: updateError } = await this.supabase
      .from('carts')
      .update({ coupon_code: code })
      .eq('id', cart.id);

    if (updateError) throw new BadRequestException(updateError.message);

    return { message: 'Coupon applied successfully', coupon_code: code };
  }

  async removeCoupon(sessionId: string) {
    const { data: cart, error } = await this.supabase
      .from('carts')
      .select('id')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (!cart) throw new NotFoundException('Cart not found');

    const { error: updateError } = await this.supabase
      .from('carts')
      .update({ coupon_code: null })
      .eq('id', cart.id);

    if (updateError) throw new BadRequestException(updateError.message);

    return { message: 'Coupon removed successfully' };
  }

  private async getOrCreateCart(tenantId: string, sessionId: string) {
    const { data: existing } = await this.supabase
      .from('carts')
      .select('*')
      .eq('session_id', sessionId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (existing) return existing;

    const { data, error } = await this.supabase
      .from('carts')
      .insert({ tenant_id: tenantId, session_id: sessionId })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  private async getCartById(cartId: string) {
    const { data: cart, error } = await this.supabase
      .from('carts')
      .select('*')
      .eq('id', cartId)
      .single();

    if (error || !cart) throw new NotFoundException('Cart not found');

    const { data: items, error: itemsError } = await this.supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cartId);

    if (itemsError) throw new BadRequestException(itemsError.message);

    return { ...cart, items: items || [] };
  }

  private async recalculateCart(cartId: string) {
    const { data: items, error } = await this.supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cartId);

    if (error) throw new BadRequestException(error.message);

    const subtotal = (items || []).reduce(
      (sum, item) => sum + Number(item.unit_price) * item.quantity,
      0,
    );

    const { error: updateError } = await this.supabase
      .from('carts')
      .update({ subtotal })
      .eq('id', cartId);

    if (updateError) throw new BadRequestException(updateError.message);
  }

  private async getVariantPrice(variantId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('product_variants')
      .select('price')
      .eq('id', variantId)
      .single();

    if (error || !data) throw new NotFoundException('Variant not found');
    return data.price;
  }
}

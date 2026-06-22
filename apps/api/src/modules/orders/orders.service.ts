import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../common/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async createFromCart(dto: {
    tenant_id: string;
    session_id: string;
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    shipping_address?: Record<string, any>;
    notes?: string;
  }) {
    const { data: cart, error: cartError } = await this.supabase
      .from('carts')
      .select('*')
      .eq('session_id', dto.session_id)
      .eq('tenant_id', dto.tenant_id)
      .single();

    if (cartError || !cart) throw new NotFoundException('Cart not found');

    const { data: cartItems, error: itemsError } = await this.supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cart.id);

    if (itemsError) throw new BadRequestException(itemsError.message);
    if (!cartItems || cartItems.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    for (const item of cartItems) {
      const { data: product } = await this.supabase
        .from('products')
        .select('stock, name')
        .eq('id', item.product_id)
        .single();

      if (!product) throw new NotFoundException(`Product ${item.product_id} not found`);

      if (product.stock !== null && product.stock < item.quantity) {
        throw new BadRequestException(`Insufficient stock for product ${product.name}`);
      }

      const newStock = product.stock !== null ? product.stock - item.quantity : null;
      const { error: stockError } = await this.supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', item.product_id);

      if (stockError) throw new BadRequestException(stockError.message);
    }

    const orderTotal = cart.subtotal || 0;
    const discount = 0;
    const shippingCost = 0;

    const { data: order, error: orderError } = await this.supabase
      .from('orders')
      .insert({
        tenant_id: dto.tenant_id,
        session_id: dto.session_id,
        status: 'pending',
        subtotal: orderTotal,
        discount,
        shipping_cost: shippingCost,
        total: orderTotal - discount + shippingCost,
        coupon_code: cart.coupon_code || null,
        customer_name: dto.customer_name,
        customer_email: dto.customer_email,
        customer_phone: dto.customer_phone || null,
        shipping_address: dto.shipping_address || null,
        notes: dto.notes || null,
      })
      .select()
      .single();

    if (orderError) throw new BadRequestException(orderError.message);

    const orderItems = cartItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: '',
      variant_name: null,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
    }));

    for (const item of cartItems) {
      const { data: product } = await this.supabase
        .from('products')
        .select('name')
        .eq('id', item.product_id)
        .single();

      let variantName: string | null = null;
      if (item.variant_id) {
        const { data: variant } = await this.supabase
          .from('product_variants')
          .select('name')
          .eq('id', item.variant_id)
          .single();
        variantName = variant?.name || null;
      }

      const { error: insertError } = await this.supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: item.product_id,
          product_name: product?.name || '',
          variant_name: variantName,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        });

      if (insertError) throw new BadRequestException(insertError.message);
    }

    const { error: clearError } = await this.supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id);

    if (clearError) throw new BadRequestException(clearError.message);

    await this.supabase.from('carts').delete().eq('id', cart.id);

    return this.findById(order.id);
  }

  async listByTenant(
    tenantId: string,
    filters?: { status?: string; page?: number; limit?: number },
  ) {
    let query = this.supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new BadRequestException(error.message);
    return { data, total: count, page, limit };
  }

  async findById(id: string) {
    const { data: order, error } = await this.supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !order) throw new NotFoundException('Order not found');

    const { data: items, error: itemsError } = await this.supabase
      .from('order_items')
      .select('*')
      .eq('order_id', id);

    if (itemsError) throw new BadRequestException(itemsError.message);

    return { ...order, items: items || [] };
  }

  async updateStatus(
    id: string,
    dto: { status?: string; payment_status?: string },
  ) {
    const updateData: Record<string, any> = {};
    if (dto.status) updateData.status = dto.status;
    if (dto.payment_status) updateData.payment_status = dto.payment_status;

    const { data, error } = await this.supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Order not found');
    return data;
  }

  async findByEmail(email: string, tenantId: string) {
    const { data, error } = await this.supabase
      .from('orders')
      .select('*')
      .eq('customer_email', email)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return data;
  }
}

import { Injectable, Inject, BadRequestException, NotFoundException, Logger, Optional } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../common/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';
import { EmailService } from '../notifications/email.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { InvoicingService } from '../invoicing/invoicing.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    private readonly emailService: EmailService,
    private readonly invoicingService: InvoicingService,
    @Optional() private readonly webhooks?: WebhooksService,
  ) {}

  async createFromCart(dto: {
    tenant_id: string;
    session_id: string;
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    shipping_address?: Record<string, any>;
    notes?: string;
    items?: any[];
    payment_method_id?: string;
    coupon_code?: string;
  }) {
    // Ensure cart exists in Supabase if frontend sent items
    if (dto.items && dto.items.length > 0) {
      let { data: cart } = await this.supabase
        .from('carts')
        .select('*')
        .eq('session_id', dto.session_id)
        .eq('tenant_id', dto.tenant_id)
        .maybeSingle();

      if (!cart) {
        const { data: newCart, error: createError } = await this.supabase
          .from('carts')
          .insert({
            tenant_id: dto.tenant_id,
            session_id: dto.session_id,
            subtotal: dto.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            coupon_code: dto.coupon_code || null,
          })
          .select()
          .single();
        if (createError) {
          this.logger.error(`Error creating cart: ${createError.message}`);
        } else {
          cart = newCart;
        }
      } else {
        await this.supabase
          .from('carts')
          .update({
            subtotal: dto.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            coupon_code: dto.coupon_code || cart.coupon_code || null,
          })
          .eq('id', cart.id);
      }

      if (cart) {
        await this.supabase
          .from('cart_items')
          .delete()
          .eq('cart_id', cart.id);

        const itemsToInsert = dto.items.map((item) => ({
          cart_id: cart.id,
          product_id: item.product_id,
          variant_id: item.variant_id || null,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
        }));

        const { error: insertItemsError } = await this.supabase
          .from('cart_items')
          .insert(itemsToInsert);

        if (insertItemsError) {
          this.logger.error(`Error inserting cart items: ${insertItemsError.message}`);
        }
      }
    }

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
    
    // Calculate shipping cost dynamically
    let shippingCost = 0;
    try {
      const { data: config } = await this.supabase
        .from('store_configs')
        .select('shipping_enabled, shipping_cost, free_shipping_min')
        .eq('tenant_id', dto.tenant_id)
        .maybeSingle();

      if (config?.shipping_enabled) {
        const minFree = config.free_shipping_min || 0;
        if (minFree === 0 || orderTotal < minFree) {
          shippingCost = config.shipping_cost || 0;
        }
      }
    } catch (err) {
      this.logger.error(`Error fetching shipping config: ${err.message}`);
    }

    // Calculate coupon discount dynamically
    let discount = 0;
    const couponCode = cart.coupon_code || dto.coupon_code;
    if (couponCode) {
      try {
        const { data: coupon } = await this.supabase
          .from('coupons')
          .select('*, promotion:promotion_id(*)')
          .eq('code', couponCode)
          .eq('tenant_id', dto.tenant_id)
          .single();

        if (coupon && coupon.is_active) {
          const promotion = coupon.promotion as any;
          if (promotion && promotion.is_active) {
            const now = new Date().toISOString();
            if (now >= promotion.starts_at && now <= promotion.ends_at) {
              const minPurchase = promotion.min_purchase || 0;
              if (orderTotal >= minPurchase) {
                const discountAmount = promotion.discount_amount || 0;
                const discountPercent = promotion.discount_percent || 0;
                if (discountAmount > 0) {
                  discount = discountAmount;
                } else if (discountPercent > 0) {
                  discount = orderTotal * (discountPercent / 100);
                }
                discount = Math.min(discount, orderTotal);
              }
            }
          }
        }
      } catch (err) {
        this.logger.error(`Error applying coupon ${couponCode}: ${err.message}`);
      }
    }

    const { data: order, error: orderError } = await this.supabase
      .from('orders')
      .insert({
        tenant_id: dto.tenant_id,
        session_id: dto.session_id,
        status: 'pending',
        subtotal: orderTotal,
        discount,
        shipping_cost: shippingCost,
        total: Math.max(0, orderTotal - discount + shippingCost),
        coupon_code: couponCode || null,
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

    const fullOrder = await this.findById(order.id);

    // Dispatch outgoing webhook order.created
    if (this.webhooks) {
      await this.webhooks.dispatch(dto.tenant_id, 'order.created', fullOrder);
    }

    // Send confirmation email asynchronously (don't block order creation)
    this.sendOrderConfirmationEmail(dto.tenant_id, fullOrder).catch((err) =>
      this.logger.error(`Failed to send confirmation email: ${err.message}`),
    );

    return fullOrder;
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
    dto: { status?: string; payment_status?: string; tracking?: string },
  ) {
    const updateData: Record<string, any> = {};
    if (dto.status) updateData.status = dto.status;
    if (dto.payment_status) updateData.payment_status = dto.payment_status;

    const { data: previousOrder } = await this.supabase
      .from('orders')
      .select('status')
      .eq('id', id)
      .single();

    const { data, error } = await this.supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Order not found');

    // Webhook dispatches
    if (this.webhooks) {
      if (dto.status && dto.status !== previousOrder?.status) {
        await this.webhooks.dispatch(data.tenant_id, `order.${dto.status}`, data);
      }
      if (dto.payment_status === 'approved') {
        await this.webhooks.dispatch(data.tenant_id, 'order.paid', data);
        
        // Auto-generate invoice/boleta/recibo asynchronously
        this.invoicingService.generateInvoice(data.tenant_id, data.id).catch((err) =>
          this.logger.error(`Failed to auto-generate invoice for order ${data.id}: ${err.message}`),
        );
      }
    }

    // Send shipping notification when status changes to 'shipped'
    if (dto.status === 'shipped' && previousOrder?.status !== 'shipped') {
      this.sendOrderShippedEmail(data.tenant_id, data, dto.tracking).catch((err) =>
        this.logger.error(`Failed to send shipping email: ${err.message}`),
      );
    }

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

  private async sendOrderConfirmationEmail(tenantId: string, order: any) {
    const { data: tenant } = await this.supabase
      .from('tenants')
      .select('name, subdomain')
      .eq('id', tenantId)
      .single();

    if (!tenant) return;

    await this.emailService.sendOrderConfirmation({
      orderId: order.id,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      items: (order.items || []).map((item: any) => ({
        name: item.product_name,
        quantity: item.quantity,
        price: item.unit_price,
      })),
      subtotal: order.subtotal,
      shippingCost: order.shipping_cost,
      discount: order.discount,
      total: order.total,
      storeName: tenant.name,
      storeUrl: `https://${tenant.subdomain}.autoshopping.cl`,
    });
  }

  private async sendOrderShippedEmail(tenantId: string, order: any, tracking?: string) {
    const { data: tenant } = await this.supabase
      .from('tenants')
      .select('name, subdomain')
      .eq('id', tenantId)
      .single();

    if (!tenant) return;

    await this.emailService.sendOrderShipped({
      orderId: order.id,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      tracking,
      storeName: tenant.name,
      storeUrl: `https://${tenant.subdomain}.autoshopping.cl`,
    });
  }
}

import { Injectable, Inject, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../common/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  CreateStockMovementDto,
  CreateSupplierDto,
  UpdateSupplierDto,
  CreatePurchaseOrderDto,
  ReceivePurchaseOrderDto,
  CreateStockAlertDto,
  UpdateInventoryConfigDto,
} from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async getDashboard(tenantId: string) {
    const { data: products } = await this.supabase
      .from('products')
      .select('id, name, stock, sku, images')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    const totalProducts = products?.length || 0;
    const totalStock = products?.reduce((sum, p) => sum + (p.stock || 0), 0) || 0;
    const lowStockProducts = products?.filter(p => p.stock > 0 && p.stock <= 5) || [];
    const outOfStockProducts = products?.filter(p => p.stock <= 0) || [];

    const { data: recentMovements } = await this.supabase
      .from('stock_movements')
      .select('*, product:products(name, images)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: alerts } = await this.supabase
      .from('stock_alerts')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    return {
      totalProducts,
      totalStock,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      lowStockProducts: lowStockProducts.slice(0, 5),
      outOfStockProducts: outOfStockProducts.slice(0, 5),
      recentMovements: recentMovements || [],
      activeAlerts: alerts?.length || 0,
    };
  }

  async getStock(tenantId: string, filters: { search?: string; category_id?: string; status?: string; page?: number; limit?: number }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('products')
      .select('id, name, slug, sku, stock, price, images, category_id, category:categories(name), product_suppliers(*, supplier:suppliers(id, name))', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
    }
    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id);
    }
    if (filters.status === 'out_of_stock') {
      query = query.lte('stock', 0);
    } else if (filters.status === 'low_stock') {
      query = query.gt('stock', 0).lte('stock', 5);
    } else if (filters.status === 'in_stock') {
      query = query.gt('stock', 5);
    }

    const { data, count, error } = await query
      .order('stock', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw new BadRequestException(error.message);

    return { data: data || [], total: count || 0, page, limit };
  }

  async getMovements(tenantId: string, filters: { type?: string; product_id?: string; from?: string; to?: string; page?: number; limit?: number }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('stock_movements')
      .select('*, product:products(name, sku, images)', { count: 'exact' })
      .eq('tenant_id', tenantId);

    if (filters.type) query = query.eq('type', filters.type);
    if (filters.product_id) query = query.eq('product_id', filters.product_id);
    if (filters.from) query = query.gte('created_at', filters.from);
    if (filters.to) query = query.lte('created_at', filters.to);

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new BadRequestException(error.message);

    return { data: data || [], total: count || 0, page, limit };
  }

  async createMovement(tenantId: string, dto: CreateStockMovementDto, createdBy?: string) {
    const { data: product } = await this.supabase
      .from('products')
      .select('id, stock, name')
      .eq('id', dto.product_id)
      .eq('tenant_id', tenantId)
      .single();

    if (!product) throw new NotFoundException('Producto no encontrado');

    const currentStock = product.stock || 0;
    const newStock = Math.max(0, currentStock + dto.quantity);

    const { error: updateError } = await this.supabase
      .from('products')
      .update({ stock: newStock, updated_at: new Date().toISOString() })
      .eq('id', dto.product_id);

    if (updateError) throw new BadRequestException(updateError.message);

    const { data: movement, error: movError } = await this.supabase
      .from('stock_movements')
      .insert({
        tenant_id: tenantId,
        product_id: dto.product_id,
        variant_id: dto.variant_id || null,
        type: dto.type,
        quantity: dto.quantity,
        reference_id: dto.reference_id || null,
        reference_type: dto.reference_type || null,
        notes: dto.notes || null,
        created_by: createdBy || null,
      })
      .select()
      .single();

    if (movError) this.logger.error(`Error creating movement: ${movError.message}`);

    return { movement, previousStock: currentStock, newStock };
  }

  async decrementStockForOrder(tenantId: string, orderId: string, items: { product_id: string; variant_id?: string; quantity: number }[]) {
    for (const item of items) {
      const { data: product } = await this.supabase
        .from('products')
        .select('id, stock, name')
        .eq('id', item.product_id)
        .eq('tenant_id', tenantId)
        .single();

      if (!product) continue;

      const currentStock = product.stock || 0;
      if (currentStock < item.quantity) {
        this.logger.warn(`Insufficient stock for ${product.name}: ${currentStock} < ${item.quantity}`);
        continue;
      }

      const newStock = currentStock - item.quantity;

      await this.supabase
        .from('products')
        .update({ stock: newStock, updated_at: new Date().toISOString() })
        .eq('id', item.product_id);

      await this.supabase
        .from('stock_movements')
        .insert({
          tenant_id: tenantId,
          product_id: item.product_id,
          variant_id: item.variant_id || null,
          type: 'sale',
          quantity: -item.quantity,
          reference_id: orderId,
          reference_type: 'order',
          notes: `Venta - Orden #${orderId.substring(0, 8)}`,
        });

      if (newStock <= 5 && newStock > 0) {
        this.logger.warn(`Low stock alert: ${product.name} has ${newStock} units`);
      }
    }
  }

  async incrementStockForReturn(tenantId: string, orderId: string, items: { product_id: string; variant_id?: string; quantity: number }[]) {
    for (const item of items) {
      const { data: product } = await this.supabase
        .from('products')
        .select('id, stock')
        .eq('id', item.product_id)
        .eq('tenant_id', tenantId)
        .single();

      if (!product) continue;

      const currentStock = product.stock || 0;
      const newStock = currentStock + item.quantity;

      await this.supabase
        .from('products')
        .update({ stock: newStock, updated_at: new Date().toISOString() })
        .eq('id', item.product_id);

      await this.supabase
        .from('stock_movements')
        .insert({
          tenant_id: tenantId,
          product_id: item.product_id,
          variant_id: item.variant_id || null,
          type: 'return',
          quantity: item.quantity,
          reference_id: orderId,
          reference_type: 'order',
          notes: `Devolución - Orden #${orderId.substring(0, 8)}`,
        });
    }
  }

  // --- Suppliers ---
  async getSuppliers(tenantId: string) {
    const { data, error } = await this.supabase
      .from('suppliers')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name');

    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async createSupplier(tenantId: string, dto: CreateSupplierDto) {
    const { data, error } = await this.supabase
      .from('suppliers')
      .insert({ ...dto, tenant_id: tenantId })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async updateSupplier(tenantId: string, id: string, dto: UpdateSupplierDto) {
    const { data, error } = await this.supabase
      .from('suppliers')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async deleteSupplier(tenantId: string, id: string) {
    const { error } = await this.supabase
      .from('suppliers')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) throw new BadRequestException(error.message);
    return { success: true };
  }

  // --- Purchase Orders ---
  async getPurchaseOrders(tenantId: string, filters: { status?: string; page?: number; limit?: number }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('purchase_orders')
      .select('*, supplier:suppliers(name), items:purchase_order_items(*, product:products(name, sku))', { count: 'exact' })
      .eq('tenant_id', tenantId);

    if (filters.status) query = query.eq('status', filters.status);

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new BadRequestException(error.message);
    return { data: data || [], total: count || 0, page, limit };
  }

  async getPurchaseOrder(tenantId: string, id: string) {
    const { data, error } = await this.supabase
      .from('purchase_orders')
      .select('*, supplier:suppliers(*), items:purchase_order_items(*, product:products(name, sku, images))')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !data) throw new NotFoundException('Orden de compra no encontrada');
    return data;
  }

  async createPurchaseOrder(tenantId: string, dto: CreatePurchaseOrderDto, createdBy?: string) {
    const total = dto.items.reduce((sum, item) => sum + item.quantity * item.unit_cost, 0);

    const { data: order, error: orderError } = await this.supabase
      .from('purchase_orders')
      .insert({
        tenant_id: tenantId,
        supplier_id: dto.supplier_id || null,
        total,
        notes: dto.notes || null,
        expected_date: dto.expected_date || null,
        created_by: createdBy || null,
      })
      .select()
      .single();

    if (orderError) throw new BadRequestException(orderError.message);

    const items = dto.items.map(item => ({
      purchase_order_id: order.id,
      product_id: item.product_id,
      variant_id: item.variant_id || null,
      quantity: item.quantity,
      received_quantity: 0,
      unit_cost: item.unit_cost,
    }));

    const { error: itemsError } = await this.supabase
      .from('purchase_order_items')
      .insert(items);

    if (itemsError) this.logger.error(`Error creating PO items: ${itemsError.message}`);

    return this.getPurchaseOrder(tenantId, order.id);
  }

  async updatePurchaseOrderStatus(tenantId: string, id: string, status: string) {
    const { data, error } = await this.supabase
      .from('purchase_orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async receivePurchaseOrder(tenantId: string, id: string, dto: ReceivePurchaseOrderDto) {
    const order = await this.getPurchaseOrder(tenantId, id);
    if (order.status === 'cancelled') throw new BadRequestException('No se puede recibir una orden cancelada');

    for (const item of dto.items) {
      const poItem = order.items?.find((i: any) => i.product_id === item.product_id);
      if (!poItem) continue;

      await this.supabase
        .from('purchase_order_items')
        .update({ received_quantity: (poItem.received_quantity || 0) + item.received_quantity })
        .eq('id', poItem.id);

      await this.createMovement(tenantId, {
        product_id: item.product_id,
        variant_id: item.variant_id,
        type: 'purchase',
        quantity: item.received_quantity,
        reference_id: id,
        reference_type: 'purchase_order',
        notes: `Compra - PO #${id.substring(0, 8)}`,
      });
    }

    return this.updatePurchaseOrderStatus(tenantId, id, 'received');
  }

  // --- Stock Alerts ---
  async getStockAlerts(tenantId: string) {
    const { data, error } = await this.supabase
      .from('stock_alerts')
      .select('*, product:products(name, stock, images)')
      .eq('tenant_id', tenantId);

    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async createStockAlert(tenantId: string, dto: CreateStockAlertDto) {
    const { data, error } = await this.supabase
      .from('stock_alerts')
      .insert({ ...dto, tenant_id: tenantId })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async deleteStockAlert(tenantId: string, id: string) {
    const { error } = await this.supabase
      .from('stock_alerts')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) throw new BadRequestException(error.message);
    return { success: true };
  }

  // --- Inventory Config ---
  async getConfig(tenantId: string) {
    let { data } = await this.supabase
      .from('inventory_config')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (!data) {
      const { data: newConfig } = await this.supabase
        .from('inventory_config')
        .insert({ tenant_id: tenantId })
        .select()
        .single();
      data = newConfig;
    }

    return data || { low_stock_threshold: 5, enable_stock_alerts: true, enable_negative_stock: false, auto_decrement_on_order: true };
  }

  async updateConfig(tenantId: string, dto: UpdateInventoryConfigDto) {
    const { data, error } = await this.supabase
      .from('inventory_config')
      .upsert({ tenant_id: tenantId, ...dto })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  // --- Product-Supplier relationships ---
  async getProductSuppliers(tenantId: string, productId: string) {
    const { data, error } = await this.supabase
      .from('product_suppliers')
      .select('*, supplier:suppliers(id, name, contact_name, email, phone)')
      .eq('tenant_id', tenantId)
      .eq('product_id', productId)
      .order('is_preferred', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async getSupplierProducts(tenantId: string, supplierId: string) {
    const { data, error } = await this.supabase
      .from('product_suppliers')
      .select('*, product:products(id, name, sku, stock, images, price)')
      .eq('tenant_id', tenantId)
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async addProductSupplier(tenantId: string, dto: {
    product_id: string;
    supplier_id: string;
    supplier_sku?: string;
    unit_cost?: number;
    lead_time_days?: number;
    min_order_quantity?: number;
    is_preferred?: boolean;
    notes?: string;
  }) {
    const { data, error } = await this.supabase
      .from('product_suppliers')
      .upsert({
        tenant_id: tenantId,
        product_id: dto.product_id,
        supplier_id: dto.supplier_id,
        supplier_sku: dto.supplier_sku || null,
        unit_cost: dto.unit_cost || null,
        lead_time_days: dto.lead_time_days || 0,
        min_order_quantity: dto.min_order_quantity || 1,
        is_preferred: dto.is_preferred || false,
        notes: dto.notes || null,
      }, { onConflict: 'tenant_id,product_id,supplier_id' })
      .select('*, supplier:suppliers(id, name)')
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async removeProductSupplier(tenantId: string, id: string) {
    const { error } = await this.supabase
      .from('product_suppliers')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) throw new BadRequestException(error.message);
    return { success: true };
  }
}

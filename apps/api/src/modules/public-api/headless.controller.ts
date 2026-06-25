import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpStatus,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiKeyGuard } from './guards/api-key.guard';
import { RequireScope } from './decorators/scopes.decorator';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../common/supabase.module';

// Helper to encode/decode base64 cursor
function encodeCursor(id: string, ts: string): string {
  return Buffer.from(JSON.stringify({ id, ts })).toString('base64url');
}

function decodeCursor(cursorStr: string): { id: string; ts: string } | null {
  try {
    const json = Buffer.from(cursorStr, 'base64url').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Simulated Sandbox Data Store
const mockProducts = [
  { id: 'sb-prod-1', name: 'Zapatillas Running Pro', slug: 'zapatillas-running-pro', price: 89990, compare_at_price: 109990, stock: 15, sku: 'ZAP-RUN-001', is_active: true, created_at: '2026-01-01T12:00:00Z' },
  { id: 'sb-prod-2', name: 'Polera Deporte Ultra', slug: 'polera-deporte-ultra', price: 19990, compare_at_price: null, stock: 45, sku: 'POL-DEP-002', is_active: true, created_at: '2026-01-02T12:00:00Z' },
  { id: 'sb-prod-3', name: 'Mochila Impermeable 30L', slug: 'mochila-impermeable-30l', price: 34990, compare_at_price: 39990, stock: 8, sku: 'MOC-IMP-003', is_active: true, created_at: '2026-01-03T12:00:00Z' },
];

const mockCategories = [
  { id: 'sb-cat-1', name: 'Calzado', slug: 'calzado', description: 'Todo tipo de calzado deportivo', parent_id: null, is_active: true },
  { id: 'sb-cat-2', name: 'Ropa', slug: 'ropa', description: 'Vestuario técnico y deportivo', parent_id: null, is_active: true },
];

const mockOrders = [
  {
    id: 'sb-ord-1',
    status: 'confirmed',
    payment_provider: 'mercadopago',
    payment_status: 'approved',
    subtotal: 89990,
    shipping_cost: 3990,
    total: 93980,
    customer_name: 'Diego Maradona',
    customer_email: 'diego@10.org',
    customer_phone: '+56912345678',
    created_at: '2026-06-25T14:32:00Z',
  },
];

@Controller('headless')
@UseGuards(ApiKeyGuard)
export class HeadlessController {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  // ==========================================
  // PRODUCTS ENDPOINTS
  // ==========================================

  @Get('products')
  @RequireScope('products:read')
  async getProducts(@Req() req: any, @Query() query: any) {
    if (req.isSandbox) {
      return { data: mockProducts, pagination: { has_next: false, has_prev: false, next_cursor: null } };
    }

    const limit = Math.min(parseInt(query.limit) || 20, 100);
    const after = query.after;

    let dbQuery = this.supabase
      .from('products')
      .select('*')
      .eq('tenant_id', req.tenantId);

    // Apply cursor pagination
    if (after) {
      const cursor = decodeCursor(after);
      if (cursor) {
        // Query elements older than cursor (created_at DESC)
        dbQuery = dbQuery.or(`created_at.lt.${cursor.ts},and(created_at.eq.${cursor.ts},id.lt.${cursor.id})`);
      }
    }

    // Apply filters
    if (query.category_id) {
      dbQuery = dbQuery.eq('category_id', query.category_id);
    }
    if (query.search) {
      dbQuery = dbQuery.ilike('name', `%${query.search}%`);
    }

    const { data: products, error } = await dbQuery
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit + 1);

    if (error) throw new BadRequestException(error.message);

    const hasNext = products.length > limit;
    const items = hasNext ? products.slice(0, limit) : products;
    const nextCursor = hasNext && items.length > 0
      ? encodeCursor(items[items.length - 1].id, items[items.length - 1].created_at)
      : null;

    return {
      data: items,
      pagination: {
        has_next: hasNext,
        next_cursor: nextCursor,
      },
    };
  }

  @Get('products/:id')
  @RequireScope('products:read')
  async getProduct(@Req() req: any, @Param('id') id: string) {
    if (req.isSandbox) {
      const prod = mockProducts.find(p => p.id === id);
      if (!prod) throw new NotFoundException('Producto no encontrado en Sandbox');
      return prod;
    }

    const { data, error } = await this.supabase
      .from('products')
      .select('*, product_variants(*)')
      .eq('id', id)
      .eq('tenant_id', req.tenantId)
      .maybeSingle();

    if (error || !data) throw new NotFoundException('Producto no encontrado');
    return data;
  }

  @Post('products')
  @RequireScope('products:write')
  async createProduct(@Req() req: any, @Body() body: any) {
    if (req.isSandbox) {
      const newProd = {
        id: `sb-prod-${Date.now()}`,
        ...body,
        created_at: new Date().toISOString(),
      };
      return newProd;
    }

    const { data, error } = await this.supabase
      .from('products')
      .insert({
        ...body,
        tenant_id: req.tenantId,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  @Put('products/:id')
  @RequireScope('products:write')
  async updateProduct(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    if (req.isSandbox) {
      const prod = mockProducts.find(p => p.id === id);
      if (!prod) throw new NotFoundException('Producto no encontrado en Sandbox');
      return { ...prod, ...body };
    }

    const { data, error } = await this.supabase
      .from('products')
      .update(body)
      .eq('id', id)
      .eq('tenant_id', req.tenantId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  @Delete('products/:id')
  @RequireScope('products:write')
  async deleteProduct(@Req() req: any, @Param('id') id: string) {
    if (req.isSandbox) {
      return { success: true, message: 'Producto eliminado del Sandbox' };
    }

    const { error } = await this.supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('tenant_id', req.tenantId);

    if (error) throw new BadRequestException(error.message);
    return { success: true };
  }

  // ==========================================
  // CATEGORIES ENDPOINTS
  // ==========================================

  @Get('categories')
  @RequireScope('products:read')
  async getCategories(@Req() req: any) {
    if (req.isSandbox) return mockCategories;

    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .eq('tenant_id', req.tenantId)
      .order('sort_order', { ascending: true });

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  @Post('categories')
  @RequireScope('products:write')
  async createCategory(@Req() req: any, @Body() body: any) {
    if (req.isSandbox) {
      return { id: `sb-cat-${Date.now()}`, ...body };
    }

    const { data, error } = await this.supabase
      .from('categories')
      .insert({ ...body, tenant_id: req.tenantId })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  @Delete('categories/:id')
  @RequireScope('products:write')
  async deleteCategory(@Req() req: any, @Param('id') id: string) {
    if (req.isSandbox) return { success: true };

    const { error } = await this.supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('tenant_id', req.tenantId);

    if (error) throw new BadRequestException(error.message);
    return { success: true };
  }

  // ==========================================
  // ORDERS ENDPOINTS
  // ==========================================

  @Get('orders')
  @RequireScope('orders:read')
  async getOrders(@Req() req: any, @Query() query: any) {
    if (req.isSandbox) {
      return { data: mockOrders, pagination: { has_next: false, next_cursor: null } };
    }

    const limit = Math.min(parseInt(query.limit) || 20, 100);
    const after = query.after;

    let dbQuery = this.supabase
      .from('orders')
      .select('*')
      .eq('tenant_id', req.tenantId);

    if (after) {
      const cursor = decodeCursor(after);
      if (cursor) {
        dbQuery = dbQuery.or(`created_at.lt.${cursor.ts},and(created_at.eq.${cursor.ts},id.lt.${cursor.id})`);
      }
    }

    const { data: orders, error } = await dbQuery
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit + 1);

    if (error) throw new BadRequestException(error.message);

    const hasNext = orders.length > limit;
    const items = hasNext ? orders.slice(0, limit) : orders;
    const nextCursor = hasNext && items.length > 0
      ? encodeCursor(items[items.length - 1].id, items[items.length - 1].created_at)
      : null;

    return {
      data: items,
      pagination: {
        has_next: hasNext,
        next_cursor: nextCursor,
      },
    };
  }

  @Put('orders/:id')
  @RequireScope('orders:write')
  async updateOrder(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    if (req.isSandbox) {
      const ord = mockOrders.find(o => o.id === id);
      if (!ord) throw new NotFoundException('Pedido no encontrado en Sandbox');
      return { ...ord, ...body };
    }

    const { data, error } = await this.supabase
      .from('orders')
      .update(body)
      .eq('id', id)
      .eq('tenant_id', req.tenantId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  // ==========================================
  // CUSTOMERS ENDPOINTS
  // ==========================================

  @Get('customers')
  @RequireScope('customers:read')
  async getCustomers(@Req() req: any) {
    if (req.isSandbox) {
      return [{ id: 'sb-cust-1', name: 'Lionel Messi', email: 'lio@goat.com', phone: '+56999999999' }];
    }

    // In our system customers are users with role 'customer' linked to the tenant
    const { data, error } = await this.supabase
      .from('users')
      .select('id, name, email, avatar_url, created_at')
      .eq('tenant_id', req.tenantId)
      .eq('role', 'customer');

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  // ==========================================
  // INVENTORY (STOCK)
  // ==========================================

  @Get('inventory')
  @RequireScope('inventory:read')
  async getInventory(@Req() req: any) {
    if (req.isSandbox) {
      return mockProducts.map(p => ({ product_id: p.id, name: p.name, sku: p.sku, stock: p.stock }));
    }

    const { data, error } = await this.supabase
      .from('products')
      .select('id, name, sku, stock')
      .eq('tenant_id', req.tenantId);

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  @Patch('inventory/:productId')
  @RequireScope('inventory:write')
  async adjustStock(@Req() req: any, @Param('productId') id: string, @Body() body: { adjustment: number }) {
    if (req.isSandbox) {
      return { product_id: id, adjustment: body.adjustment, status: 'success' };
    }

    // We can do standard atomic increment/decrement or simple update
    const { data: prod } = await this.supabase
      .from('products')
      .select('stock')
      .eq('id', id)
      .eq('tenant_id', req.tenantId)
      .single();

    if (!prod) throw new NotFoundException('Producto no encontrado');

    const newStock = Math.max(0, (prod.stock || 0) + body.adjustment);

    const { data, error } = await this.supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', id)
      .select('id, name, sku, stock')
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  // ==========================================
  // COUPONS ENDPOINTS
  // ==========================================

  @Get('coupons')
  @RequireScope('marketing:read')
  async getCoupons(@Req() req: any) {
    if (req.isSandbox) return [{ id: 'sb-coup-1', code: 'PROMO10', is_active: true }];

    const { data, error } = await this.supabase
      .from('coupons')
      .select('*')
      .eq('tenant_id', req.tenantId);

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  @Post('coupons')
  @RequireScope('marketing:write')
  async createCoupon(@Req() req: any, @Body() body: any) {
    if (req.isSandbox) return { id: 'sb-coup-2', code: body.code, is_active: true };

    const { data, error } = await this.supabase
      .from('coupons')
      .insert({ ...body, tenant_id: req.tenantId })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  // ==========================================
  // ANALYTICS ENDPOINTS
  // ==========================================

  @Get('analytics')
  @RequireScope('analytics:read')
  async getAnalytics(@Req() req: any) {
    if (req.isSandbox) {
      return { sales_today: 432000, orders_count: 5, conversion_rate: 3.2 };
    }

    const { data: orders } = await this.supabase
      .from('orders')
      .select('total, status')
      .eq('tenant_id', req.tenantId);

    const totalSales = orders?.filter(o => o.status !== 'cancelled').reduce((acc, o) => acc + Number(o.total || 0), 0) || 0;

    return {
      sales_total: totalSales,
      orders_count: orders?.length || 0,
      cancelled_orders: orders?.filter(o => o.status === 'cancelled').length || 0,
    };
  }

  // ==========================================
  // SETTINGS ENDPOINTS
  // ==========================================

  @Get('settings')
  @RequireScope('settings:read')
  async getSettings(@Req() req: any) {
    if (req.isSandbox) {
      return { business_name: 'Mi Tienda Sandbox', currency: 'CLP' };
    }

    const { data, error } = await this.supabase
      .from('store_configs')
      .select('*')
      .eq('tenant_id', req.tenantId)
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  @Put('settings')
  @RequireScope('settings:write')
  async updateSettings(@Req() req: any, @Body() body: any) {
    if (req.isSandbox) return { ...body, status: 'saved' };

    const { data, error } = await this.supabase
      .from('store_configs')
      .update(body)
      .eq('tenant_id', req.tenantId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }
}

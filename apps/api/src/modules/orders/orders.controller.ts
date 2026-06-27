import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Req, BadRequestException, Inject, NotFoundException,
} from '@nestjs/common';
import {
  IsString, IsUUID, IsOptional, IsEmail, IsObject, IsInt, Min,
} from 'class-validator';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../common/supabase.module';
import { OrdersService } from './orders.service';
import { AuthGuard } from '../../common/guards/auth.guard';

class CreateOrderDto {
  @IsString()
  session_id: string;

  @IsString()
  customer_name: string;

  @IsEmail()
  customer_email: string;

  @IsString()
  @IsOptional()
  customer_phone?: string;

  @IsObject()
  @IsOptional()
  shipping_address?: Record<string, any>;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsOptional()
  items?: any[];

  @IsString()
  @IsOptional()
  payment_method_id?: string;

  @IsString()
  @IsOptional()
  coupon_code?: string;

  @IsString()
  @IsOptional()
  shipping_provider?: string;

  @IsOptional()
  shipping_cost?: number;

  @IsString()
  @IsOptional()
  shipping_type?: string;

  @IsString()
  @IsOptional()
  shipping_branch?: string;
}

class ListOrdersQuery {
  @IsString()
  @IsOptional()
  status?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number;
}

class UpdateOrderStatusDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  payment_status?: string;

  @IsString()
  @IsOptional()
  tracking?: string;
}

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly orders: OrdersService,
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateOrderDto) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    return this.orders.createFromCart({ ...dto, tenant_id: tenantId });
  }

  @Post(':subdomain')
  async createPublic(
    @Param('subdomain') subdomain: string,
    @Body() dto: CreateOrderDto,
  ) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(subdomain);
    let tenantId = subdomain;
    if (!isUuid) {
      const { data: tenant } = await this.supabase
        .from('tenants')
        .select('id')
        .eq('subdomain', subdomain)
        .maybeSingle();
      if (!tenant) throw new NotFoundException(`Tienda '${subdomain}' no encontrada`);
      tenantId = tenant.id;
    }
    return this.orders.createFromCart({ ...dto, tenant_id: tenantId });
  }

  @Get()
  @UseGuards(AuthGuard)
  listMyTenant(@Req() req: any, @Query() query: ListOrdersQuery) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    return this.orders.listByTenant(tenantId, query);
  }

  @Get('customer/:email')
  getByEmail(
    @Param('email') email: string,
    @Query('tenant_id') tenantId: string,
  ) {
    return this.orders.findByEmail(email, tenantId);
  }

  @Get('single/:id')
  @UseGuards(AuthGuard)
  getById(@Param('id') id: string) {
    return this.orders.findById(id);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orders.updateStatus(id, dto);
  }

  @Get(':tenantId')
  @UseGuards(AuthGuard)
  listByTenant(
    @Param('tenantId') tenantId: string,
    @Query() query: ListOrdersQuery,
  ) {
    return this.orders.listByTenant(tenantId, query);
  }
}

import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Req, BadRequestException,
} from '@nestjs/common';
import {
  IsString, IsUUID, IsOptional, IsEmail, IsObject, IsInt, Min,
} from 'class-validator';
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
  constructor(private readonly orders: OrdersService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateOrderDto) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
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

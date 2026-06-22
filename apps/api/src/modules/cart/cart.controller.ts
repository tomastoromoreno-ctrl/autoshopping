import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query,
} from '@nestjs/common';
import {
  IsString, IsUUID, IsOptional, IsInt, Min,
} from 'class-validator';
import { CartService } from './cart.service';

class AddItemDto {
  @IsUUID()
  tenant_id: string;

  @IsString()
  session_id: string;

  @IsUUID()
  product_id: string;

  @IsUUID()
  @IsOptional()
  variant_id?: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

class UpdateQuantityDto {
  @IsInt()
  @Min(1)
  quantity: number;
}

class ApplyCouponDto {
  @IsString()
  code: string;
}

@Controller('cart')
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Post()
  addItem(@Body() dto: AddItemDto) {
    return this.cart.addItem(dto);
  }

  @Get(':sessionId')
  getCart(
    @Param('sessionId') sessionId: string,
    @Query('tenant_id') tenantId: string,
  ) {
    return this.cart.getCart(sessionId, tenantId);
  }

  @Patch('items/:itemId')
  updateItemQuantity(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateQuantityDto,
  ) {
    return this.cart.updateItemQuantity(itemId, dto.quantity);
  }

  @Delete('items/:itemId')
  removeItem(@Param('itemId') itemId: string) {
    return this.cart.removeItem(itemId);
  }

  @Delete(':sessionId/clear')
  clearCart(@Param('sessionId') sessionId: string) {
    return this.cart.clearCart(sessionId);
  }

  @Post(':sessionId/apply-coupon')
  applyCoupon(
    @Param('sessionId') sessionId: string,
    @Query('tenant_id') tenantId: string,
    @Body() dto: ApplyCouponDto,
  ) {
    return this.cart.applyCoupon(sessionId, tenantId, dto.code);
  }

  @Delete(':sessionId/coupon')
  removeCoupon(@Param('sessionId') sessionId: string) {
    return this.cart.removeCoupon(sessionId);
  }
}

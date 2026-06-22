import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req, BadRequestException,
} from '@nestjs/common';
import {
  IsString, IsOptional, IsBoolean, IsNumber, IsUUID, IsArray, IsInt, IsIn, Min,
} from 'class-validator';
import { PromotionsService } from './promotions.service';
import { AuthGuard } from '../../common/guards/auth.guard';

class CreatePromotionDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsIn(['percentage', 'fixed'])
  discount_type: 'percentage' | 'fixed';

  @IsNumber()
  discount_value: number;

  @IsNumber()
  @IsOptional()
  min_purchase?: number;

  @IsString()
  starts_at: string;

  @IsString()
  ends_at: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsArray()
  @IsOptional()
  applicable_product_ids?: string[];

  @IsArray()
  @IsOptional()
  applicable_category_ids?: string[];

  @IsInt()
  @IsOptional()
  usage_limit?: number;
}

class UpdatePromotionDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsIn(['percentage', 'fixed'])
  @IsOptional()
  discount_type?: 'percentage' | 'fixed';

  @IsNumber()
  @IsOptional()
  discount_value?: number;

  @IsNumber()
  @IsOptional()
  min_purchase?: number;

  @IsString()
  @IsOptional()
  starts_at?: string;

  @IsString()
  @IsOptional()
  ends_at?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsArray()
  @IsOptional()
  applicable_product_ids?: string[];

  @IsArray()
  @IsOptional()
  applicable_category_ids?: string[];

  @IsInt()
  @IsOptional()
  usage_limit?: number;
}

class ListPromotionsQuery {
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

class CreateCouponDto {
  @IsUUID()
  promotion_id: string;

  @IsString()
  code: string;

  @IsInt()
  @IsOptional()
  max_uses?: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

class UpdateCouponDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsInt()
  @IsOptional()
  max_uses?: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

class ValidateCouponDto {
  @IsString()
  code: string;

  @IsUUID()
  tenant_id: string;

  @IsNumber()
  @Min(0)
  subtotal: number;

  @IsArray()
  product_ids: string[];
}

@Controller()
export class PromotionsController {
  constructor(private readonly promotions: PromotionsService) {}

  @Get('promotions')
  @UseGuards(AuthGuard)
  listMyTenant(@Req() req: any, @Query() query: ListPromotionsQuery) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    return this.promotions.listPromotions(tenantId, query);
  }

  @Post('promotions')
  @UseGuards(AuthGuard)
  createPromotion(@Req() req: any, @Body() dto: CreatePromotionDto) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    return this.promotions.createPromotion({ ...dto, tenant_id: tenantId });
  }

  @Get('promotions/:tenantId')
  listPromotions(
    @Param('tenantId') tenantId: string,
    @Query() query: ListPromotionsQuery,
  ) {
    return this.promotions.listPromotions(tenantId, query);
  }

  @Get('promotions/single/:id')
  getPromotion(@Param('id') id: string) {
    return this.promotions.getPromotion(id);
  }

  @Patch('promotions/:id')
  @UseGuards(AuthGuard)
  updatePromotion(@Param('id') id: string, @Body() dto: UpdatePromotionDto) {
    return this.promotions.updatePromotion(id, dto);
  }

  @Delete('promotions/:id')
  @UseGuards(AuthGuard)
  deletePromotion(@Param('id') id: string) {
    return this.promotions.deletePromotion(id);
  }

  @Post('promotions/:id/toggle')
  @UseGuards(AuthGuard)
  togglePromotion(@Param('id') id: string) {
    return this.promotions.togglePromotion(id);
  }

  @Get('coupons')
  @UseGuards(AuthGuard)
  listMyCoupons(@Req() req: any) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    return this.promotions.listCoupons(tenantId);
  }

  @Post('coupons')
  @UseGuards(AuthGuard)
  createCoupon(@Req() req: any, @Body() dto: CreateCouponDto) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    return this.promotions.createCoupon({ ...dto, tenant_id: tenantId });
  }

  @Get('coupons/:tenantId')
  listCoupons(@Param('tenantId') tenantId: string) {
    return this.promotions.listCoupons(tenantId);
  }

  @Patch('coupons/:id')
  @UseGuards(AuthGuard)
  updateCoupon(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.promotions.updateCoupon(id, dto);
  }

  @Delete('coupons/:id')
  @UseGuards(AuthGuard)
  deleteCoupon(@Param('id') id: string) {
    return this.promotions.deleteCoupon(id);
  }

  @Post('coupons/validate')
  validateCoupon(@Body() dto: ValidateCouponDto) {
    return this.promotions.validateCoupon(dto);
  }

  @Get('promotions/:tenantId/active')
  getActivePromotions(@Param('tenantId') tenantId: string) {
    return this.promotions.getActivePromotions(tenantId);
  }
}

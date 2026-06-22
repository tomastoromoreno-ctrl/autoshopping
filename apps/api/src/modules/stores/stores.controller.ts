import {
  Controller, Get, Patch, Param, Body, UseGuards, Req, BadRequestException,
} from '@nestjs/common';
import {
  IsString, IsOptional, IsBoolean, IsNumber, IsUUID,
} from 'class-validator';
import { StoresService } from './stores.service';
import { AuthGuard } from '../../common/guards/auth.guard';

class UpdateStoreConfigDto {
  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  payment_provider?: string;

  @IsString()
  @IsOptional()
  mercadopago_access_token?: string;

  @IsString()
  @IsOptional()
  mercadopago_public_key?: string;

  @IsString()
  @IsOptional()
  transbank_api_key?: string;

  @IsString()
  @IsOptional()
  transbank_commerce_code?: string;

  @IsBoolean()
  @IsOptional()
  shipping_enabled?: boolean;

  @IsNumber()
  @IsOptional()
  shipping_cost?: number;

  @IsNumber()
  @IsOptional()
  free_shipping_min?: number | null;

  @IsString()
  @IsOptional()
  sales_policy?: string;

  @IsString()
  @IsOptional()
  shipping_policy?: string;
}

class UpdateAppearanceDto {
  @IsString()
  @IsOptional()
  logo_url?: string;

  @IsString()
  @IsOptional()
  favicon_url?: string;

  @IsString()
  @IsOptional()
  primary_color?: string;

  @IsString()
  @IsOptional()
  slogan?: string;

  @IsString()
  @IsOptional()
  name?: string;
}

@Controller('stores')
export class StoresController {
  constructor(private readonly stores: StoresService) {}

  @Get(':tenantId/config')
  @UseGuards(AuthGuard)
  getConfig(@Param('tenantId') tenantId: string) {
    return this.stores.getConfig(tenantId);
  }

  @Patch(':tenantId/config')
  @UseGuards(AuthGuard)
  updateConfig(
    @Param('tenantId') tenantId: string,
    @Body() dto: UpdateStoreConfigDto,
  ) {
    return this.stores.updateConfig(tenantId, dto);
  }

  @Patch(':tenantId/appearance')
  @UseGuards(AuthGuard)
  updateAppearance(
    @Param('tenantId') tenantId: string,
    @Body() dto: UpdateAppearanceDto,
  ) {
    return this.stores.updateAppearance(tenantId, dto);
  }

  @Get(':tenantId/public')
  getPublic(@Param('tenantId') tenantId: string) {
    return this.stores.getPublic(tenantId);
  }
}

@Controller('dashboard')
@UseGuards(AuthGuard)
export class DashboardController {
  constructor(private readonly stores: StoresService) {}

  @Get('stats')
  async getStats(@Req() req: any) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    return this.stores.getDashboardStats(tenantId);
  }
}

@Controller('config')
@UseGuards(AuthGuard)
export class ConfigController {
  constructor(private readonly stores: StoresService) {}

  @Get()
  getConfig(@Req() req: any) {
    const tenantId = req.user.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    return this.stores.getConfig(tenantId);
  }

  @Patch()
  updateConfig(@Req() req: any, @Body() dto: UpdateStoreConfigDto) {
    const tenantId = req.user.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    return this.stores.updateConfig(tenantId, dto);
  }

  @Get('appearance')
  getAppearance(@Req() req: any) {
    const tenantId = req.user.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    return this.stores.getPublic(tenantId); // returns appearance data (name, logo, favicon, color)
  }

  @Patch('appearance')
  updateAppearance(@Req() req: any, @Body() dto: UpdateAppearanceDto) {
    const tenantId = req.user.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    return this.stores.updateAppearance(tenantId, dto);
  }
}

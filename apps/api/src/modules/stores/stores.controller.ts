import {
  Controller, Get, Post, Patch, Param, Body, UseGuards, Req, BadRequestException, Query, Inject, NotFoundException,
} from '@nestjs/common';
import {
  IsString, IsOptional, IsBoolean, IsNumber, IsUUID,
} from 'class-validator';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../common/supabase.module';
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

  @IsString()
  @IsOptional()
  whatsapp_number?: string;

  @IsString()
  @IsOptional()
  whatsapp_message?: string;
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

  @IsString()
  @IsOptional()
  font_family?: string;

  @IsString()
  @IsOptional()
  bg_color?: string;

  @IsString()
  @IsOptional()
  btn_color?: string;

  @IsString()
  @IsOptional()
  btn_text_color?: string;

  @IsString()
  @IsOptional()
  text_color?: string;

  @IsString()
  @IsOptional()
  header_style?: string;

  @IsString()
  @IsOptional()
  footer_style?: string;

  @IsString()
  @IsOptional()
  card_style?: string;

  @IsString()
  @IsOptional()
  social_instagram?: string;

  @IsString()
  @IsOptional()
  social_facebook?: string;

  @IsString()
  @IsOptional()
  social_whatsapp?: string;

  @IsString()
  @IsOptional()
  social_twitter?: string;

  @IsString()
  @IsOptional()
  social_tiktok?: string;

  @IsString()
  @IsOptional()
  color_preset?: string;

  @IsString()
  @IsOptional()
  template_id?: string;
}

@Controller('stores')
export class StoresController {
  constructor(
    private readonly stores: StoresService,
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  private async resolveTenantId(subdomainOrId: string): Promise<string> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(subdomainOrId);
    if (isUuid) return subdomainOrId;
    const { data: tenant } = await this.supabase
      .from('tenants')
      .select('id')
      .eq('subdomain', subdomainOrId)
      .maybeSingle();
    if (!tenant) throw new NotFoundException(`Tienda '${subdomainOrId}' no encontrada`);
    return tenant.id;
  }

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

  @Get(':subdomain/banners')
  async getBanners(@Param('subdomain') subdomain: string) {
    const tenantId = await this.resolveTenantId(subdomain);
    return this.stores.getBanners(tenantId);
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

  @Get('analytics')
  async getAnalytics(@Req() req: any, @Query('days') days?: string) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    return this.stores.getAnalytics(tenantId, days ? parseInt(days) : 30);
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

  @Post('verify-domain')
  async verifyDomain(@Req() req: any, @Body() body: { domain: string }) {
    const tenantId = req.user.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    await this.stores.updateConfig(tenantId, { custom_domain: body.domain } as any);
    return { status: 'verification_started', domain: body.domain };
  }
}

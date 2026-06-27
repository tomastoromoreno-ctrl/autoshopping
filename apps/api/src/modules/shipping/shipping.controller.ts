import {
  Controller, Get, Post, Patch, Param, Body, UseGuards, Req, BadRequestException, NotFoundException, Inject
} from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../common/supabase.module';

import { IsString, IsBoolean, IsOptional, IsNumber, IsArray } from 'class-validator';

class UpdateShippingConfigDto {
  @IsString()
  provider: string;

  @IsBoolean()
  is_enabled: boolean;

  @IsString()
  @IsOptional()
  mode?: string;

  @IsString()
  @IsOptional()
  api_key?: string;

  @IsString()
  @IsOptional()
  api_secret?: string;

  @IsString()
  @IsOptional()
  client_id?: string;

  @IsString()
  @IsOptional()
  origin_region?: string;

  @IsString()
  @IsOptional()
  origin_commune?: string;

  @IsString()
  @IsOptional()
  origin_address?: string;

  @IsNumber()
  @IsOptional()
  flat_rate_cost?: number;
}

class CalculateQuotesDto {
  @IsString()
  destination_region: string;

  @IsString()
  destination_commune: string;

  @IsArray()
  items: Array<{
    product_id: string;
    variant_id?: string;
    quantity: number;
    price: number;
  }>;
}

@Controller('shipping')
export class ShippingController {
  constructor(
    private readonly shippingService: ShippingService,
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  private async resolveTenantId(subdomain: string): Promise<string> {
    const { data: tenant } = await this.supabase
      .from('tenants')
      .select('id')
      .eq('subdomain', subdomain.trim().toLowerCase())
      .maybeSingle();

    if (!tenant) {
      throw new NotFoundException(`Tienda con subdominio '${subdomain}' no encontrada`);
    }
    return tenant.id;
  }

  @Get('config')
  @UseGuards(AuthGuard)
  async getConfig(@Req() req: any) {
    const tenantId = req.user.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    return this.shippingService.getConfig(tenantId);
  }

  @Patch('config')
  @UseGuards(AuthGuard)
  async updateConfig(@Req() req: any, @Body() dto: UpdateShippingConfigDto) {
    const tenantId = req.user.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    return this.shippingService.updateConfig(tenantId, dto);
  }

  @Post('public/:subdomain/quotes')
  async getPublicQuotes(
    @Param('subdomain') subdomain: string,
    @Body() dto: CalculateQuotesDto,
  ) {
    const tenantId = await this.resolveTenantId(subdomain);
    return this.shippingService.calculateQuotes(tenantId, dto.destination_region, dto.destination_commune, dto.items);
  }
}

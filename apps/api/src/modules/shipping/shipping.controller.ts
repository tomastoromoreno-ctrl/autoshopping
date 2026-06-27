import {
  Controller, Get, Post, Patch, Param, Body, UseGuards, Req, BadRequestException, NotFoundException, Inject
} from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../common/supabase.module';

class UpdateShippingConfigDto {
  provider: string;
  is_enabled: boolean;
  api_key?: string;
  api_secret?: string;
  client_id?: string;
  origin_region?: string;
  origin_commune?: string;
  origin_address?: string;
  flat_rate_cost?: number;
}

class CalculateQuotesDto {
  destination_region: string;
  destination_commune: string;
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

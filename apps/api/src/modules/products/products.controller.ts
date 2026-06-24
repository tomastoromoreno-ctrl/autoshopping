import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req, BadRequestException, Inject, NotFoundException,
} from '@nestjs/common';
import {
  IsString, IsOptional, IsBoolean, IsNumber, IsUUID, IsArray, IsObject, IsInt, Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../common/supabase.module';
import { ProductsService } from './products.service';
import { AuthGuard } from '../../common/guards/auth.guard';

class CreateProductDto {
  @IsUUID()
  @IsOptional()
  category_id?: string;

  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  price: number;

  @IsNumber()
  @IsOptional()
  compare_at_price?: number;

  @IsNumber()
  @IsOptional()
  cost_price?: number;

  @IsInt()
  @IsOptional()
  stock?: number;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsArray()
  @IsOptional()
  images?: string[];

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

class UpdateProductDto {
  @IsUUID()
  @IsOptional()
  category_id?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsNumber()
  @IsOptional()
  compare_at_price?: number;

  @IsNumber()
  @IsOptional()
  cost_price?: number;

  @IsInt()
  @IsOptional()
  stock?: number;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsArray()
  @IsOptional()
  images?: string[];

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsBoolean()
  @IsOptional()
  is_featured?: boolean;

  @IsBoolean()
  @IsOptional()
  is_new?: boolean;
}

class CreateVariantDto {
  @IsString()
  name: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsInt()
  @IsOptional()
  stock?: number;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsObject()
  @IsOptional()
  attributes?: Record<string, any>;
}

class UpdateVariantDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsInt()
  @IsOptional()
  stock?: number;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsObject()
  @IsOptional()
  attributes?: Record<string, any>;
}

class ListProductsQuery {
  @IsUUID()
  @IsOptional()
  category_id?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  min_price?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  max_price?: number;

  @Transform(({ value }: { value: string }) => value === 'true' ? true : value === 'false' ? false : undefined)
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsString()
  @IsOptional()
  sort?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number;
}

@Controller('products')
export class ProductsController {
  constructor(
    private readonly products: ProductsService,
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

  @Get()
  @UseGuards(AuthGuard)
  findMyTenant(@Req() req: any, @Query() query: ListProductsQuery) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    return this.products.findByTenant(tenantId, query);
  }

  @Post()
  @UseGuards(AuthGuard)
  create(@Req() req: any, @Body() dto: CreateProductDto) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    return this.products.create({ ...dto, tenant_id: tenantId });
  }

  @Post('bulk')
  @UseGuards(AuthGuard)
  bulkCreate(@Req() req: any, @Body() body: { products: CreateProductDto[] }) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    return this.products.bulkCreate(tenantId, body.products);
  }

  @Get(':subdomain')
  async findByTenant(
    @Param('subdomain') subdomain: string,
    @Query() query: ListProductsQuery,
  ) {
    const tenantId = await this.resolveTenantId(subdomain);
    return this.products.findByTenant(tenantId, query);
  }

  @Get('single/:id')
  findById(@Param('id') id: string) {
    return this.products.findByIdWithVariants(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.products.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  delete(@Param('id') id: string) {
    return this.products.delete(id);
  }

  @Post(':id/variants')
  @UseGuards(AuthGuard)
  addVariant(@Param('id') id: string, @Body() dto: CreateVariantDto) {
    return this.products.addVariant(id, dto);
  }

  @Get(':id/variants')
  getVariants(@Param('id') id: string) {
    return this.products.getVariants(id);
  }

  @Patch('variants/:variantId')
  @UseGuards(AuthGuard)
  updateVariant(@Param('variantId') variantId: string, @Body() dto: UpdateVariantDto) {
    return this.products.updateVariant(variantId, dto);
  }

  @Delete('variants/:variantId')
  @UseGuards(AuthGuard)
  deleteVariant(@Param('variantId') variantId: string) {
    return this.products.deleteVariant(variantId);
  }

  @Get(':subdomain/featured')
  async getFeatured(@Param('subdomain') subdomain: string, @Query('limit') limit?: string) {
    const tenantId = await this.resolveTenantId(subdomain);
    return this.products.getFeatured(tenantId, limit ? parseInt(limit) : 10);
  }

  @Get(':subdomain/new')
  async getNewArrivals(@Param('subdomain') subdomain: string, @Query('limit') limit?: string) {
    const tenantId = await this.resolveTenantId(subdomain);
    return this.products.getNewArrivals(tenantId, limit ? parseInt(limit) : 10);
  }

  @Get(':subdomain/best-sellers')
  async getBestSellers(@Param('subdomain') subdomain: string, @Query('limit') limit?: string) {
    const tenantId = await this.resolveTenantId(subdomain);
    return this.products.getBestSellers(tenantId, limit ? parseInt(limit) : 10);
  }

  @Post(':id/view')
  async trackView(@Param('id') id: string, @Body('visitor_id') visitorId: string) {
    return this.products.trackView(id, visitorId || 'anonymous');
  }

  @Get(':id/stats')
  async getProductStats(@Param('id') id: string) {
    return this.products.getProductStats(id);
  }

  @Get(':id/prev-next')
  async getPrevNext(@Param('id') id: string) {
    return this.products.getPrevNext(id);
  }
}

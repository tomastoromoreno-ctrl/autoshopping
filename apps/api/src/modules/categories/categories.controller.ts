import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req, BadRequestException, Inject, NotFoundException,
} from '@nestjs/common';
import {
  IsString, IsOptional, IsBoolean, IsNumber, IsUUID, IsInt,
} from 'class-validator';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../common/supabase.module';
import { CategoriesService } from './categories.service';
import { AuthGuard } from '../../common/guards/auth.guard';

class CreateCategoryDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsUUID()
  @IsOptional()
  parent_id?: string;

  @IsInt()
  @IsOptional()
  order?: number;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsUUID()
  @IsOptional()
  parent_id?: string;

  @IsInt()
  @IsOptional()
  order?: number;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly categories: CategoriesService,
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
  findMyTenant(@Req() req: any) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    return this.categories.findByTenant(tenantId);
  }

  @Post()
  @UseGuards(AuthGuard)
  create(@Req() req: any, @Body() dto: CreateCategoryDto) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    return this.categories.create({
      tenant_id: tenantId,
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      image_url: dto.image_url,
      parent_id: dto.parent_id,
      sort_order: dto.order,
      is_active: dto.active,
    });
  }

  @Get(':tenantId')
  async findByTenant(
    @Param('tenantId') tenantIdOrSubdomain: string,
    @Query('parent_id') parentId?: string,
  ) {
    const tenantId = await this.resolveTenantId(tenantIdOrSubdomain);
    return this.categories.findByTenant(tenantId, parentId);
  }

  @Get('single/:id')
  findById(@Param('id') id: string) {
    return this.categories.findById(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categories.update(id, {
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      image_url: dto.image_url,
      parent_id: dto.parent_id,
      sort_order: dto.order,
      is_active: dto.active,
    });
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  delete(@Param('id') id: string) {
    return this.categories.delete(id);
  }

  @Get(':tenantId/tree')
  async getTree(@Param('tenantId') tenantIdOrSubdomain: string) {
    const tenantId = await this.resolveTenantId(tenantIdOrSubdomain);
    return this.categories.getTree(tenantId);
  }
}

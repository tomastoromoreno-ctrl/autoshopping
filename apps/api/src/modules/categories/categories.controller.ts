import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req, BadRequestException,
} from '@nestjs/common';
import {
  IsString, IsOptional, IsBoolean, IsNumber, IsUUID, IsInt,
} from 'class-validator';
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
  constructor(private readonly categories: CategoriesService) {}

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
  findByTenant(
    @Param('tenantId') tenantId: string,
    @Query('parent_id') parentId?: string,
  ) {
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
  getTree(@Param('tenantId') tenantId: string) {
    return this.categories.getTree(tenantId);
  }
}

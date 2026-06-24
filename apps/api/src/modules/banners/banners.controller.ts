import {
  Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req, BadRequestException,
} from '@nestjs/common';
import {
  IsString, IsOptional, IsBoolean, IsNumber, IsInt,
} from 'class-validator';
import { BannersService } from './banners.service';
import { AuthGuard } from '../../common/guards/auth.guard';

class CreateBannerDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  subtitle?: string;

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsString()
  @IsOptional()
  link_url?: string;

  @IsString()
  @IsOptional()
  btn_text?: string;

  @IsString()
  @IsOptional()
  bg_color?: string;

  @IsString()
  @IsOptional()
  text_color?: string;

  @IsInt()
  @IsOptional()
  sort_order?: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

class UpdateBannerDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  subtitle?: string;

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsString()
  @IsOptional()
  link_url?: string;

  @IsString()
  @IsOptional()
  btn_text?: string;

  @IsString()
  @IsOptional()
  bg_color?: string;

  @IsString()
  @IsOptional()
  text_color?: string;

  @IsInt()
  @IsOptional()
  sort_order?: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

@Controller('banners')
export class BannersController {
  constructor(private readonly banners: BannersService) {}

  @Get()
  @UseGuards(AuthGuard)
  listMyTenant(@Req() req: any) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    return this.banners.list(tenantId);
  }

  @Post()
  @UseGuards(AuthGuard)
  create(@Req() req: any, @Body() dto: CreateBannerDto) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    return this.banners.create(tenantId, dto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateBannerDto) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    return this.banners.update(id, tenantId, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    return this.banners.delete(id, tenantId);
  }

  @Post(':id/toggle')
  @UseGuards(AuthGuard)
  toggle(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    return this.banners.toggleActive(id, tenantId);
  }
}

import {
  Controller, Get, Post, Patch, Param, Body, UseGuards, Req,
} from '@nestjs/common';
import { IsString, IsOptional, IsUUID } from 'class-validator';
import { TenantsService } from './tenants.service';
import { AuthGuard } from '../../common/guards/auth.guard';

class CreateTenantDto {
  @IsString()
  name: string;

  @IsString()
  subdomain: string;
}

class UpdateTenantDto {
  @IsString()
  @IsOptional()
  name?: string;

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
  subdomain?: string;

  @IsString()
  @IsOptional()
  custom_domain?: string;
}

class SubdomainDto {
  @IsString()
  subdomain: string;
}

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() dto: CreateTenantDto, @Req() req: any) {
    return this.tenants.create({ ...dto, userId: req.user.id });
  }

  @Post('verify-subdomain')
  checkSubdomain(@Body() dto: SubdomainDto) {
    return this.tenants.verifySubdomain(dto.subdomain);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  findById(@Param('id') id: string) {
    return this.tenants.findById(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenants.update(id, dto);
  }

  @Post(':id/verify-subdomain')
  @UseGuards(AuthGuard)
  verifySubdomain(@Body() dto: SubdomainDto) {
    return this.tenants.verifySubdomain(dto.subdomain);
  }
}

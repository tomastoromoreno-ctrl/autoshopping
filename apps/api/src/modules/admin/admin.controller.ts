import {
  Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards,
} from '@nestjs/common';
import { IsString, IsOptional, IsInt, Min, IsIn, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { AdminService } from './admin.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';

class ListTenantsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

class UpdateStatusDto {
  @IsString()
  @IsIn(['active', 'inactive', 'suspended'])
  status: string;
}

class CreateTenantDto {
  @IsString()
  name: string;

  @IsString()
  subdomain: string;

  @IsUUID()
  ownerId: string;
}

class ListAllOrdersDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  tenantId?: string;
}

class ListAllUsersDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  role?: string;
}

class SystemLogsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  days?: number = 7;
}

@Controller('admin')
@UseGuards(AuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  getDashboardStats() {
    return this.admin.getDashboardStats();
  }

  @Get('tenants')
  listTenants(@Query() query: ListTenantsDto) {
    return this.admin.listTenants(
      query.page ?? 1, query.limit ?? 20, query.search, query.status,
    );
  }

  @Post('tenants')
  createTenant(@Body() dto: CreateTenantDto) {
    return this.admin.createTenant(dto.name, dto.subdomain, dto.ownerId);
  }

  @Get('tenants/:id')
  getTenantDetail(@Param('id') id: string) {
    return this.admin.getTenantDetail(id);
  }

  @Patch('tenants/:id/status')
  updateTenantStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.admin.updateTenantStatus(id, dto.status);
  }

  @Delete('tenants/:id')
  deleteTenant(@Param('id') id: string) {
    return this.admin.deleteTenant(id);
  }

  @Get('orders')
  listAllOrders(@Query() query: ListAllOrdersDto) {
    return this.admin.listAllOrders(
      query.page ?? 1, query.limit ?? 20, query.status, query.tenantId,
    );
  }

  @Get('users')
  listAllUsers(@Query() query: ListAllUsersDto) {
    return this.admin.listAllUsers(query.page ?? 1, query.limit ?? 20, query.role);
  }

  @Get('logs')
  getSystemLogs(@Query() query: SystemLogsDto) {
    return this.admin.getSystemLogs(query.days ?? 7);
  }
}

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PublicApiService } from './public-api.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { ApiKeyGuard } from './guards/api-key.guard';

@Controller()
export class PublicApiController {
  constructor(private readonly publicApi: PublicApiService) {}

  @Get('ping')
  ping() {
    return {
      ping: 'pong',
      timestamp: new Date().toISOString(),
      service: 'AutoShopping Public API',
    };
  }

  @Post('me/api-keys')
  @UseGuards(AuthGuard)
  createKey(
    @Req() req: any,
    @Body() dto: { name: string; scopes: string[]; environment?: 'live' | 'sandbox'; expiresDays?: number },
  ) {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    if (!dto.name) throw new BadRequestException('El nombre es requerido');
    return this.publicApi.createKey(tenantId, dto, userId);
  }

  @Get('me/api-keys')
  @UseGuards(AuthGuard)
  listKeys(@Req() req: any) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    return this.publicApi.listKeys(tenantId);
  }

  @Delete('me/api-keys/:id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  revokeKey(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    return this.publicApi.revokeKey(tenantId, id);
  }

  @Get('me/api-keys/:id/usage')
  @UseGuards(AuthGuard)
  getKeyUsage(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    return this.publicApi.getKeyUsage(tenantId, id);
  }

  // Introspection endpoint authenticated by API Key
  @Get('me')
  @UseGuards(ApiKeyGuard)
  getIntrospection(@Req() req: any) {
    const tenantId = req.tenantId;
    const keyId = req.apiKey?.id;
    return this.publicApi.getIntrospection(tenantId, keyId);
  }

  // Core Web Vitals RUM logger
  @Post('internal/performance/vitals/:tenantId')
  logVitals(@Param('tenantId') tenantId: string, @Body() vitals: any) {
    console.log(`[RUM Performance Vitals] Tenant: ${tenantId}`, vitals);
    return { success: true, message: 'Vitals logged' };
  }

  // CDN Cache Invalidation Mock
  @Post('internal/cache/purge')
  @UseGuards(AuthGuard)
  purgeCache(@Req() req: any, @Body() body: { tags?: string[] }) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    const tagsToPurge = body.tags || [`tenant-${tenantId}`];
    console.log(`[Cache Invalidation] Purging CDN cache tags for tenant ${tenantId}:`, tagsToPurge);
    return { success: true, purged_tags: tagsToPurge, timestamp: new Date().toISOString() };
  }
}

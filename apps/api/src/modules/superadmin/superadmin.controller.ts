import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req, ForbiddenException, Headers
} from '@nestjs/common';
import { SuperAdminService } from './superadmin.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { StaffGuard } from '../../common/guards/staff.guard';

@Controller('superadmin')
@UseGuards(AuthGuard, StaffGuard)
export class SuperAdminController {
  constructor(private readonly superadminService: SuperAdminService) {}

  // Helper para verificar rol de super_admin completo
  private enforceSuperAdmin(user: any) {
    if (user.role !== 'super_admin') {
      throw new ForbiddenException('Acceso denegado: Se requiere rol de Super Administrador para esta acción.');
    }
  }

  // MODULE 1 — GLOBAL METRICS
  @Get('stats')
  getGlobalMetrics() {
    return this.superadminService.getGlobalMetrics();
  }

  // MODULE 1 — SEARCH/FILTER TIENDAS
  @Get('tenants')
  listTenants(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('plan') plan?: string,
    @Query('country') country?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.superadminService.listTenants(
      Number(page), Number(limit), search, status, plan, country, dateFrom, dateTo
    );
  }

  // MODULE 7 — NOTAS INTERNAS POR CLIENTE
  @Get('tenants/:id/notes')
  getInternalNotes(@Param('id') id: string) {
    return this.superadminService.getInternalNotes(id);
  }

  @Post('tenants/:id/notes')
  createInternalNote(
    @Req() req: any,
    @Param('id') id: string,
    @Body('content') content: string,
  ) {
    return this.superadminService.createInternalNote(id, req.user.id, content);
  }

  // MODULE 2 — GOD MODE (STORE IMPERSONATION)
  @Post('god-mode/enter')
  enterGodMode(
    @Req() req: any,
    @Body('storeId') storeId: string,
    @Body('reason') reason: string,
  ) {
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    return this.superadminService.enterGodMode(req.user, storeId, reason, ip);
  }

  @Post('god-mode/exit')
  exitGodMode(
    @Req() req: any,
    @Headers('authorization') auth: string,
  ) {
    const token = auth.replace('Bearer ', '');
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    return this.superadminService.exitGodMode(token, req.user.id, ip);
  }

  // MODULE 3 — CLIENT ACCESS MANAGEMENT
  @Post('tenants/:id/password-reset')
  passwordReset(
    @Req() req: any,
    @Param('id') id: string,
    @Body('actionType') actionType: 'email' | 'link',
  ) {
    return this.superadminService.resetPassword(req.user.id, id, actionType);
  }

  @Post('tenants/:id/force-logout')
  forceLogout(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.superadminService.forceLogout(req.user.id, id);
  }

  @Post('tenants/:id/status')
  updateStoreStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body('status') status: 'active' | 'suspended' | 'inactive',
    @Body('reason') reason: string,
    @Body('customMessage') customMessage?: string,
  ) {
    return this.superadminService.updateStoreStatus(req.user.id, id, status, reason, customMessage);
  }

  // Destructive store reset to zero (SUPERADMIN ONLY)
  @Post('tenants/:id/reset')
  resetStoreToZero(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    this.enforceSuperAdmin(req.user);
    return this.superadminService.resetStoreToZero(req.user.id, id);
  }

  // MODULE 4 — SUBSCRIPTION MANAGEMENT
  @Get('tenants/:id/subscription')
  getSubscriptionDetail(@Param('id') id: string) {
    return this.superadminService.getSubscriptionDetail(id);
  }

  // Manual plan upgrade/downgrade (SUPERADMIN ONLY)
  @Patch('tenants/:id/subscription')
  updateSubscription(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    this.enforceSuperAdmin(req.user);
    return this.superadminService.updateSubscription(req.user.id, id, body);
  }

  // Mark payment manually (SUPERADMIN ONLY)
  @Post('tenants/:id/subscription/mark-paid')
  markPaymentAsReceived(
    @Req() req: any,
    @Param('id') id: string,
    @Body('amount') amount: number,
  ) {
    this.enforceSuperAdmin(req.user);
    return this.superadminService.markPaymentAsReceived(req.user.id, id, amount);
  }

  // MODULE 6 — AUDIT LOG VIEWER (SUPERADMIN ONLY)
  @Get('audit-logs')
  getAuditLogs(
    @Req() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Query('storeId') storeId?: string,
    @Query('operatorId') operatorId?: string,
    @Query('actionType') actionType?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    this.enforceSuperAdmin(req.user);
    return this.superadminService.getAuditLogs(
      Number(page), Number(limit), storeId, operatorId, actionType, dateFrom, dateTo
    );
  }

  // MODULE 8 — MULTI-OPERATOR MANAGEMENT (SUPERADMIN ONLY)
  @Get('operators')
  listOperators(@Req() req: any) {
    this.enforceSuperAdmin(req.user);
    return this.superadminService.listOperators();
  }

  @Post('operators')
  inviteOperator(
    @Req() req: any,
    @Body('email') email: string,
    @Body('role') role: 'super_admin' | 'support_agent',
  ) {
    this.enforceSuperAdmin(req.user);
    return this.superadminService.inviteOperator(email, role);
  }

  @Patch('operators/:id')
  toggleOperatorStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body('active') active: boolean,
  ) {
    this.enforceSuperAdmin(req.user);
    return this.superadminService.toggleOperatorStatus(id, active);
  }

  // MODULE 9 — NOTICES SYSTEM
  @Get('tenants/:id/notices')
  getTenantNotices(@Param('id') id: string) {
    return this.superadminService.getTenantNotices(id);
  }

  @Post('tenants/:id/notices')
  createTenantNotice(
    @Req() req: any,
    @Param('id') id: string,
    @Body('message') message: string,
    @Body('type') type: 'info' | 'warning' | 'critical',
  ) {
    return this.superadminService.createTenantNotice(req.user.id, id, message, type);
  }

  @Delete('tenants/:id/notices/:noticeId')
  deleteTenantNotice(
    @Req() req: any,
    @Param('id') id: string,
    @Param('noticeId') noticeId: string,
  ) {
    return this.superadminService.deleteTenantNotice(req.user.id, id, noticeId);
  }

  // MODULE 10 — FEATURE FLAGS
  @Patch('tenants/:id/features')
  updateTenantFeatures(
    @Req() req: any,
    @Param('id') id: string,
    @Body('features') features: any,
  ) {
    return this.superadminService.updateTenantFeatures(req.user.id, id, features);
  }

  // MODULE 11 — HEALTH & RESOURCES
  @Get('tenants/:id/resources')
  getTenantResources(@Param('id') id: string) {
    return this.superadminService.getTenantResources(id);
  }

  @Get('tenants/:id/health')
  getTenantHealth(@Param('id') id: string) {
    return this.superadminService.getTenantHealth(id);
  }
}

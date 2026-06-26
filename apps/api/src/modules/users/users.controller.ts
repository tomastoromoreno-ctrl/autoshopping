import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserInvitationsService } from './user-invitations.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PermissionsGuard, RequirePermission } from '../../common/guards/permissions.guard';

@Controller('users')
@UseGuards(AuthGuard, PermissionsGuard)
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly invitations: UserInvitationsService,
  ) {}

  // ─── User Management ─────────────────────────────────────

  @Get()
  @RequirePermission('users.read')
  getMyTenantUsers(@Req() req: any) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    return this.users.getTenantUsers(tenantId);
  }

  @Get('profile/:userId')
  getProfile(@Param('userId') userId: string) {
    return this.users.getProfile(userId);
  }

  @Patch('profile/:userId')
  updateProfile(@Param('userId') userId: string, @Body() body: { name?: string; avatar_url?: string }) {
    return this.users.updateProfile(userId, body);
  }

  @Get('tenant/:tenantId')
  @RequirePermission('users.read')
  getTenantUsers(@Param('tenantId') tenantId: string) {
    return this.users.getTenantUsers(tenantId);
  }

  @Patch(':userId/role')
  @RequirePermission('users.write')
  changeRole(@Req() req: any, @Param('userId') userId: string, @Body() body: { role: string }) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated');
    return this.users.changeRole(userId, body.role, tenantId, req.user.id);
  }

  @Patch(':userId')
  @RequirePermission('users.write')
  updateUser(@Req() req: any, @Param('userId') userId: string, @Body() body: { role?: string }) {
    const tenantId = req.user?.tenant_id;
    if (body.role) {
      if (!tenantId) throw new BadRequestException('No tenant associated');
      return this.users.changeRole(userId, body.role, tenantId, req.user.id);
    }
    return this.users.getProfile(userId);
  }

  @Delete(':userId')
  @RequirePermission('users.delete')
  deleteUser(@Req() req: any, @Param('userId') userId: string) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated');
    return this.users.deleteUser(userId, tenantId, req.user.id);
  }

  // ─── Invitations ─────────────────────────────────────────

  @Post('invite')
  @RequirePermission('users.write')
  createInvitation(@Req() req: any, @Body() body: { email: string; role: string }) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated');
    return this.invitations.createInvitation(tenantId, body.email, body.role, req.user.id);
  }

  @Get('invitations/list')
  @RequirePermission('users.read')
  listInvitations(@Req() req: any) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated');
    return this.invitations.listInvitations(tenantId);
  }

  @Delete('invitations/:id')
  @RequirePermission('users.write')
  revokeInvitation(@Req() req: any, @Param('id') invitationId: string) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated');
    return this.invitations.revokeInvitation(invitationId, tenantId);
  }

  // ─── Public Invitation Endpoints (token-based) ───────────

  @Get('invitations/verify/:token')
  verifyInvitation(@Param('token') token: string) {
    return this.invitations.getInvitationByToken(token);
  }

  @Post('invitations/:token/accept')
  acceptInvitation(@Req() req: any, @Param('token') token: string) {
    return this.invitations.acceptInvitation(token, req.user.id, req.user.email);
  }
}

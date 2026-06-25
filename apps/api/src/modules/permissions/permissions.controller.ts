import { Controller, Get, Patch, Post, Body, Param, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('permissions')
@UseGuards(AuthGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get('roles')
  getRoles(@Req() req: any) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated');
    return this.permissionsService.getRoles(tenantId);
  }

  @Get('my')
  getMyPermissions(@Req() req: any) {
    const tenantId = req.user?.tenant_id;
    const role = req.user?.role;
    if (!tenantId) throw new BadRequestException('No tenant associated');
    return this.permissionsService.getMyPermissions(tenantId, role);
  }

  @Patch('roles/:role')
  updateRolePermissions(
    @Req() req: any,
    @Param('role') role: string,
    @Body() body: { permissions: Record<string, boolean> },
  ) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated');
    // Only store_owner can modify permissions
    if (req.user?.role !== 'store_owner') {
      throw new BadRequestException('Solo el dueño de la tienda puede modificar permisos');
    }
    return this.permissionsService.updateRolePermissions(tenantId, role, body.permissions);
  }

  @Post('roles/reset')
  resetRolePermissions(@Req() req: any) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated');
    if (req.user?.role !== 'store_owner') {
      throw new BadRequestException('Solo el dueño de la tienda puede resetear permisos');
    }
    return this.permissionsService.resetRolePermissions(tenantId);
  }
}

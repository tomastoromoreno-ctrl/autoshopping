import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SetMetadata } from '@nestjs/common';
import { PermissionsService } from '../../modules/permissions/permissions.service';

export const PERMISSION_KEY = 'required_permission';
export const RequirePermission = (permission: string) =>
  SetMetadata(PERMISSION_KEY, permission);

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<string>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No permission required, allow access
    if (!requiredPermission) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.tenant_id) {
      throw new ForbiddenException('No tiene permisos para esta acción');
    }

    // Super admin and store_owner always have full access
    if (user.role === 'super_admin' || user.role === 'store_owner') {
      return true;
    }

    const hasPermission = await this.permissionsService.hasPermission(
      user.tenant_id,
      user.role,
      requiredPermission,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `No tiene el permiso requerido: ${requiredPermission}`,
      );
    }

    return true;
  }
}

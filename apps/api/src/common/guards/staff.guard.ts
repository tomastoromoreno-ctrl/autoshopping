import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class StaffGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user || (user.role !== 'super_admin' && user.role !== 'support_agent')) {
      throw new ForbiddenException('Super admin or Support Agent role required');
    }
    return true;
  }
}

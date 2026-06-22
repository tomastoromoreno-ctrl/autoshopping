import { Controller, Get, Patch, Delete, Body, Param, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
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
  getTenantUsers(@Param('tenantId') tenantId: string) {
    return this.users.getTenantUsers(tenantId);
  }

  @Patch(':userId/role')
  changeRole(@Param('userId') userId: string, @Body() body: { role: string }) {
    return this.users.changeRole(userId, body.role);
  }

  @Patch(':userId')
  updateUser(@Param('userId') userId: string, @Body() body: { role?: string }) {
    if (body.role) return this.users.changeRole(userId, body.role);
    return this.users.getProfile(userId);
  }

  @Delete(':userId')
  deleteUser(@Param('userId') userId: string) {
    return this.users.deleteUser(userId);
  }
}

import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { BackupsService } from './backups.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('backups')
@UseGuards(AuthGuard)
export class BackupsController {
  constructor(private readonly backupsService: BackupsService) {}

  @Get()
  listBackups(@Req() req: any) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated');
    return this.backupsService.listBackups(tenantId);
  }

  @Post('create')
  createBackup(@Req() req: any) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated');
    return this.backupsService.createBackup(tenantId, 'manual');
  }

  @Get(':id/download')
  downloadBackup(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated');
    return this.backupsService.downloadBackup(tenantId, id);
  }

  @Post('restore')
  restoreBackup(@Req() req: any, @Body() body: { backup_data: any }) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated');
    return this.backupsService.restoreBackup(tenantId, body.backup_data);
  }

  @Get('config')
  getConfig(@Req() req: any) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated');
    return this.backupsService.getConfig(tenantId);
  }

  @Patch('config')
  updateConfig(@Req() req: any, @Body() body: {
    auto_backup_enabled?: boolean;
    frequency?: string;
    retention_days?: number;
    include_images?: boolean;
  }) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated');
    return this.backupsService.updateConfig(tenantId, body);
  }
}

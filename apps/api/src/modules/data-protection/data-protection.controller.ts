import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { DataProtectionService } from './data-protection.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('data-protection')
export class DataProtectionController {
  constructor(private readonly service: DataProtectionService) {}

  // ======== Processing Activities ========
  @Get('activities')
  @UseGuards(AuthGuard)
  async listActivities(@Request() req: any) {
    return this.service.listActivities(req.user.tenant_id);
  }

  @Post('activities')
  @UseGuards(AuthGuard)
  async createActivity(@Request() req: any, @Body() dto: any) {
    return this.service.createActivity(req.user.tenant_id, dto);
  }

  @Patch('activities/:id')
  @UseGuards(AuthGuard)
  async updateActivity(@Param('id') id: string, @Request() req: any, @Body() dto: any) {
    return this.service.updateActivity(id, req.user.tenant_id, dto);
  }

  @Delete('activities/:id')
  @UseGuards(AuthGuard)
  async deleteActivity(@Param('id') id: string, @Request() req: any) {
    return this.service.deleteActivity(id, req.user.tenant_id);
  }

  // ======== Data Breaches ========
  @Get('breaches')
  @UseGuards(AuthGuard)
  async listBreaches(@Request() req: any) {
    return this.service.listBreaches(req.user.tenant_id);
  }

  @Post('breaches')
  @UseGuards(AuthGuard)
  async createBreach(@Request() req: any, @Body() dto: any) {
    return this.service.createBreach(req.user.tenant_id, dto);
  }

  @Get('breaches/:id')
  @UseGuards(AuthGuard)
  async getBreach(@Param('id') id: string, @Request() req: any) {
    return this.service.getBreach(id, req.user.tenant_id);
  }

  @Patch('breaches/:id')
  @UseGuards(AuthGuard)
  async updateBreach(@Param('id') id: string, @Request() req: any, @Body() dto: any) {
    return this.service.updateBreach(id, req.user.tenant_id, dto);
  }

  // ======== DPO ========
  @Get('dpo')
  @UseGuards(AuthGuard)
  async getDpo(@Request() req: any) {
    return this.service.getDpo(req.user.tenant_id);
  }

  @Post('dpo')
  @UseGuards(AuthGuard)
  async upsertDpo(@Request() req: any, @Body() dto: any) {
    return this.service.upsertDpo(req.user.tenant_id, dto);
  }

  @Delete('dpo')
  @UseGuards(AuthGuard)
  async deleteDpo(@Request() req: any) {
    return this.service.deleteDpo(req.user.tenant_id);
  }

  // ======== Processor Contracts ========
  @Get('processors')
  @UseGuards(AuthGuard)
  async listProcessors(@Request() req: any) {
    return this.service.listProcessors(req.user.tenant_id);
  }

  @Post('processors')
  @UseGuards(AuthGuard)
  async createProcessor(@Request() req: any, @Body() dto: any) {
    return this.service.createProcessor(req.user.tenant_id, dto);
  }

  @Patch('processors/:id')
  @UseGuards(AuthGuard)
  async updateProcessor(@Param('id') id: string, @Request() req: any, @Body() dto: any) {
    return this.service.updateProcessor(id, req.user.tenant_id, dto);
  }

  @Delete('processors/:id')
  @UseGuards(AuthGuard)
  async deleteProcessor(@Param('id') id: string, @Request() req: any) {
    return this.service.deleteProcessor(id, req.user.tenant_id);
  }

  // ======== DPIA ========
  @Post('dpia')
  @UseGuards(AuthGuard)
  async completeDpia(@Request() req: any, @Body() dto: any) {
    return this.service.completeDpia(req.user.tenant_id, dto);
  }
}

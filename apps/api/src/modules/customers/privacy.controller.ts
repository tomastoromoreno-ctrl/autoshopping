import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { PrivacyService } from './privacy.service';
import { CustomerGuard } from './customers.guard';

@Controller('customers')
export class PrivacyController {
  constructor(private readonly privacyService: PrivacyService) {}

  @Post('consent')
  @UseGuards(CustomerGuard)
  async recordConsent(
    @Req() req: any,
    @Body() body: { consent_type: string; granted: boolean },
  ) {
    return this.privacyService.recordConsent(
      req.customer.id,
      req.customer.tenant_id,
      body.consent_type,
      body.granted,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Get('consent')
  @UseGuards(CustomerGuard)
  async getConsentRecords(@Req() req: any) {
    return this.privacyService.getConsentRecords(req.customer.id, req.customer.tenant_id);
  }

  @Get('data-export')
  @UseGuards(CustomerGuard)
  async exportData(@Req() req: any) {
    return this.privacyService.exportData(req.customer.id, req.customer.tenant_id);
  }

  @Post('data-deletion')
  @UseGuards(CustomerGuard)
  async requestDataDeletion(@Req() req: any) {
    return this.privacyService.requestDataDeletion(
      req.customer.id,
      req.customer.tenant_id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  // ==================== LEY 21.719 - NUEVOS DERECHOS ====================

  @Get('portability')
  @UseGuards(CustomerGuard)
  async portability(@Req() req: any) {
    return this.privacyService.portability(req.customer.id, req.customer.tenant_id);
  }

  @Post('blocking')
  @UseGuards(CustomerGuard)
  async blocking(@Req() req: any, @Body() body: { reason: string }) {
    return this.privacyService.blocking(req.customer.id, req.customer.tenant_id, body.reason);
  }

  @Post('unblock')
  @UseGuards(CustomerGuard)
  async unblock(@Req() req: any) {
    return this.privacyService.unblock(req.customer.id, req.customer.tenant_id);
  }

  @Post('opposition')
  @UseGuards(CustomerGuard)
  async opposition(
    @Req() req: any,
    @Body() body: { marketing?: boolean; profiling?: boolean; other?: string },
  ) {
    return this.privacyService.opposition(req.customer.id, req.customer.tenant_id, body);
  }

  @Get('subject-requests')
  @UseGuards(CustomerGuard)
  async getSubjectRequests(@Req() req: any) {
    return this.privacyService.getSubjectRequests(req.customer.id, req.customer.tenant_id);
  }
}

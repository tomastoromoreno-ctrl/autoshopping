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
}

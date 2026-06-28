import { Controller, Get, Post, Body, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { BillingService } from './billing.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('billing')
@UseGuards(AuthGuard)
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  private getTenantId(req: any): string {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      throw new BadRequestException('No existe una tienda asociada a este usuario.');
    }
    return tenantId;
  }

  @Get('subscription')
  getSubscription(@Req() req: any) {
    const tenantId = this.getTenantId(req);
    return this.billing.getSubscription(tenantId);
  }

  @Post('subscription/change-payment-method')
  changePaymentMethod(@Req() req: any) {
    const tenantId = this.getTenantId(req);
    return this.billing.changePaymentMethod(tenantId);
  }

  @Post('subscription/upgrade-plan')
  upgradePlan(
    @Req() req: any,
    @Body('planName') planName: string,
  ) {
    const tenantId = this.getTenantId(req);
    if (!planName) throw new BadRequestException('Plan name is required');
    return this.billing.upgradePlan(tenantId, planName);
  }

  @Post('subscription/cancel')
  cancelSubscription(@Req() req: any) {
    const tenantId = this.getTenantId(req);
    return this.billing.cancelSubscription(tenantId);
  }
}

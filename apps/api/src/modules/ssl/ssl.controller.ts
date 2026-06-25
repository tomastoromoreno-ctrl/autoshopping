import { Controller, Get, Post, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { SslService } from './ssl.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('ssl')
@UseGuards(AuthGuard)
export class SslController {
  constructor(private readonly sslService: SslService) {}

  @Get('status')
  getStatus(@Req() req: any) {
    return this.sslService.getStatus(req.user.tenant_id);
  }

  @Post('request')
  requestCertificate(@Req() req: any, @Body() body: { domain: string }) {
    return this.sslService.requestCertificate(req.user.tenant_id, body.domain);
  }

  @Post('verify')
  verifyCertificate(@Req() req: any) {
    return this.sslService.verifyCertificate(req.user.tenant_id);
  }

  @Patch('auto-renew')
  toggleAutoRenew(@Req() req: any, @Body() body: { auto_renew: boolean }) {
    return this.sslService.toggleAutoRenew(req.user.tenant_id, body.auto_renew);
  }
}

import { Controller, Get, Post, Body, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { InvoicingService } from './invoicing.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('invoicing')
@UseGuards(AuthGuard)
export class InvoicingController {
  constructor(private readonly invoicing: InvoicingService) {}

  @Get()
  list(@Req() req: any) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated');
    return this.invoicing.listInvoices(tenantId);
  }

  @Post('generate')
  generate(@Req() req: any, @Body() body: { order_id: string }) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated');
    return this.invoicing.generateInvoice(tenantId, body.order_id);
  }
}

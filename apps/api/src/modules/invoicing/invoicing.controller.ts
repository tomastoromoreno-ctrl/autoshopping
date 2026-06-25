import { Controller, Get, Post, Patch, Body, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { InvoicingService } from './invoicing.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('invoicing')
@UseGuards(AuthGuard)
export class InvoicingController {
  constructor(private readonly invoicingService: InvoicingService) {}

  @Get()
  listInvoices(@Req() req: any) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated');
    return this.invoicingService.listInvoices(tenantId);
  }

  @Get('config')
  getConfig(@Req() req: any) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated');
    return this.invoicingService.getConfig(tenantId);
  }

  @Patch('config')
  updateConfig(@Req() req: any, @Body() body: {
    razon_social?: string;
    rut_empresa?: string;
    giro?: string;
    direccion?: string;
    comuna?: string;
    ciudad?: string;
    actividad_economica?: string;
    sii_environment?: string;
    folio_start?: number;
    auto_generate_boleta?: boolean;
    auto_generate_factura?: boolean;
  }) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated');
    return this.invoicingService.updateConfig(tenantId, body);
  }

  @Post('generate')
  generateInvoice(@Req() req: any, @Body() body: { order_id: string }) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated');
    return this.invoicingService.generateInvoice(tenantId, body.order_id);
  }
}

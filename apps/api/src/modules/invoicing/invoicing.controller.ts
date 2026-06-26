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
    sii_invoicing_enabled?: boolean;
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

  @Post('certificate')
  async uploadCertificate(
    @Req() req: any,
    @Body() body: { certificate_base64: string; filename: string; password?: string },
  ) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated');
    if (!body.certificate_base64) throw new BadRequestException('No certificate file provided');
    return this.invoicingService.uploadCertificate(tenantId, body.certificate_base64, body.filename, body.password);
  }

  @Post('caf')
  async uploadCaf(@Req() req: any, @Body() body: { xml_content: string }) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated');
    if (!body.xml_content) throw new BadRequestException('No XML content provided');
    return this.invoicingService.uploadCaf(tenantId, body.xml_content);
  }

  @Get('cafs')
  listCafs(@Req() req: any) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated');
    return this.invoicingService.listCafs(tenantId);
  }
}

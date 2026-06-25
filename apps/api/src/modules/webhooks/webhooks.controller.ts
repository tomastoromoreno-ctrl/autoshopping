import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooks: WebhooksService) {}

  // ==========================================
  // INBOUND GATEWAY WEBHOOKS (Public)
  // ==========================================

  @Post('mercadopago')
  mercadopago(@Body() body: any) {
    return this.webhooks.handleMercadoPago(body);
  }

  @Post('transbank')
  transbank(@Body('token_ws') tokenWs: string) {
    return this.webhooks.handleTransbank(tokenWs);
  }

  // ==========================================
  // OUTBOUND WEBHOOKS MANAGEMENT (AuthGuard)
  // ==========================================

  @Get()
  @UseGuards(AuthGuard)
  listEndpoints(@Req() req: any) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    return this.webhooks.listEndpoints(tenantId);
  }

  @Post()
  @UseGuards(AuthGuard)
  createEndpoint(
    @Req() req: any,
    @Body() dto: { url: string; description?: string; events: string[] },
  ) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    if (!dto.url) throw new BadRequestException('URL es requerida');
    return this.webhooks.createEndpoint(tenantId, dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  updateEndpoint(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: { url?: string; description?: string; events?: string[]; is_active?: boolean },
  ) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    return this.webhooks.updateEndpoint(tenantId, id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  deleteEndpoint(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    return this.webhooks.deleteEndpoint(tenantId, id);
  }

  @Post(':id/test')
  @UseGuards(AuthGuard)
  testEndpoint(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    return this.webhooks.testEndpoint(tenantId, id);
  }

  @Get(':id/deliveries')
  @UseGuards(AuthGuard)
  getEndpointDeliveries(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    return this.webhooks.getEndpointDeliveries(tenantId, id);
  }

  @Get('deliveries/:deliveryId')
  @UseGuards(AuthGuard)
  getDeliveryDetails(@Req() req: any, @Param('deliveryId') deliveryId: string) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    return this.webhooks.getDeliveryDetails(tenantId, deliveryId);
  }

  @Post('deliveries/:id/retry')
  @UseGuards(AuthGuard)
  retryDelivery(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    return this.webhooks.retryDelivery(tenantId, id);
  }

  // Catalog of webhook events
  @Get('events/catalog')
  getEventsCatalog() {
    return {
      'order.created': 'Nuevo pedido recibido',
      'order.paid': 'Pago confirmado',
      'product.created': 'Nuevo producto publicado',
      'product.updated': 'Producto actualizado',
      'product.deleted': 'Producto eliminado',
      'product.out_of_stock': 'Producto sin stock',
      'customer.created': 'Nuevo cliente registrado',
    };
  }
}

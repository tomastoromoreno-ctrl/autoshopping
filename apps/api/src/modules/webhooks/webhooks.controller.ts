import { Controller, Post, Body } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooks: WebhooksService) {}

  @Post('mercadopago')
  mercadopago(@Body() body: any) {
    return this.webhooks.handleMercadoPago(body);
  }

  @Post('transbank')
  transbank(@Body('token_ws') tokenWs: string) {
    return this.webhooks.handleTransbank(tokenWs);
  }
}

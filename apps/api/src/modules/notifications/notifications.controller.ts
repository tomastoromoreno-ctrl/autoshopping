import { Controller, Get, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { EmailService } from './email.service';
import { WhatsAppService } from './whatsapp.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly email: EmailService, private readonly whatsapp: WhatsAppService) {}

  @Post('email/order-confirmation')
  async sendOrderConfirmation(
    @Body() body: {
      orderId: string;
      customerName: string;
      customerEmail: string;
      items: { name: string; quantity: number; price: number }[];
      subtotal: number;
      shippingCost: number;
      discount: number;
      total: number;
      storeName: string;
      storeUrl: string;
    },
  ) {
    if (!body.orderId || !body.customerEmail) {
      throw new BadRequestException('orderId and customerEmail are required');
    }
    return this.email.sendOrderConfirmation(body);
  }

  @Post('email/order-shipped')
  async sendOrderShipped(
    @Body() body: {
      orderId: string;
      customerName: string;
      customerEmail: string;
      tracking?: string;
      storeName: string;
      storeUrl: string;
    },
  ) {
    if (!body.orderId || !body.customerEmail) {
      throw new BadRequestException('orderId and customerEmail are required');
    }
    return this.email.sendOrderShipped(body);
  }

  @Post('email/welcome')
  async sendWelcome(
    @Body() body: { name: string; email: string; storeName: string },
  ) {
    if (!body.email || !body.name) {
      throw new BadRequestException('email and name are required');
    }
    return this.email.sendWelcome(body.name, body.email, body.storeName);
  }

  @Get('whatsapp/templates')
  getTemplates() {
    return this.whatsapp.getTemplates();
  }

  @Post('whatsapp/send')
  sendWhatsApp(@Body() body: { phone: string; message: string }) {
    return this.whatsapp.sendOrderUpdate(body.phone, body.message);
  }
}

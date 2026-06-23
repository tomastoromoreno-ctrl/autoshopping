import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { EmailService } from './email.service';
import { WhatsAppService } from './whatsapp.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly email: EmailService, private readonly whatsapp: WhatsAppService) {}

  @Post('email/order-confirmation')
  sendOrderConfirmation(@Body() body: any) {
    return this.email.sendOrderConfirmation(body);
  }

  @Post('email/order-shipped')
  sendOrderShipped(@Body() body: any) {
    return this.email.sendOrderShipped(body);
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

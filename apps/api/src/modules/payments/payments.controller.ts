import {
  Controller, Get, Post, Param, Body, UseGuards,
} from '@nestjs/common';
import {
  IsString, IsUUID, IsIn,
} from 'class-validator';
import { PaymentsService } from './payments.service';
import { AuthGuard } from '../../common/guards/auth.guard';

class CreatePreferenceDto {
  @IsUUID()
  order_id: string;

  @IsUUID()
  tenant_id: string;

  @IsString()
  @IsIn(['mercadopago', 'transbank'])
  payment_provider: 'mercadopago' | 'transbank';
}

class ConfirmPaymentDto {
  @IsUUID()
  order_id: string;

  @IsString()
  payment_id: string;

  @IsString()
  payment_status: string;
}

@Controller('payments')
@UseGuards(AuthGuard)
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('create')
  create(@Body() dto: CreatePreferenceDto) {
    return this.payments.createPreference(dto);
  }

  @Post('confirm')
  confirm(@Body() dto: ConfirmPaymentDto) {
    return this.payments.confirmPayment(dto);
  }

  @Get(':orderId/status')
  status(@Param('orderId') orderId: string) {
    return this.payments.getPaymentStatus(orderId);
  }
}

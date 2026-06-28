import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomerGuard } from './customers.guard';
import { RegisterDto, LoginDto, UpdateProfileDto } from './customers.dto';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Post(':subdomain/register')
  async register(@Param('subdomain') subdomain: string, @Body() dto: RegisterDto) {
    return this.customers.register(subdomain, dto);
  }

  @Post(':subdomain/login')
  async login(@Param('subdomain') subdomain: string, @Body() dto: LoginDto) {
    return this.customers.login(subdomain, dto);
  }

  @Get('profile')
  @UseGuards(CustomerGuard)
  async getProfile(@Request() req: any) {
    return this.customers.getProfile(req.customer.id);
  }

  @Patch('profile')
  @UseGuards(CustomerGuard)
  async updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    return this.customers.updateProfile(req.customer.id, dto);
  }

  @Get('orders')
  @UseGuards(CustomerGuard)
  async getOrders(@Request() req: any) {
    return this.customers.getOrders(req.customer.id, req.customer.tenant_id);
  }

  @Get('orders/:orderId')
  @UseGuards(CustomerGuard)
  async getOrderDetail(@Request() req: any, @Param('orderId') orderId: string) {
    return this.customers.getOrderDetail(req.customer.id, orderId, req.customer.tenant_id);
  }
}

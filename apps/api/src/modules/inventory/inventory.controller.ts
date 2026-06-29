import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { InventoryService } from './inventory.service';
import {
  CreateStockMovementDto,
  CreateSupplierDto,
  UpdateSupplierDto,
  CreatePurchaseOrderDto,
  ReceivePurchaseOrderDto,
  CreateStockAlertDto,
  UpdateInventoryConfigDto,
} from './dto/inventory.dto';

@Controller('inventory')
@UseGuards(AuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  private getTenantId(req: any): string {
    return req.user?.tenant_id;
  }

  private getUserId(req: any): string | undefined {
    return req.user?.id;
  }

  @Get('dashboard')
  getDashboard(@Req() req: any) {
    return this.inventoryService.getDashboard(this.getTenantId(req));
  }

  @Get('stock')
  getStock(
    @Req() req: any,
    @Query('search') search?: string,
    @Query('category_id') category_id?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventoryService.getStock(this.getTenantId(req), {
      search, category_id, status,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get('movements')
  getMovements(
    @Req() req: any,
    @Query('type') type?: string,
    @Query('product_id') product_id?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventoryService.getMovements(this.getTenantId(req), {
      type, product_id, from, to,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Post('movements')
  createMovement(@Req() req: any, @Body() dto: CreateStockMovementDto) {
    return this.inventoryService.createMovement(this.getTenantId(req), dto, this.getUserId(req));
  }

  @Get('suppliers')
  getSuppliers(@Req() req: any) {
    return this.inventoryService.getSuppliers(this.getTenantId(req));
  }

  @Post('suppliers')
  createSupplier(@Req() req: any, @Body() dto: CreateSupplierDto) {
    return this.inventoryService.createSupplier(this.getTenantId(req), dto);
  }

  @Patch('suppliers/:id')
  updateSupplier(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.inventoryService.updateSupplier(this.getTenantId(req), id, dto);
  }

  @Delete('suppliers/:id')
  deleteSupplier(@Req() req: any, @Param('id') id: string) {
    return this.inventoryService.deleteSupplier(this.getTenantId(req), id);
  }

  @Get('purchase-orders')
  getPurchaseOrders(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventoryService.getPurchaseOrders(this.getTenantId(req), {
      status,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get('purchase-orders/:id')
  getPurchaseOrder(@Req() req: any, @Param('id') id: string) {
    return this.inventoryService.getPurchaseOrder(this.getTenantId(req), id);
  }

  @Post('purchase-orders')
  createPurchaseOrder(@Req() req: any, @Body() dto: CreatePurchaseOrderDto) {
    return this.inventoryService.createPurchaseOrder(this.getTenantId(req), dto, this.getUserId(req));
  }

  @Patch('purchase-orders/:id/status')
  updatePurchaseOrderStatus(@Req() req: any, @Param('id') id: string, @Body('status') status: string) {
    return this.inventoryService.updatePurchaseOrderStatus(this.getTenantId(req), id, status);
  }

  @Post('purchase-orders/:id/receive')
  receivePurchaseOrder(@Req() req: any, @Param('id') id: string, @Body() dto: ReceivePurchaseOrderDto) {
    return this.inventoryService.receivePurchaseOrder(this.getTenantId(req), id, dto);
  }

  @Get('alerts')
  getStockAlerts(@Req() req: any) {
    return this.inventoryService.getStockAlerts(this.getTenantId(req));
  }

  @Post('alerts')
  createStockAlert(@Req() req: any, @Body() dto: CreateStockAlertDto) {
    return this.inventoryService.createStockAlert(this.getTenantId(req), dto);
  }

  @Delete('alerts/:id')
  deleteStockAlert(@Req() req: any, @Param('id') id: string) {
    return this.inventoryService.deleteStockAlert(this.getTenantId(req), id);
  }

  @Get('config')
  getConfig(@Req() req: any) {
    return this.inventoryService.getConfig(this.getTenantId(req));
  }

  @Patch('config')
  updateConfig(@Req() req: any, @Body() dto: UpdateInventoryConfigDto) {
    return this.inventoryService.updateConfig(this.getTenantId(req), dto);
  }
}

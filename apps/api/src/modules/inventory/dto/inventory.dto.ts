import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum, IsUUID, Min } from 'class-validator';

export class CreateStockMovementDto {
  @IsUUID() product_id: string;
  @IsOptional() @IsUUID() variant_id?: string;
  @IsEnum(['purchase', 'sale', 'adjustment', 'return', 'transfer', 'damage', 'expired']) type: string;
  @IsNumber() quantity: number;
  @IsOptional() @IsString() reference_id?: string;
  @IsOptional() @IsString() reference_type?: string;
  @IsOptional() @IsString() notes?: string;
}

export class CreateSupplierDto {
  @IsString() name: string;
  @IsOptional() @IsString() contact_name?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateSupplierDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() contact_name?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsBoolean() is_active?: boolean;
}

export class CreatePurchaseOrderDto {
  @IsOptional() @IsUUID() supplier_id?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() expected_date?: string;
  items: { product_id: string; variant_id?: string; quantity: number; unit_cost: number }[];
}

export class ReceivePurchaseOrderDto {
  items: { product_id: string; variant_id?: string; received_quantity: number }[];
}

export class CreateStockAlertDto {
  @IsUUID() product_id: string;
  @IsOptional() @IsUUID() variant_id?: string;
  @IsNumber() @Min(1) threshold: number;
}

export class UpdateInventoryConfigDto {
  @IsOptional() @IsNumber() low_stock_threshold?: number;
  @IsOptional() @IsBoolean() enable_stock_alerts?: boolean;
  @IsOptional() @IsBoolean() enable_negative_stock?: boolean;
  @IsOptional() @IsBoolean() auto_decrement_on_order?: boolean;
}

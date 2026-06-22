export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  STORE_OWNER = 'store_owner',
  CUSTOMER = 'customer',
}

export enum StoreStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export enum PaymentProvider {
  MERCADOPAGO = 'mercadopago',
  TRANSBANK = 'transbank',
}

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum Currency {
  CLP = 'CLP',
  ARS = 'ARS',
  USD = 'USD',
}

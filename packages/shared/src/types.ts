import { Currency, DiscountType, OrderStatus, PaymentProvider, StoreStatus, UserRole } from './enums';

export interface Tenant {
  id: string;
  subdomain: string;
  custom_domain: string | null;
  name: string;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  status: StoreStatus;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenant_id: string | null;
  email_confirmed: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoreConfig {
  id: string;
  tenant_id: string;
  currency: Currency;
  payment_provider: PaymentProvider;
  mercadopago_access_token: string | null;
  mercadopago_public_key: string | null;
  transbank_api_key: string | null;
  transbank_commerce_code: string | null;
  shipping_enabled: boolean;
  shipping_cost: number;
  free_shipping_min: number | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  tenant_id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  stock: number;
  sku: string | null;
  images: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  price: number;
  stock: number;
  sku: string | null;
  attributes: Record<string, string>;
}

export interface Promotion {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  min_purchase: number | null;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  applicable_product_ids: string[] | null;
  applicable_category_ids: string[] | null;
  usage_limit: number | null;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface Cart {
  id: string;
  tenant_id: string;
  user_id: string | null;
  session_id: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping_cost: number;
  total: number;
  coupon_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Order {
  id: string;
  tenant_id: string;
  user_id: string | null;
  session_id: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping_cost: number;
  total: number;
  status: OrderStatus;
  payment_provider: PaymentProvider;
  payment_id: string | null;
  payment_status: string | null;
  coupon_code: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_address: Address | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Address {
  street: string;
  number: string;
  complement: string | null;
  city: string;
  region: string;
  zip_code: string;
  country: string;
}

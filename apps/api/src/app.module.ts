import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { UsersModule } from './modules/users/users.module';
import { StoresModule } from './modules/stores/stores.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { CartModule } from './modules/cart/cart.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { AdminModule } from './modules/admin/admin.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { BlogModule } from './modules/blog/blog.module';
import { InvoicingModule } from './modules/invoicing/invoicing.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { BannersModule } from './modules/banners/banners.module';
import { UploadModule } from './modules/upload/upload.module';
import { SupabaseModule } from './common/supabase.module';
import { SslModule } from './modules/ssl/ssl.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { LegalModule } from './modules/legal/legal.module';
import { BackupsModule } from './modules/backups/backups.module';
import { PublicApiModule } from './modules/public-api/public-api.module';
import { InternationalizationModule } from './modules/internationalization/internationalization.module';
import { ShippingModule } from './modules/shipping/shipping.module';
import { SuperAdminModule } from './modules/superadmin/superadmin.module';
import { BillingModule } from './modules/billing/billing.module';
import { CustomersModule } from './modules/customers/customers.module';
import { InventoryModule } from './modules/inventory/inventory.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    AuthModule,
    TenantsModule,
    UsersModule,
    StoresModule,
    CategoriesModule,
    ProductsModule,
    PromotionsModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    WebhooksModule,
    AdminModule,
    NotificationsModule,
    BlogModule,
    InvoicingModule,
    ReviewsModule,
    BannersModule,
    UploadModule,
    SslModule,
    PermissionsModule,
    LegalModule,
    BackupsModule,
    PublicApiModule,
    InternationalizationModule,
    ShippingModule,
    SuperAdminModule,
    BillingModule,
    CustomersModule,
    InventoryModule,
  ],
})
export class AppModule {}

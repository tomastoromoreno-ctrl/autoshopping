import { Injectable, Inject, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../common/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../notifications/email.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class SuperAdminService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  // Helper para registrar en AuditLog
  async logAction(
    operatorId: string,
    storeId: string | null,
    actionType: string,
    reason: string | null = null,
    notes: string | null = null,
    ipAddress: string | null = null,
    metadata: any = null,
  ) {
    try {
      await this.supabase.from('audit_logs').insert({
        operator_id: operatorId,
        store_id: storeId,
        action_type: actionType,
        reason,
        notes,
        ip_address: ipAddress,
        metadata: metadata ? JSON.stringify(metadata) : null,
      });
    } catch (e) {
      console.error('Error logging audit action:', e.message);
    }
  }

  // MODULE 1 — GLOBAL METRICS
  async getGlobalMetrics() {
    // Total stores (tenants)
    const { count: totalTenants } = await this.supabase
      .from('tenants')
      .select('*', { count: 'exact', head: true });

    // Suspended stores
    const { count: suspendedTenants } = await this.supabase
      .from('tenants')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'suspended');

    // Trial stores
    const { count: trialTenants } = await this.supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'trial');

    // Active stores
    const { count: activeTenants } = await this.supabase
      .from('tenants')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Monthly Recurring Revenue (MRR) - Sum of active subscription prices
    const { data: mrrData } = await this.supabase
      .from('subscriptions')
      .select('price')
      .eq('status', 'active');

    const mrr = (mrrData || []).reduce((sum, sub) => sum + Number(sub.price || 0), 0);

    // New signups this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: newSignups } = await this.supabase
      .from('tenants')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString());

    // Legacy Stats Integration
    const { count: totalUsers } = await this.supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: totalOrders } = await this.supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    const { data: revenueData } = await this.supabase
      .from('orders')
      .select('total')
      .not('status', 'in', '("cancelled","pending")');

    const totalRevenue = (revenueData || []).reduce(
      (sum, row) => sum + Number(row.total || 0), 0,
    );

    const { data: recentOrders } = await this.supabase
      .from('orders')
      .select('*, tenants!inner(name)')
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: ordersByStatus } = await this.supabase
      .from('orders')
      .select('status');

    const orders_by_status: Record<string, number> = {};
    if (ordersByStatus) {
      for (const row of ordersByStatus) {
        const s = (row as any).status || 'unknown';
        orders_by_status[s] = (orders_by_status[s] || 0) + 1;
      }
    }

    return {
      totalTenants: totalTenants || 0,
      suspendedTenants: suspendedTenants || 0,
      trialTenants: trialTenants || 0,
      activeTenants: activeTenants || 0,
      mrr: mrr || 0,
      newSignups: newSignups || 0,
      // Legacy Stats
      totalUsers: totalUsers || 0,
      totalOrders: totalOrders || 0,
      totalRevenue: totalRevenue || 0,
      recentOrders: (recentOrders || []).map(o => ({
        id: o.id,
        tenant_name: o.tenants?.name || 'Tienda',
        customer_name: o.customer_name || o.email || 'Cliente',
        total: o.total || 0,
        status: o.status || 'pending',
        created_at: o.created_at,
      })),
      ordersByStatus: orders_by_status,
    };
  }

  // MODULE 1 — STORE TABLE (Paginated & Filterable)
  async listTenants(
    page: number,
    limit: number,
    search?: string,
    status?: string,
    plan?: string,
    country?: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    let query = this.supabase
      .from('tenants')
      .select('*, subscriptions(*)', { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,subdomain.ilike.%${search}%`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    const offset = (page - 1) * limit;
    const { data: tenants, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new BadRequestException(error.message);

    // Enrich with owner email and filter by plan if specified
    let enriched = await Promise.all(
      (tenants || []).map(async (tenant) => {
        // Encontrar dueño
        const { data: owner } = await this.supabase
          .from('users')
          .select('email')
          .eq('tenant_id', tenant.id)
          .eq('role', 'store_owner')
          .limit(1)
          .maybeSingle();

        const subscription = tenant.subscriptions?.[0] || {
          plan_name: 'trial',
          status: 'trial',
          next_billing_date: new Date(new Date(tenant.created_at).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          price: 0,
          billing_cycle: 'monthly'
        };

        return {
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          custom_domain: tenant.custom_domain,
          status: tenant.status,
          created_at: tenant.created_at,
          owner_email: owner?.email || 'Sin dueño asignado',
          plan: subscription.plan_name,
          subscription_status: subscription.status,
          next_billing_date: subscription.next_billing_date,
          subscription_detail: subscription,
        };
      })
    );

    // Client-side plan filtering if specified
    if (plan) {
      enriched = enriched.filter(t => t.plan.toLowerCase() === plan.toLowerCase());
    }

    return { data: enriched, total: count || 0, page, limit };
  }

  // MODULE 7 — INTERNAL NOTES
  async getInternalNotes(storeId: string) {
    const { data, error } = await this.supabase
      .from('internal_notes')
      .select('*, operator:users(id, name, email)')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async createInternalNote(storeId: string, operatorId: string, content: string) {
    const { data, error } = await this.supabase
      .from('internal_notes')
      .insert({
        store_id: storeId,
        operator_id: operatorId,
        content,
      })
      .select('*, operator:users(id, name, email)')
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  // MODULE 2 — GOD MODE (STORE IMPERSONATION)
  async enterGodMode(operator: any, targetStoreId: string, reason: string, ipAddress: string) {
    // 1. Obtener dueño de la tienda objetivo
    const { data: targetUser } = await this.supabase
      .from('users')
      .select('id, email, name')
      .eq('tenant_id', targetStoreId)
      .eq('role', 'store_owner')
      .limit(1)
      .maybeSingle();

    if (!targetUser) {
      throw new BadRequestException('No se encontró un usuario dueño de la tienda para impersonar.');
    }

    const { data: tenant } = await this.supabase
      .from('tenants')
      .select('name')
      .eq('id', targetStoreId)
      .single();

    const tenantName = tenant?.name || 'Tienda';

    // 2. Generar signed JWT (15 min expiry)
    const secret = this.config.get('JWT_SECRET') || 'autogastos-god-mode-secret-key-987654321';
    const payload = {
      superadminId: operator.id,
      targetStoreId,
      targetUserId: targetUser.id,
      reason,
      timestamp: Date.now(),
      isGodMode: true,
      tenantName,
    };

    const token = jwt.sign(payload, secret, { expiresIn: '15m' });

    // 3. Registrar en god_mode_sessions
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const { error: sessionError } = await this.supabase
      .from('god_mode_sessions')
      .insert({
        operator_id: operator.id,
        store_id: targetStoreId,
        reason,
        token,
        expires_at: expiresAt.toISOString(),
        is_active: true,
      });

    if (sessionError) throw new BadRequestException(sessionError.message);

    // 4. Logear en AuditLog
    await this.logAction(
      operator.id,
      targetStoreId,
      'GOD_MODE_ENTER',
      reason,
      `Modo Dios iniciado por ${operator.name} (${operator.email})`,
      ipAddress,
      { operatorName: operator.name, targetUserEmail: targetUser.email }
    );

    // 5. Enviar alerta opcional por email al dueño de la tienda
    await this.emailService.sendGodModeAccessedAlert(targetUser.email, tenantName, reason);

    return { token };
  }

  async exitGodMode(token: string, operatorId: string, ipAddress: string) {
    // Buscar la sesión activa por token
    const { data: session } = await this.supabase
      .from('god_mode_sessions')
      .select('*')
      .eq('token', token)
      .eq('is_active', true)
      .maybeSingle();

    if (session) {
      await this.supabase
        .from('god_mode_sessions')
        .update({ is_active: false, exited_at: new Date().toISOString() })
        .eq('id', session.id);

      await this.logAction(
        operatorId,
        session.store_id,
        'GOD_MODE_EXIT',
        'Cierre de sesión manual',
        'Modo Dios finalizado con éxito',
        ipAddress
      );
    }
    return { success: true };
  }

  // MODULE 3 — CLIENT ACCESS MANAGEMENT
  async resetPassword(operatorId: string, storeId: string, actionType: 'email' | 'link') {
    const { data: owner } = await this.supabase
      .from('users')
      .select('id, email, name')
      .eq('tenant_id', storeId)
      .eq('role', 'store_owner')
      .single();

    if (!owner) throw new BadRequestException('Dueño de tienda no encontrado');

    if (actionType === 'email') {
      const resetLink = `${this.config.get('APP_URL')}/auth/reset-password?userId=${owner.id}`;
      await this.emailService.sendPasswordResetLink(owner.email, resetLink);
      await this.logAction(operatorId, storeId, 'PASSWORD_RESET', 'Solicitud del superadmin', `Email enviado a ${owner.email}`);
      return { message: 'Correo de restablecimiento enviado exitosamente.' };
    } else {
      // Login Link de un solo uso
      const tempToken = jwt.sign({ userId: owner.id, tenantId: storeId, tempLogin: true }, this.config.get('JWT_SECRET') || 'autogastos-god-mode-secret-key-987654321', { expiresIn: '1h' });
      const tempLink = `${this.config.get('APP_URL')}/auth/login/temp?token=${tempToken}`;
      await this.logAction(operatorId, storeId, 'PASSWORD_RESET', 'Enlace temporal generado', `Enlace copiado por superadmin`);
      return { tempLink };
    }
  }

  async forceLogout(operatorId: string, storeId: string) {
    const { data: users } = await this.supabase
      .from('users')
      .select('id, email')
      .eq('tenant_id', storeId);

    if (users) {
      for (const u of users) {
        // Revoke active sessions in Supabase Auth
        await this.supabase.auth.admin.signOut(u.id);
      }
    }

    await this.logAction(operatorId, storeId, 'FORCE_LOGOUT', 'Solicitud del superadmin', `Cierre forzado para todos los usuarios de la tienda`);
    return { success: true };
  }

  async updateStoreStatus(
    operatorId: string,
    storeId: string,
    status: 'active' | 'suspended' | 'inactive',
    reason: string,
    customMessage?: string,
  ) {
    const { data: tenant } = await this.supabase
      .from('tenants')
      .update({ status })
      .eq('id', storeId)
      .select()
      .single();

    if (!tenant) throw new NotFoundException('Tienda no encontrada');

    // Sync status in subscription
    await this.supabase
      .from('subscriptions')
      .update({ status: status === 'active' ? 'active' : 'suspended', suspension_reason: status === 'suspended' ? reason : null })
      .eq('tenant_id', storeId);

    // Get owner email to notify
    const { data: owner } = await this.supabase
      .from('users')
      .select('email')
      .eq('tenant_id', storeId)
      .eq('role', 'store_owner')
      .maybeSingle();

    if (owner) {
      if (status === 'suspended') {
        await this.emailService.sendStoreSuspended(owner.email, tenant.name, customMessage || reason);
      } else if (status === 'active') {
        await this.emailService.sendStoreReactivated(owner.email, tenant.name);
      }
    }

    await this.logAction(
      operatorId,
      storeId,
      status === 'suspended' ? 'STORE_SUSPENDED' : 'STORE_ACTIVATED',
      reason,
      `Estado de la tienda cambiado a ${status}`
    );

    return tenant;
  }

  async resetStoreToZero(operatorId: string, storeId: string) {
    const { data: tenant } = await this.supabase
      .from('tenants')
      .select('name')
      .eq('id', storeId)
      .single();

    if (!tenant) throw new NotFoundException('Tienda no encontrada');

    // Wipe store content tables
    const tables = [
      'order_items',
      'orders',
      'cart_items',
      'carts',
      'coupons',
      'promotions',
      'product_variants',
      'products',
      'categories',
    ];

    for (const table of tables) {
      await this.supabase.from(table).delete().eq('tenant_id', storeId);
    }

    // Reset store config color and settings back to defaults
    await this.supabase
      .from('store_configs')
      .update({
        currency: 'CLP',
        payment_provider: 'mercadopago',
        mercadopago_access_token: null,
        mercadopago_public_key: null,
        transbank_api_key: null,
        transbank_commerce_code: null,
        shipping_enabled: false,
        shipping_cost: 0,
        free_shipping_min: null,
      })
      .eq('tenant_id', storeId);

    // Get owner email to notify
    const { data: owner } = await this.supabase
      .from('users')
      .select('email')
      .eq('tenant_id', storeId)
      .eq('role', 'store_owner')
      .maybeSingle();

    if (owner) {
      await this.emailService.sendStoreReset(owner.email, tenant.name);
    }

    await this.logAction(operatorId, storeId, 'STORE_RESET', 'Reinicio absoluto de tienda', `Toda la data de ventas y catálogo fue eliminada`);
    return { success: true };
  }

  // MODULE 4 — SUBSCRIPTION MANAGEMENT (SUPERADMIN SIDE)
  async getSubscriptionDetail(storeId: string) {
    const { data: sub, error } = await this.supabase
      .from('subscriptions')
      .select('*')
      .eq('tenant_id', storeId)
      .maybeSingle();

    if (error) throw new BadRequestException(error.message);

    // Mock payment history since there's no payment transaction table defined yet.
    // If there is one, query it. Otherwise, return mock items to render.
    const payments = [
      { id: 'pay_1', date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), amount: sub?.price || 26900, status: 'paid', invoice_url: '#' },
      { id: 'pay_2', date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), amount: sub?.price || 26900, status: 'paid', invoice_url: '#' },
    ];

    return { subscription: sub, payments };
  }

  async updateSubscription(
    operatorId: string,
    storeId: string,
    dto: {
      plan_name?: string;
      price?: number;
      billing_cycle?: string;
      status?: 'active' | 'suspended' | 'trial' | 'overdue';
      next_billing_date?: string;
      grace_period_ends_at?: string;
      manual_override?: boolean;
    }
  ) {
    const { data: tenant } = await this.supabase
      .from('tenants')
      .select('name')
      .eq('id', storeId)
      .single();

    const { data: sub, error } = await this.supabase
      .from('subscriptions')
      .update({
        ...dto,
        updated_at: new Date().toISOString(),
      })
      .eq('tenant_id', storeId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    // Notify client if plan name changed
    const { data: owner } = await this.supabase
      .from('users')
      .select('email')
      .eq('tenant_id', storeId)
      .eq('role', 'store_owner')
      .maybeSingle();

    if (owner && dto.plan_name && tenant) {
      await this.emailService.sendPlanChanged(owner.email, tenant.name, dto.plan_name, sub.price);
    }

    await this.logAction(
      operatorId,
      storeId,
      'PLAN_CHANGED',
      'Configurado por SuperAdmin',
      `Suscripción modificada. Plan: ${sub.plan_name}, Estado: ${sub.status}`,
      null,
      dto
    );

    return sub;
  }

  async markPaymentAsReceived(operatorId: string, storeId: string, amount: number) {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const { data: sub, error } = await this.supabase
      .from('subscriptions')
      .update({
        status: 'active',
        next_billing_date: nextMonth.toISOString(),
        grace_period_ends_at: null,
        manual_override: false,
        updated_at: new Date().toISOString()
      })
      .eq('tenant_id', storeId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    // Reactivate store in case it was suspended
    await this.supabase
      .from('tenants')
      .update({ status: 'active' })
      .eq('id', storeId);

    // Notify store owner
    const { data: tenant } = await this.supabase
      .from('tenants')
      .select('name')
      .eq('id', storeId)
      .single();

    const { data: owner } = await this.supabase
      .from('users')
      .select('email')
      .eq('tenant_id', storeId)
      .eq('role', 'store_owner')
      .maybeSingle();

    if (owner && tenant) {
      await this.emailService.sendStoreReactivated(owner.email, tenant.name);
    }

    await this.logAction(
      operatorId,
      storeId,
      'PAYMENT_MARKED',
      'Pago manual recibido por transferencia bancaria',
      `Registrado pago por monto de $${amount.toLocaleString('es-CL')}. Próximo cobro: ${sub.next_billing_date}`
    );

    return sub;
  }

  // MODULE 6 — AUDIT LOG VIEWER
  async getAuditLogs(
    page: number,
    limit: number,
    storeId?: string,
    operatorId?: string,
    actionType?: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    let query = this.supabase
      .from('audit_logs')
      .select('*, operator:users(id, name, email), store:tenants(id, name)', { count: 'exact' });

    if (storeId) query = query.eq('store_id', storeId);
    if (operatorId) query = query.eq('operator_id', operatorId);
    if (actionType) query = query.eq('action_type', actionType);
    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo);

    const offset = (page - 1) * limit;
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new BadRequestException(error.message);

    return { data: data || [], total: count || 0, page, limit };
  }

  // MODULE 8 — OPERATOR ACCOUNT MANAGEMENT
  async listOperators() {
    const { data, error } = await this.supabase
      .from('users')
      .select('id, name, email, role, email_confirmed, created_at')
      .in('role', ['super_admin', 'support_agent'])
      .order('role', { ascending: true });

    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async inviteOperator(email: string, role: 'super_admin' | 'support_agent') {
    // 1. Invitar usando Supabase Auth Admin API
    const { data, error } = await this.supabase.auth.admin.inviteUserByEmail(email, {
      data: { role },
      redirectTo: `${this.config.get('APP_URL')}/auth/confirm`,
    });

    if (error) throw new BadRequestException(error.message);

    // 2. Insertar/Actualizar en users
    const { error: dbError } = await this.supabase.from('users').insert({
      id: data.user.id,
      email,
      name: email.split('@')[0],
      role,
      email_confirmed: false,
    });

    if (dbError) {
      // Si ya existía, lo actualizamos
      await this.supabase
        .from('users')
        .update({ role })
        .eq('email', email);
    }

    return { message: 'Invitación de operador enviada con éxito.', user: data.user };
  }

  async toggleOperatorStatus(operatorId: string, active: boolean) {
    // Desactivar operador: podemos quitarle los roles administrativos en db
    const targetRole = active ? 'support_agent' : 'customer';

    const { data, error } = await this.supabase
      .from('users')
      .update({ role: targetRole })
      .eq('id', operatorId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    // Actualizar metadata de auth
    await this.supabase.auth.admin.updateUserById(operatorId, {
      user_metadata: { role: targetRole },
    });

    return data;
  }

  // MODULE 9 — NOTICES SYSTEM
  async getTenantNotices(tenantId: string) {
    const { data, error } = await this.supabase
      .from('tenant_notices')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async createTenantNotice(operatorId: string, tenantId: string, message: string, type: 'info' | 'warning' | 'critical') {
    const { data, error } = await this.supabase
      .from('tenant_notices')
      .insert({
        tenant_id: tenantId,
        message,
        type,
        is_active: true,
        created_by: operatorId,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    await this.logAction(
      operatorId,
      tenantId,
      'CREATE_NOTICE',
      `Creado aviso (${type}): ${message}`
    );

    return data;
  }

  async deleteTenantNotice(operatorId: string, tenantId: string, noticeId: string) {
    const { data, error } = await this.supabase
      .from('tenant_notices')
      .update({ is_active: false })
      .eq('id', noticeId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    await this.logAction(
      operatorId,
      tenantId,
      'DEACTIVATE_NOTICE',
      `Desactivado aviso ID: ${noticeId}`
    );

    return data;
  }

  // MODULE 10 — FEATURE FLAGS
  async updateTenantFeatures(operatorId: string, tenantId: string, features: any) {
    const { data, error } = await this.supabase
      .from('tenants')
      .update({ features })
      .eq('id', tenantId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    await this.logAction(
      operatorId,
      tenantId,
      'UPDATE_FEATURES',
      `Actualizadas características especiales: ${JSON.stringify(features)}`
    );

    return data;
  }

  // MODULE 11 — HEALTH & RESOURCES
  async getTenantResources(tenantId: string) {
    const { count: productCount, error: productError } = await this.supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    if (productError) throw new BadRequestException(productError.message);

    // Mock storage calculation based on product images
    const { data: imagesData } = await this.supabase
      .from('products')
      .select('images')
      .eq('tenant_id', tenantId);

    let imagesCount = 0;
    if (imagesData) {
      for (const row of imagesData) {
        if (Array.isArray(row.images)) {
          imagesCount += row.images.length;
        }
      }
    }

    // Estimate storage: 450 KB average size per image asset
    const estimatedStorageMb = Math.round((imagesCount * 0.45) * 100) / 100;

    return {
      productCount: productCount || 0,
      productLimit: 500, // standard limit
      estimatedStorageMb,
      storageLimitMb: 250, // standard limit
    };
  }

  async getTenantHealth(tenantId: string) {
    // Check if tenant exists and measure database latency
    const startTime = Date.now();
    const { data, error } = await this.supabase
      .from('tenants')
      .select('id, subdomain, status')
      .eq('id', tenantId)
      .single();
    const latency = Date.now() - startTime;

    if (error || !data) {
      return { status: 'offline', latency: 0, lastCheck: new Date() };
    }

    // Determine health based on status and latency parameters
    let status = 'healthy';
    if (data.status === 'suspended') {
      status = 'warning'; // Warning indicator if suspended
    } else if (latency > 1500) {
      status = 'degraded'; // Slow responses
    }

    return {
      status,
      latency,
      lastCheck: new Date(),
    };
  }
}

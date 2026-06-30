import { Injectable, Inject, BadRequestException, NotFoundException, OnModuleInit } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../common/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../notifications/email.service';

@Injectable()
export class BillingService implements OnModuleInit {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  onModuleInit() {
    // Iniciar el chequeo diario en segundo plano (cada 24 horas)
    // Ejecutar 5 segundos después del inicio para no bloquear el arranque
    setTimeout(() => {
      this.checkSubscriptionOverdues().catch(console.error);
      setInterval(() => {
        this.checkSubscriptionOverdues().catch(console.error);
      }, 24 * 60 * 60 * 1000);
    }, 5000);
  }

  // Obtener suscripción de una tienda
  async getSubscription(tenantId: string) {
    const { data: sub, error } = await this.supabase
      .from('subscriptions')
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (error) throw new BadRequestException(error.message);
    if (!sub) {
      // Si no tiene suscripción (por ejemplo recién creada), le creamos una de prueba
      const nextBilling = new Date();
      nextBilling.setDate(nextBilling.getDate() + 14); // 14 días de prueba

      const { data: newSub, error: createError } = await this.supabase
        .from('subscriptions')
        .insert({
          tenant_id: tenantId,
          plan_name: 'trial',
          price: 0,
          billing_cycle: 'monthly',
          status: 'trial',
          next_billing_date: nextBilling.toISOString(),
        })
        .select()
        .single();

      if (createError) throw new BadRequestException(createError.message);
      return { subscription: newSub, payments: [] };
    }

    // Historial de pagos (simulado)
    const payments = [
      { id: 'pay_1', date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), amount: sub.price || 0, status: 'paid', invoice_url: '#' },
    ];

    return { subscription: sub, payments };
  }

  // Generar enlace para actualizar método de pago (MercadoPago / Stripe / Flow simulado)
  async changePaymentMethod(tenantId: string) {
    // Retornamos un link simulado al portal de pagos
    const paymentPortalUrl = `https://checkout.autoshopping.cl/payment-method?tenantId=${tenantId}&token=pm_update_${Date.now()}`;
    return { url: paymentPortalUrl };
  }

  // Cliente cambia de plan
  async upgradePlan(tenantId: string, planName: string) {
    let price = 0;
    if (planName === 'starter') price = 14900;
    else if (planName === 'growth') price = 26900;
    else if (planName === 'pro') price = 49900;
    else if (planName === 'enterprise') price = 129000;
    else throw new BadRequestException('Plan inválido seleccionado.');

    const nextBilling = new Date();
    nextBilling.setMonth(nextBilling.getMonth() + 1);

    const { data: sub, error } = await this.supabase
      .from('subscriptions')
      .update({
        plan_name: planName,
        price,
        status: 'active',
        next_billing_date: nextBilling.toISOString(),
        grace_period_ends_at: null,
        suspension_reason: null,
        manual_override: false,
        updated_at: new Date().toISOString()
      })
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    // Asegurarse de activar la tienda si estaba suspendida
    await this.supabase
      .from('tenants')
      .update({ status: 'active' })
      .eq('id', tenantId);

    // Enviar correo de confirmación
    const { data: tenant } = await this.supabase
      .from('tenants')
      .select('name')
      .eq('id', tenantId)
      .single();

    const { data: owner } = await this.supabase
      .from('users')
      .select('email')
      .eq('tenant_id', tenantId)
      .eq('role', 'store_owner')
      .maybeSingle();

    if (owner && tenant) {
      await this.emailService.sendPlanChanged(owner.email, tenant.name, planName, price);
    }

    return sub;
  }

  // Cancelar suscripción
  async cancelSubscription(tenantId: string) {
    // Al cancelar, degradamos a plan free/trial expirado inmediatamente o al final del ciclo.
    // Para simplificar, deshabilitamos el cobro recurrente marcando el plan como 'free'
    const { data: sub, error } = await this.supabase
      .from('subscriptions')
      .update({
        plan_name: 'cancelled',
        price: 0,
        status: 'suspended',
        updated_at: new Date().toISOString()
      })
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    // Suspender el tenant
    await this.supabase
      .from('tenants')
      .update({ status: 'suspended' })
      .eq('id', tenantId);

    return { success: true, subscription: sub };
  }

  // Chequeo automático de facturación atrasada (Reglas globales de auto-suspensión)
  async checkSubscriptionOverdues() {
    // Obtener todas las suscripciones
    const { data: subs, error } = await this.supabase
      .from('subscriptions')
      .select('*')
      .not('status', 'eq', 'suspended');

    if (error || !subs) return;

    const now = new Date();

    for (const sub of subs) {
      // Ignorar si tiene override manual
      if (sub.manual_override) continue;

      const nextBilling = new Date(sub.next_billing_date);

      // Si la fecha de cobro ya pasó
      if (nextBilling < now) {
        // Encontrar datos del dueño y tienda
        const { data: tenant } = await this.supabase
          .from('tenants')
          .select('name, status')
          .eq('id', sub.tenant_id)
          .single();

        const { data: owner } = await this.supabase
          .from('users')
          .select('email')
          .eq('tenant_id', sub.tenant_id)
          .eq('role', 'store_owner')
          .limit(1)
          .maybeSingle();

        if (!tenant || !owner) continue;

        // Calcular días de atraso
        const diffTime = Math.abs(now.getTime() - nextBilling.getTime());
        const daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        // Si estaba activo/trial, cambia a 'overdue' (día 1)
        if (sub.status === 'active' || sub.status === 'trial') {
          const gracePeriodEnds = new Date(nextBilling.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 días gracia
          
          await this.supabase
            .from('subscriptions')
            .update({
              status: 'overdue',
              grace_period_ends_at: gracePeriodEnds.toISOString(),
            })
            .eq('id', sub.id);

          // Alerta día 1
          const paymentLink = `${this.config.get('APP_URL')}/dashboard/config/subscription`;
          await this.emailService.sendPaymentOverdueWarning(owner.email, 1, paymentLink);
          await this.emailService.sendPaymentFailed(owner.email, sub.price || 26900, paymentLink);
          continue;
        }

        if (sub.status === 'overdue') {
          const paymentLink = `${this.config.get('APP_URL')}/dashboard/config/subscription`;
          
          if (daysOverdue === 3) {
            // Alerta final día 3
            await this.emailService.sendPaymentOverdueWarning(owner.email, 3, paymentLink);
          } else if (daysOverdue >= 4) {
            // Auto-suspensión en día 4
            await this.supabase
              .from('subscriptions')
              .update({
                status: 'suspended',
                suspension_reason: 'Falta de pago tras expirar el período de gracia de 3 días.',
              })
              .eq('id', sub.id);

            await this.supabase
              .from('tenants')
              .update({ status: 'suspended' })
              .eq('id', sub.tenant_id);

            await this.emailService.sendSubscriptionSuspensionNotice(owner.email, tenant.name);
          }
        }
      }
    }
  }
}

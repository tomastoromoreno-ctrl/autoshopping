import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../common/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class PrivacyService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async recordConsent(
    customerId: string,
    tenantId: string,
    consentType: string,
    granted: boolean,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const validTypes = ['privacy_policy', 'marketing', 'data_processing'];
    if (!validTypes.includes(consentType)) {
      throw new BadRequestException('Tipo de consentimiento inválido');
    }

    const { data, error } = await this.supabase
      .from('consent_records')
      .insert({
        tenant_id: tenantId,
        customer_id: customerId,
        consent_type: consentType,
        granted,
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    // Also update the customer record for quick access
    if (consentType === 'marketing') {
      await this.supabase
        .from('customers')
        .update({ marketing_consent: granted })
        .eq('id', customerId);
    } else if (consentType === 'privacy_policy') {
      await this.supabase
        .from('customers')
        .update({
          privacy_consent: granted,
          privacy_consent_date: granted ? new Date().toISOString() : null,
        })
        .eq('id', customerId);
    }

    return data;
  }

  async getConsentRecords(customerId: string, tenantId: string) {
    const { data, error } = await this.supabase
      .from('consent_records')
      .select('*')
      .eq('customer_id', customerId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async exportData(customerId: string, tenantId: string) {
    const { data: customer, error: custError } = await this.supabase
      .from('customers')
      .select('name, email, phone, default_address, created_at')
      .eq('id', customerId)
      .single();

    if (custError || !customer) throw new BadRequestException('Cliente no encontrado');

    const { data: orders } = await this.supabase
      .from('orders')
      .select('id, order_number, status, total, created_at')
      .eq('customer_id', customerId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    const { data: consents } = await this.supabase
      .from('consent_records')
      .select('consent_type, granted, created_at')
      .eq('customer_id', customerId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    return {
      personal_data: customer,
      orders: orders || [],
      consent_records: consents || [],
      export_date: new Date().toISOString(),
      data_controller: 'AutoShopping / Tienda',
      legal_basis: 'Ley N° 19.628 sobre Protección de la Vida Privada',
    };
  }

  async requestDataDeletion(
    customerId: string,
    tenantId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Anonymize personal data in orders (keep for accounting)
    await this.supabase
      .from('orders')
      .update({
        customer_name: 'Cliente Eliminado',
        customer_email: 'eliminado@privacidad.local',
        customer_phone: null,
      })
      .eq('customer_id', customerId)
      .eq('tenant_id', tenantId);

    // Delete personal data from customer record
    await this.supabase
      .from('customers')
      .update({
        name: 'Cliente Eliminado',
        email: `eliminado-${Date.now()}@privacidad.local`,
        phone: null,
        default_address: null,
        marketing_consent: false,
        privacy_consent: false,
      })
      .eq('id', customerId);

    // Record the deletion request as consent
    await this.supabase
      .from('consent_records')
      .insert({
        tenant_id: tenantId,
        customer_id: customerId,
        consent_type: 'data_processing',
        granted: false,
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
      });

    // Log the data subject request
    await this.logDsr(tenantId, customerId, 'cancellation', 'completed');

    return { message: 'Solicitud de eliminación registrada. Sus datos personales serán eliminados.' };
  }

  // ==================== LEY 21.719 - NUEVOS DERECHOS ====================

  // Derecho a Portabilidad (Art. 2 letra e)
  async portability(customerId: string, tenantId: string) {
    const { data: customer, error: custError } = await this.supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (custError || !customer) throw new BadRequestException('Cliente no encontrado');

    const { data: orders } = await this.supabase
      .from('orders')
      .select('*')
      .eq('customer_id', customerId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    const { data: consents } = await this.supabase
      .from('consent_records')
      .select('*')
      .eq('customer_id', customerId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    // Structured portable format per Ley 21.719 / GDPR standard
    const portableData = {
      export_date: new Date().toISOString(),
      data_controller: {
        name: 'AutoShopping',
        contact: 'privacy@autoshopping.cl',
      },
      legal_basis: 'Ley N° 21.719 sobre Protección de Datos Personales',
      personal_data: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        default_address: customer.default_address,
        created_at: customer.created_at,
      },
      orders: (orders || []).map((o: any) => ({
        order_number: o.order_number,
        status: o.status,
        total: o.total,
        items_count: o.items_count,
        created_at: o.created_at,
      })),
      consent_records: (consents || []).map((c: any) => ({
        type: c.consent_type,
        granted: c.granted,
        date: c.created_at,
      })),
    };

    await this.logDsr(tenantId, customerId, 'portability', 'completed');

    return portableData;
  }

  // Derecho a Bloqueo (Art. 2 letra f)
  async blocking(customerId: string, tenantId: string, reason: string) {
    const { data, error } = await this.supabase
      .from('customers')
      .update({
        data_blocked: true,
        data_blocked_at: new Date().toISOString(),
        data_blocked_reason: reason,
      })
      .eq('id', customerId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    await this.logDsr(tenantId, customerId, 'blocking', 'completed', { reason });

    return {
      message: 'El bloqueo de sus datos ha sido registrado. Sus datos no serán procesados hasta nuevo aviso.',
      customer: data,
    };
  }

  // Derecho a Oposición (Art. 2 letra d)
  async opposition(customerId: string, tenantId: string, dto: { marketing?: boolean; profiling?: boolean; other?: string }) {
    const updates: Record<string, any> = {};
    if (dto.marketing !== undefined) updates.opposition_marketing = dto.marketing;
    if (dto.profiling !== undefined) updates.opposition_profiling = dto.profiling;
    if (dto.other !== undefined) updates.opposition_other = dto.other;

    if (Object.keys(updates).length === 0) {
      throw new BadRequestException('Debe especificar al menos un tipo de oposición');
    }

    const { data, error } = await this.supabase
      .from('customers')
      .update(updates)
      .eq('id', customerId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    // If opposing to marketing, also update consent record
    if (dto.marketing === true) {
      await this.supabase
        .from('customers')
        .update({ marketing_consent: false })
        .eq('id', customerId);

      await this.supabase
        .from('consent_records')
        .insert({
          tenant_id: tenantId,
          customer_id: customerId,
          consent_type: 'marketing',
          granted: false,
          notes: 'Oposición al tratamiento de datos para marketing',
        });
    }

    await this.logDsr(tenantId, customerId, 'opposition', 'completed', dto);

    return {
      message: 'Su oposición ha sido registrada. Sus preferencias han sido actualizadas.',
      customer: data,
    };
  }

  // Desbloqueo de datos
  async unblock(customerId: string, tenantId: string) {
    const { data, error } = await this.supabase
      .from('customers')
      .update({
        data_blocked: false,
        data_blocked_at: null,
        data_blocked_reason: null,
      })
      .eq('id', customerId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    return {
      message: 'El bloqueo de sus datos ha sido levantado.',
      customer: data,
    };
  }

  // Historial de solicitudes ARCO-P-B
  async getSubjectRequests(customerId: string, tenantId: string) {
    const { data, error } = await this.supabase
      .from('data_subject_requests')
      .select('*')
      .eq('customer_id', customerId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  private async logDsr(tenantId: string, customerId: string, requestType: string, status: string, details?: any) {
    try {
      await this.supabase
        .from('data_subject_requests')
        .insert({
          tenant_id: tenantId,
          customer_id: customerId,
          request_type: requestType,
          status,
          details: details ? JSON.stringify(details) : null,
          responded_at: new Date().toISOString(),
        });
    } catch {} // Non-critical
  }
}

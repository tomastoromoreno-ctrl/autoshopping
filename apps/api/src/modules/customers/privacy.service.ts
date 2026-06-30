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

    return { message: 'Solicitud de eliminación registrada. Sus datos personales serán eliminados.' };
  }
}

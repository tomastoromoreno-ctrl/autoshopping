import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../common/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SslService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async getStatus(tenantId: string) {
    const { data: tenant } = await this.supabase
      .from('tenants')
      .select('subdomain, custom_domain')
      .eq('id', tenantId)
      .single();

    if (!tenant) throw new NotFoundException('Tenant no encontrado');

    // Check for existing SSL certificate record
    const { data: cert } = await this.supabase
      .from('ssl_certificates')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      subdomain: tenant.subdomain,
      subdomain_ssl: true, // Subdomains always have SSL via platform
      custom_domain: tenant.custom_domain || null,
      certificate: cert || null,
    };
  }

  async requestCertificate(tenantId: string, domain: string) {
    if (!domain) throw new BadRequestException('Dominio requerido');

    // Check if certificate already exists for this domain
    const { data: existing } = await this.supabase
      .from('ssl_certificates')
      .select('id, status')
      .eq('tenant_id', tenantId)
      .eq('domain', domain)
      .maybeSingle();

    if (existing && existing.status === 'active') {
      throw new BadRequestException('Ya existe un certificado activo para este dominio');
    }

    // Upsert the certificate record
    const { data, error } = await this.supabase
      .from('ssl_certificates')
      .upsert({
        tenant_id: tenantId,
        domain,
        status: 'issuing',
        last_check_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'tenant_id,domain' })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    // In production, this would trigger Let's Encrypt / Vercel API
    // For now, simulate certificate issuance after a short delay
    setTimeout(async () => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days

      await this.supabase
        .from('ssl_certificates')
        .update({
          status: 'active',
          issued_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('tenant_id', tenantId)
        .eq('domain', domain);
    }, 5000);

    return data;
  }

  async verifyCertificate(tenantId: string) {
    const { data: cert, error } = await this.supabase
      .from('ssl_certificates')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new BadRequestException(error.message);
    if (!cert) throw new NotFoundException('No hay certificado registrado');

    // Update last check time
    await this.supabase
      .from('ssl_certificates')
      .update({ last_check_at: new Date().toISOString() })
      .eq('id', cert.id);

    // Check if certificate is about to expire (within 30 days)
    if (cert.expires_at) {
      const expiresAt = new Date(cert.expires_at);
      const daysUntilExpiry = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry <= 0) {
        await this.supabase
          .from('ssl_certificates')
          .update({ status: 'expired', updated_at: new Date().toISOString() })
          .eq('id', cert.id);
        return { ...cert, status: 'expired', days_until_expiry: daysUntilExpiry };
      }

      return { ...cert, days_until_expiry: daysUntilExpiry };
    }

    return cert;
  }

  async toggleAutoRenew(tenantId: string, autoRenew: boolean) {
    const { data, error } = await this.supabase
      .from('ssl_certificates')
      .update({ auto_renew: autoRenew, updated_at: new Date().toISOString() })
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }
}

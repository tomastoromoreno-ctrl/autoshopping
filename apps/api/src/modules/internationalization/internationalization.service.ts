import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../common/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class InternationalizationService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  // ==========================================
  // LANGUAGES MANAGEMENT
  // ==========================================

  async listLanguages(tenantId: string) {
    const { data, error } = await this.supabase
      .from('tenant_languages')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('is_default', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async activateLanguage(tenantId: string, dto: { code: string; is_default?: boolean }) {
    // If setting as default, remove default from others
    if (dto.is_default) {
      await this.supabase
        .from('tenant_languages')
        .update({ is_default: false })
        .eq('tenant_id', tenantId);
    }

    const { data, error } = await this.supabase
      .from('tenant_languages')
      .upsert({
        tenant_id: tenantId,
        language_code: dto.code,
        is_default: dto.is_default || false,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async deactivateLanguage(tenantId: string, code: string) {
    // Cannot deactivate default
    const { data: lang } = await this.supabase
      .from('tenant_languages')
      .select('is_default')
      .eq('tenant_id', tenantId)
      .eq('language_code', code)
      .single();

    if (lang?.is_default) {
      throw new BadRequestException('No se puede desactivar el idioma por defecto');
    }

    const { error } = await this.supabase
      .from('tenant_languages')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('language_code', code);

    if (error) throw new BadRequestException(error.message);
    return { success: true };
  }

  // ==========================================
  // CURRENCIES MANAGEMENT
  // ==========================================

  async listCurrencies(tenantId: string) {
    const { data, error } = await this.supabase
      .from('tenant_currencies')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('is_default', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async activateCurrency(tenantId: string, dto: {
    code: string;
    is_default?: boolean;
    exchange_rate?: number;
    rate_mode?: 'auto' | 'manual';
    rounding_rule?: string;
  }) {
    if (dto.is_default) {
      await this.supabase
        .from('tenant_currencies')
        .update({ is_default: false })
        .eq('tenant_id', tenantId);
    }

    // If auto mode, resolve rate now
    let rate = dto.exchange_rate || 1.0;
    if (dto.rate_mode === 'auto') {
      const resolvedRate = await this.fetchSingleExchangeRate('CLP', dto.code);
      if (resolvedRate) rate = resolvedRate;
    }

    const { data, error } = await this.supabase
      .from('tenant_currencies')
      .upsert({
        tenant_id: tenantId,
        currency_code: dto.code,
        is_default: dto.is_default || false,
        exchange_rate: rate,
        rate_mode: dto.rate_mode || 'auto',
        rounding_rule: dto.rounding_rule || 'nearest',
        is_active: true,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async updateCurrencyRate(tenantId: string, code: string, dto: { exchange_rate: number }) {
    const { data, error } = await this.supabase
      .from('tenant_currencies')
      .update({
        exchange_rate: dto.exchange_rate,
        rate_mode: 'manual',
      })
      .eq('tenant_id', tenantId)
      .eq('currency_code', code)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async deactivateCurrency(tenantId: string, code: string) {
    const { data: curr } = await this.supabase
      .from('tenant_currencies')
      .select('is_default')
      .eq('tenant_id', tenantId)
      .eq('currency_code', code)
      .single();

    if (curr?.is_default) {
      throw new BadRequestException('No se puede desactivar la moneda por defecto');
    }

    const { error } = await this.supabase
      .from('tenant_currencies')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('currency_code', code);

    if (error) throw new BadRequestException(error.message);
    return { success: true };
  }

  // ==========================================
  // PRODUCT TRANSLATIONS
  // ==========================================

  async getProductTranslations(productId: string) {
    const { data, error } = await this.supabase
      .from('product_translations')
      .select('*')
      .eq('product_id', productId);

    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async updateProductTranslation(productId: string, lang: string, dto: {
    name: string;
    description?: string;
    short_description?: string;
    slug: string;
    meta_title?: string;
    meta_description?: string;
  }) {
    const { data, error } = await this.supabase
      .from('product_translations')
      .upsert({
        product_id: productId,
        language_code: lang,
        ...dto,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  // ==========================================
  // EXCHANGE RATE UPDATE ENGINE
  // ==========================================

  async triggerExchangeRatesUpdate() {
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/CLP');
      if (!response.ok) throw new Error('Failed to fetch from open.er-api.com');
      
      const val = await response.json();
      const rates = val.rates;
      if (!rates) return { success: false, message: 'No rates returned' };

      // Write historical logs
      const insertRows = Object.entries(rates).map(([target, rate]) => ({
        base_currency: 'CLP',
        target_currency: target,
        rate: Number(rate),
        source: 'exchangerate-api',
      }));

      await this.supabase.from('exchange_rate_history').insert(insertRows);

      // Fetch all auto-mode tenant currencies and update their rates
      const { data: autoCurrencies } = await this.supabase
        .from('tenant_currencies')
        .select('*')
        .eq('rate_mode', 'auto');

      for (const curr of autoCurrencies || []) {
        // Since rates base is CLP, and if the base of the tenant is CLP:
        // Or if tenant has another base (let's assume base is CLP for most tenants since we are in Chile).
        // Let's resolve rate. If target is USD, the rate is rates['USD']
        const targetRate = rates[curr.currency_code];
        if (targetRate) {
          await this.supabase
            .from('tenant_currencies')
            .update({ exchange_rate: Number(targetRate) })
            .eq('tenant_id', curr.tenant_id)
            .eq('currency_code', curr.currency_code);
        }
      }

      return { success: true, message: 'Exchange rates updated successfully', base: 'CLP' };
    } catch (e) {
      console.error('Error updating exchange rates:', e.message);
      return { success: false, error: e.message };
    }
  }

  private async fetchSingleExchangeRate(base: string, target: string): Promise<number | null> {
    try {
      const response = await fetch(`https://open.er-api.com/v6/latest/${base}`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.rates?.[target] || null;
    } catch {
      return null;
    }
  }
}

import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../common/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class ShippingService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async getConfig(tenantId: string) {
    const { data, error } = await this.supabase
      .from('shipping_configurations')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async updateConfig(tenantId: string, dto: any) {
    const { provider, is_enabled, mode, api_key, api_secret, client_id, origin_region, origin_commune, origin_address, flat_rate_cost } = dto;

    const { data: existing } = await this.supabase
      .from('shipping_configurations')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('provider', provider)
      .maybeSingle();

    let result;
    if (existing) {
      result = await this.supabase
        .from('shipping_configurations')
        .update({
          is_enabled,
          mode,
          api_key,
          api_secret,
          client_id,
          origin_region,
          origin_commune,
          origin_address,
          flat_rate_cost,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      result = await this.supabase
        .from('shipping_configurations')
        .insert({
          tenant_id: tenantId,
          provider,
          is_enabled,
          mode,
          api_key,
          api_secret,
          client_id,
          origin_region,
          origin_commune,
          origin_address,
          flat_rate_cost,
        })
        .select()
        .single();
    }

    if (result.error) throw new BadRequestException(result.error.message);
    return result.data;
  }

  async calculateQuotes(tenantId: string, region: string, commune: string, items: any[]) {
    // 1. Obtener configuraciones de envío habilitadas
    const { data: configs, error } = await this.supabase
      .from('shipping_configurations')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_enabled', true);

    if (error) throw new BadRequestException(error.message);
    if (!configs || configs.length === 0) return [];

    // 2. Obtener configuración general de la tienda (para verificar envío gratis)
    const { data: storeConfig } = await this.supabase
      .from('store_configs')
      .select('free_shipping_min, shipping_enabled')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (!storeConfig || !storeConfig.shipping_enabled) {
      return [];
    }

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

    const quotes = [];
    const normalizedRegion = (region || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Clasificación de zonas de Chile para tarifas realistas
    let zone: 'metropolitana' | 'cercana' | 'extrema' = 'metropolitana';
    if (normalizedRegion.includes('metropolitana') || normalizedRegion.includes('santiago') || normalizedRegion.includes('rm')) {
      zone = 'metropolitana';
    } else if (
      normalizedRegion.includes('valparaiso') || 
      normalizedRegion.includes('higgins') || 
      normalizedRegion.includes('coquimbo') || 
      normalizedRegion.includes('maule') || 
      normalizedRegion.includes('biobio') ||
      normalizedRegion.includes('nuble')
    ) {
      zone = 'cercana';
    } else {
      zone = 'extrema';
    }

    for (const config of configs) {
      let cost = 0;
      let name = '';
      let deliveryTime = '';
      let isCollect = config.mode === 'collect';

      if (config.provider === 'flat_rate') {
        cost = Number(config.flat_rate_cost || 0);
        name = 'Tarifa Plana (Envío Propio)';
        deliveryTime = '2 a 4 días hábiles';
        isCollect = false;
      } else if (config.provider === 'starken') {
        name = isCollect ? 'Starken (Por Pagar - Cancelas al recibir)' : 'Starken';
        if (isCollect) {
          cost = 0;
          deliveryTime = '2 a 5 días hábiles. El envío se paga al recibir.';
        } else {
          if (zone === 'metropolitana') {
            cost = 3900 + (totalQuantity * 500);
            deliveryTime = '2 a 3 días hábiles';
          } else if (zone === 'cercana') {
            cost = 5200 + (totalQuantity * 700);
            deliveryTime = '3 a 5 días hábiles';
          } else {
            cost = 8500 + (totalQuantity * 1200);
            deliveryTime = '5 a 8 días hábiles';
          }
        }
      } else if (config.provider === 'chilexpress') {
        name = isCollect ? 'Chilexpress (Por Pagar - Cancelas al recibir)' : 'Chilexpress';
        if (isCollect) {
          cost = 0;
          deliveryTime = '1 a 3 días hábiles. El envío se paga al recibir.';
        } else {
          if (zone === 'metropolitana') {
            cost = 4500 + (totalQuantity * 600);
            deliveryTime = '1 a 2 días hábiles (Express)';
          } else if (zone === 'cercana') {
            cost = 5900 + (totalQuantity * 850);
            deliveryTime = '2 a 3 días hábiles';
          } else {
            cost = 9800 + (totalQuantity * 1500);
            deliveryTime = '3 a 5 días hábiles';
          }
        }
      } else if (config.provider === 'blueexpress') {
        name = isCollect ? 'Blue Express (Por Pagar - Cancelas al recibir)' : 'Blue Express';
        if (isCollect) {
          cost = 0;
          deliveryTime = '2 a 4 días hábiles. El envío se paga al recibir.';
        } else {
          if (zone === 'metropolitana') {
            cost = 3700 + (totalQuantity * 450);
            deliveryTime = '2 a 3 días hábiles';
          } else if (zone === 'cercana') {
            cost = 4900 + (totalQuantity * 650);
            deliveryTime = '3 a 4 días hábiles';
          } else {
            cost = 7900 + (totalQuantity * 1100);
            deliveryTime = '4 a 6 días hábiles';
          }
        }
      }

      // Aplicar envío gratis si corresponde (y si no es cobro por pagar)
      if (!isCollect && storeConfig.free_shipping_min && subtotal >= Number(storeConfig.free_shipping_min)) {
        cost = 0;
      }

      quotes.push({
        id: config.provider,
        name,
        cost,
        delivery_time: deliveryTime,
        is_collect: isCollect,
      });
    }

    return quotes;
  }
}

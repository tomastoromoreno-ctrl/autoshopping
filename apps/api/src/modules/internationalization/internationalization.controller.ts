import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { InternationalizationService } from './internationalization.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller()
export class InternationalizationController {
  constructor(private readonly intl: InternationalizationService) {}

  // ==========================================
  // LANGUAGES (AuthGuard)
  // ==========================================

  @Get('store/languages')
  @UseGuards(AuthGuard)
  listLanguages(@Req() req: any) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    return this.intl.listLanguages(tenantId);
  }

  @Post('store/languages')
  @UseGuards(AuthGuard)
  activateLanguage(@Req() req: any, @Body() dto: { code: string; is_default?: boolean }) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    if (!dto.code) throw new BadRequestException('Código de idioma es requerido');
    return this.intl.activateLanguage(tenantId, dto);
  }

  @Delete('store/languages/:code')
  @UseGuards(AuthGuard)
  deactivateLanguage(@Req() req: any, @Param('code') code: string) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    return this.intl.deactivateLanguage(tenantId, code);
  }

  // ==========================================
  // CURRENCIES (AuthGuard)
  // ==========================================

  @Get('store/currencies')
  @UseGuards(AuthGuard)
  listCurrencies(@Req() req: any) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    return this.intl.listCurrencies(tenantId);
  }

  @Post('store/currencies')
  @UseGuards(AuthGuard)
  activateCurrency(@Req() req: any, @Body() dto: {
    code: string;
    is_default?: boolean;
    exchange_rate?: number;
    rate_mode?: 'auto' | 'manual';
    rounding_rule?: string;
  }) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    if (!dto.code) throw new BadRequestException('Código de moneda es requerido');
    return this.intl.activateCurrency(tenantId, dto);
  }

  @Put('store/currencies/:code')
  @UseGuards(AuthGuard)
  updateCurrencyRate(@Req() req: any, @Param('code') code: string, @Body() dto: { exchange_rate: number }) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    if (dto.exchange_rate === undefined) throw new BadRequestException('Tasa de cambio es requerida');
    return this.intl.updateCurrencyRate(tenantId, code, dto);
  }

  @Delete('store/currencies/:code')
  @UseGuards(AuthGuard)
  deactivateCurrency(@Req() req: any, @Param('code') code: string) {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) throw new BadRequestException('No tenant associated with user');
    return this.intl.deactivateCurrency(tenantId, code);
  }

  // ==========================================
  // TRANSLATIONS (AuthGuard)
  // ==========================================

  @Get('products/:id/translations')
  @UseGuards(AuthGuard)
  getProductTranslations(@Param('id') id: string) {
    return this.intl.getProductTranslations(id);
  }

  @Put('products/:id/translations/:lang')
  @UseGuards(AuthGuard)
  updateProductTranslation(
    @Param('id') id: string,
    @Param('lang') lang: string,
    @Body() dto: {
      name: string;
      description?: string;
      short_description?: string;
      slug: string;
      meta_title?: string;
      meta_description?: string;
    },
  ) {
    if (!dto.name) throw new BadRequestException('El nombre traducido es requerido');
    if (!dto.slug) throw new BadRequestException('El slug traducido es requerido');
    return this.intl.updateProductTranslation(id, lang, dto);
  }

  // Cron-triggered internal endpoint
  @Post('internal/currencies/update-rates')
  triggerRatesUpdate() {
    return this.intl.triggerExchangeRatesUpdate();
  }
}

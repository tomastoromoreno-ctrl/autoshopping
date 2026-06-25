import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { LegalService } from './legal.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('legal')
export class LegalController {
  constructor(private readonly legalService: LegalService) {}

  // Protected endpoints (dashboard)
  @Get()
  @UseGuards(AuthGuard)
  listDocuments(@Req() req: any) {
    return this.legalService.listDocuments(req.user.tenant_id);
  }

  @Post('generate')
  @UseGuards(AuthGuard)
  generateDocument(@Req() req: any, @Body() body: { type: string }) {
    return this.legalService.generateDocument(req.user.tenant_id, body.type);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  updateDocument(@Req() req: any, @Param('id') id: string, @Body() body: { content: string }) {
    return this.legalService.updateDocument(req.user.tenant_id, id, body.content);
  }

  @Patch(':id/toggle')
  @UseGuards(AuthGuard)
  toggleActive(@Req() req: any, @Param('id') id: string, @Body() body: { is_active: boolean }) {
    return this.legalService.toggleActive(req.user.tenant_id, id, body.is_active);
  }

  // Public endpoint (storefront)
  @Get('public/:subdomain/:type')
  getPublicDocument(@Param('subdomain') subdomain: string, @Param('type') type: string) {
    return this.legalService.getPublicDocument(subdomain, type);
  }
}

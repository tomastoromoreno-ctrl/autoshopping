import { Module } from '@nestjs/common';
import { InvoicingService } from './invoicing.service';
import { InvoicingController } from './invoicing.controller';
import { InvoicePdfService } from './invoice-pdf.service';

@Module({
  controllers: [InvoicingController],
  providers: [InvoicingService, InvoicePdfService],
  exports: [InvoicingService, InvoicePdfService],
})
export class InvoicingModule {}

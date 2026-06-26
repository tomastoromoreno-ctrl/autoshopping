import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class InvoicePdfService {
  generateInvoicePdf(invoice: any, config: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const blue = '#2563eb';
      const gray = '#6b7280';
      const lightGray = '#f3f4f6';
      const dark = '#1f2937';

      const w = doc.page.width - 100;
      let y = 50;

      const formatClp = (amount: number): string =>
        '$' + Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

      // Header background
      doc.rect(0, 0, doc.page.width, 110).fill(blue);
      doc.fill('#ffffff');
      doc.font('Helvetica-Bold').fontSize(22).text(
        invoice.type === 'factura' ? 'FACTURA ELECTRÓNICA' : 'BOLETA ELECTRÓNICA',
        50, 30,
      );
      doc.font('Helvetica').fontSize(10).text(
        `Folio: ${invoice.folio || '—'}    Código SII: ${invoice.sii_code || '—'}`,
        50, 60,
      );
      doc.fontSize(8).text(
        `Fecha: ${new Date().toLocaleDateString('es-CL')}`,
        50, 78,
      );
      doc.fontSize(8).text(
        `Documento Tributario Electrónico - SII Chile`,
        50, 93,
      );

      // Store info
      y = 130;
      doc.fill(dark);
      doc.font('Helvetica-Bold').fontSize(10).text('EMISOR', 50, y);
      y += 15;
      doc.font('Helvetica').fontSize(9);
      doc.text(`Razón Social: ${config.razon_social || invoice.razon_social_emisor || '—'}`, 50, y);
      y += 13;
      doc.text(`RUT: ${config.rut_empresa || invoice.rut_emisor || '—'}`, 50, y);
      if (config.giro) { y += 13; doc.text(`Giro: ${config.giro}`, 50, y); }
      if (config.direccion) { y += 13; doc.text(`Dirección: ${config.direccion}`, 50, y); }

      // Customer info
      y = 130;
      doc.font('Helvetica-Bold').fontSize(10).text('RECEPTOR', 300, y);
      y += 15;
      doc.font('Helvetica').fontSize(9);
      doc.text(`Nombre: ${invoice.customer_name || '—'}`, 300, y);
      y += 13;
      doc.text(`RUT: ${invoice.customer_rut || '—'}`, 300, y);
      if (invoice.customer_email) { y += 13; doc.text(`Email: ${invoice.customer_email}`, 300, y); }

      // Separator
      y = 210;
      doc.strokeColor(blue).lineWidth(2).moveTo(50, y).lineTo(w + 50, y).stroke();

      // Items table header
      y = 220;
      doc.rect(50, y, w, 20).fill(lightGray);
      doc.fill(dark);
      doc.font('Helvetica-Bold').fontSize(9);
      doc.text('Cant.', 60, y + 6, { width: 40, align: 'center' });
      doc.text('Descripción', 110, y + 6, { width: 250 });
      doc.text('P. Unitario', 360, y + 6, { width: 100, align: 'right' });
      doc.text('Total', 460, y + 6, { width: 90, align: 'right' });
      y += 24;

      // Items rows
      const items = invoice.items || [];
      doc.font('Helvetica').fontSize(9);
      for (const item of items) {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }
        doc.fill(dark);
        doc.text(String(item.quantity || 1), 60, y, { width: 40, align: 'center' });
        doc.text(item.product_name || item.nombre || item.description || '—', 110, y, { width: 240 });
        doc.text(formatClp(Number(item.unit_price) || 0), 360, y, { width: 100, align: 'right' });
        doc.text(
          formatClp((Number(item.unit_price) || 0) * (Number(item.quantity) || 1)),
          460, y, { width: 90, align: 'right' },
        );
        y += 18;

        // Row separator
        doc.strokeColor('#e5e7eb').lineWidth(0.5).moveTo(50, y).lineTo(w + 50, y).stroke();
        y += 2;
      }

      // Totals section
      y = Math.max(y + 10, 240);
      const totalX = 360;
      const totalValX = 460;
      const lineH = 16;

      doc.font('Helvetica').fontSize(9);
      doc.fill(gray).text('Neto:', totalX, y, { width: 100, align: 'right' });
      doc.fill(dark).text(formatClp(invoice.net_amount || 0), totalValX, y, { width: 90, align: 'right' });
      y += lineH;

      doc.fill(gray).text('IVA 19%:', totalX, y, { width: 100, align: 'right' });
      doc.fill(dark).text(formatClp(invoice.tax_amount || 0), totalValX, y, { width: 90, align: 'right' });
      y += lineH;

      doc.strokeColor(blue).lineWidth(1).moveTo(totalX - 10, y).lineTo(totalValX + 90, y).stroke();
      y += 4;

      doc.font('Helvetica-Bold').fontSize(11);
      doc.fill(blue).text('TOTAL:', totalX, y, { width: 100, align: 'right' });
      doc.fill(blue).text(formatClp(invoice.total || 0), totalValX, y, { width: 90, align: 'right' });
      y += 28;

      // QR code placeholder
      if (y > 680) {
        doc.addPage();
        y = 50;
      }
      const qrSize = 80;
      doc.rect(50, y, qrSize, qrSize).stroke(blue);
      doc.fill(gray).font('Helvetica').fontSize(7).text(
        'Código QR SII',
        50 + qrSize / 2 - 20, y + qrSize / 2 - 4,
        { width: 40, align: 'center' },
      );

      // SII Resolution info
      doc.fontSize(7).fill(gray);
      const resText =
        `Resolución SII N° 80 de 2024 — Ambiente de ${config.sii_environment === 'production' ? 'Producción' : 'Certificación'}`;
      doc.text(resText, 150, y + 10, { width: 350 });
      doc.text('Timbre Electrónico SII — Verifique documento en www.sii.cl', 150, y + 24, { width: 350 });

      // Footer
      doc.fontSize(7).fill(gray);
      doc.text(
        'Documento Tributario Electrónico | Este documento no requiere firma ni timbre húmedo.',
        50, doc.page.height - 40,
        { width: w, align: 'center' },
      );

      doc.end();
    });
  }
}

import { Injectable } from '@nestjs/common';
import PDFDocument = require('pdfkit');
import * as fs from 'fs';
import * as path from 'path';
import QRCode from 'qrcode';

@Injectable()
export class PdfService {
  private mmToPt(mm: number): number {
    return mm * 2.834645669291337;
  }

  async gerarCautela(item: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 0, left: 0, right: 0, bottom: 0 },
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const pageWidth = this.mmToPt(210);
      const pageHeight = this.mmToPt(297);

      // CabeÃ§alho com fundo azul escuro
      doc
        .rect(0, 0, pageWidth, this.mmToPt(38))
        .fillAndStroke('#0f163a', '#0f163a');

      // Textos do cabeÃ§alho (em branco)
      doc.fillColor('#ffffff');
      doc.font('Helvetica-Bold');
      doc.fontSize(11);
      doc.text(
        'POLÃCIA MILITAR DE PERNAMBUCO  |  DTEC - atlas V2',
        this.mmToPt(20),
        this.mmToPt(14),
      );

      doc.fontSize(18);
      doc.text('CAUTELA DE MATERIAL', this.mmToPt(20), this.mmToPt(22));

      doc.fontSize(9);
      doc.text(`NÂº CAU-${Date.now()}`, this.mmToPt(20), this.mmToPt(30));

      // Corpo do documento
      doc.fillColor('#000000');
      doc.font('Helvetica');

      let cursorY = this.mmToPt(50);

      // DeclaraÃ§Ã£o
      const dataAtual = new Date().toLocaleDateString('pt-BR');
      const horaAtual = new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const isVencido =
        item.dataRetornoEmprestimo &&
        new Date(item.dataRetornoEmprestimo) < new Date();

      if (isVencido) {
        doc
          .rect(
            this.mmToPt(15),
            cursorY - this.mmToPt(12),
            this.mmToPt(180),
            this.mmToPt(12),
          )
          .fillAndStroke('#fde2e4', '#fde2e4');
        doc.fillColor('#9b0000');
        doc.font('Helvetica-Bold');
        doc.fontSize(10);
        doc.text(
          'ATENÃ‡ÃƒO: EMPRESTIMO VENCIDO â€” DEVOLUÃ‡ÃƒO EM ATRASO',
          this.mmToPt(20),
          cursorY - this.mmToPt(8),
        );
        cursorY -= this.mmToPt(20);
      }

      // Texto de declaraÃ§Ã£o
      doc.fillColor('#333333');
      doc.font('Helvetica');
      doc.fontSize(11);
      const declaracao =
        'Pelo presente termo, declaro ter recebido da carga do atlas/PMPE o material descrito abaixo, assumindo plena responsabilidade por sua guarda e conservaÃ§Ã£o:';
      doc.text(declaracao, this.mmToPt(16), cursorY, {
        width: this.mmToPt(178),
      });

      cursorY -= this.mmToPt(30);

      // Dados do material
      doc.font('Helvetica-Bold');
      doc.fontSize(10);
      const dados = [
        ['PatrimÃ´nio atlas', item.patrimonio || 'â€”'],
        ['Tipo de Material', item.tipoEquipamento?.nome || 'â€”'],
        ['Marca', item.marca?.nome || 'â€”'],
        ['NÃºmero de SÃ©rie', item.numeroSerie || 'â€”'],
        ['SeÃ§Ã£o / Unidade', item.secao?.sigla || 'â€”'],
        [
          'Data da SaÃ­da',
          item.dataSolicitacao
            ? new Date(item.dataSolicitacao).toLocaleDateString('pt-BR')
            : dataAtual,
        ],
      ];

      for (const [label, value] of dados) {
        doc.text(label as string, this.mmToPt(16), cursorY);
        doc.font('Helvetica');
        doc.text(String(value), this.mmToPt(90), cursorY);
        doc.font('Helvetica-Bold');
        cursorY -= this.mmToPt(7);
      }

      // Termo de responsabilidade
      cursorY -= this.mmToPt(4);
      doc
        .rect(
          this.mmToPt(15),
          cursorY - this.mmToPt(38),
          this.mmToPt(180),
          this.mmToPt(38),
        )
        .fillAndStroke('#f1f5fb', '#f1f5fb');

      doc.fillColor('#000000');
      doc.text(
        'TERMO DE RESPONSABILIDADE',
        this.mmToPt(20),
        cursorY - this.mmToPt(6),
      );

      doc.font('Helvetica');
      doc.fontSize(10);
      const termo =
        'Comprometo-me a zelar pela integridade do material acima descrito, utilizando-o estritamente para o servico policial militar. Em caso de extravio, dano por negligencia ou mau uso, assumo a responsabilidade administrativa, civil e penal, conforme as normas vigentes da PMPE.';
      doc.text(termo, this.mmToPt(20), cursorY - this.mmToPt(12), {
        width: this.mmToPt(170),
      });

      // RodapÃ©
      doc.fontSize(7);
      doc.text(
        `Documento gerado automaticamente pelo atlas em ${dataAtual} Ã s ${horaAtual}`,
        this.mmToPt(20),
        this.mmToPt(18),
      );

      doc.end();
    });
  }

  // Duplicate gerarEtiqueta implementation removed
  async gerarEtiqueta(item: any): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      // Determine label orientation and dimensions (mm)
      const isVertical = item.layout === 'vertical';
      const widthMm = isVertical ? 40 : 60; // label width in mm
      const heightMm = isVertical ? 60 : 40; // label height in mm

      // Create A4 PDF document to hold five labels
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 0, left: 0, right: 0, bottom: 0 },
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Convert label dimensions to points (pdfkit uses points)
      const labelWidthPt = this.mmToPt(widthMm);
      const labelHeightPt = this.mmToPt(heightMm);
      const pageWidth = this.mmToPt(210); // A4 width in points

      // Prepare QR code and logo buffers (reuse for all labels)
      const qrContent = `https://atlas.local/etiqueta/${item.patrimonio}`;
      const qrDataUrl = await QRCode.toDataURL(qrContent);
      const qrBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, '');
      const qrBuffer = Buffer.from(qrBase64, 'base64');
      const logoPath = path.resolve(
        __dirname,
        '../../../../atlas-frontend/src/assets/cropped-logo-pmpe-150x150.png',
      );
      const logoBuffer = fs.readFileSync(logoPath);

      // Helper to draw a single label at a given vertical offset
      const drawLabel = (offsetY: number) => {
        // Header (premium background)
        const headerHeight = this.mmToPt(9);
        doc
          .rect(0, offsetY, labelWidthPt, headerHeight)
          .fillAndStroke('#0f163a', '#0f163a');

        // Logo in header left corner
        const logoWidthMm = 4;
        const logoX = this.mmToPt(2);
        const logoY = offsetY + (headerHeight - this.mmToPt(logoWidthMm)) / 2;
        doc.image(logoBuffer, logoX, logoY, {
          width: this.mmToPt(logoWidthMm),
        });

        // Centered header text
        doc.fillColor('#ffffff');
        doc.font('Helvetica-Bold');
        const headerTextX =
          this.mmToPt(2) + this.mmToPt(logoWidthMm) + this.mmToPt(1);
        const headerTextWidth = labelWidthPt - headerTextX - this.mmToPt(2);
        doc.fontSize(3);
        doc.text(
          'POLÃCIA MILITAR DE PERNAMBUCO',
          headerTextX,
          offsetY + this.mmToPt(1.5),
          { width: headerTextWidth, align: 'center' },
        );

        // Adjust body top and QR size based on orientation
        const bodyTop =
          offsetY + headerHeight + this.mmToPt(isVertical ? 1 : 0.5);
        const columnGap = this.mmToPt(1);
        const columnWidth = (labelWidthPt - columnGap) / 2;
        const qrSize = this.mmToPt(18); // larger QR for better scanability
        const qrX = labelWidthPt - qrSize - this.mmToPt(2);
        const qrY = bodyTop;
        doc.image(qrBuffer, qrX, qrY, { width: qrSize });

        // Left column
        const leftX = this.mmToPt(2);
        doc.fillColor('#000000');
        // Left column (starts at top after header)
        doc.font('Helvetica-Bold');
        doc.fontSize(3);
        doc.text('PATRIMÃ”NIO', leftX, bodyTop + this.mmToPt(2));
        doc.font('Helvetica');
        doc.fontSize(5);
        doc.text(item.patrimonio || 'S/PAT', leftX, bodyTop + this.mmToPt(5));
        doc.font('Helvetica-Bold');
        doc.fontSize(4);
        doc.text('TIPO DE MATERIAL', leftX, bodyTop + this.mmToPt(9));
        doc.font('Helvetica');
        doc.fontSize(5);
        doc.text(
          item.tipoEquipamento?.nome || 'â€”',
          leftX,
          bodyTop + this.mmToPt(11),
        );
        doc.font('Helvetica-Bold');
        doc.fontSize(4);
        doc.text('MARCA / MODELO', leftX, bodyTop + this.mmToPt(15));
        doc.font('Helvetica');
        doc.fontSize(5);
        const marca =
          `${item.marca?.nome || 'â€”'} ${item.modelo?.nome || ''}`.trim();
        doc.text(marca, leftX, bodyTop + this.mmToPt(17));

        // Section / Unidade placed below QR code
        const secY = bodyTop + qrSize + this.mmToPt(20);
        doc.font('Helvetica-Bold');
        doc.fontSize(4);
        doc.text('SEÃ‡ÃƒO / UNIDADE', qrX, secY, {
          width: qrSize,
          align: 'center',
        });
        doc.fontSize(5);
        doc.text(item.secao?.sigla || 'DTEC', qrX, secY + this.mmToPt(3), {
          width: qrSize,
          align: 'center',
        });

        // Footer (premium background)
        const footerHeight = this.mmToPt(9);
        doc
          .rect(
            0,
            offsetY + labelHeightPt - footerHeight,
            labelWidthPt,
            footerHeight,
          )
          .fillAndStroke('#0f163a', '#0f163a');
        doc.fillColor('#ffffff');
        doc.font('Helvetica-Bold');
        doc.fontSize(4);
        doc.text(
          'DTECâ€‘UTEL',
          this.mmToPt(2),
          offsetY + labelHeightPt - footerHeight + this.mmToPt(2),
          { width: labelWidthPt - this.mmToPt(4), align: 'center' },
        );
        doc.font('Helvetica');
        doc.fontSize(3);
        doc.text(
          'DTEC / SISTEMAS AUDITORIA VIA QR CODE',
          this.mmToPt(2),
          offsetY + labelHeightPt - footerHeight + this.mmToPt(5),
          { width: labelWidthPt - this.mmToPt(4), align: 'center' },
        );
      };

      // Draw a single label (no stacking)
      const offsetY = 0;
      drawLabel(offsetY);

      doc.end();
    });
  }

  async gerarTabelaPDF(
    titulo: string,
    subtitulo: string,
    colunas: string[],
    linhas: string[][],
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: [this.mmToPt(297), this.mmToPt(210)],
        margin: this.mmToPt(16),
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const margin = this.mmToPt(16);
      let cursorY = doc.page.height - margin;

      // TÃ­tulo
      doc.font('Helvetica-Bold');
      doc.fontSize(14);
      doc.text(titulo, margin, cursorY);

      cursorY -= this.mmToPt(7);

      // SubtÃ­tulo
      doc.font('Helvetica');
      doc.fontSize(9);
      doc.text(subtitulo, margin, cursorY);

      cursorY -= this.mmToPt(11);

      // CabeÃ§alho da tabela
      doc.font('Helvetica-Bold');
      doc.fontSize(8);
      doc.text(colunas.join(' | '), margin, cursorY);

      cursorY -= this.mmToPt(6.5);

      // Linhas da tabela
      doc.font('Helvetica');
      for (const row of linhas) {
        if (cursorY < margin + this.mmToPt(10)) {
          doc.addPage();
          cursorY = doc.page.height - margin;
        }

        const rowText = row
          .map((cell, index) => {
            const value = String(cell || '')
              .replace(/\s+/g, ' ')
              .trim();
            return value.length > 32 ? value.slice(0, 29) + '...' : value;
          })
          .join(' | ');

        doc.fontSize(8);
        doc.text(rowText, margin, cursorY);
        cursorY -= this.mmToPt(6.5);
      }

      doc.end();
    });
  }
}

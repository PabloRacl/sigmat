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

      // Cabeçalho com fundo azul escuro
      doc
        .rect(0, 0, pageWidth, this.mmToPt(38))
        .fillAndStroke('#0f163a', '#0f163a');

      // Textos do cabeçalho (em branco)
      doc.fillColor('#ffffff');
      doc.font('Helvetica-Bold');
      doc.fontSize(11);
      doc.text(
        'POLÍCIA MILITAR DE PERNAMBUCO  |  DTEC - atlas V2',
        this.mmToPt(20),
        this.mmToPt(14),
      );

      doc.fontSize(18);
      doc.text('CAUTELA DE MATERIAL', this.mmToPt(20), this.mmToPt(22));

      doc.fontSize(9);
      doc.text(`Nº CAU-${Date.now()}`, this.mmToPt(20), this.mmToPt(30));

      // Corpo do documento
      doc.fillColor('#000000');
      doc.font('Helvetica');

      let cursorY = this.mmToPt(50);

      // Declaração
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
          'ATENÇÃO: EMPRÉSTIMO VENCIDO — DEVOLUÇÃO EM ATRASO',
          this.mmToPt(20),
          cursorY - this.mmToPt(8),
        );
        cursorY -= this.mmToPt(20);
      }

      // Texto de declaração
      doc.fillColor('#333333');
      doc.font('Helvetica');
      doc.fontSize(11);
      const declaracao =
        'Pelo presente termo, declaro ter recebido da carga do atlas/PMPE o material descrito abaixo, assumindo plena responsabilidade por sua guarda e conservação:';
      doc.text(declaracao, this.mmToPt(16), cursorY, {
        width: this.mmToPt(178),
      });

      cursorY -= this.mmToPt(30);

      // Dados do material
      doc.font('Helvetica-Bold');
      doc.fontSize(10);
      const dados = [
        ['Patrimônio atlas', item.patrimonio || '—'],
        ['Tipo de Material', item.tipoEquipamento?.nome || '—'],
        ['Marca', item.marca?.nome || '—'],
        ['Número de Série', item.numeroSerie || '—'],
        ['Seção / Unidade', item.secao?.sigla || '—'],
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

      // Rodapé
      doc.fontSize(7);
      doc.text(
        `Documento gerado automaticamente pelo atlas em ${dataAtual} às ${horaAtual}`,
        this.mmToPt(20),
        this.mmToPt(18),
      );
      doc.end();
    });
  }

  async gerarEtiqueta(item: any): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      // Check if item is celular to apply custom layout
      const isCelular = item.tipoEquipamento?.nome?.toLowerCase() === 'celular';
      const isVertical = isCelular || item.layout === 'vertical';
      const widthMm = isVertical ? 40 : 60; // label width in mm
      const heightMm = isVertical ? 60 : 40; // label height in mm

      // Convert label dimensions to points (pdfkit uses points)
      const labelWidthPt = this.mmToPt(widthMm);
      const labelHeightPt = this.mmToPt(heightMm);

      // Create PDF document with exact label size
      const doc = new PDFDocument({
        size: [labelWidthPt, labelHeightPt],
        margins: { top: 0, left: 0, right: 0, bottom: 0 },
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Prepare QR code and logo buffers
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
      const qrContent = `${frontendUrl}/qrcode/${item.id}`;
      const qrDataUrl = await QRCode.toDataURL(qrContent, { margin: 1 });
      const qrBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, '');
      const qrBuffer = Buffer.from(qrBase64, 'base64');
      const logoPath = path.resolve(
        __dirname,
        '../../../../atlas-frontend/src/assets/cropped-logo-pmpe-150x150.png',
      );
      const logoBuffer = fs.readFileSync(logoPath);

      // Parse specs JSON safely
      let specs: any = {};
      if (item.especificacoes) {
        if (typeof item.especificacoes === 'string') {
          try {
            specs = JSON.parse(item.especificacoes);
          } catch {
            specs = {};
          }
        } else {
          specs = item.especificacoes;
        }
      }
      const imei = specs.imei || specs.imei1 || '—';
      const telefone = specs.telefone || '—';

      // Header (premium gradient background)
      const headerHeight = this.mmToPt(isCelular ? 11 : 8);
      const headerGrad = doc.linearGradient(0, 0, labelWidthPt, 0);
      headerGrad.stop(0, '#2563eb');
      headerGrad.stop(1, '#1e3a8a');
      doc
        .rect(0, 0, labelWidthPt, headerHeight)
        .fill(headerGrad);

      // Logo in header left corner
      const logoWidthMm = 5;
      const logoX = this.mmToPt(3);
      const logoY = (headerHeight - this.mmToPt(logoWidthMm)) / 2;
      doc.image(logoBuffer, logoX, logoY, {
        width: this.mmToPt(logoWidthMm),
      });

      // Centered header text
      doc.fillColor('#ffffff');
      doc.font('Helvetica-Bold');
      const headerTextX = this.mmToPt(3) + this.mmToPt(logoWidthMm) + this.mmToPt(2);
      const headerTextWidth = labelWidthPt - headerTextX - this.mmToPt(3);

      if (isCelular) {
        doc.fontSize(6);
        doc.text(
          'PMPE',
          headerTextX,
          this.mmToPt(2.2),
          { width: headerTextWidth, align: 'center' },
        );
        doc.fontSize(4.5);
        doc.text(
          'DIRETORIA DE TECNOLOGIA',
          headerTextX,
          this.mmToPt(5.5),
          { width: headerTextWidth, align: 'center' },
        );
      } else {
        doc.fontSize(4.5);
        doc.text(
          'POLÍCIA MILITAR DE PERNAMBUCO',
          headerTextX,
          (headerHeight - 4.5) / 2,
          { width: headerTextWidth, align: 'center' },
        );
      }

      // Footer (premium gradient background)
      const footerHeight = this.mmToPt(7);
      const footerY = labelHeightPt - footerHeight;
      const footerGrad = doc.linearGradient(0, footerY, labelWidthPt, footerY);
      footerGrad.stop(0, '#2563eb');
      footerGrad.stop(1, '#1e3a8a');
      doc
        .rect(0, footerY, labelWidthPt, footerHeight)
        .fill(footerGrad);

      doc.fillColor('#ffffff');
      doc.font('Helvetica-Bold');
      doc.fontSize(4.5);
      doc.text(
        'DTEC ‑ UTEL',
        this.mmToPt(2),
        footerY + this.mmToPt(1.5),
        { width: labelWidthPt - this.mmToPt(4), align: 'center' },
      );
      doc.font('Helvetica');
      doc.fontSize(3.5);
      doc.text(
        'DTEC / SISTEMAS AUDITORIA VIA QR CODE',
        this.mmToPt(2),
        footerY + this.mmToPt(3.8),
        { width: labelWidthPt - this.mmToPt(4), align: 'center' },
      );

      // Body layout
      doc.fillColor('#000000');
      const textX = this.mmToPt(3);

      if (isVertical) {
        // Vertical Layout: 40mm x 60mm
        if (isCelular) {
          // Celular stacked layout Y coordinates adjusted for 11mm header
          // Patrimonio
          doc.font('Helvetica-Bold');
          doc.fontSize(4.5);
          doc.text('PATRIMÔNIO', textX, this.mmToPt(13));
          doc.font('Helvetica-Bold');
          doc.fontSize(8.5);
          doc.text(item.patrimonio || 'S/PAT', textX, this.mmToPt(14.5));

          // Telefone
          doc.font('Helvetica-Bold');
          doc.fontSize(4.5);
          doc.text('Nº TELEFONE', textX, this.mmToPt(19.5));
          doc.font('Helvetica');
          doc.fontSize(6);
          doc.text(`N: ${telefone}`, textX, this.mmToPt(21));

          // IMEI
          doc.font('Helvetica-Bold');
          doc.fontSize(4.5);
          doc.text('IMEI', textX, this.mmToPt(25.5));
          doc.font('Helvetica');
          doc.fontSize(6);
          doc.text(imei, textX, this.mmToPt(27));
        } else {
          // Regular vertical layout (10mm starting Y)
          // Patrimonio
          doc.font('Helvetica-Bold');
          doc.fontSize(4.5);
          doc.text('PATRIMÔNIO', textX, this.mmToPt(10));
          doc.font('Helvetica-Bold');
          doc.fontSize(8.5);
          doc.text(item.patrimonio || 'S/PAT', textX, this.mmToPt(11.5));

          // Tipo de Material
          doc.font('Helvetica-Bold');
          doc.fontSize(4.5);
          doc.text('TIPO DE MATERIAL', textX, this.mmToPt(16.5));
          doc.font('Helvetica');
          doc.fontSize(6);
          doc.text(item.tipoEquipamento?.nome || '—', textX, this.mmToPt(18));

          // Marca / Modelo
          doc.font('Helvetica-Bold');
          doc.fontSize(4.5);
          doc.text('MARCA / MODELO', textX, this.mmToPt(22.5));
          doc.font('Helvetica');
          doc.fontSize(6);
          const marca = `${item.marca?.nome || '—'} ${item.modelo?.nome || ''}`.trim();
          doc.text(marca, textX, this.mmToPt(24));

          // Seção / Unidade
          doc.font('Helvetica-Bold');
          doc.fontSize(4.5);
          doc.text('SEÇÃO / UNIDADE', textX, this.mmToPt(28.5));
          doc.font('Helvetica-Bold');
          doc.fontSize(6.5);
          doc.text(item.secao?.sigla || 'DTEC', textX, this.mmToPt(30));
        }

        // QR Code centered horizontally
        const qrSize = this.mmToPt(18);
        const qrX = (labelWidthPt - qrSize) / 2;
        const qrY = this.mmToPt(isCelular ? 32.5 : 34.5);
        doc.image(qrBuffer, qrX, qrY, { width: qrSize });
      } else {
        // Horizontal Layout: 60mm x 40mm
        // Left Column (Text) and Right Column (QR Code)
        const qrSize = this.mmToPt(18);
        const qrX = labelWidthPt - qrSize - this.mmToPt(3);
        const qrY = headerHeight + (labelHeightPt - headerHeight - footerHeight - qrSize) / 2;
        doc.image(qrBuffer, qrX, qrY, { width: qrSize });

        // Patrimonio
        doc.font('Helvetica-Bold');
        doc.fontSize(4.5);
        doc.text('PATRIMÔNIO', textX, this.mmToPt(10.5));
        doc.font('Helvetica-Bold');
        doc.fontSize(7.5);
        doc.text(item.patrimonio || 'S/PAT', textX, this.mmToPt(12));

        // Tipo de Material
        doc.font('Helvetica-Bold');
        doc.fontSize(4.5);
        doc.text('TIPO DE MATERIAL', textX, this.mmToPt(16.5));
        doc.font('Helvetica');
        doc.fontSize(5.5);
        doc.text(item.tipoEquipamento?.nome || '—', textX, this.mmToPt(18));

        // Marca / Modelo
        doc.font('Helvetica-Bold');
        doc.fontSize(4.5);
        doc.text('MARCA / MODELO', textX, this.mmToPt(22));
        doc.font('Helvetica');
        doc.fontSize(5.5);
        const marca = `${item.marca?.nome || '—'} ${item.modelo?.nome || ''}`.trim();
        doc.text(marca, textX, this.mmToPt(23.5));

        // Seção / Unidade
        doc.font('Helvetica-Bold');
        doc.fontSize(4.5);
        doc.text('SEÇÃO / UNIDADE', textX, this.mmToPt(27.5));
        doc.font('Helvetica-Bold');
        doc.fontSize(6);
        doc.text(item.secao?.sigla || 'DTEC', textX, this.mmToPt(29));
      }

      doc.end();
    });
  }

  async gerarTabelaPDF(data: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: this.mmToPt(10), // Reduced margins to fit wide tables
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const margin = this.mmToPt(10);
      const pageWidth = doc.page.width;
      const contentWidth = pageWidth - 2 * margin;
      let cursorY = margin;

      // Function to draw the PMPE Header
      const desenharCabecalho = () => {
        try {
          const logoPath = path.resolve(__dirname, '../../../../atlas-frontend/src/assets/cropped-logo-pmpe-150x150.png');
          const logoSize = this.mmToPt(15);
          doc.image(logoPath, (pageWidth - logoSize) / 2, cursorY, { width: logoSize });
          cursorY += logoSize + this.mmToPt(2);
        } catch (e) {
          // Logo missing fallback
        }

        doc.fillColor('#000000');
        doc.font('Helvetica-Bold');
        doc.fontSize(14);
        doc.text('POLÍCIA MILITAR DE PERNAMBUCO', margin, cursorY, { align: 'center', width: contentWidth });
        cursorY += this.mmToPt(6);

        doc.font('Helvetica');
        doc.fontSize(11);
        doc.text(data.titulo || 'Relatório de Fiscalização', margin, cursorY, { align: 'center', width: contentWidth });
        cursorY += this.mmToPt(5);

        doc.fontSize(8);
        const dateStr = new Date().toLocaleString('pt-BR');
        doc.text(`Gerado em: ${dateStr}`, margin, cursorY, { align: 'center', width: contentWidth });
        cursorY += this.mmToPt(4);

        // Divisor Line
        doc.moveTo(margin, cursorY).lineTo(pageWidth - margin, cursorY).lineWidth(0.5).stroke('#aaaaaa');
        cursorY += this.mmToPt(4);

        // Fiscal Metadata
        doc.font('Helvetica');
        doc.fontSize(9);
        const yMetadata = cursorY;
        
        doc.text('Fiscal:', margin, yMetadata);
        doc.font('Helvetica-Bold');
        doc.text(data.fiscal?.toUpperCase() || '—', margin + this.mmToPt(12), yMetadata);

        doc.font('Helvetica');
        doc.text('Matrícula:', margin + this.mmToPt(120), yMetadata);
        doc.font('Helvetica-Bold');
        doc.text(data.matricula || '—', margin + this.mmToPt(135), yMetadata);

        cursorY += this.mmToPt(5);

        doc.font('Helvetica');
        doc.text('OME:', margin, cursorY);
        doc.font('Helvetica-Bold');
        doc.text(data.ome?.toUpperCase() || '—', margin + this.mmToPt(12), cursorY);

        cursorY += this.mmToPt(6);
      };

      const checkPageBreak = (neededHeight: number) => {
        if (cursorY + neededHeight > doc.page.height - margin) {
          doc.addPage();
          cursorY = margin;
          desenharCabecalho();
        }
      };

      desenharCabecalho();

      // Fallback para Cautela Coletiva Antiga caso não passe 'grupos'
      const grupos = data.grupos && data.grupos.length > 0 ? data.grupos : [{
        colunas: data.colunas,
        linhas: data.linhas
      }];

      for (const grupo of grupos) {
        checkPageBreak(this.mmToPt(50));

        // Group Header (Operação, Local, etc)
        if (grupo.operacao || grupo.tituloGeral) {
          cursorY += this.mmToPt(4);
          doc.font('Helvetica');
          doc.fontSize(9);
          
          const col1X = margin;
          const val1X = margin + this.mmToPt(25);
          const col2X = margin + this.mmToPt(100);
          const val2X = margin + this.mmToPt(120);

          let gy = cursorY;

          // Row 1
          doc.text('Operação:', col1X, gy);
          doc.font('Helvetica-Bold');
          doc.text((grupo.operacao || grupo.tituloGeral || '').toUpperCase(), val1X, gy);

          doc.font('Helvetica');
          doc.text('Evento:', col2X, gy);
          doc.font('Helvetica-Bold');
          doc.text((grupo.evento || '').toUpperCase(), val2X, gy);

          gy += this.mmToPt(5);

          // Row 2
          doc.font('Helvetica');
          doc.text('Local:', col1X, gy);
          doc.font('Helvetica-Bold');
          doc.text((grupo.local || '').toUpperCase(), val1X, gy);

          doc.font('Helvetica');
          doc.text('Data:', col2X, gy);
          doc.font('Helvetica-Bold');
          doc.text((grupo.data || '').toUpperCase(), val2X, gy);

          gy += this.mmToPt(5);

          // Row 3
          doc.font('Helvetica');
          doc.text('Ome Beneficiada:', col1X, gy);
          doc.font('Helvetica-Bold');
          doc.text((grupo.omeBeneficiada || '').toUpperCase(), val1X, gy);

          doc.font('Helvetica');
          doc.text('Período:', col2X, gy);
          doc.font('Helvetica-Bold');
          doc.text((grupo.periodo || '').toUpperCase(), val2X, gy);

          gy += this.mmToPt(5);

          // Row 4
          doc.font('Helvetica');
          doc.text('Ome Cedente:', col1X, gy);
          doc.font('Helvetica-Bold');
          doc.text((grupo.omeCedente || '').toUpperCase(), val1X, gy);

          doc.font('Helvetica');
          doc.text('Modalidade:', col2X, gy);
          doc.font('Helvetica-Bold');
          doc.text((grupo.modalidade || '').toUpperCase(), val2X, gy);

          cursorY = gy + this.mmToPt(8);
        }

        // Draw Table
        const rowHeight = this.mmToPt(7);
        const colunas = grupo.colunas || [];
        const linhas = grupo.linhas || [];
        
        if (colunas.length === 0) continue;

        const colWidth = contentWidth / colunas.length;

        // Table Header
        checkPageBreak(rowHeight * 2);
        
        doc.rect(margin, cursorY, contentWidth, rowHeight).fill('#1E3A5F');
        doc.fillColor('#ffffff');
        doc.font('Helvetica-Bold');
        doc.fontSize(8);

        for (let i = 0; i < colunas.length; i++) {
          doc.text(colunas[i], margin + (i * colWidth), cursorY + this.mmToPt(2), {
            width: colWidth,
            align: 'center'
          });
          // Draw vertical separator
          if (i > 0) {
            doc.moveTo(margin + (i * colWidth), cursorY).lineTo(margin + (i * colWidth), cursorY + rowHeight).lineWidth(0.5).stroke('#4a6080');
          }
        }
        cursorY += rowHeight;

        // Table Rows
        doc.fillColor('#333333');
        doc.font('Helvetica');
        
        for (let r = 0; r < linhas.length; r++) {
          checkPageBreak(rowHeight);
          
          const rowY = cursorY;
          // Row Background (Zebra)
          if (r % 2 === 0) {
            doc.rect(margin, rowY, contentWidth, rowHeight).fill('#f9fafb');
          }
          
          doc.fillColor('#000000');
          for (let c = 0; c < colunas.length; c++) {
            const val = String(linhas[r][c] || '').replace(/\s+/g, ' ').trim();
            // Truncate if too long
            const truncated = val.length > 50 ? val.substring(0, 47) + '...' : val;
            
            doc.text(truncated, margin + (c * colWidth) + this.mmToPt(1), rowY + this.mmToPt(2), {
              width: colWidth - this.mmToPt(2),
              align: 'center'
            });

            // Vertical line
            doc.moveTo(margin + (c * colWidth), rowY).lineTo(margin + (c * colWidth), rowY + rowHeight).lineWidth(0.5).stroke('#e5e7eb');
          }
          
          // Outer right border and bottom border
          doc.moveTo(margin + contentWidth, rowY).lineTo(margin + contentWidth, rowY + rowHeight).stroke('#e5e7eb');
          doc.moveTo(margin, rowY + rowHeight).lineTo(margin + contentWidth, rowY + rowHeight).stroke('#e5e7eb');
          
          cursorY += rowHeight;
        }

        // Faltas / Remanejamentos blocks (optional, as seen in image)
        cursorY += this.mmToPt(8);
      }

      doc.end();
    });
  }
}

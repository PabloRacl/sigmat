import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PdfService {
  private mmToPt(mm: number): number {
    return mm * 2.834645669291337;
  }

  private async loadPdfLib(): Promise<typeof import('pdf-lib')> {
    return await import('pdf-lib');
  }

  private async loadFileSaver(): Promise<{ saveAs: (blob: Blob, fileName: string) => void }> {
    const fileSaver = await import('file-saver-es');
    return (fileSaver.default ?? fileSaver) as { saveAs: (blob: Blob, fileName: string) => void };
  }

  private async savePdf(bytes: Uint8Array, fileName: string) {
    const fileSaver = await this.loadFileSaver();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    fileSaver.saveAs(blob, fileName);
  }

  private async loadQRCode(): Promise<typeof import('@nuintun/qrcode')> {
    return await import('@nuintun/qrcode');
  }

  private wrapText(text: string, font: any, size: number, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let current = '';

    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) <= maxWidth) {
        current = test;
      } else {
        if (current) {
          lines.push(current);
        }
        current = word;
      }
    }

    if (current) {
      lines.push(current);
    }

    return lines;
  }

  private gerarQRCodeDataUrl(encoded: any, moduleSize = 4, margin = 2): string {
    const size = encoded.size;
    const canvasSize = (size + margin * 2) * moduleSize;
    const canvas = document.createElement('canvas');
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas não disponível para gerar QR Code');
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    ctx.fillStyle = '#000000';

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (encoded.get(x, y)) {
          ctx.fillRect((x + margin) * moduleSize, (y + margin) * moduleSize, moduleSize, moduleSize);
        }
      }
    }

    return canvas.toDataURL('image/png');
  }

  private formatarChave(chave: string): string {
    return chave
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private drawWrappedText(page: any, text: string, x: number, y: number, font: any, size: number, maxWidth: number, lineHeight: number, color: any) {
    const lines = this.wrapText(text, font, size, maxWidth);
    let cursorY = y;
    for (const line of lines) {
      page.drawText(line, {
        x,
        y: cursorY,
        size,
        font,
        color
      });
      cursorY -= lineHeight;
    }
    return cursorY;
  }

  async gerarCautela(item: any) {
    const pdfLib = await this.loadPdfLib();
    const { PDFDocument, rgb, StandardFonts } = pdfLib;
    const pdfDoc = await PDFDocument.create();
    const pageWidth = this.mmToPt(210);
    const pageHeight = this.mmToPt(297);
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const isVencido = item.dataRetornoEmprestimo && new Date(item.dataRetornoEmprestimo) < new Date();
    const numeroCautela = `CAU-${Date.now()}`;

    page.drawRectangle({
      x: 0,
      y: pageHeight - this.mmToPt(38),
      width: pageWidth,
      height: this.mmToPt(38),
      color: rgb(0.0588, 0.0902, 0.1647)
    });

    page.drawText('POLÍCIA MILITAR DE PERNAMBUCO  |  DTEC - SIGMAT V2', {
      x: this.mmToPt(20),
      y: pageHeight - this.mmToPt(14),
      size: 11,
      font: font,
      color: rgb(1, 1, 1)
    });

    page.drawText('CAUTELA DE MATERIAL', {
      x: this.mmToPt(20),
      y: pageHeight - this.mmToPt(22),
      size: 18,
      font: boldFont,
      color: rgb(1, 1, 1)
    });

    page.drawText(`Nº ${numeroCautela}`, {
      x: this.mmToPt(20),
      y: pageHeight - this.mmToPt(30),
      size: 9,
      font: font,
      color: rgb(1, 1, 1)
    });

    let cursorY = pageHeight - this.mmToPt(50);

    if (isVencido) {
      page.drawRectangle({
        x: this.mmToPt(15),
        y: cursorY - this.mmToPt(12),
        width: this.mmToPt(180),
        height: this.mmToPt(12),
        color: rgb(0.996, 0.886, 0.894)
      });
      page.drawText('ATENCAO: EMPRESTIMO VENCIDO — DEVOLUCAO EM ATRASO', {
        x: this.mmToPt(20),
        y: cursorY - this.mmToPt(8),
        size: 10,
        font: boldFont,
        color: rgb(0.6, 0.106, 0.106)
      });
      cursorY -= this.mmToPt(20);
    }

    const declaracao = 'Pelo presente termo, declaro ter recebido da carga do SIGMAT/PMPE o material descrito abaixo, assumindo plena responsabilidade por sua guarda e conservação:';
    cursorY = this.drawWrappedText(page, declaracao, this.mmToPt(16), cursorY, font, 11, this.mmToPt(178), this.mmToPt(6), rgb(0.2, 0.2, 0.2));
    cursorY -= this.mmToPt(4);

    const rows = [
      ['Patrimônio SIGMAT', item.patrimonio || '—'],
      ['Tipo de Material', item.tipoEquipamento?.nome || '—'],
      ['Marca', item.marca?.nome || '—'],
      ['Número de Série', item.numeroSerie || '—'],
      ['Seção / Unidade', item.secao?.sigla || '—'],
      ['Data da Saída', item.dataSolicitacao ? new Date(item.dataSolicitacao).toLocaleDateString('pt-BR') : dataAtual],
      ['Retorno Previsto', item.dataRetornoEmprestimo ? new Date(item.dataRetornoEmprestimo).toLocaleDateString('pt-BR') + (isVencido ? '  [VENCIDO]' : '') : 'Não informado'],
      ['Solicitante', (item.solicitante || '—').toUpperCase()]
    ];

    for (const [label, value] of rows) {
      page.drawText(label, {
        x: this.mmToPt(16),
        y: cursorY,
        size: 10,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.2)
      });
      page.drawText(value, {
        x: this.mmToPt(90),
        y: cursorY,
        size: 10,
        font,
        color: rgb(0.2, 0.2, 0.2)
      });
      cursorY -= this.mmToPt(7);
    }

    for (const [key, val] of Object.entries(item.especificacoes || {})) {
      page.drawText(this.formatarChave(key), {
        x: this.mmToPt(16),
        y: cursorY,
        size: 10,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.2)
      });
      page.drawText(val ? String(val).toUpperCase() : '—', {
        x: this.mmToPt(90),
        y: cursorY,
        size: 10,
        font,
        color: rgb(0.2, 0.2, 0.2)
      });
      cursorY -= this.mmToPt(7);
    }

    cursorY -= this.mmToPt(4);
    page.drawRectangle({
      x: this.mmToPt(15),
      y: cursorY - this.mmToPt(38),
      width: this.mmToPt(180),
      height: this.mmToPt(38),
      color: rgb(0.945, 0.961, 0.976)
    });
    page.drawText('TERMO DE RESPONSABILIDADE', {
      x: this.mmToPt(20),
      y: cursorY - this.mmToPt(6),
      size: 10,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2)
    });

    const termo = 'Comprometo-me a zelar pela integridade do material acima descrito, utilizando-o estritamente para o servico policial militar. Em caso de extravio, dano por negligencia ou mau uso, assumo a responsabilidade administrativa, civil e penal, conforme as normas vigentes da PMPE.';
    cursorY = this.drawWrappedText(page, termo, this.mmToPt(20), cursorY - this.mmToPt(12), font, 10, this.mmToPt(170), this.mmToPt(5.5), rgb(0.2, 0.2, 0.2));
    cursorY -= this.mmToPt(14);

    page.drawLine({
      start: { x: this.mmToPt(25), y: cursorY },
      end: { x: this.mmToPt(90), y: cursorY },
      thickness: 1,
      color: rgb(0.39, 0.45, 0.55)
    });
    page.drawLine({
      start: { x: this.mmToPt(120), y: cursorY },
      end: { x: this.mmToPt(185), y: cursorY },
      thickness: 1,
      color: rgb(0.39, 0.45, 0.55)
    });
    cursorY -= this.mmToPt(5);

    page.drawText('Assinatura e Matricula do Recebedor', {
      x: this.mmToPt(27),
      y: cursorY,
      size: 9,
      font,
      color: rgb(0.39, 0.45, 0.55)
    });
    page.drawText('Responsavel pela Carga  /  SIGMAT', {
      x: this.mmToPt(125),
      y: cursorY,
      size: 9,
      font,
      color: rgb(0.39, 0.45, 0.55)
    });
    cursorY -= this.mmToPt(8);

    page.drawText((item.solicitante || '').toUpperCase(), {
      x: this.mmToPt(25),
      y: cursorY,
      size: 10,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2)
    });
    page.drawText(`Data: ${dataAtual}`, {
      x: this.mmToPt(25),
      y: cursorY - this.mmToPt(6),
      size: 10,
      font,
      color: rgb(0.2, 0.2, 0.2)
    });

    page.drawText(`Documento gerado automaticamente pelo SIGMAT em ${dataAtual} as ${horaAtual}  |  Cod. ${numeroCautela}`, {
      x: this.mmToPt(20),
      y: this.mmToPt(18),
      size: 7,
      font,
      color: rgb(0.59, 0.59, 0.59)
    });

    const pdfBytes = await pdfDoc.save();
    await this.savePdf(pdfBytes, `cautela_${item.patrimonio}_${dataAtual.replace(/\//g, '-')}.pdf`);
  }

  async gerarCautelaColetiva(itens: any[]) {
    const pdfLib = await this.loadPdfLib();
    const { PDFDocument, rgb, StandardFonts } = pdfLib;
    const pdfDoc = await PDFDocument.create();
    const pageWidth = this.mmToPt(210);
    const pageHeight = this.mmToPt(297);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages: any[] = [];

    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const solicitante = (itens[0]?.solicitante || 'VARIOS').toUpperCase();
    const numeroCautela = `COL-${Date.now()}`;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    pages.push(page);
    let cursorY = pageHeight - this.mmToPt(45);

    const addHeader = () => {
      page.drawRectangle({
        x: 0,
        y: pageHeight - this.mmToPt(40),
        width: pageWidth,
        height: this.mmToPt(40),
        color: rgb(0.0588, 0.0902, 0.1647)
      });
      page.drawText('POLÍCIA MILITAR DE PERNAMBUCO  |  DTEC - SIGMAT V2', {
        x: this.mmToPt(20),
        y: pageHeight - this.mmToPt(14),
        size: 11,
        font,
        color: rgb(1, 1, 1)
      });
      page.drawText('CAUTELA COLETIVA DE MATERIAIS', {
        x: this.mmToPt(20),
        y: pageHeight - this.mmToPt(22),
        size: 18,
        font: boldFont,
        color: rgb(1, 1, 1)
      });
      page.drawText(`Nº ${numeroCautela}  |  Total: ${itens.length} itens`, {
        x: this.mmToPt(20),
        y: pageHeight - this.mmToPt(30),
        size: 9,
        font,
        color: rgb(1, 1, 1)
      });
    };

    addHeader();

    const declaracao = `Pelo presente termo, declaro ter recebido da carga do SIGMAT/PMPE os materiais descritos na relacao abaixo, sob a responsabilidade do solicitante ${solicitante}, assumindo plena responsabilidade por sua guarda e conservação:`;
    cursorY = this.drawWrappedText(page, declaracao, this.mmToPt(15), cursorY, font, 11, this.mmToPt(180), this.mmToPt(6), rgb(0.2, 0.2, 0.2));
    cursorY -= this.mmToPt(8);

    const rowHeight = this.mmToPt(8);
    for (let index = 0; index < itens.length; index++) {
      const it = itens[index];
      const line = `${index + 1}. ${it.patrimonio || '—'} | ${it.tipoEquipamento?.nome || '—'} | ${it.marca?.nome || '—'} | ${it.numeroSerie || '—'}`;
      if (cursorY < this.mmToPt(30)) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        pages.push(page);
        cursorY = pageHeight - this.mmToPt(20);
      }
      page.drawText(line, {
        x: this.mmToPt(15),
        y: cursorY,
        size: 9,
        font,
        color: rgb(0.2, 0.2, 0.2)
      });
      cursorY -= rowHeight;
    }

    cursorY -= this.mmToPt(5);
    page.drawRectangle({
      x: this.mmToPt(15),
      y: cursorY - this.mmToPt(35),
      width: this.mmToPt(180),
      height: this.mmToPt(35),
      color: rgb(0.945, 0.961, 0.976)
    });
    page.drawText('TERMO DE RESPONSABILIDADE COLETIVA', {
      x: this.mmToPt(20),
      y: cursorY - this.mmToPt(6),
      size: 9,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2)
    });

    const termo = 'Os materiais listados acima destinam-se exclusivamente ao servico policial militar. O recebedor compromete-se a devolver os itens em perfeito estado. Qualquer alteracao, dano ou extravio deve ser comunicado imediatamente a DTEC via SEI.';
    this.drawWrappedText(page, termo, this.mmToPt(20), cursorY - this.mmToPt(12), font, 9, this.mmToPt(170), this.mmToPt(5), rgb(0.2, 0.2, 0.2));
    cursorY -= this.mmToPt(18);

    if (cursorY < this.mmToPt(40)) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      addHeader();
      cursorY = pageHeight - this.mmToPt(45);
    }

    page.drawLine({
      start: { x: this.mmToPt(25), y: cursorY },
      end: { x: this.mmToPt(90), y: cursorY },
      thickness: 1,
      color: rgb(0.39, 0.45, 0.55)
    });
    page.drawLine({
      start: { x: this.mmToPt(120), y: cursorY },
      end: { x: this.mmToPt(185), y: cursorY },
      thickness: 1,
      color: rgb(0.39, 0.45, 0.55)
    });
    cursorY -= this.mmToPt(8);

    page.drawText('Assinatura do Recebedor', {
      x: this.mmToPt(27),
      y: cursorY,
      size: 8,
      font,
      color: rgb(0.39, 0.45, 0.55)
    });
    page.drawText('Responsável DTEC / SIGMAT', {
      x: this.mmToPt(125),
      y: cursorY,
      size: 8,
      font,
      color: rgb(0.39, 0.45, 0.55)
    });

    page.drawText(`Gerado em: ${dataAtual} às ${horaAtual} | Total: ${itens.length} registros`, {
      x: this.mmToPt(15),
      y: this.mmToPt(15),
      size: 8,
      font,
      color: rgb(0.2, 0.2, 0.2)
    });

    const pdfBytes = await pdfDoc.save();
    await this.savePdf(pdfBytes, `cautela_coletiva_${solicitante.replace(/ /g, '_')}_${dataAtual.replace(/\//g, '-')}.pdf`);
  }

  async gerarEtiquetas(itens: any[]) {
    const pdfLib = await this.loadPdfLib();
    const { PDFDocument, rgb, StandardFonts } = pdfLib;
    const pdfDoc = await PDFDocument.create();
    const pageWidth = this.mmToPt(60);
    const pageHeight = this.mmToPt(40);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    for (let i = 0; i < itens.length; i++) {
      const item = itens[i];
      const page = pdfDoc.addPage([pageWidth, pageHeight]);

      page.drawRectangle({
        x: 0,
        y: pageHeight - this.mmToPt(9),
        width: pageWidth,
        height: this.mmToPt(9),
        color: rgb(0.0588, 0.0902, 0.1647)
      });

      const embX = this.mmToPt(5.5);
      const embY = pageHeight - this.mmToPt(4.5);
      page.drawEllipse({
        x: embX,
        y: embY,
        xScale: this.mmToPt(3.2),
        yScale: this.mmToPt(3.2),
        color: rgb(0.8549, 0.6471, 0.1255)
      });
      page.drawEllipse({
        x: embX,
        y: embY,
        xScale: this.mmToPt(2.8),
        yScale: this.mmToPt(2.8),
        color: rgb(0.0588, 0.0902, 0.1647)
      });
      page.drawLine({
        start: { x: embX, y: embY + this.mmToPt(2.0) },
        end: { x: embX - this.mmToPt(1.6), y: embY - this.mmToPt(1.2) },
        thickness: this.mmToPt(0.2),
        color: rgb(0.8549, 0.6471, 0.1255)
      });
      page.drawLine({
        start: { x: embX - this.mmToPt(1.6), y: embY - this.mmToPt(1.2) },
        end: { x: embX + this.mmToPt(1.6), y: embY - this.mmToPt(1.2) },
        thickness: this.mmToPt(0.2),
        color: rgb(0.8549, 0.6471, 0.1255)
      });
      page.drawLine({
        start: { x: embX + this.mmToPt(1.6), y: embY - this.mmToPt(1.2) },
        end: { x: embX, y: embY + this.mmToPt(2.0) },
        thickness: this.mmToPt(0.2),
        color: rgb(0.8549, 0.6471, 0.1255)
      });
      page.drawLine({
        start: { x: embX, y: embY - this.mmToPt(0.7) },
        end: { x: embX, y: embY + this.mmToPt(1.2) },
        thickness: this.mmToPt(0.2),
        color: rgb(0.0588, 0.0902, 0.1647)
      });
      page.drawLine({
        start: { x: embX - this.mmToPt(0.8), y: embY + this.mmToPt(0.2) },
        end: { x: embX + this.mmToPt(0.8), y: embY + this.mmToPt(0.2) },
        thickness: this.mmToPt(0.2),
        color: rgb(0.0588, 0.0902, 0.1647)
      });

      page.drawText('POLÍCIA MILITAR DE PERNAMBUCO', {
        x: this.mmToPt(10.5),
        y: pageHeight - this.mmToPt(3.8),
        size: 5,
        font: boldFont,
        color: rgb(1, 1, 1)
      });
      page.drawText('SIGMAT — GESTÃO DE PATRIMÔNIO', {
        x: this.mmToPt(10.5),
        y: pageHeight - this.mmToPt(6.8),
        size: 6.2,
        font,
        color: rgb(1, 1, 1)
      });

      try {
        const baseUrl = window.location.origin;
        const equipUrl = `${baseUrl}/qrcode/${item.id}`;
        const qrcode = await this.loadQRCode();
        const encoder = new qrcode.Encoder({ level: 'H' });
        const encoded = encoder.encode(new qrcode.Byte(equipUrl));
        const qrDataUrl = this.gerarQRCodeDataUrl(encoded, 4, 1);
        const qrImage = await pdfDoc.embedPng(qrDataUrl);
        page.drawImage(qrImage, {
          x: this.mmToPt(41),
          y: pageHeight - this.mmToPt(26.5),
          width: this.mmToPt(15),
          height: this.mmToPt(15)
        });
      } catch (err) {
        console.error('Erro ao gerar QR Code para etiqueta:', err);
      }

      page.drawText('PATRIMÔNIO', {
        x: this.mmToPt(4),
        y: this.mmToPt(26.5),
        size: 5,
        font: boldFont,
        color: rgb(0.4706, 0.5098, 0.5686)
      });
      page.drawText(item.patrimonio || 'S/PAT', {
        x: this.mmToPt(4),
        y: this.mmToPt(23.5),
        size: 9,
        font: boldFont,
        color: rgb(0.0588, 0.0902, 0.1647)
      });

      page.drawText('TIPO DE MATERIAL', {
        x: this.mmToPt(4),
        y: this.mmToPt(20),
        size: 5,
        font: boldFont,
        color: rgb(0.4706, 0.5098, 0.5686)
      });
      page.drawText(item.tipoEquipamento?.nome || 'Não Informado', {
        x: this.mmToPt(4),
        y: this.mmToPt(17.5),
        size: 7.2,
        font,
        color: rgb(0.2, 0.2549, 0.3294)
      });

      page.drawText('MARCA / MODELO', {
        x: this.mmToPt(4),
        y: this.mmToPt(14.5),
        size: 5,
        font: boldFont,
        color: rgb(0.4706, 0.5098, 0.5686)
      });
      page.drawText(`${item.marca?.nome || '—'} ${item.modelo?.nome || ''}`, {
        x: this.mmToPt(4),
        y: this.mmToPt(12),
        size: 6.5,
        font,
        color: rgb(0.3922, 0.4588, 0.5451)
      });

      const sectionLabel = 'SEÇÃO / UNIDADE';
      const sectionValue = item.secao?.sigla || 'DTEC';
      const labelWidth = boldFont.widthOfTextAtSize(sectionLabel, 5);
      const valueWidth = boldFont.widthOfTextAtSize(sectionValue, 7.5);
      page.drawText(sectionLabel, {
        x: this.mmToPt(56) - labelWidth,
        y: this.mmToPt(14.5),
        size: 5,
        font: boldFont,
        color: rgb(0.4706, 0.5098, 0.5686)
      });
      page.drawText(sectionValue, {
        x: this.mmToPt(56) - valueWidth,
        y: this.mmToPt(12),
        size: 7.5,
        font: boldFont,
        color: rgb(0.1137, 0.3059, 0.8471)
      });

      page.drawLine({
        start: { x: this.mmToPt(3), y: this.mmToPt(5) },
        end: { x: this.mmToPt(57), y: this.mmToPt(5) },
        thickness: this.mmToPt(0.18),
        color: rgb(0.8863, 0.9098, 0.9412)
      });
      const auditLabel = 'AUDITORIA VIA QR CODE';
      const auditLabelWidth = font.widthOfTextAtSize(auditLabel, 4.8);
      page.drawText('DTEC / SISTEMAS', {
        x: this.mmToPt(4),
        y: this.mmToPt(2.8),
        size: 4.8,
        font,
        color: rgb(0.5804, 0.6392, 0.7216)
      });
      page.drawText(auditLabel, {
        x: this.mmToPt(56) - auditLabelWidth,
        y: this.mmToPt(2.8),
        size: 4.8,
        font,
        color: rgb(0.5804, 0.6392, 0.7216)
      });
    }

    const pdfBytes = await pdfDoc.save();
    await this.savePdf(pdfBytes, `etiquetas_sigmat_${new Date().getTime()}.pdf`);
  }
}


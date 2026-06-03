import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

@Injectable()
export class PdfService {
  private mmToPt(mm: number): number {
    return mm * 2.834645669291337;
  }

  async gerarCautela(item: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 0, left: 0, right: 0, bottom: 0 }
      });

      let buffers: Buffer[] = [];
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
      doc.text('POLÍCIA MILITAR DE PERNAMBUCO  |  DTEC - SIGMAT V2', this.mmToPt(20), this.mmToPt(14));

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
      const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const isVencido = item.dataRetornoEmprestimo && new Date(item.dataRetornoEmprestimo) < new Date();

      if (isVencido) {
        doc
          .rect(this.mmToPt(15), cursorY - this.mmToPt(12), this.mmToPt(180), this.mmToPt(12))
          .fillAndStroke('#fde2e4', '#fde2e4');
        doc.fillColor('#9b0000');
        doc.font('Helvetica-Bold');
        doc.fontSize(10);
        doc.text('ATENÇÃO: EMPRESTIMO VENCIDO — DEVOLUÇÃO EM ATRASO', this.mmToPt(20), cursorY - this.mmToPt(8));
        cursorY -= this.mmToPt(20);
      }

      // Texto de declaração
      doc.fillColor('#333333');
      doc.font('Helvetica');
      doc.fontSize(11);
      const declaracao = 'Pelo presente termo, declaro ter recebido da carga do SIGMAT/PMPE o material descrito abaixo, assumindo plena responsabilidade por sua guarda e conservação:';
      doc.text(declaracao, this.mmToPt(16), cursorY, { width: this.mmToPt(178) });

      cursorY -= this.mmToPt(30);

      // Dados do material
      doc.font('Helvetica-Bold');
      doc.fontSize(10);
      const dados = [
        ['Patrimônio SIGMAT', item.patrimonio || '—'],
        ['Tipo de Material', item.tipoEquipamento?.nome || '—'],
        ['Marca', item.marca?.nome || '—'],
        ['Número de Série', item.numeroSerie || '—'],
        ['Seção / Unidade', item.secao?.sigla || '—'],
        ['Data da Saída', item.dataSolicitacao ? new Date(item.dataSolicitacao).toLocaleDateString('pt-BR') : dataAtual],
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
        .rect(this.mmToPt(15), cursorY - this.mmToPt(38), this.mmToPt(180), this.mmToPt(38))
        .fillAndStroke('#f1f5fb', '#f1f5fb');

      doc.fillColor('#000000');
      doc.text('TERMO DE RESPONSABILIDADE', this.mmToPt(20), cursorY - this.mmToPt(6));

      doc.font('Helvetica');
      doc.fontSize(10);
      const termo = 'Comprometo-me a zelar pela integridade do material acima descrito, utilizando-o estritamente para o servico policial militar. Em caso de extravio, dano por negligencia ou mau uso, assumo a responsabilidade administrativa, civil e penal, conforme as normas vigentes da PMPE.';
      doc.text(termo, this.mmToPt(20), cursorY - this.mmToPt(12), { width: this.mmToPt(170) });

      // Rodapé
      doc.fontSize(7);
      doc.text(`Documento gerado automaticamente pelo SIGMAT em ${dataAtual} às ${horaAtual}`, this.mmToPt(20), this.mmToPt(18));

      doc.end();
    });
  }

  async gerarEtiqueta(item: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: [this.mmToPt(60), this.mmToPt(40)],
        margins: { top: 0, left: 0, right: 0, bottom: 0 }
      });

      let buffers: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const pageWidth = this.mmToPt(60);
      const pageHeight = this.mmToPt(40);

      // Cabeçalho
      doc
        .rect(0, pageHeight - this.mmToPt(9), pageWidth, this.mmToPt(9))
        .fillAndStroke('#0f163a', '#0f163a');

      doc.fillColor('#ffffff');
      doc.font('Helvetica-Bold');
      doc.fontSize(5);
      doc.text('POLÍCIA MILITAR DE PERNAMBUCO', this.mmToPt(10.5), pageHeight - this.mmToPt(3.8));

      doc.fontSize(6.2);
      doc.text('SIGMAT — GESTÃO DE PATRIMÔNIO', this.mmToPt(10.5), pageHeight - this.mmToPt(6.8));

      // Conteúdo
      doc.fillColor('#000000');
      doc.font('Helvetica-Bold');
      doc.fontSize(5);
      doc.text('PATRIMÔNIO', this.mmToPt(4), pageHeight - this.mmToPt(26.5));

      doc.fontSize(9);
      doc.text(item.patrimonio || 'S/PAT', this.mmToPt(4), pageHeight - this.mmToPt(23.5));

      doc.fontSize(5);
      doc.text('TIPO DE MATERIAL', this.mmToPt(4), pageHeight - this.mmToPt(20));

      doc.font('Helvetica');
      doc.fontSize(7.2);
      doc.text(item.tipoEquipamento?.nome || 'Não Informado', this.mmToPt(4), pageHeight - this.mmToPt(17.5));

      doc.font('Helvetica-Bold');
      doc.fontSize(5);
      doc.text('MARCA / MODELO', this.mmToPt(4), pageHeight - this.mmToPt(14.5));

      doc.font('Helvetica');
      doc.fontSize(6.5);
      const marca = `${item.marca?.nome || '—'} ${item.modelo?.nome || ''}`.trim();
      doc.text(marca, this.mmToPt(4), pageHeight - this.mmToPt(12));

      // Seção alinhada à direita
      doc.font('Helvetica-Bold');
      doc.fontSize(5);
      doc.text('SEÇÃO / UNIDADE', this.mmToPt(4), pageHeight - this.mmToPt(14.5), {
        align: 'right',
        width: this.mmToPt(52)
      });

      doc.font('Helvetica-Bold');
      doc.fontSize(7.5);
      doc.text(item.secao?.sigla || 'DTEC', this.mmToPt(4), pageHeight - this.mmToPt(12), {
        align: 'right',
        width: this.mmToPt(52)
      });

      doc.end();
    });
  }

  async gerarTabelaPDF(titulo: string, subtitulo: string, colunas: string[], linhas: string[][]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: [this.mmToPt(297), this.mmToPt(210)],
        margin: this.mmToPt(16)
      });

      let buffers: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const margin = this.mmToPt(16);
      let cursorY = doc.page.height - margin;

      // Título
      doc.font('Helvetica-Bold');
      doc.fontSize(14);
      doc.text(titulo, margin, cursorY);

      cursorY -= this.mmToPt(7);

      // Subtítulo
      doc.font('Helvetica');
      doc.fontSize(9);
      doc.text(subtitulo, margin, cursorY);

      cursorY -= this.mmToPt(11);

      // Cabeçalho da tabela
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
            const value = String(cell || '').replace(/\s+/g, ' ').trim();
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

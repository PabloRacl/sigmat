import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as QRCode from 'qrcode';


@Injectable({ providedIn: 'root' })
export class PdfService {

  gerarCautela(item: any) {
    const doc = new jsPDF();
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const isVencido = item.dataRetornoEmprestimo && new Date(item.dataRetornoEmprestimo) < new Date();

    // ── Faixa de cabeçalho ──────────────────────────────────
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 38, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('POLÍCIA MILITAR DE PERNAMBUCO  |  DTEC - SIGMAT V2', 105, 13, { align: 'center' });

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('CAUTELA DE MATERIAL', 105, 28, { align: 'center' });

    const numeroCautela = `CAU-${Date.now()}`;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nº ${numeroCautela}`, 105, 36, { align: 'center' });

    // ── Aviso de vencimento ─────────────────────────────────
    let curY = 50;
    if (isVencido) {
      doc.setFillColor(254, 226, 226);
      doc.setDrawColor(239, 68, 68);
      doc.roundedRect(15, curY, 180, 12, 3, 3, 'FD');
      doc.setTextColor(153, 27, 27);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('ATENCAO: EMPRESTIMO VENCIDO — DEVOLUCAO EM ATRASO', 105, curY + 8, { align: 'center' });
      curY += 20;
    }

    // ── Declaração ──────────────────────────────────────────
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const declaracao = 'Pelo presente termo, declaro ter recebido da carga do SIGMAT/PMPE o material descrito abaixo, assumindo plena responsabilidade por sua guarda e conservação:';
    const declLines = doc.splitTextToSize(declaracao, 178);
    doc.text(declLines, 16, curY);
    curY += declLines.length * 6 + 6;

    // ── Tabela do equipamento ───────────────────────────────
    autoTable(doc, {
      startY: curY,
      head: [['Campo', 'Informação']],
      body: [
        ['Patrimônio SIGMAT', item.patrimonio || '—'],
        ['Tipo de Material', item.tipoEquipamento?.nome || '—'],
        ['Marca', item.marca?.nome || '—'],
        ['Número de Série', item.numeroSerie || '—'],
        ['Seção / Unidade', item.secao?.sigla || '—'],
        ['Data da Saída', item.dataSolicitacao
          ? new Date(item.dataSolicitacao).toLocaleDateString('pt-BR')
          : dataAtual],
        ['Retorno Previsto', item.dataRetornoEmprestimo
          ? new Date(item.dataRetornoEmprestimo).toLocaleDateString('pt-BR') + (isVencido ? '  [VENCIDO]' : '')
          : 'Não informado'],
        ['Solicitante', (item.solicitante || '—').toUpperCase()],
        // Adiciona campos dinâmicos de especificações se existirem
        ...Object.entries(item.especificacoes || {}).map(([key, val]) => [
          this.formatarChave(key),
          val ? String(val).toUpperCase() : '—'
        ])
      ],
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
      bodyStyles: { fontSize: 10, textColor: [50, 50, 50] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 } },
      margin: { left: 15, right: 15 },
    });

    curY = (doc as any).lastAutoTable.finalY + 12;

    // ── Termo de responsabilidade ───────────────────────────
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(15, curY, 180, 38, 3, 3, 'FD');
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('TERMO DE RESPONSABILIDADE', 105, curY + 7, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    const termo = 'Comprometo-me a zelar pela integridade do material acima descrito, utilizando-o estritamente para o servico policial militar. Em caso de extravio, dano por negligencia ou mau uso, assumo a responsabilidade administrativa, civil e penal, conforme as normas vigentes da PMPE.';
    const termoLines = doc.splitTextToSize(termo, 170);
    doc.text(termoLines, 20, curY + 14);
    curY += 50;

    // ── Assinaturas ─────────────────────────────────────────
    curY += 5;
    doc.setDrawColor(100, 116, 139);
    doc.line(25, curY + 18, 90, curY + 18);
    doc.line(120, curY + 18, 185, curY + 18);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Assinatura e Matricula do Recebedor', 57, curY + 24, { align: 'center' });
    doc.text('Responsavel pela Carga  /  SIGMAT', 152, curY + 24, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'bold');
    doc.text((item.solicitante || '').toUpperCase(), 57, curY + 10, { align: 'center' });
    doc.text(`Data: ${dataAtual}`, 57, curY + 32, { align: 'center' });

    // ── Rodapé ──────────────────────────────────────────────
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Documento gerado automaticamente pelo SIGMAT em ${dataAtual} as ${horaAtual}  |  Cod. ${numeroCautela}`,
      105, 290, { align: 'center' }
    );

    doc.save(`cautela_${item.patrimonio}_${dataAtual.replace(/\//g, '-')}.pdf`);
  }

  private formatarChave(chave: string): string {
    return chave
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  gerarCautelaColetiva(itens: any[]) {
    const doc = new jsPDF();
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const solicitante = (itens[0]?.solicitante || 'VARIOS').toUpperCase();

    // Cabeçalho Premium
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text('POLÍCIA MILITAR DE PERNAMBUCO  |  DTEC - SIGMAT V2', 105, 13, { align: 'center' });
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('CAUTELA COLETIVA DE MATERIAIS', 105, 28, { align: 'center' });
    
    const numeroCautela = `COL-${Date.now()}`;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nº ${numeroCautela}  |  Total: ${itens.length} itens`, 105, 37, { align: 'center' });

    // Declaração
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(11);
    let curY = 55;
    const declaracao = `Pelo presente termo, declaro ter recebido da carga do SIGMAT/PMPE os materiais descritos na relacao abaixo, sob a responsabilidade do solicitante ${solicitante}, assumindo plena responsabilidade por sua guarda e conservação:`;
    const declLines = doc.splitTextToSize(declaracao, 180);
    doc.text(declLines, 15, curY);
    curY += declLines.length * 6 + 8;

    // Tabela de Itens
    autoTable(doc, {
      startY: curY,
      head: [['#', 'Patrimônio', 'Tipo', 'Marca', 'N.Série']],
      body: itens.map((it, idx) => [
        idx + 1,
        it.patrimonio || '—',
        it.tipoEquipamento?.nome || '—',
        it.marca?.nome || '—',
        it.numeroSerie || '—'
      ]),
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], fontSize: 9 },
      bodyStyles: { fontSize: 8.5 },
      margin: { left: 15, right: 15 }
    });

    curY = (doc as any).lastAutoTable.finalY + 15;

    // Termo
    if (curY > 230) { doc.addPage(); curY = 20; }
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(15, curY, 180, 35, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('TERMO DE RESPONSABILIDADE COLETIVA', 105, curY + 7, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    const termo = 'Os materiais listados acima destinam-se exclusivamente ao servico policial militar. O recebedor compromete-se a devolver os itens em perfeito estado. Qualquer alteracao, dano ou extravio deve ser comunicado imediatamente a DTEC via SEI.';
    const termoLines = doc.splitTextToSize(termo, 170);
    doc.text(termoLines, 20, curY + 15);

    // Assinaturas
    curY += 55;
    doc.setDrawColor(100, 116, 139);
    doc.line(25, curY, 90, curY);
    doc.line(120, curY, 185, curY);
    doc.setFontSize(8);
    doc.text('Assinatura do Recebedor', 57, curY + 5, { align: 'center' });
    doc.text('Responsável DTEC / SIGMAT', 152, curY + 5, { align: 'center' });

    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`Gerado pelo SIGMAT em ${dataAtual} as ${horaAtual} | Cod: ${numeroCautela}`, 105, 285, { align: 'center' });

    doc.save(`cautela_coletiva_${solicitante.replace(/ /g, '_')}_${dataAtual.replace(/\//g, '-')}.pdf`);
  }

  async gerarEtiquetas(itens: any[]) {
    const doc = new jsPDF();
    const labelWidth = 60;
    const labelHeight = 40;
    const margin = 10;
    const itemsPerRow = 3;
    const itemsPerCol = 6;
    
    let curX = margin;
    let curY = margin;
    let count = 0;

    for (let i = 0; i < itens.length; i++) {
      const item = itens[i];
      if (count > 0 && count % (itemsPerRow * itemsPerCol) === 0) {
        doc.addPage();
        curX = margin;
        curY = margin;
      }

      // Desenha contorno da etiqueta
      doc.setDrawColor(200, 200, 200);
      doc.rect(curX, curY, labelWidth, labelHeight);

      // Conteúdo da Etiqueta
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('PMPE - SIGMAT V2', curX + 5, curY + 7);
      
      doc.setFontSize(10);
      doc.text(item.patrimonio || 'S/P', curX + 5, curY + 15);
      
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(item.tipoEquipamento?.nome || 'Material', curX + 5, curY + 20);
      doc.text(item.marca?.nome || '', curX + 5, curY + 24);

      // QR Code local
      try {
        const baseUrl = window.location.origin;
        const equipUrl = `${baseUrl}/qrcode/${item.id}`;
        const qrDataUrl = await QRCode.toDataURL(equipUrl, { margin: 1, width: 100 });
        doc.addImage(qrDataUrl, 'PNG', curX + 35, curY + 5, 20, 20);
      } catch (err) {
        console.error('Erro ao gerar QR Code', err);
      }

      doc.setFontSize(6);
      doc.text('DTEC/SISTEMAS', curX + 35, curY + 28);

      // Atualiza coordenadas
      count++;
      if (count % itemsPerRow === 0) {
        curX = margin;
        curY += labelHeight + 5;
      } else {
        curX += labelWidth + 5;
      }
    }

    doc.save(`etiquetas_patrimonio_${new Date().getTime()}.pdf`);
  }
}


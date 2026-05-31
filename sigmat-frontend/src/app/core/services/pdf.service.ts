import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PdfService {
  private async loadJspdf() {
    const [jspdfModule, autoTableModule] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ]);

    return {
      jsPDF: jspdfModule.jsPDF ?? jspdfModule.default ?? jspdfModule,
      autoTable: autoTableModule.default ?? autoTableModule
    };
  }

  private async loadQRCode() {
    const qrcode = await import('qrcode');
    return qrcode;
  }

  async gerarCautela(item: any) {
    const { jsPDF, autoTable } = await this.loadJspdf();
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

  async gerarCautelaColetiva(itens: any[]) {
    const { jsPDF, autoTable } = await this.loadJspdf();
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
    const { jsPDF } = await this.loadJspdf();
    const QRCode = await this.loadQRCode();

    // Dimensões padrão para etiquetas térmicas (60mm x 40mm)
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [60, 40]
    });
    
    for (let i = 0; i < itens.length; i++) {
      const item = itens[i];
      if (i > 0) {
        doc.addPage();
      }

      const curX = 0;
      const curY = 0;

      // 1. Cabeçalho Corporativo PMPE (Navy Blue)
      doc.setFillColor(15, 23, 42);
      doc.rect(curX, curY, 60, 9, 'F');

      // ── DESENHAR EMBLEMA VETORIAL PMPE ──
      const embX = curX + 5.5;
      const embY = curY + 4.5;
      
      // Círculo dourado externo
      doc.setFillColor(218, 165, 32);
      doc.circle(embX, embY, 3.2, 'F');

      // Círculo interno azul
      doc.setFillColor(15, 23, 42);
      doc.circle(embX, embY, 2.8, 'F');

      // Escudo vetorial interno (triângulo estilizado em dourado)
      doc.setFillColor(218, 165, 32);
      doc.triangle(
        embX, embY + 2.0,
        embX - 1.6, embY - 1.2,
        embX + 1.6, embY - 1.2,
        'F'
      );

      // Pequena cruz azul interna no escudo
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.2);
      doc.line(embX, embY - 0.7, embX, embY + 1.2);
      doc.line(embX - 0.8, embY + 0.2, embX + 0.8, embY + 0.2);

      // Texto do Cabeçalho (Branco)
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5);
      doc.text('POLÍCIA MILITAR DE PERNAMBUCO', curX + 10.5, curY + 3.8);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.2);
      doc.text('SIGMAT — GESTÃO DE PATRIMÔNIO', curX + 10.5, curY + 6.8);

      // 2. QR Code (Lateral Direita - Compactado para 15x15mm com nível de correção H para tolerância do brasão no centro)
      try {
        const baseUrl = window.location.origin;
        const equipUrl = `${baseUrl}/qrcode/${item.id}`;
        const qrDataUrl = await QRCode.toDataURL(equipUrl, { 
          margin: 1, 
          width: 80,
          errorCorrectionLevel: 'H'
        });
        doc.addImage(qrDataUrl, 'PNG', curX + 41, curY + 11.5, 15, 15);

        // Desenho do mini-brasão PMPE vetorial no centro do QR Code
        const qrCentX = curX + 48.5;
        const qrCentY = curY + 19.0;

        // Fundo circular dourado
        doc.setFillColor(218, 165, 32);
        doc.circle(qrCentX, qrCentY, 1.7, 'F');

        // Círculo interno azul escuro
        doc.setFillColor(15, 23, 42);
        doc.circle(qrCentX, qrCentY, 1.4, 'F');

        // Escudo dourado central (triângulo estilizado)
        doc.setFillColor(218, 165, 32);
        doc.triangle(
          qrCentX, qrCentY + 1.0,
          qrCentX - 0.8, qrCentY - 0.6,
          qrCentX + 0.8, qrCentY - 0.6,
          'F'
        );

        // Cruz interna azul do escudo
        doc.setDrawColor(15, 23, 42);
        doc.setLineWidth(0.15);
        doc.line(qrCentX, qrCentY - 0.3, qrCentX, qrCentY + 0.6);
        doc.line(qrCentX - 0.4, qrCentY + 0.1, qrCentX + 0.4, qrCentY + 0.1);

      } catch (err) {
        console.error('Erro ao gerar QR Code para etiqueta:', err);
      }

      // 3. Informações do Equipamento (Coluna da Esquerda)
      
      // Campo 1: PATRIMÔNIO
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5);
      doc.setTextColor(120, 130, 140);
      doc.text('PATRIMÔNIO', curX + 4, curY + 13.5);
      
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(item.patrimonio || 'S/PAT', curX + 4, curY + 17.2);

      // Campo 2: TIPO DE MATERIAL
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5);
      doc.setTextColor(120, 130, 140);
      doc.text('TIPO DE MATERIAL', curX + 4, curY + 21.0);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(51, 65, 85);
      doc.text(item.tipoEquipamento?.nome || 'Não Informado', curX + 4, curY + 24.5);
      
      // Campo 3: MARCA / MODELO
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5);
      doc.setTextColor(120, 130, 140);
      doc.text('MARCA / MODELO', curX + 4, curY + 28.2);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`${item.marca?.nome || '—'} ${item.modelo?.nome || ''}`, curX + 4, curY + 31.8);

      // 4. Seção (Alinhada à Direita com a borda do QR Code - X = 56)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5);
      doc.setTextColor(120, 130, 140);
      doc.text('SEÇÃO / UNIDADE', curX + 56, curY + 28.2, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(29, 78, 216); // Azul royal PMPE
      doc.text(item.secao?.sigla || 'DTEC', curX + 56, curY + 31.8, { align: 'right' });

      // 5. Rodapé da Etiqueta
      // Linha separadora discreta
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.18);
      doc.line(curX + 3, curY + 35.0, curX + 57, curY + 35.0);

      // Textos institucionais do rodapé
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(4.8);
      doc.setTextColor(148, 163, 184);
      doc.text('DTEC / SISTEMAS', curX + 4, curY + 38.2);
      
      // Alinhado à direita na borda
      doc.text('AUDITORIA VIA QR CODE', curX + 56, curY + 38.2, { align: 'right' });
    }

    doc.save(`etiquetas_sigmat_${new Date().getTime()}.pdf`);
  }
}


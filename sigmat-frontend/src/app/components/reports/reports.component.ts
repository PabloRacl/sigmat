import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EquipmentService } from '../../services/equipment.service';
import { SettingsService } from '../../services/settings.service';
import { ReportsService } from '../../services/reports.service';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { TabViewModule } from 'primeng/tabview';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, BorderStyle, AlignmentType, HeadingLevel, PageOrientation } from 'docx';
import * as FileSaver from 'file-saver';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule,
    DropdownModule, InputTextModule, TooltipModule, TabViewModule,
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent implements OnInit {
  // Reutilizamos o EquipmentService que já traz todos os dados com includes completos
  private equipmentService = inject(EquipmentService);
  private reportsService = inject(ReportsService);
  private configService = inject(SettingsService);

  // Dados
  inventarioOriginal: any[] = [];
  inventario: any[] = [];
  carregando = true;

  // Filtros e busca local (sem ir ao servidor)
  termoBusca = '';
  filtroSecaoId: number | null = null;
  filtroTipoId: number | null = null;
  filtroStatusId: number | null = null;
  filtroDisponibilidadeId: number | null = null;

  // Dados auxiliares
  secoes: any[] = [];
  tipos: any[] = [];
  status: any[] = [];
  disponibilidades: any[] = [];

  resumoUnidades: { sigla: string; total: number }[] = [];

  ngOnInit() {
    this.carregarDados();
    this.configService.listarSecoes().subscribe(r => this.secoes = r);
    this.configService.listarTipos().subscribe(r => this.tipos = r);
    this.configService.listarStatus().subscribe(r => this.status = r);
    this.configService.listarDisponibilidades().subscribe(r => this.disponibilidades = r);
  }

  carregarDados() {
    this.carregando = true;
    const filtros = {
      busca: this.termoBusca,
      secaoId: this.filtroSecaoId,
      tipoId: this.filtroTipoId,
      statusId: this.filtroStatusId,
      disponibilidadeId: this.filtroDisponibilidadeId
    };

    this.reportsService.obterInventario(filtros).subscribe({
      next: (res) => {
        this.inventarioOriginal = res;
        this.inventario = [...res];
        this.carregando = false;
      },
      error: () => this.carregando = false
    });

    this.reportsService.obterResumoUnidades().subscribe(res => {
      this.resumoUnidades = res;
    });
  }

  aplicarFiltros() {
    this.carregarDados();
  }

  limparFiltros() {
    this.termoBusca = '';
    this.filtroSecaoId = null;
    this.filtroTipoId = null;
    this.filtroStatusId = null;
    this.filtroDisponibilidadeId = null;
    this.carregarDados();
  }

  exportarCSV() {
    if (this.inventario.length === 0) return;

    const headers = [
      'Disponibilidade', 'Seção', 'Diretoria', 'Tipo', 'Patrimônio', 'SEI',
      'N. Série', 'Marca', 'Modelo', 'Status', 'Data Aquisição', 'Tipo Aquisição',
      'Solicitante', 'Data Solicitação', 'Retorno Empréstimo', 'Observação'
    ];

    const rows = this.inventario.map(e => [
      e.disponibilidade?.nome || '',
      e.secao?.sigla || '',
      e.secao?.diretoria?.sigla || '',
      e.tipoEquipamento?.nome || '',
      e.patrimonio || '',
      e.sei || '',
      e.numeroSerie || '',
      e.marca?.nome || '',
      e.modelo?.nome || '',
      e.status?.nome || '',
      this.formatarData(e.dataAquisicao),
      e.tipoAquisicao?.nome || '',
      e.solicitante || '',
      this.formatarData(e.dataSolicitacao),
      this.formatarData(e.dataRetornoEmprestimo),
      e.observacao || ''
    ]);

    const headersStr = headers.map(h => `"${h}"`).join(';');
    const csv = [
      headersStr,
      ...rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(';'))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inventario_sigmat_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  }

  exportarPDF() {
    if (this.inventario.length === 0) return;
    const doc = new jsPDF('landscape');
    const totalPagesExp = '{total_pages_count_string}';

    const headers = [['Patrimônio', 'SEI', 'Série', 'Tipo', 'Marca/Modelo', 'Seção', 'Status', 'Disp.', 'Observação']];
    const data = this.inventario.map(e => [
      e.patrimonio || '',
      e.sei || '',
      e.numeroSerie || '',
      e.tipoEquipamento?.nome || '',
      `${e.marca?.nome || ''} ${e.modelo?.nome || ''}`.trim(),
      e.secao?.sigla || '',
      e.status?.nome || '',
      e.disponibilidade?.nome || '',
      e.observacao || ''
    ]);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 35,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [21, 128, 61], textColor: 255, fontStyle: 'bold', halign: 'center' }, // Verde Premium
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didDrawPage: (data) => {
        // HEADER
        doc.setFillColor(30, 64, 175); // Azul Polícia
        doc.rect(0, 0, doc.internal.pageSize.width, 15, 'F');
        doc.setTextColor(255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('SIGMAT - SISTEMA DE GESTÃO DE MATERIAIS', 14, 10);
        
        doc.setTextColor(50);
        doc.setFontSize(12);
        doc.text('Relatório Oficial de Equipamentos', 14, 25);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')} | Total de registros: ${this.inventario.length}`, 14, 30);

        // FOOTER
        let str = `Página ${(doc.internal as any).getNumberOfPages()}`;
        if (typeof doc.putTotalPages === 'function') {
          str = str + ' de ' + totalPagesExp;
        }
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
      }
    });

    if (typeof doc.putTotalPages === 'function') {
      doc.putTotalPages(totalPagesExp);
    }

    doc.save(`relatorio_sigmat_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  exportarWord() {
    if (this.inventario.length === 0) return;

    const tableRows = [
      new TableRow({
        tableHeader: true,
        children: [
          'Patrimônio', 'SEI', 'N. Série', 'Tipo', 'Marca/Modelo', 'Seção', 'Status', 'Disponibilidade', 'Observação'
        ].map(text => new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: "FFFFFF" })], alignment: AlignmentType.CENTER })],
          shading: { fill: "15803d" }, // Verde Premium
          margins: { top: 100, bottom: 100, left: 100, right: 100 }
        }))
      })
    ];

    this.inventario.forEach(e => {
      tableRows.push(new TableRow({
        children: [
          e.patrimonio || '',
          e.sei || '',
          e.numeroSerie || '',
          e.tipoEquipamento?.nome || '',
          `${e.marca?.nome || ''} ${e.modelo?.nome || ''}`.trim(),
          e.secao?.sigla || '',
          e.status?.nome || '',
          e.disponibilidade?.nome || '',
          e.observacao || ''
        ].map(text => new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text, size: 18 })] })], // Size is half-points, 18 = 9pt
          margins: { top: 80, bottom: 80, left: 100, right: 100 }
        }))
      }));
    });

    const table = new Table({
      rows: tableRows,
      width: { size: "100%", type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "EEEEEE" },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "EEEEEE" },
      }
    });

    const doc = new Document({
      creator: "SIGMAT",
      title: "Relatório de Equipamentos",
      sections: [{
        properties: {
          page: { 
            margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 },
            size: { orientation: PageOrientation.LANDSCAPE }
          }
        },
        children: [
          new Paragraph({
            text: "SIGMAT - SISTEMA DE GESTÃO DE MATERIAIS",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER
          }),
          new Paragraph({
            text: `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')} | Total: ${this.inventario.length} registros`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          }),
          table
        ]
      }]
    });

    Packer.toBlob(doc).then(blob => {
      FileSaver.saveAs(blob, `relatorio_sigmat_${new Date().toISOString().slice(0, 10)}.docx`);
    });
  }

  formatarData(v: string | null): string {
    if (!v) return '';
    return new Date(v).toLocaleDateString('pt-BR');
  }

  obterCorStatus(s: string): string {
    const status = s?.toUpperCase();
    if (status === 'ATIVO' || status === 'DISPONÍVEL') return 'verde';
    if (status === 'MANUTENÇÃO' || status === 'PENDENTE_APROVACAO') return 'amarelo';
    if (status === 'INATIVO' || status === 'EXTRAVIADO' || status === 'DANO') return 'vermelho';
    return 'cinza';
  }

  obterCorDisponibilidade(d: string): string {
    const disp = d?.toUpperCase();
    if (disp === 'CARGA') return 'azul';
    if (disp === 'EMPRESTIMO') return 'amarelo';
    return 'cinza';
  }
}


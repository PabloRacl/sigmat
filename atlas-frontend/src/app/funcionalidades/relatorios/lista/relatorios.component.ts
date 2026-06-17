import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../../nucleo/servicos/configuracoes.service';
import { ReportsService } from '../../../nucleo/servicos/relatorios.service';
import { PdfService } from '../../../nucleo/servicos/pdf.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { TabsModule } from 'primeng/tabs';
import { LayoutPaginaComponent } from '../../../componentes/layout-pagina/layout-pagina.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule,
    SelectModule, InputTextModule, TooltipModule, TabsModule,
    LayoutPaginaComponent
  ],
  templateUrl: './relatorios.component.html',
  styleUrl: './relatorios.component.scss'
})
export class ReportsComponent implements OnInit, OnDestroy {
  private reportsService = inject(ReportsService);
  private configService = inject(SettingsService);
  private pdfService = inject(PdfService);
  private filtroInventarioSubject = new Subject<void>();
  private filtroTransferSubject = new Subject<void>();
  private subscriptions = new Subscription();

  // Dados
  inventarioOriginal: any[] = [];
  inventario: any[] = [];
  carregando = true;
  abaAtiva = 0;

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
  transferencias: any[] = [];

  filtroTransferStatus: string | null = null;
  filtroTransferOrigemId: number | null = null;
  filtroTransferDestinoId: number | null = null;
  filtroTransferLote = '';
  filtroTransferPatrimonio = '';
  filtroTransferSolicitante = '';
  filtroTransferRecebedor = '';
  filtroTransferEnvioInicio = '';
  filtroTransferEnvioFim = '';
  filtroTransferRecebimentoInicio = '';
  filtroTransferRecebimentoFim = '';

  statusTransferencias = [
    { label: 'Todos', value: null },
    { label: 'Pendente', value: 'PENDENTE' },
    { label: 'Concluída', value: 'CONCLUIDA' },
    { label: 'Cancelada', value: 'CANCELADA' },
  ];

  resumoUnidades: { sigla: string; total: number }[] = [];

  ngOnInit() {
    this.subscriptions.add(
      this.filtroInventarioSubject.pipe(debounceTime(300)).subscribe(() => this.carregarDados())
    );
    this.subscriptions.add(
      this.filtroTransferSubject.pipe(debounceTime(300)).subscribe(() => this.carregarTransferencias())
    );

    this.carregarDados();
    this.carregarTransferencias();
    this.carregarResumoUnidades();
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
  }

  carregarResumoUnidades() {
    this.reportsService.obterResumoUnidades().subscribe(res => {
      this.resumoUnidades = res;
    });
  }

  carregarTransferencias() {
    const filtros = {
      status: this.filtroTransferStatus,
      origemId: this.filtroTransferOrigemId,
      destinoId: this.filtroTransferDestinoId,
      lote: this.filtroTransferLote,
      patrimonio: this.filtroTransferPatrimonio,
      solicitante: this.filtroTransferSolicitante,
      recebedor: this.filtroTransferRecebedor,
      dataEnvioInicio: this.filtroTransferEnvioInicio,
      dataEnvioFim: this.filtroTransferEnvioFim,
      dataRecebimentoInicio: this.filtroTransferRecebimentoInicio,
      dataRecebimentoFim: this.filtroTransferRecebimentoFim,
    };

    this.reportsService.obterTransferencias(filtros).subscribe({
      next: (res) => this.transferencias = res,
      error: () => this.transferencias = []
    });
  }

  aplicarFiltrosTransferencias() {
    this.filtroTransferSubject.next();
  }

  limparFiltrosTransferencias() {
    this.filtroTransferStatus = null;
    this.filtroTransferOrigemId = null;
    this.filtroTransferDestinoId = null;
    this.filtroTransferLote = '';
    this.filtroTransferPatrimonio = '';
    this.filtroTransferSolicitante = '';
    this.filtroTransferRecebedor = '';
    this.filtroTransferEnvioInicio = '';
    this.filtroTransferEnvioFim = '';
    this.filtroTransferRecebimentoInicio = '';
    this.filtroTransferRecebimentoFim = '';
    this.filtroTransferSubject.next();
  }

  aplicarFiltros() {
    this.filtroInventarioSubject.next();
  }

  limparFiltros() {
    this.termoBusca = '';
    this.filtroSecaoId = null;
    this.filtroTipoId = null;
    this.filtroStatusId = null;
    this.filtroDisponibilidadeId = null;
    this.filtroInventarioSubject.next();
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
    link.download = `inventario_atlas_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  }

  trackByEquipamentoId(index: number, item: any) {
    return item?.id ?? index;
  }

  trackByTransferenciaId(index: number, item: any) {
    return item?.id ?? index;
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  exportarTransferCSV() {
    if (this.transferencias.length === 0) return;

    const headers = [
      'Data Envio', 'Origem', 'Destino', 'Patrimônio', 'Solicitante', 'Recebedor', 'Status', 'Data Recebimento', 'Observação'
    ];

    const rows = this.transferencias.map((t: any) => [
      this.formatarData(t.dataEnvio),
      t.origem?.sigla || '',
      t.destino?.sigla || '',
      t.equipamento?.patrimonio || '',
      t.solicitante?.nome || '',
      t.recebedor?.nome || '',
      t.status || '',
      this.formatarData(t.dataRecebimento),
      t.observacao || ''
    ]);

    const headersStr = headers.map((h: string) => `"${String(h).replace(/"/g, '""')}"`).join(';');
    const csv = [
      headersStr,
      ...rows.map((r: any[]) => r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(';'))
    ].join('\n');

    const blob = new Blob([' FEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transferencias_atlas_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  }

  async exportarTransferPDF() {
    if (this.transferencias.length === 0) return;

    const headers = [
      'Data Envio', 'Origem', 'Destino', 'Patrimônio', 'Solicitante', 'Recebedor', 'Status', 'Data Recebimento', 'Observação'
    ];

    const rows = this.transferencias.map((t: any) => [
      this.formatarData(t.dataEnvio),
      t.origem?.sigla || '',
      t.destino?.sigla || '',
      t.equipamento?.patrimonio || '',
      t.solicitante?.nome || '',
      t.recebedor?.nome || '',
      t.status || '',
      this.formatarData(t.dataRecebimento),
      t.observacao || ''
    ]);

    await this.pdfService.gerarTabelaPDF(
      'Relatório de Transferências',
      `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')} | Total: ${this.transferencias.length} registros`,
      headers,
      rows
    );
  }

  imprimirTransferencias() {
    if (this.transferencias.length === 0) return;

    const columns = ['Data Envio', 'Origem', 'Destino', 'Patrim�nio', 'Solicitante', 'Recebedor', 'Status', 'Data Recebimento', 'Observa��o'];
    const rows = this.transferencias.map((t: any) => [
      this.formatarData(t.dataEnvio),
      t.origem?.sigla || '�',
      t.destino?.sigla || '�',
      t.equipamento?.patrimonio || '�',
      t.solicitante?.nome || '�',
      t.recebedor?.nome || '�',
      t.status || '�',
      this.formatarData(t.dataRecebimento) || '�',
      t.observacao || '�'
    ]);

    const htmlRows = rows.map(row => `
      <tr>
        ${row.map((cell, index) => {
          const value = String(cell);
          if (index === 6) {
            return `<td style="padding: 8px 10px; text-align:center"><span style="display:inline-block;padding:4px 8px;border-radius:12px;color:#fff;${this.getPrintStatusStyle(value)}">${value}</span></td>`;
          }
          return `<td>${value}</td>`;
        }).join('')}
      </tr>
    `).join('');

    const html = `<!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>Relat�rio de Transfer�ncias</title>
          <style>
            body { font-family: Arial, Helvetica, sans-serif; margin: 24px; color: #1a1a1a; }
            h1, h2, h3, p { margin: 0 0 12px; }
            .header { margin-bottom: 16px; }
            .summary { margin-top: 8px; font-size: 0.95rem; color: #4b5563; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #d1d5db; padding: 10px 12px; vertical-align: top; }
            th { background: #1f618d; color: #ffffff; font-weight: 700; text-align: left; }
            tr:nth-child(even) td { background: #f9fafb; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Relat�rio de Transfer�ncias</h2>
            <div class="summary">Gerado em: ${new Date().toLocaleDateString('pt-BR')} �s ${new Date().toLocaleTimeString('pt-BR')} � Total: ${this.transferencias.length} registros</div>
          </div>
          <table>
            <thead>
              <tr>${columns.map(col => `<th>${col}</th>`).join('')}</tr>
            </thead>
            <tbody>${htmlRows}</tbody>
          </table>
        </body>
      </html>`;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  private getPrintStatusStyle(status: string): string {
    const normalized = String(status).toUpperCase();
    if (normalized.includes('CONCLUIDA') || normalized.includes('CONCLU�DA')) return 'background:#16a34a;';
    if (normalized.includes('PENDENTE')) return 'background:#f59e0b;';
    if (normalized.includes('CANCELADA')) return 'background:#dc2626;';
    return 'background:#6b7280;';
  }

  exportarResumoCSV() {
    if (this.resumoUnidades.length === 0) return;

    const headers = ['Unidade', 'Total de Equipamentos'];
    const rows = this.resumoUnidades.map(u => [u.sigla, u.total]);
    const csv = [
      headers.map(h => `"${h}"`).join(';'),
      ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `resumo_unidades_atlas_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  }

  exportarResumoPDF() {
    if (this.resumoUnidades.length === 0) return;

    const rowsHtml = this.resumoUnidades.map(u => `
      <tr>
        <td>${u.sigla}</td>
        <td style="text-align:right">${u.total}</td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>Resumo por Unidade</title>
          <style>
            body { font-family: Arial, Helvetica, sans-serif; margin: 24px; color: #1a1a1a; }
            h2 { margin-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #d1d5db; padding: 10px 12px; }
            th { background: #1f618d; color: white; text-align: left; }
            tr:nth-child(even) td { background: #f9fafb; }
          </style>
        </head>
        <body>
          <h2>Resumo por Unidade</h2>
          <table>
            <thead>
              <tr><th>Unidade</th><th style="text-align:right">Total de Equipamentos</th></tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </body>
      </html>`;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  imprimirResumoUnidades() {
    if (this.resumoUnidades.length === 0) return;

    const rowsHtml = this.resumoUnidades.map(u => `
      <tr>
        <td>${u.sigla}</td>
        <td style="text-align:right">${u.total}</td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>Resumo por Unidade</title>
          <style>
            body { font-family: Arial, Helvetica, sans-serif; margin: 24px; color: #1a1a1a; }
            h2 { margin-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #d1d5db; padding: 10px 12px; }
            th { background: #1f618d; color: white; text-align: left; }
            tr:nth-child(even) td { background: #f9fafb; }
          </style>
        </head>
        <body>
          <h2>Resumo por Unidade</h2>
          <table>
            <thead>
              <tr><th>Unidade</th><th style="text-align:right">Total de Equipamentos</th></tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </body>
      </html>`;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  async exportarPDF() {
    if (this.inventario.length === 0) return;

    const headers = ['Patrimônio', 'SEI', 'Série', 'Tipo', 'Marca/Modelo', 'Seção', 'Status', 'Disp.', 'Observação'];
    const rows = this.inventario.map(e => [
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

    await this.pdfService.gerarTabelaPDF(
      'Relatório Oficial de Equipamentos',
      `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')} | Total de registros: ${this.inventario.length}`,
      headers,
      rows
    );
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





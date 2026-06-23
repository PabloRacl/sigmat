import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../../nucleo/servicos/configuracoes.service';
import { ReportsService } from '../../../nucleo/servicos/relatorios.service';
import { PdfService } from '../../../nucleo/servicos/pdf.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { AuthService } from '../../../nucleo/servicos/autenticacao.service';
import { MaintenanceService } from '../../../nucleo/servicos/manutencao.service';
import { ApprovalsService } from '../../../nucleo/servicos/aprovacoes.service';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { TabsModule } from 'primeng/tabs';
import { LayoutPaginaComponent } from '../../../componentes/layout-pagina/layout-pagina.component';
import { IndicadorStatusComponent } from '../../../componentes/indicador-status/indicador-status.component';
import { TabelaScrollComponent } from '../../../componentes/tabela-scroll/tabela-scroll.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule,
    SelectModule, InputTextModule, TooltipModule, TabsModule,
    LayoutPaginaComponent,
    IndicadorStatusComponent,
    TabelaScrollComponent
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
  private maintenanceService = inject(MaintenanceService);
  private approvalsService = inject(ApprovalsService);
  private authService = inject(AuthService);
  private subscriptions = new Subscription();

  // Dados
  inventarioOriginal: any[] = [];
  inventario: any[] = [];
  carregando = true;
  abaAtiva = 0;

  // Filtros e busca local (sem ir ao servidor)
  termoBusca = '';
  filtroDiretoriaId: number | null = null;
  filtroBatalhaoId: number | null = null;
  filtroSecaoId: number | null = null;
  filtroTipoId: number | null = null;
  filtroStatusId: number | null = null;
  filtroDisponibilidadeId: number | null = null;

  // Filtros Manutenção
  termoBuscaManutencao = '';
  filtroManutencaoStatus: any = null;
  filtroManutencaoAberturaInicio: Date | null = null;
  filtroManutencaoAberturaFim: Date | null = null;

  // Filtros Aprovações
  termoBuscaAprovacoes = '';
  filtroAprovacoesStatus: any = null;
  filtroAprovacoesDataInicio: Date | null = null;
  filtroAprovacoesDataFim: Date | null = null;

  // Filtros Auditoria
  termoBuscaAuditoria = '';
  filtroAuditoriaDataInicio: Date | null = null;
  filtroAuditoriaDataFim: Date | null = null;

  statusOpcoes: any[] = [];

  // Dados auxiliares
  diretorias: any[] = [];
  batalhoes: any[] = [];
  secoes: any[] = [];
  tipos: any[] = [];
  status: any[] = [];
  disponibilidades: any[] = [];
  transferencias: any[] = [];
  manutencoes: any[] = [];
  manutencoesOriginal: any[] = [];
  
  aprovacoes: any[] = [];
  aprovacoesOriginal: any[] = [];
  
  auditoria: any[] = [];
  auditoriaOriginal: any[] = [];

  filtroTransferStatus: string | null = null;
  filtroTransferOrigemId: number | null = null;
  filtroTransferDestinoId: number | null = null;
  filtroTransferLote = '';
  filtroTransferPatrimonio = '';
  filtroTransferSolicitante = '';
  filtroTransferRecebedor = '';
  filtroTransferEnvioInicio: any = null;
  filtroTransferEnvioFim: any = null;
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
    this.statusOpcoes = [
      { label: 'Aprovado', value: true },
      { label: 'Rejeitado', value: false },
      { label: 'Pendente', value: null }
    ];

    this.subscriptions.add(
      this.filtroInventarioSubject.pipe(debounceTime(300)).subscribe(() => this.carregarDados())
    );
    this.subscriptions.add(
      this.filtroTransferSubject.pipe(debounceTime(300)).subscribe(() => this.carregarTransferencias())
    );

    this.carregarDados();
    this.carregarTransferencias();
    this.carregarManutencoes();
    this.carregarAuditoria();
    this.carregarAprovacoes();
    this.carregarResumoUnidades();
    this.configService.listarDiretorias().subscribe(r => this.diretorias = r);
    this.configService.listarBatalhoes().subscribe(r => this.batalhoes = r);
    this.configService.listarSecoes().subscribe(r => this.secoes = r);
    this.configService.listarTipos().subscribe(r => this.tipos = r);
    this.configService.listarStatus().subscribe(r => this.status = r);
    this.configService.listarDisponibilidades().subscribe(r => this.disponibilidades = r);
  }

  carregarDados() {
    this.carregando = true;
    const filtros = {
      busca: this.termoBusca,
      diretoriaId: this.filtroDiretoriaId,
      batalhaoId: this.filtroBatalhaoId,
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
      this.resumoUnidades = res as unknown as { sigla: string; total: number }[];
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

  carregarManutencoes() {
    this.maintenanceService.listarTodos().subscribe({
      next: (res: any) => {
        this.manutencoesOriginal = res;
        this.manutencoes = [...this.manutencoesOriginal];
      },
      error: () => { this.manutencoesOriginal = []; this.manutencoes = []; }
    });
  }

  carregarAprovacoes() {
    this.approvalsService.listarTodas().subscribe({
      next: (res: any) => {
        this.aprovacoesOriginal = res;
        this.aprovacoes = [...this.aprovacoesOriginal];
      },
      error: () => { this.aprovacoesOriginal = []; this.aprovacoes = []; }
    });
  }

  carregarAuditoria() {
    this.reportsService.obterAuditoria().subscribe({
      next: (res: any) => {
        this.auditoriaOriginal = res;
        this.auditoria = [...this.auditoriaOriginal];
      },
      error: () => { this.auditoriaOriginal = []; this.auditoria = []; }
    });
  }

  aplicarFiltrosTransferencias() {
    this.filtroTransferSubject.next();
  }

  limparFiltrosTransferencias() {
    this.filtroTransferPatrimonio = '';
    this.filtroTransferStatus = null;
    this.filtroTransferOrigemId = null;
    this.filtroTransferDestinoId = null;
    this.filtroTransferLote = '';
    this.filtroTransferEnvioInicio = null;
    this.filtroTransferEnvioFim = null;
    this.aplicarFiltrosTransferencias();
  }

  // ── FILTROS MANUTENÇÕES ────────────────────────────────────────────────────────
  aplicarFiltrosManutencoes() {
    let result = [...this.manutencoesOriginal];

    if (this.termoBuscaManutencao) {
      const termo = this.termoBuscaManutencao.toLowerCase();
      result = result.filter(m => 
        (m.equipamento?.patrimonio && m.equipamento.patrimonio.toLowerCase().includes(termo)) ||
        (m.solicitante?.nome && m.solicitante.nome.toLowerCase().includes(termo)) ||
        (m.descricaoProblema && m.descricaoProblema.toLowerCase().includes(termo)) ||
        (m.tecnicoResponsavel && m.tecnicoResponsavel.toLowerCase().includes(termo)) ||
        (m.id && String(m.id).includes(termo))
      );
    }

    if (this.filtroManutencaoStatus) {
      result = result.filter(m => m.status === this.filtroManutencaoStatus.nome);
    }

    if (this.filtroManutencaoAberturaInicio) {
      const d1 = new Date(this.filtroManutencaoAberturaInicio);
      d1.setHours(0,0,0,0);
      result = result.filter(m => m.dataAbertura && new Date(m.dataAbertura) >= d1);
    }

    if (this.filtroManutencaoAberturaFim) {
      const d2 = new Date(this.filtroManutencaoAberturaFim);
      d2.setHours(23,59,59,999);
      result = result.filter(m => m.dataAbertura && new Date(m.dataAbertura) <= d2);
    }

    this.manutencoes = result;
  }

  limparFiltrosManutencoes() {
    this.termoBuscaManutencao = '';
    this.filtroManutencaoStatus = null;
    this.filtroManutencaoAberturaInicio = null;
    this.filtroManutencaoAberturaFim = null;
    this.aplicarFiltrosManutencoes();
  }

  // ── FILTROS APROVAÇÕES ────────────────────────────────────────────────────────
  aplicarFiltrosAprovacoes() {
    let result = [...this.aprovacoesOriginal];

    if (this.termoBuscaAprovacoes) {
      const termo = this.termoBuscaAprovacoes.toLowerCase();
      result = result.filter(a => 
        (a.equipamento?.patrimonio && a.equipamento.patrimonio.toLowerCase().includes(termo)) ||
        (a.solicitante?.nome && a.solicitante.nome.toLowerCase().includes(termo)) ||
        (a.avaliador?.nome && a.avaliador.nome.toLowerCase().includes(termo)) ||
        (a.id && String(a.id).includes(termo)) ||
        (a.motivoRejeicao && a.motivoRejeicao.toLowerCase().includes(termo))
      );
    }

    if (this.filtroAprovacoesStatus !== null && this.filtroAprovacoesStatus !== undefined) {
      result = result.filter(a => {
        if (this.filtroAprovacoesStatus === true) return a.aprovado === true;
        if (this.filtroAprovacoesStatus === false) return a.aprovado === false;
        return a.aprovado === null || a.aprovado === undefined;
      });
    }

    if (this.filtroAprovacoesDataInicio) {
      const d1 = new Date(this.filtroAprovacoesDataInicio);
      d1.setHours(0,0,0,0);
      result = result.filter(a => a.dataSolicitacao && new Date(a.dataSolicitacao) >= d1);
    }

    if (this.filtroAprovacoesDataFim) {
      const d2 = new Date(this.filtroAprovacoesDataFim);
      d2.setHours(23,59,59,999);
      result = result.filter(a => a.dataSolicitacao && new Date(a.dataSolicitacao) <= d2);
    }

    this.aprovacoes = result;
  }

  limparFiltrosAprovacoes() {
    this.termoBuscaAprovacoes = '';
    this.filtroAprovacoesStatus = null;
    this.filtroAprovacoesDataInicio = null;
    this.filtroAprovacoesDataFim = null;
    this.aplicarFiltrosAprovacoes();
  }

  // ── FILTROS AUDITORIA ────────────────────────────────────────────────────────
  aplicarFiltrosAuditoria() {
    let result = [...this.auditoriaOriginal];

    if (this.termoBuscaAuditoria) {
      const termo = this.termoBuscaAuditoria.toLowerCase();
      result = result.filter(l => 
        (l.usuario?.nome && l.usuario.nome.toLowerCase().includes(termo)) ||
        (l.acao && l.acao.toLowerCase().includes(termo)) ||
        (l.ip && l.ip.toLowerCase().includes(termo)) ||
        (l.userAgent && l.userAgent.toLowerCase().includes(termo)) ||
        (l.descricao && l.descricao.toLowerCase().includes(termo)) ||
        (l.equipamento?.patrimonio && l.equipamento.patrimonio.toLowerCase().includes(termo)) ||
        (l.dadosAlterados && JSON.stringify(l.dadosAlterados).toLowerCase().includes(termo))
      );
    }

    if (this.filtroAuditoriaDataInicio) {
      const d1 = new Date(this.filtroAuditoriaDataInicio);
      d1.setHours(0,0,0,0);
      result = result.filter(l => l.createdAt && new Date(l.createdAt) >= d1);
    }

    if (this.filtroAuditoriaDataFim) {
      const d2 = new Date(this.filtroAuditoriaDataFim);
      d2.setHours(23,59,59,999);
      result = result.filter(l => l.createdAt && new Date(l.createdAt) <= d2);
    }

    this.auditoria = result;
  }

  limparFiltrosAuditoria() {
    this.termoBuscaAuditoria = '';
    this.filtroAuditoriaDataInicio = null;
    this.filtroAuditoriaDataFim = null;
    this.aplicarFiltrosAuditoria();
  }

  // ── TRADUTOR DE JSON PARA HUMANOS (AUDITORIA) ────────────────────────────────
  obterListaDetalhes(dados: any): { chave: string, valor: any }[] {
    if (!dados || typeof dados !== 'object') return [];
    
    let lista: { chave: string, valor: any }[] = [];
    
    // Tratar formato de Diff (antes e depois)
    if ('antes' in dados || 'depois' in dados) {
       const chaves = new Set([...Object.keys(dados.antes || {}), ...Object.keys(dados.depois || {})]);
       chaves.forEach(k => {
         let antes = dados.antes?.[k];
         let depois = dados.depois?.[k];
         
         if (typeof antes === 'object' && antes !== null) antes = JSON.stringify(antes);
         if (typeof depois === 'object' && depois !== null) depois = JSON.stringify(depois);
         
         lista.push({
           chave: k,
           valor: `De: ${antes ?? 'Vazio'} ➔ Para: ${depois ?? 'Vazio'}`
         });
       });
       return lista;
    }

    // Tratar formato chave-valor genérico
    Object.keys(dados).forEach(k => {
      let val = dados[k];
      if (typeof val === 'object' && val !== null) {
        val = JSON.stringify(val); // Arrays de fotos, etc
      }
      lista.push({ chave: k, valor: val });
    });
    
    return lista;
  }
  
  formatarChave(chave: string): string {
    // Transforma "statusAtual" em "Status Atual"
    const formatada = chave.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    return formatada;
  }

  aplicarFiltros() {
    this.filtroInventarioSubject.next();
  }

  limparFiltros() {
    this.termoBusca = '';
    this.filtroDiretoriaId = null;
    this.filtroBatalhaoId = null;
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

    const user = this.authService.getUsuario();
    const fiscal = user?.nome || 'Não Identificado';
    const matricula = user?.matricula || '—';
    const ome = (user as any)?.batalhao?.sigla || (user as any)?.secao?.batalhao?.sigla || (user as any)?.secao?.diretoria?.sigla || 'DTEC';

    // AGRUPAMENTO HIERÁRQUICO
    const grupos: Record<string, any[]> = {};
    
    this.inventario.forEach(e => {
      const dirSigla = e.secao?.diretoria?.sigla || '';
      const batSigla = e.secao?.batalhao?.sigla || '';
      let chaveGrupo = [dirSigla, batSigla].filter(x => x).join(' > ');
      if (!chaveGrupo) chaveGrupo = 'Outras Unidades';
      
      if (!grupos[chaveGrupo]) grupos[chaveGrupo] = [];
      grupos[chaveGrupo].push(e);
    });

    const headers = ['Patrimônio', 'SEI', 'Série', 'Tipo', 'Marca/Modelo', 'Seção', 'Status', 'Disp.'];
    const payloadGrupos: any[] = [];

    Object.keys(grupos).sort().forEach(chaveGrupo => {
      const linhas = grupos[chaveGrupo].map(e => [
        e.patrimonio || '',
        e.sei || '',
        e.numeroSerie || '',
        e.tipoEquipamento?.nome || '',
        `${e.marca?.nome || ''} ${e.modelo?.nome || ''}`.trim(),
        e.secao?.sigla || '',
        e.status?.nome || '',
        e.disponibilidade?.nome || ''
      ]);

      payloadGrupos.push({
        tituloGeral: `INVENTÁRIO: ${chaveGrupo}`,
        operacao: 'LEVANTAMENTO DE MATERIAL',
        evento: 'GERAÇÃO DE INVENTÁRIO DO ATLAS',
        local: chaveGrupo,
        data: new Date().toLocaleDateString('pt-BR'),
        omeBeneficiada: chaveGrupo,
        periodo: '-',
        omeCedente: '-',
        modalidade: 'SISTÊMICA',
        colunas: headers,
        linhas: linhas
      });
    });

    const payloadObj = {
      titulo: 'Relatório Geral de Inventário',
      fiscal,
      matricula,
      ome,
      grupos: payloadGrupos
    };

    await this.pdfService.gerarRelatorioOficial(payloadObj);
  }

  formatarData(v: string | null): string {
    if (!v) return '';
    return new Date(v).toLocaleDateString('pt-BR');
  }

}





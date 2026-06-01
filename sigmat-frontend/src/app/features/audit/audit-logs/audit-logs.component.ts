import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportsService } from '../../../core/services/reports.service';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, TableModule, TagModule, TooltipModule, InputTextModule, FormsModule, DialogModule, ButtonModule],
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.scss']
})
export class AuditLogsComponent implements OnInit {
  private reportsService = inject(ReportsService);

  logs: any[] = [];
  carregando = true;
  expandedLogs = new Set<number>();
  showModal = false;
  selectedLog: any = null;

  // filtros
  filtros: any = {
    acao: '',
    usuario: '',
    patrimonio: '',
    descricao: '',
    startDate: '',
    endDate: ''
  };

  acoesDisponiveis = ['CREATE','UPDATE','DELETE','LOGIN','LOGOUT'];

  ngOnInit() {
    this.carregarLogs();
  }

  carregarLogs(filtros?: any) {
    this.carregando = true;
    this.reportsService.obterAuditoria(filtros || this.filtros).subscribe({
      next: (res) => {
        this.logs = res;
        this.carregando = false;
      },
      error: () => this.carregando = false
    });
  }

  aplicarFiltros() {
    const payload: any = {};
    if (this.filtros.acao) payload.acao = this.filtros.acao;
    if (this.filtros.usuario) payload.usuario = this.filtros.usuario;
    if (this.filtros.patrimonio) payload.patrimonio = this.filtros.patrimonio;
    if (this.filtros.descricao) payload.descricao = this.filtros.descricao;
    if (this.filtros.startDate) payload.startDate = this.filtros.startDate;
    if (this.filtros.endDate) payload.endDate = this.filtros.endDate;

    this.carregarLogs(payload);
  }

  limparFiltros() {
    this.filtros = { acao: '', usuario: '', patrimonio: '', descricao: '', startDate: '', endDate: '' };
    this.carregarLogs();
  }

  obterCorAcao(acao: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
    switch (acao?.toUpperCase()) {
      case 'CREATE': return 'success';
      case 'UPDATE': return 'info';
      case 'APPROVE': return 'success';
      case 'REJECT': return 'danger';
      case 'DELETE': return 'danger';
      case 'LOGIN': return 'success';
      case 'LOGOUT': return 'secondary';
      case 'TRANSFER': return 'info';
      case 'BATCH_UPDATE': return 'info';
      default: return 'secondary';
    }
  }

  formatarJSON(json: any): string {
    if (!json) return 'â€”';
    return JSON.stringify(json, null, 2);
  }

  formatKey(key: string): string {
    const labels: Record<string, string> = {
      marcaId: 'Marca',
      modeloId: 'Modelo',
      tipoEquipamentoId: 'Tipo Equipamento',
      statusId: 'Status',
      tipoAquisicaoId: 'Tipo AquisiÃ§Ã£o',
      disponibilidadeId: 'Disponibilidade',
      secaoId: 'SeÃ§Ã£o',
      usuarioResponsavelId: 'ResponsÃ¡vel',
      usuarioAprovadorId: 'Aprovador',
      usuarioNegadorId: 'Negador',
      solicitanteId: 'Solicitante',
      usuarioId: 'UsuÃ¡rio',
      numeroSerie: 'NÃºmero de SÃ©rie',
      patrimonio: 'PatrimÃ´nio',
      dataAquisicao: 'Data de AquisiÃ§Ã£o',
    };
    return labels[key] || key.replace(/([A-Z])/g, ' $1').replace(/Id$/, '').toUpperCase();
  }

  diffKeys(dadosAlterados: any): string[] {
    if (!dadosAlterados) return [];
    if (dadosAlterados.antes && dadosAlterados.depois) {
      return Array.from(new Set([
        ...Object.keys(dadosAlterados.antes || {}),
        ...Object.keys(dadosAlterados.depois || {}),
      ]));
    }
    return Object.keys(dadosAlterados || {});
  }

  getBeforeValue(dadosAlterados: any, key: string): any {
    if (dadosAlterados.antes && key in dadosAlterados.antes) return dadosAlterados.antes[key];
    if (dadosAlterados.dadosAntigos && key in dadosAlterados.dadosAntigos) return dadosAlterados.dadosAntigos[key];
    return null;
  }

  getAfterValue(dadosAlterados: any, key: string): any {
    if (dadosAlterados.depois && key in dadosAlterados.depois) return dadosAlterados.depois[key];
    if (dadosAlterados.dadosNovos && key in dadosAlterados.dadosNovos) return dadosAlterados.dadosNovos[key];
    if (key in dadosAlterados) return dadosAlterados[key];
    return null;
  }

  formatValue(value: any): string {
    if (value === null || value === undefined || value === '') return 'â€”';
    if (typeof value === 'object') {
      if ('nome' in value) return String(value.nome);
      if ('sigla' in value) return String(value.sigla);
      if ('patrimonio' in value) return String(value.patrimonio);
      if ('descricaoAmigavel' in value) return String(value.descricaoAmigavel);
      if ('matricula' in value && 'nome' in value) return `${value.nome} (${value.matricula})`;
      return JSON.stringify(value);
    }
    return String(value);
  }

  isCreate(log: any): boolean {
    return (log?.acao || '').toUpperCase() === 'CREATE';
  }

  toggleExpand(id: number) {
    if (this.expandedLogs.has(id)) this.expandedLogs.delete(id);
    else this.expandedLogs.add(id);
  }

  isExpanded(id: number): boolean {
    return this.expandedLogs.has(id);
  }

  getTopChangedKeys(log: any, limit = 3): string[] {
    const keys = this.diffKeys(log.dadosAlterados || {});
    return keys.slice(0, limit);
  }

  getChangedCount(log: any): number {
    return this.diffKeys(log.dadosAlterados || {}).length;
  }

  // Preferred fields to show for CREATE in order
  createDisplayOrder(): string[] {
    return ['patrimonio','numeroSerie','marcaId','modeloId','tipoEquipamentoId','statusId','secaoId','dataAquisicao','observacao'];
  }

  openModal(log: any) {
    this.selectedLog = log;
    this.showModal = true;
  }

  closeModal() {
    this.selectedLog = null;
    this.showModal = false;
  }
}


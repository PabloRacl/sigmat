/**
 * [Estado Atual]: Componente de apresenta��o/painel (Dumb Component com carregamento reativo de hist�rico) para timeline do Equipamento.
 * [Depend�ncias T�cnicas]:
 *   - Services: EquipmentService
 * [Hist�rico de Modifica��es]:
 *   - Movido para /feature./equipamentos/linha-do-tempo-equipamento.
 *   - Adicionado cabe�alho de contexto arquitetural de alta efici�ncia de tokens.
 * [Regras de Neg�cio Imut�veis]:
 *   - Renderiza��o e mapeamento do hist�rico/log de altera��es de equipamentos (diff).
 */

import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EquipmentService } from '../../../nucleo/servicos/equipamentos.service';

// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { EstadoVazioComponent } from '../../../componentes/estado-vazio/estado-vazio.component';

@Component({
  selector: 'app-linha-do-tempo-equipamento',
  standalone: true,
  imports: [CommonModule, DialogModule, EstadoVazioComponent],
  templateUrl: './linha-do-tempo-equipamento.component.html',
  styleUrls: ['./linha-do-tempo-equipamento.component.scss']
})
export class EquipmentTimelineComponent {
  private equipmentService = inject(EquipmentService);

  @Input() visible = false;
  @Input() equipment: any = null;
  @Output() visibleChange = new EventEmitter<boolean>();

  history: any[] = [];
  loading = false;

  ngOnChanges() {
    if (this.visible && this.equipment) {
      this.loadHistory();
    }
  }

  loadHistory() {
    this.loading = true;
    this.equipmentService.obterHistorico(this.equipment.id).subscribe({
      next: (res) => {
        this.history = res.map(log => ({
          ...log,
          parsedDiff: this.parseDiff(log.dadosAlterados)
        }));
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  private formatKey(key: string): string {
    const DICTIONARY: Record<string, string> = {
      sei: 'Processo SEI',
      marcaId: 'ID Marca',
      secaoId: 'ID Seção',
      modeloId: 'ID Modelo',
      statusId: 'ID Status',
      observacao: 'Observação',
      patrimonio: 'Patrimônio',
      numeroSerie: 'Nº Série',
      dataAquisicao: 'Data Aquisição',
      dataSolicitacao: 'Data Solicitação',
      dataRetornoEmprestimo: 'Retorno Empréstimo',
      especificacoes: 'Especificações',
      disponibilidadeId: 'ID Disponibilidade',
      tipoEquipamentoId: 'ID Tipo Equip.',
      tipoAquisicaoId: 'ID Tipo Aquisição',
      solicitante: 'Solicitante',
      valor: 'Valor',
      empenho: 'Empenho'
    };
    return DICTIONARY[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim();
  }

  private formatValue(value: any): string {
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'object') {
      if (Object.keys(value).length === 0) return '-';
      return JSON.stringify(value);
    }
    
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      const date = new Date(value);
      return date.toLocaleDateString('pt-BR');
    }

    return String(value);
  }

  parseDiff(diff: any): any[] {
    if (!diff) return [];
    const result = [];

    if (diff.antes && diff.depois) {
      for (const key of Object.keys(diff.depois)) {
        result.push({
          key: this.formatKey(key),
          oldValue: this.formatValue(diff.antes[key]),
          newValue: this.formatValue(diff.depois[key]),
          isUpdate: true
        });
      }
    } else {
      for (const key of Object.keys(diff)) {
        result.push({
          key: this.formatKey(key),
          value: this.formatValue(diff[key]),
          isUpdate: false
        });
      }
    }

    return result;
  }

  obterIconeAcao(acao: string): string {
    const a = acao?.toUpperCase();
    if (a === 'CREATE') return 'pi pi-plus';
    if (a === 'UPDATE' || a === 'BATCH_UPDATE') return 'pi pi-pencil';
    if (a === 'DELETE') return 'pi pi-trash';
    if (a === 'APPROVE') return 'pi pi-check-circle';
    if (a === 'REJECT') return 'pi pi-times-circle';
    if (a === 'TRANSFER' || a === 'TRANSFERENCIA_CONCLUIDA') return 'pi pi-truck';
    if (a === 'ABERTURA_OS' || a === 'ATUALIZACAO_OS') return 'pi pi-wrench';
    return 'pi pi-info-circle';
  }

  obterClasseAcao(acao: string): string {
    const a = acao?.toUpperCase();
    if (a === 'CREATE' || a === 'APPROVE') return 'success';
    if (a === 'UPDATE' || a === 'BATCH_UPDATE') return 'info';
    if (a === 'DELETE' || a === 'REJECT') return 'danger';
    if (a === 'TRANSFER' || a === 'TRANSFERENCIA_CONCLUIDA') return 'warning';
    if (a === 'ABERTURA_OS' || a === 'ATUALIZACAO_OS') return 'maintenance';
    return 'neutral';
  }

  fechar() {
    this.visibleChange.emit(false);
  }
}


/**
 * [Estado Atual]: Componente de apresentação puramente visual (Dumb Component) para detalhes do Equipamento.
 * [Dependências Técnicas]:
 *   - PrimeNG DialogModule
 * [Histórico de Modificações]:
 *   - Movido para /feature./equipamentos/detalhes-equipamento.
 *   - Adicionado cabeçalho de contexto arquitetural de alta eficiência de tokens.
 * [Regras de Negócio Imutáveis]:
 *   - Exibição de especificações e propriedades de equipamento de forma somente leitura.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

// PrimeNG
import { DialogModule } from 'primeng/dialog';

import { IndicadorStatusComponent } from '../../../componentes/indicador-status/indicador-status.component';
import { EstadoVazioComponent } from '../../../componentes/estado-vazio/estado-vazio.component';

@Component({
  selector: 'app-detalhes-equipamento',
  standalone: true,
  imports: [CommonModule, DialogModule, IndicadorStatusComponent, EstadoVazioComponent],
  templateUrl: './detalhes-equipamento.component.html',
  styleUrls: ['./detalhes-equipamento.component.scss']
})
export class EquipmentDetailsComponent {
  @Input() visible = false;
  @Input() equipment: any = null;
  @Output() visibleChange = new EventEmitter<boolean>();

  get chavesEspecificacoes(): string[] {
    if (!this.equipment?.especificacoes) return [];
    return Object.keys(this.equipment.especificacoes);
  }

  formatarChave(chave: string): string {
    return chave
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  fechar() {
    this.visibleChange.emit(false);
  }
}

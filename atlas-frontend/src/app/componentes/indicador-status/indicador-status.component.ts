import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SeveridadeStatus, severidadeStatus } from '../../nucleo/utilitarios/status-utilitarios';

@Component({
  selector: 'app-indicador-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="indicador-status" [ngClass]="'severidade-' + severidade">
      {{ valor }}
    </span>
  `,
  styles: [],
})
export class IndicadorStatusComponent {
  @Input({ required: true }) valor = '';
  @Input() tipo: 'status' | 'disponibilidade' | 'transferencia' = 'status';
  @Input() severidadeManual?: SeveridadeStatus;

  get severidade(): SeveridadeStatus {
    return this.severidadeManual ?? severidadeStatus(this.valor, this.tipo);
  }
}

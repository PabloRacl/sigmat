import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

// PrimeNG
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-equipment-details',
  standalone: true,
  imports: [CommonModule, DialogModule],
  templateUrl: './equipment-details.component.html',
  styleUrl: './equipment-details.component.scss'
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

  obterCorStatus(status: string): string {
    const s = status?.toUpperCase();
    if (s === 'ATIVO' || s === 'DISPONÍVEL') return 'success';
    if (s === 'MANUTENÇÃO' || s === 'PENDENTE_APROVACAO') return 'warning';
    if (s === 'INATIVO' || s === 'EXTRAVIADO' || s === 'DANO') return 'danger';
    return 'neutral';
  }

  obterCorDisponibilidade(disp: string): string {
    const d = disp?.toUpperCase();
    if (d === 'CARGA') return 'success';
    if (d === 'EMPRESTIMO') return 'warning';
    return 'neutral';
  }

  fechar() {
    this.visibleChange.emit(false);
  }
}

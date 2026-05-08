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

  fechar() {
    this.visibleChange.emit(false);
  }
}

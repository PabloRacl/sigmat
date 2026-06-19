import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TooltipModule } from 'primeng/tooltip';

export type FiltroTipo = 'text' | 'select' | 'date';

export interface FiltroConfig {
  key: string;
  label: string;
  tipo: FiltroTipo;
  placeholder?: string;
  opcoes?: any[];
  optionLabel?: string;
  optionValue?: string;
  showClear?: boolean;
}

@Component({
  selector: 'app-filtro-lateral',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DrawerModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    DatePickerModule,
    TooltipModule
  ],
  templateUrl: './filtro-lateral.component.html',
  styleUrls: ['./filtro-lateral.component.scss']
})
export class FiltroLateralComponent {
  @Input() titulo: string = 'Filtros Avançados';
  @Input() config: FiltroConfig[] = [];
  @Input() visible: boolean = false;
  
  // O modelo dinâmico contendo as seleções do usuário: { [key: string]: any }
  @Input() modelo: any = {};
  
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() aplicar = new EventEmitter<any>();
  @Output() limpar = new EventEmitter<void>();

  fechar() {
    this.visible = false;
    this.visibleChange.emit(this.visible);
  }

  onAplicar() {
    this.aplicar.emit(this.modelo);
    this.fechar();
  }

  onLimpar() {
    // Zera o modelo localmente
    Object.keys(this.modelo).forEach(key => this.modelo[key] = null);
    this.limpar.emit();
  }
}

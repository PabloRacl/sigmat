import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MaintenanceService } from '../../services/maintenance.service';
import { AuthService } from '../../services/auth.service';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { Textarea } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { DatePickerModule } from 'primeng/datepicker';

@Component({
  selector: 'app-maintenance-list',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    DropdownModule,
    InputTextModule,
    Textarea,
    ToastModule,
    InputNumberModule,
    TooltipModule,
    DatePickerModule
  ],
  providers: [MessageService],
  templateUrl: './maintenance-list.component.html',
  styleUrl: './maintenance-list.component.scss'
})
export class MaintenanceListComponent implements OnInit {
  private MaintenanceService = inject(MaintenanceService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private fb = inject(FormBuilder);

  get ehAdmin(): boolean {
    const perfil = this.authService.getUsuario()?.perfil;
    return perfil === 'ADMIN_DTEC' || perfil === 'DIRETORIA';
  }

  ordens: any[] = [];
  carregando = true;

  exibirModalStatus = false;
  statusForm: FormGroup;
  osSelecionada: any = null;

  statusOpcoes = [
    { label: 'Aberta', value: 'ABERTA' },
    { label: 'Em Andamento', value: 'EM_ANDAMENTO' },
    { label: 'Aguardando Peça', value: 'AGUARDANDO_PECA' },
    { label: 'Concluída', value: 'CONCLUIDA' },
    { label: 'Cancelada', value: 'CANCELADA' },
  ];

  constructor() {
    this.statusForm = this.fb.group({
      status: ['', Validators.required],
      tecnicoResponsavel: [''],
      dataPrevisao: [null],
      solucaoAplicada: [''],
      valorGasto: [null]
    });
  }

  ngOnInit() {
    this.carregarDados();
  }

  carregarDados() {
    this.carregando = true;
    this.MaintenanceService.listarTodos().subscribe({
      next: (res) => {
        this.ordens = res;
        this.carregando = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar ordens de serviço.' });
        this.carregando = false;
      }
    });
  }

  abrirAtualizacaoStatus(os: any) {
    this.osSelecionada = os;
    this.statusForm.reset({
      status: os.status,
      tecnicoResponsavel: os.tecnicoResponsavel || '',
      dataPrevisao: os.dataPrevisao ? new Date(os.dataPrevisao) : null,
      solucaoAplicada: os.solucaoAplicada || '',
      valorGasto: os.valorGasto || null
    });
    this.exibirModalStatus = true;
  }

  salvarStatus() {
    if (this.statusForm.invalid || !this.osSelecionada) return;

    this.MaintenanceService.atualizarStatus(
      this.osSelecionada.id, 
      this.statusForm.value.status, 
      this.statusForm.value
    ).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Status atualizado com sucesso.' });
        this.exibirModalStatus = false;
        this.carregarDados();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao atualizar status.' });
      }
    });
  }
}


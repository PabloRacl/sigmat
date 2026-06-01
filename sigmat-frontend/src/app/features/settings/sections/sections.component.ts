import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SettingsService } from '../../../core/services/settings.service';
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-settings-sections',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule
  ],
  providers: [MessageService],
  templateUrl: './sections.component.html',
  styleUrls: ['./sections.component.scss']
})
export class SettingsSectionsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private settingsService = inject(SettingsService);
  private messageService = inject(MessageService);

  secoes: any[] = [];
  batalhoes: any[] = [];
  carregando = false;
  dialogVisivel = false;
  editando = false;
  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      id: [null],
      sigla: ['', Validators.required],
      nome: ['', Validators.required],
      batalhaoId: [null, Validators.required]
    });
  }

  ngOnInit() {
    this.carregarDados();
  }

  carregarDados() {
    this.carregando = true;
    this.settingsService.listarSecoes().subscribe({
      next: (res) => {
        this.secoes = res || [];
        this.carregando = false;
      },
      error: () => {
        this.carregando = false;
      }
    });

    this.settingsService.listarBatalhoes().subscribe({
      next: (res) => this.batalhoes = res || []
    });
  }

  abrirDialog(secao?: any) {
    this.editando = !!secao;
    this.dialogVisivel = true;
    if (secao) {
      this.form.patchValue({
        id: secao.id,
        sigla: secao.sigla,
        nome: secao.nome,
        batalhaoId: secao.batalhaoId
      });
    } else {
      this.form.reset();
      this.form.patchValue({ id: null });
    }
  }

  fecharDialog() {
    this.dialogVisivel = false;
  }

  salvar() {
    if (this.form.invalid) {
      this.messageService.add({ severity: 'warn', summary: 'Validação', detail: 'Preencha todos os campos obrigatórios.' });
      return;
    }

    const dados = this.form.value;
    const action = this.editando ? this.settingsService.atualizarSecao(dados.id, dados) : this.settingsService.criarSecao(dados);
    action.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: `Seção ${this.editando ? 'atualizada' : 'criada'} com sucesso.` });
        this.fecharDialog();
        this.carregarDados();
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: err?.error?.message || 'Falha ao salvar seção.' });
      }
    });
  }

  getBatalhaoNome(id: number) {
    return this.batalhoes.find((b: any) => b.id === id)?.sigla || '—';
  }
}

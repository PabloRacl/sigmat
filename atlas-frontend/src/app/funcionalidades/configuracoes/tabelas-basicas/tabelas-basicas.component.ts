import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../../nucleo/servicos/configuracoes.service';
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';

@Component({
  selector: 'app-tabelas-basicas',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, DialogModule, InputTextModule, DropdownModule],
  providers: [MessageService],
  templateUrl: './tabelas-basicas.component.html',
  styleUrls: ['./tabelas-basicas.component.scss']
})
export class TabelasBasicasComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private settingsService = inject(SettingsService);
  private messageService = inject(MessageService);

  entidade: string = '';
  titulo: string = '';
  itens: any[] = [];
  carregando = false;

  modalVisivel = false;
  salvando = false;
  modoEdicao = false;
  novoRegistro: any = { nome: '' };

  // Usado apenas para 'modelos'
  marcas: any[] = [];

  ngOnInit() {
    // Escuta mudanças de parâmetros de rota para recarregar a tabela correta
    this.route.paramMap.subscribe(params => {
      const entidade = params.get('entidade');
      if (entidade) {
        this.entidade = entidade;
        this.configurarEntidade();
        this.carregarDados();
      }
    });
  }

  configurarEntidade() {
    switch (this.entidade) {
      case 'tipos': this.titulo = 'Tipos de Equipamento'; break;
      case 'marcas': this.titulo = 'Marcas'; break;
      case 'modelos': 
        this.titulo = 'Modelos'; 
        this.carregarMarcas(); // Necessário para o dropdown
        break;
      case 'status': this.titulo = 'Status de Equipamento'; break;
      case 'disponibilidades': this.titulo = 'Disponibilidades'; break;
      default: this.titulo = 'Tabela Básica';
    }
  }

  carregarMarcas() {
    this.settingsService.listarMarcas().subscribe(res => this.marcas = res);
  }

  carregarDados() {
    this.carregando = true;
    let observable;

    switch (this.entidade) {
      case 'tipos': observable = this.settingsService.listarTipos(); break;
      case 'marcas': observable = this.settingsService.listarMarcas(); break;
      case 'modelos': observable = this.settingsService.listarModelos(); break;
      case 'status': observable = this.settingsService.listarStatus(); break;
      case 'disponibilidades': observable = this.settingsService.listarDisponibilidades(); break;
    }

    if (observable) {
      observable.subscribe({
        next: (res) => {
          this.itens = res;
          this.carregando = false;
        },
        error: (err) => {
          this.carregando = false;
          this.mostrarErro('Erro ao carregar dados');
        }
      });
    } else {
      this.carregando = false;
    }
  }

  abrirModalNovo() {
    this.modoEdicao = false;
    this.novoRegistro = { nome: '' };
    if (this.entidade === 'modelos') {
      this.novoRegistro.marcaId = null;
    }
    this.modalVisivel = true;
  }

  editar(item: any) {
    this.modoEdicao = true;
    this.novoRegistro = { ...item };
    this.modalVisivel = true;
  }

  fecharModal() {
    this.modalVisivel = false;
  }

  salvar() {
    if (!this.novoRegistro.nome || this.novoRegistro.nome.trim() === '') {
      this.mostrarErro('O nome é obrigatório');
      return;
    }

    if (this.entidade === 'modelos' && !this.novoRegistro.marcaId) {
      this.mostrarErro('Selecione uma marca');
      return;
    }

    this.salvando = true;
    let observable;

    if (this.modoEdicao) {
      switch (this.entidade) {
        case 'tipos': observable = this.settingsService.atualizarTipo(this.novoRegistro.id, { nome: this.novoRegistro.nome }); break;
        case 'marcas': observable = this.settingsService.atualizarMarca(this.novoRegistro.id, { nome: this.novoRegistro.nome }); break;
        case 'modelos': observable = this.settingsService.atualizarModelo(this.novoRegistro.id, { nome: this.novoRegistro.nome, marcaId: this.novoRegistro.marcaId }); break;
        case 'status': observable = this.settingsService.atualizarStatus(this.novoRegistro.id, { nome: this.novoRegistro.nome }); break;
        case 'disponibilidades': observable = this.settingsService.atualizarDisponibilidade(this.novoRegistro.id, { nome: this.novoRegistro.nome }); break;
      }
    } else {
      switch (this.entidade) {
        case 'tipos': observable = this.settingsService.criarTipo({ nome: this.novoRegistro.nome }); break;
        case 'marcas': observable = this.settingsService.criarMarca({ nome: this.novoRegistro.nome }); break;
        case 'modelos': observable = this.settingsService.criarModelo({ nome: this.novoRegistro.nome, marcaId: this.novoRegistro.marcaId }); break;
        case 'status': observable = this.settingsService.criarStatus({ nome: this.novoRegistro.nome }); break;
        case 'disponibilidades': observable = this.settingsService.criarDisponibilidade({ nome: this.novoRegistro.nome }); break;
      }
    }

    if (observable) {
      observable.subscribe({
        next: () => {
          this.salvando = false;
          this.fecharModal();
          this.mostrarSucesso(this.modoEdicao ? 'Registro atualizado com sucesso' : 'Registro criado com sucesso');
          this.carregarDados();
        },
        error: (err) => {
          this.salvando = false;
          this.mostrarErro(err.error?.message || 'Erro ao criar registro');
        }
      });
    }
  }

  excluir(id: number) {
    if (!confirm('Deseja realmente excluir este registro?')) return;

    let observable;
    switch (this.entidade) {
      case 'tipos': observable = this.settingsService.excluirTipo(id); break;
      case 'marcas': observable = this.settingsService.excluirMarca(id); break;
      case 'modelos': observable = this.settingsService.excluirModelo(id); break;
      case 'status': observable = this.settingsService.excluirStatus(id); break;
      case 'disponibilidades': observable = this.settingsService.excluirDisponibilidade(id); break;
    }

    if (observable) {
      observable.subscribe({
        next: () => {
          this.mostrarSucesso('Registro excluído com sucesso');
          this.carregarDados();
        },
        error: (err) => {
          this.mostrarErro(err.error?.message || 'Erro ao excluir registro');
        }
      });
    }
  }

  private mostrarSucesso(msg: string) {
    this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: msg });
  }

  private mostrarErro(msg: string) {
    this.messageService.add({ severity: 'error', summary: 'Erro', detail: msg });
  }
}

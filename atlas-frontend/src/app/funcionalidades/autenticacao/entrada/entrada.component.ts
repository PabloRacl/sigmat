import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../nucleo/servicos/autenticacao.service';
import { MockModeService } from '../../../nucleo/servicos/modo-mock.service';
import { ROTAS } from '../../../nucleo/utilitarios/rotas.constantes';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule],
  templateUrl: './entrada.component.html',
  styleUrls: ['./entrada.component.scss']
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  error = '';
  requestError = '';
  requestSuccess = '';
  loading = false;
  requestLoading = false;
  showPassword = false;

  // Solicitar acesso fields
  reqUsuario = '';
  reqMatricula = '';
  reqCpf = '';
  reqNome = '';
  reqUnidade = '';
  reqSenha = '';

  // Unidades (OMEs) para o select pesquisável
  unidades: string[] = [];
  unidadesFiltradas: string[] = [];
  unidadesBusca = '';
  mostrarDropdownUnidades = false;
  carregandoUnidades = false;
  dropdownTop = 0;
  dropdownLeft = 0;
  dropdownWidth = 0;

  showRequestModal = false;
  showAdvancedMenu = false;
  returnUrl = '/visao-geral';
  mockMode = false;

  constructor(
    private authService: AuthService,
    public mockModeService: MockModeService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.returnUrl = this.route.snapshot.queryParams?.['returnUrl'] || '/visao-geral/inicio';
    this.mockMode = this.mockModeService.useMock;
  }

  ngOnInit() {
    this.carregarUnidades();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.unidade-select-wrapper')) {
      this.mostrarDropdownUnidades = false;
    }
  }

  carregarUnidades() {
    this.carregandoUnidades = true;
    this.authService.buscarUnidades().subscribe({
      next: (res) => {
        this.unidades = res.unidades || [];
        this.unidadesFiltradas = [...this.unidades];
        this.carregandoUnidades = false;
      },
      error: () => {
        this.unidades = ['DTEC', 'DIM', 'BPCHOQUE', 'BPTUR', 'BPGD', 'BOPE', 'CPM', 'EMG'];
        this.unidadesFiltradas = [...this.unidades];
        this.carregandoUnidades = false;
      }
    });
  }

  filtrarUnidades() {
    const termo = this.unidadesBusca.toLowerCase();
    this.unidadesFiltradas = this.unidades.filter(u => u.toLowerCase().includes(termo));
  }

  selecionarUnidade(unidade: string) {
    this.reqUnidade = unidade;
    this.unidadesBusca = '';
    this.unidadesFiltradas = [...this.unidades];
    this.mostrarDropdownUnidades = false;
  }

  abrirDropdownUnidades(event: MouseEvent) {
    const target = (event.currentTarget as HTMLElement);
    const rect = target.getBoundingClientRect();
    this.dropdownTop = rect.bottom + 4;
    this.dropdownLeft = rect.left;
    this.dropdownWidth = rect.width;
    this.mostrarDropdownUnidades = true;
    this.unidadesFiltradas = [...this.unidades];
    this.unidadesBusca = '';
  }

  login() {
    if (!this.username || !this.password) {
      this.error = 'Por favor, preencha todos os campos.';
      return;
    }

    this.loading = true;
    this.error = '';

    if (this.mockModeService.useMock !== this.mockMode) {
      this.mockModeService.setUseMock(this.mockMode);
    }

    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (err: any) => {
        console.error('Login Error:', err);
        this.error = 'Erro: ' + (err.error?.message || err.message || 'Falha desconhecida');
        this.loading = false;
      }
    });
  }

  abrirDialogSolicitarAcesso() {
    this.requestError = '';
    this.requestSuccess = '';
    this.showRequestModal = true;
  }

  fecharDialogSolicitarAcesso() {
    this.showRequestModal = false;
    this.requestError = '';
    this.requestSuccess = '';
    this.reqUsuario = '';
    this.reqMatricula = '';
    this.reqCpf = '';
    this.reqNome = '';
    this.reqUnidade = '';
    this.reqSenha = '';
    this.unidadesBusca = '';
    this.mostrarDropdownUnidades = false;
  }

  solicitarAcesso() {
    if (!this.reqUsuario || !this.reqMatricula || !this.reqCpf || !this.reqNome || !this.reqUnidade || !this.reqSenha) {
      this.requestError = 'Preencha todos os campos para solicitar acesso.';
      return;
    }

    this.requestLoading = true;
    this.requestError = '';
    this.requestSuccess = '';

    const dados = {
      usuario: this.reqUsuario,
      matricula: this.reqMatricula,
      cpf: this.reqCpf,
      nome: this.reqNome,
      unidade: this.reqUnidade,
      senha: this.reqSenha
    };

    this.authService.solicitarAcesso(dados).subscribe({
      next: (res: any) => {
        this.requestSuccess = res?.message || 'Solicitação enviada com sucesso. Aguarde retorno da DTEC.';
        this.requestLoading = false;
      },
      error: (err: any) => {
        console.error('Solicitar Acesso Error:', err);
        this.requestError = 'Erro: ' + (err.error?.message || err.message || 'Falha ao enviar solicitação');
        this.requestLoading = false;
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  get mockLoginHint() {
    return this.mockModeService.mockHint;
  }

  get isForcedReal(): boolean {
    return this.mockModeService.isForcedReal();
  }

  toggleMockMode() {
    this.mockModeService.setUseMock(this.mockMode);
  }

  forceRealMode() {
    this.mockMode = false;
    this.mockModeService.forceRealMode();
  }

  resetMockOverride() {
    this.mockModeService.clearOverride();
    this.mockMode = this.mockModeService.useMock;
  }

  toggleAdvancedMenu() {
    this.showAdvancedMenu = !this.showAdvancedMenu;
  }
}

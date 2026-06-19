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
  reqNome = '';
  reqUnidade = '';
  reqMotivo = '';

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
        if (err.status === 429) {
          this.error = 'Muitas tentativas inválidas. Por segurança contra ataques, seu IP foi temporariamente bloqueado. Aguarde 1 minuto e tente novamente.';
        } else {
          this.error = this.obterMensagemErro(err);
        }
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
    this.reqNome = '';
    this.reqUnidade = '';
    this.reqMotivo = '';
    this.unidadesBusca = '';
    this.mostrarDropdownUnidades = false;
  }

  solicitarAcesso() {
    if (!this.reqUsuario || !this.reqMatricula || !this.reqNome || !this.reqUnidade || !this.reqMotivo) {
      this.requestError = 'Preencha todos os campos para solicitar acesso.';
      return;
    }

    this.requestLoading = true;
    this.requestError = '';
    this.requestSuccess = '';

    const dados = {
      usuario: this.reqUsuario,
      matricula: this.reqMatricula,
      nome: this.reqNome,
      unidade: this.reqUnidade,
      motivo: this.reqMotivo
    };

    this.authService.solicitarAcesso(dados).subscribe({
      next: (res: any) => {
        this.requestSuccess = res?.message || 'Solicitação enviada com sucesso. Aguarde retorno da DTEC.';
        this.requestLoading = false;
      },
      error: (err: any) => {
        console.error('Solicitar Acesso Error:', err);
        if (err.status === 429) {
          this.requestError = 'Muitas solicitações enviadas em curto espaço de tempo. Aguarde 1 minuto para evitar sobrecarga no sistema.';
        } else {
          this.requestError = this.obterMensagemErro(err);
        }
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

  private obterMensagemErro(err: any): string {
    const status = err.status;
    const backendMessage = err.error?.message;

    // Se o backend enviar uma mensagem específica já traduzida ou clara, aproveita:
    if (backendMessage && typeof backendMessage === 'string' && backendMessage.toLowerCase().includes('senha')) {
      return 'Usuário ou senha incorretos.';
    }

    switch (status) {
      case 400:
        return 'Os dados enviados estão incorretos ou incompletos. Verifique e tente novamente.';
      case 401:
        return 'Acesso negado: Usuário ou senha incorretos.';
      case 403:
        return 'Acesso negado: Você não tem permissão para realizar esta ação.';
      case 404:
        return 'O serviço ou usuário solicitado não foi encontrado.';
      case 500:
        return 'Ocorreu um erro interno no servidor. Por favor, tente novamente mais tarde.';
      case 503:
        return 'O sistema está temporariamente indisponível para manutenção. Tente novamente em breve.';
      case 504:
        return 'O servidor demorou muito para responder (Timeout). Verifique sua conexão e tente novamente.';
      case 0:
        return 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet ou se você está na rede da corporação.';
      default:
        return backendMessage || 'Ocorreu um erro inesperado. Tente novamente mais tarde.';
    }
  }
}

import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../nucleo/servicos/autenticacao.service';
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
  reqCpf = '';
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
  returnUrl = '/visao-geral';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.returnUrl = this.route.snapshot.queryParams?.['returnUrl'] || '/visao-geral/inicio';
  }

  ngOnInit() {
    this.carregarUnidades();
    this.route.queryParams.subscribe(params => {
      if (params['returnUrl']) {
        this.returnUrl = params['returnUrl'];
      }
    });
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

  loadingProgress = 0;

  login() {
    if (!this.username || !this.password) {
      this.error = 'Por favor, preencha todos os campos.';
      return;
    }

    this.loading = true;
    this.loadingProgress = 0;
    this.error = '';



    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        // Dispara progresso dinâmico de 0 a 100% que vai acelerar os cubos no DOM
        const duration = 2800; // 2.8 segundos de experiência visual premium
        const intervalTime = 30;
        const steps = duration / intervalTime;
        let currentStep = 0;

        const timer = setInterval(() => {
          currentStep++;
          // Curva de aceleração não-linear (acelera no final)
          const ratio = currentStep / steps;
          this.loadingProgress = Math.min(Math.round(Math.pow(ratio, 1.5) * 100), 100);

          if (currentStep >= steps) {
            clearInterval(timer);
            this.router.navigateByUrl(this.returnUrl);
          }
        }, intervalTime);
      },
      error: (err: HttpErrorResponse | Error | unknown) => {
        const e = err as HttpErrorResponse;
        console.error('Login Error:', e);
        if (e.status === 429) {
          this.error = 'Muitas tentativas inválidas. Por segurança contra ataques, seu IP foi temporariamente bloqueado. Aguarde 1 minuto e tente novamente.';
        } else {
          this.error = this.obterMensagemErro(err);
        }
        this.loading = false;
        this.loadingProgress = 0;
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
    this.reqCpf = '';
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
      cpf: this.reqCpf,
      matricula: this.reqMatricula,
      nome: this.reqNome,
      unidade: this.reqUnidade,
      motivo: this.reqMotivo
    };

    this.authService.solicitarAcesso(dados).subscribe({
      next: (res: Record<string, unknown>) => {
        this.requestSuccess = (res?.['message'] as string) || 'Solicitação enviada com sucesso. Aguarde retorno da DTEC.';
        this.requestLoading = false;
      },
      error: (err: HttpErrorResponse | Error | unknown) => {
        const e = err as HttpErrorResponse;
        console.error('Solicitar Acesso Error:', e);
        if (e.status === 429) {
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



  private obterMensagemErro(err: unknown): string {
        const e = err as HttpErrorResponse;
    const status = e.status;
    const backendMessage = e.error?.message;

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

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../nucleo/servicos/autenticacao.service';
import { MockModeService } from '../../../nucleo/servicos/modo-mock.service';
import { environment } from '../../../environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule],
  templateUrl: './entrada.component.html',
  styleUrls: ['./entrada.component.scss']
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  requestError = '';
  requestSuccess = '';
  loading = false;
  requestLoading = false;
  showPassword = false;
  showRequestModal = false;
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
  }

  solicitarAcesso() {
    if (!this.username || !this.password) {
      this.requestError = 'Para solicitar acesso, preencha matrícula/CPF e senha corporativa.';
      return;
    }

    this.requestLoading = true;
    this.requestError = '';
    this.requestSuccess = '';

    this.authService.solicitarAcesso(this.username, this.password).subscribe({
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
}



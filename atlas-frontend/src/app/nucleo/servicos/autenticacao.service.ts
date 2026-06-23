import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { environment } from '../../environment';
import { MockModeService } from './modo-mock.service';
import { USUARIOS_MOCK } from '../dados-teste/usuarios.teste';
import { UsuarioLogado } from '../interfaces/usuario.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private mockMode = inject(MockModeService);
  private readonly API_URL = `${environment.apiUrl}/autenticacao`;

  private usuarioSubject = new BehaviorSubject<UsuarioLogado | null>(this.getUsuario());
  public usuario$ = this.usuarioSubject.asObservable();

  login(matricula: string, senha: string) {
    if (this.mockMode.useMock) {
      const mockUsuario = USUARIOS_MOCK[matricula?.toLowerCase()];
      if (mockUsuario && senha === '123') {
        const mockResponse = {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          usuario: mockUsuario
        };

        return of(mockResponse).pipe(
          tap(res => {
            this.salvarSessao(res.access_token, res.refresh_token, res.usuario);
          })
        );
      }

      return throwError(() => new Error('Usuário ou senha inválidos'));
    }

    return this.http.post<{ access_token: string; refresh_token: string; usuario: UsuarioLogado }>(`${this.API_URL}/login-sei`, { usuario: matricula, senha })
      .pipe(
        tap(res => {
          if (res.access_token) {
            this.salvarSessao(res.access_token, res.refresh_token, res.usuario);
          }
        })
      );
  }

  refresh() {
    if (this.mockMode.useMock) {
      const refreshToken = this.getRefreshToken();
      const mockResponse = {
        access_token: 'mock-access-token',
        refresh_token: refreshToken || 'mock-refresh-token'
      };
      return of(mockResponse).pipe(
        tap(res => {
          if (res.access_token) {
            this.salvarSessao(res.access_token, res.refresh_token, this.getUsuario()!);
          }
        })
      );
    }

    const refreshToken = this.getRefreshToken();
    return this.http.post<{ access_token: string; refresh_token: string }>(`${this.API_URL}/refresh`, { refresh_token: refreshToken })
      .pipe(
        tap(res => {
          if (res.access_token) {
            this.salvarSessao(res.access_token, res.refresh_token, this.getUsuario()!);
          }
        })
      );
  }

  solicitarAcesso(dados: { usuario: string, matricula: string, nome: string, unidade: string, motivo: string }) {
    return this.http.post<{ message: string }>(`${this.API_URL}/solicitar-acesso`, dados);
  }

  buscarUnidades() {
    return this.http.get<{ unidades: string[] }>(`${this.API_URL}/unidades`);
  }

  logout() {
    if (this.mockMode.useMock) {
      this.limparSessao();
      return;
    }

    const token = this.getToken();
    if (token) {
      this.http.post(`${this.API_URL}/logout`, {}).subscribe({
        next: () => this.limparSessao(),
        error: () => this.limparSessao()
      });
    } else {
      this.limparSessao();
    }
  }

  private salvarSessao(access: string, refresh: string, user: UsuarioLogado) {
    localStorage.setItem('atlas_token', access);
    localStorage.setItem('atlas_refresh', refresh);
    localStorage.setItem('atlas_user', JSON.stringify(user));
    this.usuarioSubject.next(user);
  }

  private limparSessao() {
    localStorage.removeItem('atlas_token');
    localStorage.removeItem('atlas_refresh');
    localStorage.removeItem('atlas_user');
    this.usuarioSubject.next(null);
  }

  getToken() {
    return localStorage.getItem('atlas_token');
  }

  getRefreshToken() {
    return localStorage.getItem('atlas_refresh');
  }

  getUsuario() {
    const user = localStorage.getItem('atlas_user');
    try {
      return user ? JSON.parse(user) as UsuarioLogado : null;
    } catch {
      return null;
    }
  }

  isAutenticado(): boolean {
    return !!this.getToken();
  }

  getTokenExpirationTime(): number {
    const token = this.getToken();
    if (!token) return 0;
    
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return 0;
      
      const payload = JSON.parse(atob(parts[1]));
      return payload.exp ? payload.exp * 1000 : 0;
    } catch {
      return 0;
    }
  }
}


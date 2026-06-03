import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { environment } from '../../environment';
import { MockModeService } from './modo-mock.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private mockMode = inject(MockModeService);
  private readonly API_URL = `${environment.apiUrl}/autenticacao`;

  private usuarioSubject = new BehaviorSubject<any>(this.getUsuario());
  public usuario$ = this.usuarioSubject.asObservable();

  login(matricula: string, senha: string) {
    if (this.mockMode.useMock) {
      const mockUsers: Record<string, any> = {
        'pablo.ricardo': {
          id: 1,
          nome: 'Pablo Ricardo',
          login: 'pablo.ricardo',
          perfil: 'ADMIN_DTEC',
          email: 'pablo.ricardo@localhost',
          diretoriaId: null,
          diretoriaSigla: 'DTEC',
          batalhaoId: null,
          batalhaoSigla: null,
          secaoId: null,
          secaoSigla: null
        },
        'diretoria': {
          id: 2,
          nome: 'Usuário Diretoria',
          login: 'diretoria',
          perfil: 'DIRETORIA',
          email: 'diretoria@localhost',
          diretoriaId: 10,
          diretoriaSigla: 'DTEC',
          batalhaoId: null,
          batalhaoSigla: null,
          secaoId: null,
          secaoSigla: null
        },
        'comandante': {
          id: 3,
          nome: 'Comandante BPTUR',
          login: 'comandante',
          perfil: 'COMANDANTE',
          email: 'comandante@localhost',
          diretoriaId: 10,
          diretoriaSigla: 'DTEC',
          batalhaoId: 20,
          batalhaoSigla: 'BPTUR',
          secaoId: 101,
          secaoSigla: 'BPTUR'
        },
        'usuariobatalhao': {
          id: 4,
          nome: 'Usuário BPTUR',
          login: 'usuariobatalhao',
          perfil: 'USUARIO_BATALHAO',
          email: 'usuariobatalhao@localhost',
          diretoriaId: 10,
          diretoriaSigla: 'DTEC',
          batalhaoId: 20,
          batalhaoSigla: 'BPTUR',
          secaoId: 101,
          secaoSigla: 'BPTUR'
        }
      };

      const mockUsuario = mockUsers[matricula?.toLowerCase()];
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

    return this.http.post<any>(`${this.API_URL}/login-sei`, { usuario: matricula, senha })
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
            this.salvarSessao(res.access_token, res.refresh_token, this.getUsuario());
          }
        })
      );
    }

    const refreshToken = this.getRefreshToken();
    return this.http.post<any>(`${this.API_URL}/refresh`, { refresh_token: refreshToken })
      .pipe(
        tap(res => {
          if (res.access_token) {
            this.salvarSessao(res.access_token, res.refresh_token, this.getUsuario());
          }
        })
      );
  }

  solicitarAcesso(usuario: string, senha: string) {
    return this.http.post<any>(`${this.API_URL}/solicitar-acesso`, { usuario, senha });
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

  private salvarSessao(access: string, refresh: string, user: any) {
    localStorage.setItem('sigmat_token', access);
    localStorage.setItem('sigmat_refresh', refresh);
    localStorage.setItem('sigmat_user', JSON.stringify(user));
    this.usuarioSubject.next(user);
  }

  private limparSessao() {
    localStorage.removeItem('sigmat_token');
    localStorage.removeItem('sigmat_refresh');
    localStorage.removeItem('sigmat_user');
    this.usuarioSubject.next(null);
  }

  getToken() {
    return localStorage.getItem('sigmat_token');
  }

  getRefreshToken() {
    return localStorage.getItem('sigmat_refresh');
  }

  getUsuario() {
    const user = localStorage.getItem('sigmat_user');
    try {
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  }

  isAutenticado(): boolean {
    return !!this.getToken();
  }
}


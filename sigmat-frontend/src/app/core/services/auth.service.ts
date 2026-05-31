import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/autenticacao`;

  private usuarioSubject = new BehaviorSubject<any>(this.getUsuario());
  public usuario$ = this.usuarioSubject.asObservable();

  login(matricula: string, senha: string) {
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

  logout() {
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


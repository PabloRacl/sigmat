import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';
import { Usuario, UsuarioListagem } from '../interfaces/usuario.interface';

export interface CriarUsuarioPayload {
  login: string;
  matricula: string;
  nome: string;
  email?: string;
  postoGraduacao?: string;
  perfil: string;
  secaoId?: number;
  batalhaoId?: number;
}

export type AtualizarUsuarioPayload = Partial<CriarUsuarioPayload>;

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/usuarios`;

  listarTodos(): Observable<UsuarioListagem[]> {
    return this.http.get<UsuarioListagem[]>(this.apiUrl);
  }

  buscarPorId(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`);
  }

  criar(dados: CriarUsuarioPayload): Observable<Usuario> {
    return this.http.post<Usuario>(this.apiUrl, dados);
  }

  atualizar(id: number, dados: AtualizarUsuarioPayload): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.apiUrl}/${id}`, dados);
  }

  remover(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  listarLogsAuditoria(usuarioFiltro: string): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/relatorios/auditoria?usuario=${encodeURIComponent(usuarioFiltro)}`);
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/configuracoes`;

  listarTipos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/tipos`);
  }

  listarMarcas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/marcas`);
  }

  listarModelos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/modelos`);
  }

  criarTipo(dados: { nome: string }): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/tipos`, dados);
  }

  criarMarca(dados: { nome: string }): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/marcas`, dados);
  }

  criarModelo(dados: { nome: string; marcaId?: number }): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/modelos`, dados);
  }

  listarStatus(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/status`);
  }

  listarDisponibilidades(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/disponibilidades`);
  }

  listarTiposAquisicao(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/tipos-aquisicao`);
  }

  listarSecoes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/secoes`);
  }

  criarSecao(dados: { sigla: string; nome: string; batalhaoId?: number; diretoriaId?: number }): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/secoes`, dados);
  }

  atualizarSecao(id: number, dados: { sigla?: string; nome?: string; batalhaoId?: number; diretoriaId?: number }): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/secoes/${id}`, dados);
  }

  listarBatalhoes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/batalhoes`);
  }
}



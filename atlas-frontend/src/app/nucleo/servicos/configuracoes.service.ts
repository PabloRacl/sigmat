import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
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

  atualizarTipo(id: number, dados: { nome: string }): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/tipos/${id}`, dados);
  }

  criarMarca(dados: { nome: string }): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/marcas`, dados);
  }

  atualizarMarca(id: number, dados: { nome: string }): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/marcas/${id}`, dados);
  }

  criarModelo(dados: { nome: string; marcaId?: number }): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/modelos`, dados);
  }

  atualizarModelo(id: number, dados: { nome: string; marcaId?: number }): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/modelos/${id}`, dados);
  }

  excluirTipo(id: number): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/tipos/${id}`);
  }

  excluirMarca(id: number): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/marcas/${id}`);
  }

  excluirModelo(id: number): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/modelos/${id}`);
  }

  criarStatus(dados: { nome: string }): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/status`, dados);
  }

  listarStatus(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/status`);
  }

  excluirStatus(id: number): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/status/${id}`);
  }

  atualizarStatus(id: number, dados: { nome: string }): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/status/${id}`, dados);
  }

  listarDisponibilidades(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/disponibilidades`);
  }

  criarDisponibilidade(dados: { nome: string }): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/disponibilidades`, dados);
  }

  atualizarDisponibilidade(id: number, dados: { nome: string }): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/disponibilidades/${id}`, dados);
  }

  excluirDisponibilidade(id: number): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/disponibilidades/${id}`);
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

  private batalhoesCache: Record<string, unknown>[] | null = null;
  private diretoriasCache: Record<string, unknown>[] | null = null;

  listarDiretorias(): Observable<any[]> {
    if (this.diretoriasCache) {
      return of(this.diretoriasCache);
    }
    return new Observable(observer => {
      this.http.get<any[]>(`${this.API_URL}/diretorias`).subscribe({
        next: (res) => {
          this.diretoriasCache = res;
          observer.next(res);
          observer.complete();
        },
        error: (err) => observer.error(err)
      });
    });
  }

  listarBatalhoes(): Observable<any[]> {
    if (this.batalhoesCache) {
      return of(this.batalhoesCache);
    }
    return new Observable(observer => {
      this.http.get<any[]>(`${this.API_URL}/batalhoes`).subscribe({
        next: (res) => {
          this.batalhoesCache = res;
          observer.next(res);
          observer.complete();
        },
        error: (err) => observer.error(err)
      });
    });
  }

  limparCacheBatalhoes() {
    this.batalhoesCache = null;
  }
}



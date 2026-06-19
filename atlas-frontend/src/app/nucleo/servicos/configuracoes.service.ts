import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environment';
import { MockModeService } from './modo-mock.service';
import {
  MOCK_TIPOS, MOCK_STATUS, MOCK_DISPONIBILIDADES, MOCK_TIPOS_AQUISICAO,
  MOCK_SECOES, MOCK_BATALHOES, MOCK_MARCAS, MOCK_MODELOS
} from '../dados-teste/configuracoes.teste';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private http = inject(HttpClient);
  private mockMode = inject(MockModeService);
  private readonly API_URL = `${environment.apiUrl}/configuracoes`;

  listarTipos(): Observable<any[]> {
    if (this.mockMode.useMock) {
      return of(MOCK_TIPOS);
    }
    return this.http.get<any[]>(`${this.API_URL}/tipos`);
  }

  listarMarcas(): Observable<any[]> {
    if (this.mockMode.useMock) {
      return of(MOCK_MARCAS);
    }
    return this.http.get<any[]>(`${this.API_URL}/marcas`);
  }

  listarModelos(): Observable<any[]> {
    if (this.mockMode.useMock) {
      return of(MOCK_MODELOS);
    }
    return this.http.get<any[]>(`${this.API_URL}/modelos`);
  }

  criarTipo(dados: { nome: string }): Observable<any> {
    if (this.mockMode.useMock) {
      return of({ id: Date.now(), ...dados });
    }
    return this.http.post<any>(`${this.API_URL}/tipos`, dados);
  }

  atualizarTipo(id: number, dados: { nome: string }): Observable<any> {
    if (this.mockMode.useMock) return of({ ...dados, id });
    return this.http.put<any>(`${this.API_URL}/tipos/${id}`, dados);
  }

  criarMarca(dados: { nome: string }): Observable<any> {
    if (this.mockMode.useMock) {
      return of({ id: Date.now(), ...dados });
    }
    return this.http.post<any>(`${this.API_URL}/marcas`, dados);
  }

  atualizarMarca(id: number, dados: { nome: string }): Observable<any> {
    if (this.mockMode.useMock) return of({ ...dados, id });
    return this.http.put<any>(`${this.API_URL}/marcas/${id}`, dados);
  }

  criarModelo(dados: { nome: string; marcaId?: number }): Observable<any> {
    if (this.mockMode.useMock) {
      return of({ id: Date.now(), ...dados });
    }
    return this.http.post<any>(`${this.API_URL}/modelos`, dados);
  }

  atualizarModelo(id: number, dados: { nome: string; marcaId?: number }): Observable<any> {
    if (this.mockMode.useMock) return of({ ...dados, id });
    return this.http.put<any>(`${this.API_URL}/modelos/${id}`, dados);
  }

  excluirTipo(id: number): Observable<any> {
    if (this.mockMode.useMock) {
      return of({ success: true });
    }
    return this.http.delete<any>(`${this.API_URL}/tipos/${id}`);
  }

  excluirMarca(id: number): Observable<any> {
    if (this.mockMode.useMock) {
      return of({ success: true });
    }
    return this.http.delete<any>(`${this.API_URL}/marcas/${id}`);
  }

  excluirModelo(id: number): Observable<any> {
    if (this.mockMode.useMock) {
      return of({ success: true });
    }
    return this.http.delete<any>(`${this.API_URL}/modelos/${id}`);
  }

  criarStatus(dados: { nome: string }): Observable<any> {
    if (this.mockMode.useMock) {
      return of({ id: Date.now(), ...dados });
    }
    return this.http.post<any>(`${this.API_URL}/status`, dados);
  }

  listarStatus(): Observable<any[]> {
    if (this.mockMode.useMock) {
      return of(MOCK_STATUS);
    }
    return this.http.get<any[]>(`${this.API_URL}/status`);
  }

  excluirStatus(id: number): Observable<any> {
    if (this.mockMode.useMock) {
      return of({ success: true });
    }
    return this.http.delete<any>(`${this.API_URL}/status/${id}`);
  }

  atualizarStatus(id: number, dados: { nome: string }): Observable<any> {
    if (this.mockMode.useMock) {
      return of({ ...dados, id });
    }
    return this.http.put<any>(`${this.API_URL}/status/${id}`, dados);
  }

  listarDisponibilidades(): Observable<any[]> {
    if (this.mockMode.useMock) {
      return of(MOCK_DISPONIBILIDADES);
    }
    return this.http.get<any[]>(`${this.API_URL}/disponibilidades`);
  }

  criarDisponibilidade(dados: { nome: string }): Observable<any> {
    if (this.mockMode.useMock) return of({ id: Date.now(), ...dados });
    return this.http.post<any>(`${this.API_URL}/disponibilidades`, dados);
  }

  atualizarDisponibilidade(id: number, dados: { nome: string }): Observable<any> {
    if (this.mockMode.useMock) return of({ ...dados, id });
    return this.http.put<any>(`${this.API_URL}/disponibilidades/${id}`, dados);
  }

  excluirDisponibilidade(id: number): Observable<any> {
    if (this.mockMode.useMock) return of({ success: true });
    return this.http.delete<any>(`${this.API_URL}/disponibilidades/${id}`);
  }

  listarTiposAquisicao(): Observable<any[]> {
    if (this.mockMode.useMock) {
      return of(MOCK_TIPOS_AQUISICAO);
    }
    return this.http.get<any[]>(`${this.API_URL}/tipos-aquisicao`);
  }

  listarSecoes(): Observable<any[]> {
    if (this.mockMode.useMock) {
      return of(MOCK_SECOES);
    }
    return this.http.get<any[]>(`${this.API_URL}/secoes`);
  }

  criarSecao(dados: { sigla: string; nome: string; batalhaoId?: number; diretoriaId?: number }): Observable<any> {
    if (this.mockMode.useMock) {
      return of({ id: Date.now(), ...dados });
    }
    return this.http.post<any>(`${this.API_URL}/secoes`, dados);
  }

  atualizarSecao(id: number, dados: { sigla?: string; nome?: string; batalhaoId?: number; diretoriaId?: number }): Observable<any> {
    if (this.mockMode.useMock) {
      return of({ id, ...dados });
    }
    return this.http.put<any>(`${this.API_URL}/secoes/${id}`, dados);
  }

  private batalhoesCache: any[] | null = null;

  listarBatalhoes(): Observable<any[]> {
    if (this.mockMode.useMock) {
      return of(MOCK_BATALHOES);
    }
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



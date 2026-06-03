import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environment';
import { MockModeService } from './modo-mock.service';

const MOCK_TIPOS = [
  { id: 1, nome: 'CPU' },
  { id: 2, nome: 'MONITOR' },
  { id: 3, nome: 'RÁDIO' },
  { id: 4, nome: 'CELULAR' },
  { id: 5, nome: 'CHIP' },
  { id: 6, nome: 'MODEM' },
  { id: 7, nome: 'MULTICARREGADOR' },
  { id: 8, nome: 'TABLET' },
  { id: 9, nome: 'FONTE' },
  { id: 10, nome: 'TECLADO' },
  { id: 11, nome: 'MOUSE' },
  { id: 12, nome: 'ALL IN ONE' },
  { id: 13, nome: 'NOOTBOOK' },
  { id: 999, nome: 'TESTES' }
];

const MOCK_STATUS = [
  { id: 1, nome: 'ATIVO' },
  { id: 2, nome: 'INATIVO' },
  { id: 3, nome: 'EXTRAVIADO' },
  { id: 4, nome: 'MANUTENÇÃO' },
  { id: 5, nome: 'DANO' },
  { id: 6, nome: 'DISPONÍVEL' },
  { id: 7, nome: 'RESERVA' },
  { id: 23, nome: 'PENDENTE_APROVACAO' }
];

const MOCK_DISPONIBILIDADES = [
  { id: 1, nome: 'CARGA' },
  { id: 2, nome: 'EMPRESTIMO' }
];

const MOCK_TIPOS_AQUISICAO = [
  { id: 1, nome: 'COMPRA' },
  { id: 2, nome: 'DOAÇÃO' },
  { id: 3, nome: 'TRANSFERÊNCIA' }
];

const MOCK_SECOES = [
  { id: 101, sigla: 'BPTUR', nome: 'Seção BPTUR', batalhaoId: 20 },
  { id: 201, sigla: 'HQT', nome: 'Seção HQT', batalhaoId: 21 },
  { id: 202, sigla: 'CBT1', nome: 'Seção CBT1', batalhaoId: 22 },
  { id: 301, sigla: 'OUT', nome: 'Seção OUTRO', batalhaoId: 30 }
];

const MOCK_BATALHOES = [
  { id: 20, sigla: 'BPTUR', nome: 'Batalhão BPTUR' },
  { id: 21, sigla: 'HQT', nome: 'Batalhão HQT' },
  { id: 22, sigla: 'CBT1', nome: 'Batalhão CBT1' },
  { id: 30, sigla: 'OUT', nome: 'Batalhão Outros' }
];

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
      return of([
        { id: 1, nome: 'Dell' },
        { id: 2, nome: 'Samsung' },
        { id: 3, nome: 'Motorola' },
        { id: 4, nome: 'HP' },
        { id: 5, nome: 'Sony' }
      ]);
    }
    return this.http.get<any[]>(`${this.API_URL}/marcas`);
  }

  listarModelos(): Observable<any[]> {
    if (this.mockMode.useMock) {
      return of([
        { id: 1, nome: 'Inspiron', marcaId: 1 },
        { id: 2, nome: 'Galaxy Tab', marcaId: 2 },
        { id: 3, nome: 'Moto G', marcaId: 3 },
        { id: 4, nome: 'LaserJet', marcaId: 4 },
        { id: 5, nome: 'Alpha', marcaId: 5 }
      ]);
    }
    return this.http.get<any[]>(`${this.API_URL}/modelos`);
  }

  criarTipo(dados: { nome: string }): Observable<any> {
    if (this.mockMode.useMock) {
      return of({ id: Date.now(), ...dados });
    }
    return this.http.post<any>(`${this.API_URL}/tipos`, dados);
  }

  criarMarca(dados: { nome: string }): Observable<any> {
    if (this.mockMode.useMock) {
      return of({ id: Date.now(), ...dados });
    }
    return this.http.post<any>(`${this.API_URL}/marcas`, dados);
  }

  criarModelo(dados: { nome: string; marcaId?: number }): Observable<any> {
    if (this.mockMode.useMock) {
      return of({ id: Date.now(), ...dados });
    }
    return this.http.post<any>(`${this.API_URL}/modelos`, dados);
  }

  listarStatus(): Observable<any[]> {
    if (this.mockMode.useMock) {
      return of(MOCK_STATUS);
    }
    return this.http.get<any[]>(`${this.API_URL}/status`);
  }

  listarDisponibilidades(): Observable<any[]> {
    if (this.mockMode.useMock) {
      return of(MOCK_DISPONIBILIDADES);
    }
    return this.http.get<any[]>(`${this.API_URL}/disponibilidades`);
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

  listarBatalhoes(): Observable<any[]> {
    if (this.mockMode.useMock) {
      return of(MOCK_BATALHOES);
    }
    return this.http.get<any[]>(`${this.API_URL}/batalhoes`);
  }
}



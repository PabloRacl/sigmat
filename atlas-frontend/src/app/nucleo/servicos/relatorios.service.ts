import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environment';
import { MockModeService } from './modo-mock.service';
import { MOCK_EQUIPAMENTOS } from '../dados-teste/equipamentos.teste';
import { MOCK_RESUMO_UNIDADES } from '../dados-teste/configuracoes.teste';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private http = inject(HttpClient);
  private mockMode = inject(MockModeService);
  private apiUrl = `${environment.apiUrl}/relatorios`;

  private buildParams(params: any): HttpParams {
    let httpParams = new HttpParams();
    if (!params) return httpParams;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });

    return httpParams;
  }

  obterInventario(filtros: any): Observable<any[]> {
    if (this.mockMode.useMock) {
      return of([...MOCK_EQUIPAMENTOS]);
    }

    return this.http.get<any[]>(`${this.apiUrl}/inventario`, {
      params: this.buildParams(filtros)
    });
  }

  obterResumoUnidades(): Observable<any[]> {
    if (this.mockMode.useMock) {
      return of(MOCK_RESUMO_UNIDADES);
    }
    return this.http.get<any[]>(`${this.apiUrl}/resumo-unidades`);
  }

  obterTransferencias(filtros: any): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/transferencias`, { params: this.buildParams(filtros) });
  }

  obterAuditoria(filtros?: any): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/auditoria`, { params: this.buildParams(filtros) });
  }

  registrarLog(acao: string, detalhes: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/log`, { acao, detalhes, dataHora: new Date().toISOString() });
  }
}



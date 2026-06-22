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

  private buildParams(params: Record<string, unknown>): HttpParams {
    let httpParams = new HttpParams();
    if (!params) return httpParams;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });

    return httpParams;
  }

  obterInventario(filtros: Record<string, unknown>): Observable<Record<string, unknown>[]> {
    if (this.mockMode.useMock) {
      return of([...MOCK_EQUIPAMENTOS] as unknown as Record<string, unknown>[]);
    }

    return this.http.get<Record<string, unknown>[]>(`${this.apiUrl}/inventario`, {
      params: this.buildParams(filtros)
    });
  }

  obterResumoUnidades(): Observable<Record<string, unknown>[]> {
    if (this.mockMode.useMock) {
      return of(MOCK_RESUMO_UNIDADES as unknown as Record<string, unknown>[]);
    }
    return this.http.get<Record<string, unknown>[]>(`${this.apiUrl}/resumo-unidades`);
  }

  obterTransferencias(filtros: Record<string, unknown>): Observable<Record<string, unknown>[]> {
    return this.http.get<Record<string, unknown>[]>(`${this.apiUrl}/transferencias`, { params: this.buildParams(filtros) });
  }

  obterAuditoria(filtros?: Record<string, unknown>): Observable<Record<string, unknown>[]> {
    return this.http.get<Record<string, unknown>[]>(`${this.apiUrl}/auditoria`, { params: filtros ? this.buildParams(filtros) : undefined });
  }

  registrarLog(acao: string, detalhes: Record<string, unknown>): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(`${this.apiUrl}/log`, { acao, detalhes, dataHora: new Date().toISOString() });
  }
}



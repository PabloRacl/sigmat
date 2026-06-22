import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';

@Injectable({ providedIn: 'root' })
export class LoansService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/emprestimos`;

  listarEmprestados(): Observable<Record<string, unknown>[]> {
    return this.http.get<Record<string, unknown>[]>(this.apiUrl);
  }

  historico(): Observable<Record<string, unknown>[]> {
    return this.http.get<Record<string, unknown>[]>(`${this.apiUrl}/historico`);
  }

  vencidos(): Observable<Record<string, unknown>[]> {
    return this.http.get<Record<string, unknown>[]>(`${this.apiUrl}/vencidos`);
  }

  listarEquipamentosDisponiveis(search: string = ''): Observable<{ itens: Record<string, unknown>[]; total: number }> {
    const params: Record<string, string | number> = { page: 1, limit: 50 };
    if (search) params['search'] = search;
    return this.http.get<{ itens: Record<string, unknown>[]; total: number }>(`${environment.apiUrl}/equipamentos`, { params: params as any });
  }

  registrarSaida(id: number, dados: { solicitante: string; usuarioResponsavelId: number; dataSolicitacao: string; dataRetornoEmprestimo?: string }): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(`${this.apiUrl}/${id}/saida`, dados);
  }

  registrarRetorno(id: number): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(`${this.apiUrl}/${id}/retorno`, {});
  }
}


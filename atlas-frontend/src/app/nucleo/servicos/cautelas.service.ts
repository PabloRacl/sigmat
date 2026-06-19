import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';

@Injectable({ providedIn: 'root' })
export class LoansService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/emprestimos`;

  listarEmprestados(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  historico(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/historico`);
  }

  vencidos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/vencidos`);
  }

  listarEquipamentosDisponiveis(search: string = ''): Observable<any> {
    const params: any = { page: 1, limit: 50 };
    if (search) params.search = search;
    return this.http.get<any>(`${environment.apiUrl}/equipamentos`, { params });
  }

  registrarSaida(id: number, dados: { solicitante: string; dataSolicitacao: string; dataRetornoEmprestimo?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/saida`, dados);
  }

  registrarRetorno(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/retorno`, {});
  }
}


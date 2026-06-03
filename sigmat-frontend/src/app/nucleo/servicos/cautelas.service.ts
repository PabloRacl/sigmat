import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';

@Injectable({ providedIn: 'root' })
export class LoansService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/emprestimos`;

  private headers() {
    const token = localStorage.getItem('sigmat_token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  listarEmprestados(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { headers: this.headers() });
  }

  historico(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/historico`, { headers: this.headers() });
  }

  vencidos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/vencidos`, { headers: this.headers() });
  }

  listarEquipamentosDisponiveis(search: string = ''): Observable<any> {
    const params: any = { page: 1, limit: 50 };
    if (search) params.search = search;
    return this.http.get<any>(`${environment.apiUrl}/equipamentos`, { 
      headers: this.headers(),
      params 
    });
  }

  registrarSaida(id: number, dados: { solicitante: string; dataSolicitacao: string; dataRetornoEmprestimo?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/saida`, dados, { headers: this.headers() });
  }

  registrarRetorno(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/retorno`, {}, { headers: this.headers() });
  }
}


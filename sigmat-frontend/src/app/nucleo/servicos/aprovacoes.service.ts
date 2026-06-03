import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';

@Injectable({
  providedIn: 'root'
})
export class ApprovalsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/aprovacoes`;

  listarPendentes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pendentes`);
  }

  obterContagem(): Observable<{ total: number }> {
    return this.http.get<{ total: number }>(`${this.apiUrl}/contagem`);
  }

  processarDecisao(id: number, aprovado: boolean, justificativa: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/decisao`, { aprovado, justificativa });
  }
}



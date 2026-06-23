import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';

@Injectable({ providedIn: 'root' })
export class AccessRequestsFrontendService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/solicitacoes-acesso`;

  listarPendentes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pendentes`);
  }

  aprovar(id: number, dadosCuradoria?: { perfil?: string; secaoId?: number; batalhaoId?: number }): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/aprovar`, dadosCuradoria || {});
  }

  rejeitar(id: number, motivo?: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/rejeitar`, { motivo });
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';

@Injectable({ providedIn: 'root' })
export class AccessRequestsFrontendService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/solicitacoes-acesso`;

  private headers() {
    const token = localStorage.getItem('atlas_token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  listarPendentes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pendentes`, { headers: this.headers() });
  }

  aprovar(id: number): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/aprovar`, {}, { headers: this.headers() });
  }

  rejeitar(id: number, motivo?: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/rejeitar`, { motivo }, { headers: this.headers() });
  }
}

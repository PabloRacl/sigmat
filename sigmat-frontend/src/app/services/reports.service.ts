import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/reports`;

  obterInventario(filtros: any): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/inventario`, {
      params: filtros
    });
  }

  obterResumoUnidades(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/resumo-unidades`);
  }

  obterAuditoria(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/auditoria`);
  }
}



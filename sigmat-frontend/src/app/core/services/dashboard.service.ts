import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/dashboard`;

  obterEstatisticas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/estatisticas`);
  }

  obterAtividades(): Observable<any> {
    return this.http.get(`${this.apiUrl}/atividades`);
  }
}



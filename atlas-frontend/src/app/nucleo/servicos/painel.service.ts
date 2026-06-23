import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environment';
import { EstatisticasDashboard, AtividadeDashboard } from '../interfaces/painel.interface';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/dashboard`;

  obterEstatisticas(): Observable<EstatisticasDashboard> {
    return this.http.get<EstatisticasDashboard>(`${this.apiUrl}/estatisticas`);
  }

  obterAtividades(): Observable<AtividadeDashboard[]> {
    return this.http.get<AtividadeDashboard[]>(`${this.apiUrl}/atividades`);
  }
}



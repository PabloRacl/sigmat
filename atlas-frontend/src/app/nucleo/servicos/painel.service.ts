import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environment';
import { MockModeService } from './modo-mock.service';
import { MOCK_ESTATISTICAS } from '../dados-teste/painel.teste';
import { EstatisticasDashboard, AtividadeDashboard } from '../interfaces/painel.interface';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private mockMode = inject(MockModeService);
  private apiUrl = `${environment.apiUrl}/dashboard`;

  obterEstatisticas(): Observable<EstatisticasDashboard> {
    if (this.mockMode.useMock) {
      return of(MOCK_ESTATISTICAS);
    }

    return this.http.get<EstatisticasDashboard>(`${this.apiUrl}/estatisticas`);
  }

  obterAtividades(): Observable<AtividadeDashboard[]> {
    if (this.mockMode.useMock) {
      return of([]);
    }
    return this.http.get<AtividadeDashboard[]>(`${this.apiUrl}/atividades`);
  }
}



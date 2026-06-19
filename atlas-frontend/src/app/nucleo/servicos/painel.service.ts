import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environment';
import { MockModeService } from './modo-mock.service';
import { MOCK_ESTATISTICAS } from '../dados-teste/painel.teste';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private mockMode = inject(MockModeService);
  private apiUrl = `${environment.apiUrl}/dashboard`;

  obterEstatisticas(): Observable<any> {
    if (this.mockMode.useMock) {
      return of(MOCK_ESTATISTICAS);
    }

    return this.http.get(`${this.apiUrl}/estatisticas`);
  }

  obterAtividades(): Observable<any> {
    if (this.mockMode.useMock) {
      return of([]);
    }
    return this.http.get(`${this.apiUrl}/atividades`);
  }
}



import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environment';
import { MockModeService } from './modo-mock.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private mockMode = inject(MockModeService);
  private apiUrl = `${environment.apiUrl}/dashboard`;

  obterEstatisticas(): Observable<any> {
    if (this.mockMode.useMock) {
      return of({
        resumo: {
          total: 5,
          ativos: 3,
          emprestados: 1,
          manutencao: 1,
          inativos: 0
        },
        graficos: {
          porStatus: {
            labels: ['ATIVO', 'MANUTENÇÃO'],
            datasets: [{ data: [3, 2], backgroundColor: ['#22c55e', '#f97316'] }]
          },
          porTipo: {
            labels: ['Notebook', 'Tablet', 'Smartphone', 'Impressora', 'Câmera'],
            datasets: [{ data: [1, 1, 1, 1, 1], backgroundColor: ['#2563eb', '#9333ea', '#14b8a6', '#f59e0b', '#ef4444'] }]
          },
          porDisponibilidade: {
            labels: ['DISPONÍVEL', 'EMPRÉSTIMO', 'CARGA'],
            datasets: [{ data: [3, 1, 1], backgroundColor: ['#10b981', '#0ea5e9', '#f97316'] }]
          },
          porBatalhao: {
            labels: ['BPTUR', 'HQT', 'CBT1', 'OUT'],
            datasets: [{ data: [2, 1, 1, 1], backgroundColor: ['#2563eb', '#8b5cf6', '#f59e0b', '#ef4444'] }]
          },
          porMarca: {
            labels: ['Dell', 'Samsung', 'Motorola', 'HP', 'Sony'],
            datasets: [{ data: [1, 1, 1, 1, 1], backgroundColor: ['#2563eb', '#0ea5e9', '#14b8a6', '#f59e0b', '#ef4444'] }]
          }
        }
      });
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



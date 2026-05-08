import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environment';

@Injectable({
  providedIn: 'root'
})
export class MaintenanceService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/manutencao`;

  listarTodos() {
    return this.http.get<any>(this.API_URL);
  }

  buscarPorId(id: number) {
    return this.http.get<any>(`${this.API_URL}/${id}`);
  }

  criar(dados: any) {
    return this.http.post<any>(this.API_URL, dados);
  }

  criarMassa(ids: number[], dados: any) {
    return this.http.post<any>(`${this.API_URL}/massa`, { ids, ...dados });
  }

  atualizarStatus(id: number, status: string, dadosAdicionais: any = {}) {
    return this.http.patch<any>(`${this.API_URL}/${id}/status`, { status, ...dadosAdicionais });
  }
}



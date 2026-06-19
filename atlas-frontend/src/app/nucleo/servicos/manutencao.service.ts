import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environment';

@Injectable({
  providedIn: 'root'
})
export class MaintenanceService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/manutencao`;

  listarTodos() {
    return this.http.get<any>(this.API_URL);
  }

  contarPendentes() {
    return this.http.get<{ total: number }>(`${this.API_URL}/pendentes/contagem`);
  }

  buscarPorId(id: number) {
    return this.http.get<any>(`${this.API_URL}/${id}`);
  }

  criar(dados: any) {
    return this.http.post<any>(this.API_URL, dados);
  }

  // Cria ordens de serviço em massa
  criarMassa(ids: number[], dados: any) {
    return this.http.post<any>(`${this.API_URL}/massa`, { ids, ...dados });
  }

  // Atualiza status e demais campos (previsão, técnico, solução, custo) em uma única chamada
  atualizarStatus(id: number, payload: any) {
    // payload deve conter ao menos `{ status: string, ...outrosCampos }`
    return this.http.patch<any>(`${this.API_URL}/${id}/status`, payload);
  }

  // Obtém histórico de alterações da ordem
  obterHistorico(id: number) {
    return this.http.get<any[]>(`${this.API_URL}/${id}/historico`);
  }
}



import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';
import { OrdemServico } from '../../funcionalidades/manutencao/lista/lista-manutencao.component';

export interface CriarOsPayload {
  equipamentoId: number;
  descricaoProblema: string;
  tecnicoResponsavel?: string;
  dataPrevisao?: string | null;
}

export interface AtualizarStatusPayload {
  status: string;
  tecnicoResponsavel?: string;
  dataPrevisao?: string | null;
  solucaoAplicada?: string;
  valorGasto?: number | null;
}

export interface HistoricoOs {
  id: number;
  campo: string;
  valorAntigo: string;
  valorNovo: string;
  dataAlteracao: string;
  usuario?: { nome: string; matricula?: string };
  createdAt?: string | Date;
  descricao?: string;
  acao?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MaintenanceService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/manutencao`;

  listarTodos(): Observable<OrdemServico[]> {
    return this.http.get<OrdemServico[]>(this.API_URL);
  }

  contarPendentes(): Observable<{ total: number }> {
    return this.http.get<{ total: number }>(`${this.API_URL}/pendentes/contagem`);
  }

  buscarPorId(id: number): Observable<OrdemServico> {
    return this.http.get<OrdemServico>(`${this.API_URL}/${id}`);
  }

  criar(dados: CriarOsPayload): Observable<OrdemServico> {
    return this.http.post<OrdemServico>(this.API_URL, dados);
  }

  // Cria ordens de serviço em massa
  criarMassa(ids: number[], dados: CriarOsPayload): Observable<OrdemServico[]> {
    return this.http.post<OrdemServico[]>(`${this.API_URL}/massa`, { ids, ...dados });
  }

  // Atualiza status e demais campos (previsão, técnico, solução, custo) em uma única chamada
  atualizarStatus(id: number, payload: AtualizarStatusPayload): Observable<OrdemServico> {
    // payload deve conter ao menos `{ status: string, ...outrosCampos }`
    return this.http.patch<OrdemServico>(`${this.API_URL}/${id}/status`, payload);
  }

  // Obtém histórico de alterações da ordem
  obterHistorico(id: number): Observable<HistoricoOs[]> {
    return this.http.get<HistoricoOs[]>(`${this.API_URL}/${id}/historico`);
  }
}

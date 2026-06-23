import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';

@Injectable({
  providedIn: 'root'
})
export class TransfersService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/transferencias`;

  solicitar(dados: { equipamentoId: number; destinoId: number; observacao?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/solicitar`, dados);
  }

  solicitarMassa(
    equipamentoIds: number[],
    destinoId: number,
    observacao?: string,
    disponibilidadeId?: number,
    solicitante?: string,
    dataSolicitacao?: string,
    dataRetornoEmprestimo?: string
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}/solicitar-massa`, {
      equipamentoIds, destinoId, observacao,
      disponibilidadeId, solicitante, dataSolicitacao, dataRetornoEmprestimo
    });
  }

  listarPendentes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pendentes`);
  }

  listar(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  confirmar(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/confirmar`, {});
  }

  cancelar(id: number, motivoRejeicao?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/cancelar`, { motivoRejeicao });
  }

  confirmarLote(transferenciaIds: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/confirmar-lote`, { transferenciaIds });
  }

  cancelarLote(transferenciaIds: number[], motivoRejeicao?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/cancelar-lote`, { transferenciaIds, motivoRejeicao });
  }
}



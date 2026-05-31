import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environment';

@Injectable({
  providedIn: 'root'
})
export class EquipmentService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/equipamentos`;

  listarTodos(page: number = 1, limit: number = 20, search: string = '', filtros: any = {}) {
    const params: any = { page, limit, ...filtros };
    if (search) params.search = search;
    return this.http.get<any>(this.API_URL, { params });
  }

  buscarPorId(id: number) {
    return this.http.get<any>(`${this.API_URL}/${id}`);
  }

  criar(dados: any) {
    return this.http.post<any>(this.API_URL, dados);
  }

  atualizar(id: number, dados: any) {
    return this.http.patch<any>(`${this.API_URL}/${id}`, dados);
  }

  remover(id: number) {
    return this.http.delete<any>(`${this.API_URL}/${id}`);
  }

  obterHistorico(id: number) {
    return this.http.get<any[]>(`${this.API_URL}/${id}/historico`);
  }

  atualizarEmMassa(ids: number[], dados: any) {
    return this.http.patch<any>(`${this.API_URL}/massa`, { ids, dados });
  }
}



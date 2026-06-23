import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { environment } from '../../environment';
import { AuthService } from './autenticacao.service';
import { Equipamento } from '../interfaces/equipamento.interface';
import type { UsuarioLogado } from '../interfaces/usuario.interface';

@Injectable({
  providedIn: 'root'
})
export class EquipmentService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private readonly API_URL = `${environment.apiUrl}/equipamentos`;


  listarTodos(page: number = 1, limit: number = 20, search: string = '', filtros: Record<string, any> = {}) {


    const params: Record<string, any> = { page, limit, ...filtros };
    if (search) params['search'] = search;
    return this.http.get<{ itens: Equipamento[]; total: number }>(this.API_URL, { params });
  }

  buscarPorId(id: number) {
    return this.http.get<Equipamento>(`${this.API_URL}/${id}`);
  }

  criar(dados: Partial<Equipamento>) {
    return this.http.post<Equipamento>(this.API_URL, dados);
  }

  atualizar(id: number, dados: Partial<Equipamento>) {
    return this.http.patch<Equipamento>(`${this.API_URL}/${id}`, dados);
  }

  remover(id: number) {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  obterHistorico(id: number) {
    return this.http.get<Record<string, any>[]>(`${this.API_URL}/${id}/historico`);
  }

  atualizarEmMassa(ids: number[], dados: Record<string, any>) {
    return this.http.patch<Record<string, any>>(`${this.API_URL}/massa`, { ids, dados });
  }
}



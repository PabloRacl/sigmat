import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { environment } from '../../environment';
import { AuthService } from './autenticacao.service';
import { MockModeService } from './modo-mock.service';
import { MOCK_EQUIPAMENTOS } from '../dados-teste/equipamentos.teste';
import { Equipamento } from '../interfaces/equipamento.interface';
import type { UsuarioLogado } from '../interfaces/usuario.interface';

@Injectable({
  providedIn: 'root'
})
export class EquipmentService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private mockMode = inject(MockModeService);
  private readonly API_URL = `${environment.apiUrl}/equipamentos`;

  private getMockEquipamentos() {
    return [...MOCK_EQUIPAMENTOS];
  }

  private filterMockEquipamentos(equipamentos: Equipamento[], search: string, filtros: Record<string, any>, usuario: UsuarioLogado | null) {
    let items = equipamentos;

    if (usuario) {
      if (usuario['perfil'] === 'DIRETORIA') {
        items = items.filter(e => e.secao?.batalhao?.diretoria?.id === usuario['diretoriaId']);
      } else if (usuario['perfil'] === 'COMANDANTE' || usuario['perfil'] === 'USUARIO_BATALHAO') {
        items = items.filter(e => e.secao?.batalhao?.id === usuario['batalhaoId']);
      }
    }

    if (filtros?.['secaoId']) {
      items = items.filter(e => e.secao?.id === filtros['secaoId']);
    }
    if (filtros?.['tipoId']) {
      items = items.filter(e => e.tipoEquipamento?.id === filtros['tipoId'] || e.tipoEquipamento?.nome?.toUpperCase().includes(String(filtros['tipoId']).toUpperCase()));
    }
    if (filtros?.['statusId']) {
      items = items.filter(e => e.status?.id === filtros['statusId'] || e.status?.nome?.toUpperCase().includes(String(filtros['statusId']).toUpperCase()));
    }
    if (filtros?.['disponibilidadeId']) {
      items = items.filter(e => e.disponibilidade?.id === filtros['disponibilidadeId'] || e.disponibilidade?.nome?.toUpperCase().includes(String(filtros['disponibilidadeId']).toUpperCase()));
    }
    if (filtros?.['marcaId']) {
      items = items.filter(e => e.marca?.id === filtros['marcaId'] || e.marca?.nome?.toUpperCase().includes(String(filtros['marcaId']).toUpperCase()));
    }
    if (filtros?.['patrimonio']) {
      items = items.filter(e => e.patrimonio?.toUpperCase().includes(filtros['patrimonio'].toUpperCase()));
    }
    if (filtros?.['sei']) {
      items = items.filter(e => e.patrimonio?.toUpperCase().includes(filtros['sei'].toUpperCase()) || e.numeroSerie?.toUpperCase().includes(filtros['sei'].toUpperCase()));
    }
    if (filtros?.['numeroSerie']) {
      items = items.filter(e => e.numeroSerie?.toUpperCase().includes(filtros['numeroSerie'].toUpperCase()));
    }

    if (search) {
      const term = search.toString().toUpperCase();
      items = items.filter(e =>
        e.patrimonio?.toUpperCase().includes(term) ||
        e.tipoEquipamento?.nome?.toUpperCase().includes(term) ||
        e.marca?.nome?.toUpperCase().includes(term) ||
        e.secao?.sigla?.toUpperCase().includes(term) ||
        e.secao?.batalhao?.sigla?.toUpperCase().includes(term) ||
        e.secao?.batalhao?.diretoria?.sigla?.toUpperCase().includes(term)
      );
    }

    return items;
  }

  listarTodos(page: number = 1, limit: number = 20, search: string = '', filtros: Record<string, any> = {}) {
    if (this.mockMode.useMock) {
      const usuario = this.authService.getUsuario();
      let itens = this.filterMockEquipamentos(this.getMockEquipamentos(), search, filtros, usuario);
      const total = itens.length;
      const start = (page - 1) * limit;
      itens = itens.slice(start, start + limit);
      return of({ itens, total });
    }

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



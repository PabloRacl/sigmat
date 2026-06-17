import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { environment } from '../../environment';
import { AuthService } from './autenticacao.service';
import { MockModeService } from './modo-mock.service';

@Injectable({
  providedIn: 'root'
})
export class EquipmentService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private mockMode = inject(MockModeService);
  private readonly API_URL = `${environment.apiUrl}/equipamentos`;

  private getMockEquipamentos() {
    return [
      {
        id: 1,
        patrimonio: 'BPTUR-0001',
        numeroSerie: 'SN-BPTUR-001',
        tipoEquipamento: { nome: 'Notebook' },
        marca: { nome: 'Dell' },
        status: { nome: 'ATIVO' },
        disponibilidade: { nome: 'DISPONIVEL' },
        secao: {
          id: 101,
          sigla: 'BPTUR',
          nome: 'Seção BPTUR',
          batalhao: {
            id: 20,
            sigla: 'BPTUR',
            nome: 'Batalhão BPTUR',
            diretoria: { id: 10, sigla: 'DTEC', nome: 'Diretoria de Tecnologia' }
          }
        }
      },
      {
        id: 2,
        patrimonio: 'BPTUR-0002',
        numeroSerie: 'SN-BPTUR-002',
        tipoEquipamento: { nome: 'Tablet' },
        marca: { nome: 'Samsung' },
        status: { nome: 'MANUTENCAO' },
        disponibilidade: { nome: 'EMPRESTIMO' },
        secao: {
          id: 101,
          sigla: 'BPTUR',
          nome: 'Seção BPTUR',
          batalhao: {
            id: 20,
            sigla: 'BPTUR',
            nome: 'Batalhão BPTUR',
            diretoria: { id: 10, sigla: 'DTEC', nome: 'Diretoria de Tecnologia' }
          }
        }
      },
      {
        id: 3,
        patrimonio: 'DPTO-0001',
        numeroSerie: 'SN-DTEC-001',
        tipoEquipamento: { nome: 'Smartphone' },
        marca: { nome: 'Motorola' },
        status: { nome: 'ATIVO' },
        disponibilidade: { nome: 'DISPONIVEL' },
        secao: {
          id: 201,
          sigla: 'HQT',
          nome: 'Seção HQT',
          batalhao: {
            id: 21,
            sigla: 'HQT',
            nome: 'Batalhão HQT',
            diretoria: { id: 10, sigla: 'DTEC', nome: 'Diretoria de Tecnologia' }
          }
        }
      },
      {
        id: 4,
        patrimonio: 'DPTO-0002',
        numeroSerie: 'SN-DTEC-002',
        tipoEquipamento: { nome: 'Impressora' },
        marca: { nome: 'HP' },
        status: { nome: 'ATIVO' },
        disponibilidade: { nome: 'CARGA' },
        secao: {
          id: 202,
          sigla: 'CBT1',
          nome: 'Seção CBT1',
          batalhao: {
            id: 22,
            sigla: 'CBT1',
            nome: 'Batalhão CBT1',
            diretoria: { id: 10, sigla: 'DTEC', nome: 'Diretoria de Tecnologia' }
          }
        }
      },
      {
        id: 5,
        patrimonio: 'OUT-0001',
        numeroSerie: 'SN-OUT-001',
        tipoEquipamento: { nome: 'Câmera' },
        marca: { nome: 'Sony' },
        status: { nome: 'ATIVO' },
        disponibilidade: { nome: 'DISPONIVEL' },
        secao: {
          id: 301,
          sigla: 'OUT',
          nome: 'Seção OUTRO',
          batalhao: {
            id: 30,
            sigla: 'OUT',
            nome: 'Batalhão Outros',
            diretoria: { id: 11, sigla: 'DIREX', nome: 'Diretoria Extra' }
          }
        }
      }
    ];
  }

  private filterMockEquipamentos(equipamentos: any[], search: string, filtros: any, usuario: any) {
    let items = equipamentos;

    if (usuario) {
      if (usuario.perfil === 'DIRETORIA') {
        items = items.filter(e => e.secao?.batalhao?.diretoria?.id === usuario.diretoriaId);
      } else if (usuario.perfil === 'COMANDANTE' || usuario.perfil === 'USUARIO_BATALHAO') {
        items = items.filter(e => e.secao?.batalhao?.id === usuario.batalhaoId);
      }
    }

    if (filtros?.secaoId) {
      items = items.filter(e => e.secao?.id === filtros.secaoId);
    }
    if (filtros?.tipoId) {
      items = items.filter(e => e.tipoEquipamento?.id === filtros.tipoId || e.tipoEquipamento?.nome?.toUpperCase().includes(String(filtros.tipoId).toUpperCase()));
    }
    if (filtros?.statusId) {
      items = items.filter(e => e.status?.id === filtros.statusId || e.status?.nome?.toUpperCase().includes(String(filtros.statusId).toUpperCase()));
    }
    if (filtros?.disponibilidadeId) {
      items = items.filter(e => e.disponibilidade?.id === filtros.disponibilidadeId || e.disponibilidade?.nome?.toUpperCase().includes(String(filtros.disponibilidadeId).toUpperCase()));
    }
    if (filtros?.marcaId) {
      items = items.filter(e => e.marca?.id === filtros.marcaId || e.marca?.nome?.toUpperCase().includes(String(filtros.marcaId).toUpperCase()));
    }
    if (filtros?.patrimonio) {
      items = items.filter(e => e.patrimonio?.toUpperCase().includes(filtros.patrimonio.toUpperCase()));
    }
    if (filtros?.sei) {
      items = items.filter(e => e.patrimonio?.toUpperCase().includes(filtros.sei.toUpperCase()) || e.numeroSerie?.toUpperCase().includes(filtros.sei.toUpperCase()));
    }
    if (filtros?.numeroSerie) {
      items = items.filter(e => e.numeroSerie?.toUpperCase().includes(filtros.numeroSerie.toUpperCase()));
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

  listarTodos(page: number = 1, limit: number = 20, search: string = '', filtros: any = {}) {
    if (this.mockMode.useMock) {
      const usuario = this.authService.getUsuario();
      let itens = this.filterMockEquipamentos(this.getMockEquipamentos(), search, filtros, usuario);
      const total = itens.length;
      const start = (page - 1) * limit;
      itens = itens.slice(start, start + limit);
      return of({ itens, total });
    }

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



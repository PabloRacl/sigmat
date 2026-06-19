import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../banco-dados/prisma.service';
import { AcaoLog } from '@prisma/client';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async registrarLog(dados: {
    usuarioId: number;
    equipamentoId?: number;
    acao: AcaoLog;
    descricao: string;

    dadosAlterados?: any;
    ip?: string;
    userAgent?: string;
  }) {
    const dadosAlteradosNormalizados = dados.dadosAlterados
      ? await this.normalizarDadosParaLog(dados.dadosAlterados)
      : {};

    return this.prisma.logOperacao.create({
      data: {
        usuarioId: dados.usuarioId,
        equipamentoId: dados.equipamentoId,
        acao: dados.acao,
        descricao: dados.descricao,
        dadosAlterados: dadosAlteradosNormalizados,
        ip: dados.ip,
        userAgent: dados.userAgent,
      },
    });
  }

  async normalizarDadosParaLog(dados: any): Promise<any> {
    return this.normalizarValores(dados);
  }

  /**
   * Compara dois objetos e retorna apenas o que mudou
   */
  gerarDiff(antigo: any, novo: any) {
    const diff: any = {
      antes: {},
      depois: {},
    };

    for (const key in novo) {
      if (key === 'updatedAt' || key === 'createdAt') continue;
      if (this.isRelationalObjectKey(key, novo)) continue;

      if (JSON.stringify(antigo[key]) !== JSON.stringify(novo[key])) {
        diff.antes[key] = antigo[key];
        diff.depois[key] = novo[key];
      }
    }

    return Object.keys(diff.antes).length > 0 ? diff : null;
  }

  private isRelationalObjectKey(key: string, objeto: any): boolean {
    const value = objeto[key];
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return false;
    }

    const idKey = `${key}Id`;
    return idKey in objeto;
  }

  async gerarDiffComLabels(antigo: any, novo: any) {
    const antigoNormalizado = await this.normalizarValores(antigo);
    const novoNormalizado = await this.normalizarValores(novo);
    return this.gerarDiff(antigoNormalizado, novoNormalizado);
  }

  private async normalizarValores(dados: any): Promise<any> {
    const cache = {
      marca: new Map<number, string>(),
      modelo: new Map<number, string>(),
      tipoEquipamento: new Map<number, string>(),
      status: new Map<number, string>(),
      tipoAquisicao: new Map<number, string>(),
      disponibilidade: new Map<number, string>(),
      secao: new Map<number, string>(),
      usuario: new Map<number, string>(),
    };

    await this.buscarLabelsEmLote(dados, cache);
    return this.aplicarLabels(dados, cache);
  }

  private async buscarLabelsEmLote(dados: any, cache: any): Promise<void> {
    if (dados === null || dados === undefined || typeof dados !== 'object')
      return;

    if (Array.isArray(dados)) {
      for (const item of dados) {
        await this.buscarLabelsEmLote(item, cache);
      }
      return;
    }

    const idsParaBuscar = {
      marca: new Set<number>(),
      modelo: new Set<number>(),
      tipoEquipamento: new Set<number>(),
      status: new Set<number>(),
      tipoAquisicao: new Set<number>(),
      disponibilidade: new Set<number>(),
      secao: new Set<number>(),
      usuario: new Set<number>(),
    };

    const coletarIds = (obj: any) => {
      if (obj === null || obj === undefined || typeof obj !== 'object') return;
      if (Array.isArray(obj)) {
        obj.forEach(coletarIds);
        return;
      }
      for (const [key, value] of Object.entries(obj)) {
        if (value === null || value === undefined) continue;
        if (typeof value === 'object' && !Array.isArray(value)) {
          coletarIds(value);
          continue;
        }
        if (
          key.endsWith('Id') &&
          typeof value === 'number' &&
          !Number.isNaN(value)
        ) {
          switch (key) {
            case 'marcaId':
              idsParaBuscar.marca.add(value);
              break;
            case 'modeloId':
              idsParaBuscar.modelo.add(value);
              break;
            case 'tipoEquipamentoId':
              idsParaBuscar.tipoEquipamento.add(value);
              break;
            case 'statusId':
              idsParaBuscar.status.add(value);
              break;
            case 'tipoAquisicaoId':
              idsParaBuscar.tipoAquisicao.add(value);
              break;
            case 'disponibilidadeId':
              idsParaBuscar.disponibilidade.add(value);
              break;
            case 'secaoId':
              idsParaBuscar.secao.add(value);
              break;
            case 'usuarioResponsavelId':
            case 'usuarioAprovadorId':
            case 'usuarioNegadorId':
            case 'solicitanteId':
            case 'usuarioId':
              idsParaBuscar.usuario.add(value);
              break;
          }
        }
      }
    };

    coletarIds(dados);

    // Agora buscar no banco em lote
    const promessas: Promise<void>[] = [];

    if (idsParaBuscar.marca.size > 0)
      promessas.push(
        this.prisma.marca
          .findMany({ where: { id: { in: Array.from(idsParaBuscar.marca) } } })
          .then((res) => res.forEach((r) => cache.marca.set(r.id, r.nome))),
      );
    if (idsParaBuscar.modelo.size > 0)
      promessas.push(
        this.prisma.modelo
          .findMany({ where: { id: { in: Array.from(idsParaBuscar.modelo) } } })
          .then((res) => res.forEach((r) => cache.modelo.set(r.id, r.nome))),
      );
    if (idsParaBuscar.tipoEquipamento.size > 0)
      promessas.push(
        this.prisma.tipoEquipamento
          .findMany({
            where: { id: { in: Array.from(idsParaBuscar.tipoEquipamento) } },
          })
          .then((res) =>
            res.forEach((r) => cache.tipoEquipamento.set(r.id, r.nome)),
          ),
      );
    if (idsParaBuscar.status.size > 0)
      promessas.push(
        this.prisma.statusEquipamento
          .findMany({ where: { id: { in: Array.from(idsParaBuscar.status) } } })
          .then((res) => res.forEach((r) => cache.status.set(r.id, r.nome))),
      );
    if (idsParaBuscar.tipoAquisicao.size > 0)
      promessas.push(
        this.prisma.tipoAquisicao
          .findMany({
            where: { id: { in: Array.from(idsParaBuscar.tipoAquisicao) } },
          })
          .then((res) =>
            res.forEach((r) => cache.tipoAquisicao.set(r.id, r.nome)),
          ),
      );
    if (idsParaBuscar.disponibilidade.size > 0)
      promessas.push(
        this.prisma.disponibilidade
          .findMany({
            where: { id: { in: Array.from(idsParaBuscar.disponibilidade) } },
          })
          .then((res) =>
            res.forEach((r) => cache.disponibilidade.set(r.id, r.nome)),
          ),
      );
    if (idsParaBuscar.secao.size > 0)
      promessas.push(
        this.prisma.secao
          .findMany({ where: { id: { in: Array.from(idsParaBuscar.secao) } } })
          .then((res) =>
            res.forEach((r) => cache.secao.set(r.id, r.sigla ?? r.nome)),
          ),
      );
    if (idsParaBuscar.usuario.size > 0)
      promessas.push(
        this.prisma.usuario
          .findMany({
            where: { id: { in: Array.from(idsParaBuscar.usuario) } },
          })
          .then((res) =>
            res.forEach((r) =>
              cache.usuario.set(r.id, `${r.nome} (${r.matricula})`),
            ),
          ),
      );

    await Promise.all(promessas);
  }

  private aplicarLabels(dados: any, cache: any): any {
    if (dados === null || dados === undefined || typeof dados !== 'object')
      return dados;
    if (Array.isArray(dados))
      return dados.map((item) => this.aplicarLabels(item, cache));

    const resultado: any = {};
    for (const [key, value] of Object.entries(dados)) {
      if (value === null || value === undefined) {
        resultado[key] = value;
        continue;
      }
      if (typeof value === 'object' && !Array.isArray(value)) {
        resultado[key] = this.aplicarLabels(value, cache);
        continue;
      }

      if (key.endsWith('Id') && typeof value === 'number') {
        let label = value;
        switch (key) {
          case 'marcaId':
            label = cache.marca.get(value) ?? value;
            break;
          case 'modeloId':
            label = cache.modelo.get(value) ?? value;
            break;
          case 'tipoEquipamentoId':
            label = cache.tipoEquipamento.get(value) ?? value;
            break;
          case 'statusId':
            label = cache.status.get(value) ?? value;
            break;
          case 'tipoAquisicaoId':
            label = cache.tipoAquisicao.get(value) ?? value;
            break;
          case 'disponibilidadeId':
            label = cache.disponibilidade.get(value) ?? value;
            break;
          case 'secaoId':
            label = cache.secao.get(value) ?? value;
            break;
          case 'usuarioResponsavelId':
          case 'usuarioAprovadorId':
          case 'usuarioNegadorId':
          case 'solicitanteId':
          case 'usuarioId':
            label = cache.usuario.get(value) ?? value;
            break;
        }
        resultado[key] = label;
      } else {
        resultado[key] = value;
      }
    }
    return resultado;
  }
}

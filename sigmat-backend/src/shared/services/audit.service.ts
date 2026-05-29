import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
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
      depois: {}
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
    if (dados === null || dados === undefined || typeof dados !== 'object') {
      return dados;
    }

    if (Array.isArray(dados)) {
      return Promise.all(dados.map(item => this.normalizarValores(item)));
    }

    const resultado: any = {};
    for (const [key, value] of Object.entries(dados)) {
      if (value === null || value === undefined) {
        resultado[key] = value;
        continue;
      }

      if (typeof value === 'object' && !Array.isArray(value)) {
        resultado[key] = await this.normalizarValores(value);
        continue;
      }

      if (key.endsWith('Id')) {
        resultado[key] = await this.labelFromId(key, value);
        continue;
      }

      resultado[key] = value;
    }

    return resultado;
  }

  private async labelFromId(key: string, value: any): Promise<any> {
    const id = Number(value);
    if (Number.isNaN(id)) return value;

    switch (key) {
      case 'marcaId': {
        const marca = await this.prisma.marca.findUnique({ where: { id } });
        return marca?.nome ?? value;
      }
      case 'modeloId': {
        const modelo = await this.prisma.modelo.findUnique({ where: { id } });
        return modelo?.nome ?? value;
      }
      case 'tipoEquipamentoId': {
        const tipo = await this.prisma.tipoEquipamento.findUnique({ where: { id } });
        return tipo?.nome ?? value;
      }
      case 'statusId': {
        const status = await this.prisma.statusEquipamento.findUnique({ where: { id } });
        return status?.nome ?? value;
      }
      case 'tipoAquisicaoId': {
        const tipo = await this.prisma.tipoAquisicao.findUnique({ where: { id } });
        return tipo?.nome ?? value;
      }
      case 'disponibilidadeId': {
        const disponibilidade = await this.prisma.disponibilidade.findUnique({ where: { id } });
        return disponibilidade?.nome ?? value;
      }
      case 'secaoId': {
        const secao = await this.prisma.secao.findUnique({ where: { id } });
        return secao?.sigla ?? secao?.nome ?? value;
      }
      case 'usuarioResponsavelId':
      case 'usuarioAprovadorId':
      case 'usuarioNegadorId':
      case 'solicitanteId':
      case 'usuarioId': {
        const usuario = await this.prisma.usuario.findUnique({ where: { id } });
        return usuario ? `${usuario.nome} (${usuario.matricula})` : value;
      }
      default:
        return value;
    }
  }
}






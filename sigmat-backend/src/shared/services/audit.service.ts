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
    return this.prisma.logOperacao.create({
      data: {
        usuarioId: dados.usuarioId,
        equipamentoId: dados.equipamentoId,
        acao: dados.acao,
        descricao: dados.descricao,
        dadosAlterados: dados.dadosAlterados || {},
        ip: dados.ip,
        userAgent: dados.userAgent,
      },
    });
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
      
      if (JSON.stringify(antigo[key]) !== JSON.stringify(novo[key])) {
        diff.antes[key] = antigo[key];
        diff.depois[key] = novo[key];
      }
    }

    return Object.keys(diff.antes).length > 0 ? diff : null;
  }
}






/**
 * [Estado Atual]: Repositório para gerenciar a persistência de Tokens de Refresh e Lista Negra (Blacklist).
 * [Dependências Técnicas]:
 *   - PrismaService (Banco de Dados)
 * [Histórico de Modificações]:
 *   - Criado para isolar o acesso do PrismaClient dentro do módulo de Autenticação.
 * [Regras de Negócio Imutáveis]:
 *   - Acesso exclusivo ao banco de dados; nenhuma validação de senha ou expiração de JWT deve residir aqui.
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findRefreshToken(args: Prisma.RefreshTokenFindUniqueArgs): Promise<any> {
    return this.prisma.refreshToken.findUnique(args);
  }

  async createRefreshToken(args: Prisma.RefreshTokenCreateArgs) {
    return this.prisma.refreshToken.create(args);
  }

  async deleteRefreshToken(args: Prisma.RefreshTokenDeleteArgs) {
    return this.prisma.refreshToken.delete(args);
  }

  async deleteManyRefreshTokens(args: Prisma.RefreshTokenDeleteManyArgs) {
    return this.prisma.refreshToken.deleteMany(args);
  }

  async createBlacklistToken(args: Prisma.TokenBlacklistCreateArgs) {
    return this.prisma.tokenBlacklist.create(args);
  }

  async findBlacklistToken(args: Prisma.TokenBlacklistFindUniqueArgs) {
    return this.prisma.tokenBlacklist.findUnique(args);
  }
}

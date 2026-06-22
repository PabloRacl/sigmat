import { Module } from '@nestjs/common';
import { ImportacaoController } from './importacao.controller';
import { ImportacaoService } from './importacao.service';
import { PrismaService } from '../../banco-dados/prisma.service';

@Module({
  controllers: [ImportacaoController],
  providers: [ImportacaoService, PrismaService]
})
export class ImportacaoModule {}

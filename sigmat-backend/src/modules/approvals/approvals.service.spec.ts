import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PerfilUsuario } from '@prisma/client';
import { ApprovalsService } from './approvals.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../shared/services/audit.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('ApprovalsService', () => {
  let service: ApprovalsService;
  let prisma: any;
  let auditService: any;
  let notificationsService: any;

  beforeEach(async () => {
    prisma = {
      alteracaoPendente: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      equipamento: {
        update: jest.fn(),
        delete: jest.fn(),
      },
      logOperacao: {
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    auditService = {
      normalizarDadosParaLog: jest.fn().mockResolvedValue({ antes: {}, depois: {} }),
      gerarDiffComLabels: jest.fn().mockResolvedValue({ campo: { antes: 'A', depois: 'B' } }),
      registrarLog: jest.fn().mockResolvedValue({}),
    };

    notificationsService = {
      notificarAtualizacaoGlobal: jest.fn(),
      notificarDecisaoAlteracao: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApprovalsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = module.get<ApprovalsService>(ApprovalsService);
  });

  it('deve retornar pendência encontrada', async () => {
    const pendencia = { id: 1, equipamento: {}, solicitante: {} };
    prisma.alteracaoPendente.findUnique.mockResolvedValue(pendencia);

    await expect(service.obterPendencia(1)).resolves.toEqual(pendencia);
    expect(prisma.alteracaoPendente.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: { equipamento: true, solicitante: true, aprovadoPor: true },
    });
  });

  it('deve lançar NotFoundException quando pendência não existir', async () => {
    prisma.alteracaoPendente.findUnique.mockResolvedValue(null);

    await expect(service.obterPendencia(999)).rejects.toThrow(NotFoundException);
  });

  it('deve criar solicitação quando houver alterações', async () => {
    const dadosAntigos = { nome: 'Antigo', patrimonio: '123' };
    const dadosNovos = { nome: 'Novo', patrimonio: '123' };
    const pendencia = { id: 7, equipamentoId: 1, solicitanteId: 2, dadosAntigos, dadosNovos, camposAlterados: ['nome'] };

    prisma.alteracaoPendente.create.mockResolvedValue(pendencia);

    await expect(service.criarSolicitacao(1, 2, dadosNovos, dadosAntigos)).resolves.toEqual(pendencia);
    expect(prisma.alteracaoPendente.create).toHaveBeenCalledWith({
      data: {
        equipamentoId: 1,
        solicitanteId: 2,
        dadosAntigos,
        dadosNovos,
        camposAlterados: ['nome'],
      },
    });
    expect(auditService.gerarDiffComLabels).toHaveBeenCalledWith(dadosAntigos, dadosNovos);
    expect(notificationsService.notificarAtualizacaoGlobal).toHaveBeenCalled();
  });

  it('deve retornar mensagem quando não houver alterações detectadas', async () => {
    const dadosAntigos = { nome: 'Mesmo' };
    const dadosNovos = { nome: 'Mesmo' };

    await expect(service.criarSolicitacao(1, 2, dadosNovos, dadosAntigos)).resolves.toEqual({
      message: 'Nenhuma alteração detectada',
    });
    expect(prisma.alteracaoPendente.create).not.toHaveBeenCalled();
  });

  it('deve listar pendências pendentes por unidade', async () => {
    const pendencias = [{ id: 1 }, { id: 2 }];
    prisma.alteracaoPendente.findMany.mockResolvedValue(pendencias);

    await expect(service.listarPendentesPorUnidade(5)).resolves.toEqual(pendencias);
    expect(prisma.alteracaoPendente.findMany).toHaveBeenCalledWith({
      where: {
        aprovado: null,
        equipamento: { secao: { batalhaoId: 5 } },
      },
      include: { equipamento: true, solicitante: true },
    });
  });

  it('deve contar pendências pendentes para unidade', async () => {
    prisma.alteracaoPendente.count.mockResolvedValue(8);

    await expect(service.contarPendentes(5)).resolves.toBe(8);
    expect(prisma.alteracaoPendente.count).toHaveBeenCalledWith({
      where: {
        aprovado: null,
        equipamento: { secao: { batalhaoId: 5 } },
      },
    });
  });

  it('deve impedir usuário não autorizado de processar decisão', async () => {
    await expect(
      service.processarDecisao(1, true, { perfil: 'OUTRO' }, 'motivo')
    ).rejects.toThrow(ForbiddenException);
  });

  it('deve lançar NotFoundException para solicitação inexistente', async () => {
    prisma.alteracaoPendente.findUnique.mockResolvedValue(null);

    await expect(
      service.processarDecisao(1, true, { perfil: PerfilUsuario.ADMIN_DTEC, id: 10 }, 'motivo')
    ).rejects.toThrow(NotFoundException);
  });

  it('deve lançar BadRequestException se solicitação já tiver sido processada', async () => {
    prisma.alteracaoPendente.findUnique.mockResolvedValue({ id: 1, aprovado: true, equipamento: { secao: { batalhaoId: 1 } } });

    await expect(
      service.processarDecisao(1, true, { perfil: PerfilUsuario.ADMIN_DTEC, id: 10 }, 'motivo')
    ).rejects.toThrow(BadRequestException);
  });

  it('deve executar atualização ao aprovar solicitação', async () => {
    const solicitacao = {
      id: 1,
      aprovado: null,
      solicitanteId: 42,
      equipamentoId: 100,
      equipamento: { id: 100, secao: { batalhaoId: 1 }, patrimonio: 'EQP-100' },
      dadosNovos: { nome: 'Novo nome' },
      camposAlterados: ['nome'],
    };

    prisma.alteracaoPendente.findUnique.mockResolvedValue(solicitacao);
    const pendenciaAtualizada = { ...solicitacao, aprovado: true, aprovadoPorId: 10 };

    const tx = {
      alteracaoPendente: { update: jest.fn().mockResolvedValue(pendenciaAtualizada) },
      equipamento: { update: jest.fn().mockResolvedValue({}), delete: jest.fn() },
      logOperacao: { create: jest.fn().mockResolvedValue({}) },
    };

    prisma.$transaction.mockImplementation(async (callback: any) => callback(tx));

    const resultado = await service.processarDecisao(
      1,
      true,
      { perfil: PerfilUsuario.ADMIN_DTEC, id: 10 },
      undefined
    );

    expect(resultado).toEqual(pendenciaAtualizada);
    expect(tx.alteracaoPendente.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        aprovado: true,
        aprovadoPorId: 10,
        motivoNegacao: undefined,
        dataAprovacao: expect.any(Date),
      },
    });
    expect(tx.equipamento.update).toHaveBeenCalledWith({
      where: { id: 100 },
      data: { nome: 'Novo nome' },
    });
    expect(tx.logOperacao.create).toHaveBeenCalled();
    expect(notificationsService.notificarAtualizacaoGlobal).toHaveBeenCalled();
    expect(notificationsService.notificarDecisaoAlteracao).toHaveBeenCalledWith(42, true, 'EQP-100');
  });

  it('deve registrar rejeição sem atualizar equipamento', async () => {
    const solicitacao = {
      id: 2,
      aprovado: null,
      solicitanteId: 77,
      equipamentoId: 200,
      equipamento: { id: 200, secao: { batalhaoId: 1 }, patrimonio: 'EQP-200' },
      dadosNovos: { nome: 'Nome recusado' },
      camposAlterados: ['nome'],
    };

    prisma.alteracaoPendente.findUnique.mockResolvedValue(solicitacao);
    const pendenciaAtualizada = { ...solicitacao, aprovado: false, aprovadoPorId: 20, motivoNegacao: 'Inválido' };

    const tx = {
      alteracaoPendente: { update: jest.fn().mockResolvedValue(pendenciaAtualizada) },
      equipamento: { update: jest.fn(), delete: jest.fn() },
      logOperacao: { create: jest.fn().mockResolvedValue({}) },
    };

    prisma.$transaction.mockImplementation(async (callback: any) => callback(tx));

    const resultado = await service.processarDecisao(
      2,
      false,
      { perfil: PerfilUsuario.COMANDANTE, id: 20, batalhaoId: 1 },
      'Inválido'
    );

    expect(resultado).toEqual(pendenciaAtualizada);
    expect(tx.alteracaoPendente.update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: {
        aprovado: false,
        aprovadoPorId: 20,
        motivoNegacao: 'Inválido',
        dataAprovacao: expect.any(Date),
      },
    });
    expect(tx.equipamento.update).not.toHaveBeenCalled();
    expect(tx.logOperacao.create).toHaveBeenCalled();
    expect(notificationsService.notificarDecisaoAlteracao).toHaveBeenCalledWith(77, false, 'EQP-200');
  });
});

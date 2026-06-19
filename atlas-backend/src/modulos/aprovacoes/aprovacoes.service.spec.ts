import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PerfilUsuario } from '@prisma/client';
import { ApprovalsService } from './aprovacoes.service';
import { AuditService } from '../../compartilhado/servicos/audit.service';
import { NotificationsService } from '../notificacoes/notificacoes.service';
import { I_APROVACAO_REPOSITORIO } from './repositorios/aprovacoes.repository.interface';

describe('ApprovalsService', () => {
  let service: ApprovalsService;
  let repository: any;
  let auditService: any;
  let notificationsService: any;

  beforeEach(async () => {
    repository = {
      criar: jest.fn(),
      listarPendentesPorUnidade: jest.fn(),
      contarPendentes: jest.fn(),
      obterPendencia: jest.fn(),
      processarDecisao: jest.fn(),
    };

    auditService = {
      normalizarDadosParaLog: jest
        .fn()
        .mockResolvedValue({ antes: {}, depois: {} }),
      gerarDiffComLabels: jest
        .fn()
        .mockResolvedValue({ campo: { antes: 'A', depois: 'B' } }),
      registrarLog: jest.fn().mockResolvedValue({}),
    };

    notificationsService = {
      notificarAtualizacaoGlobal: jest.fn(),
      notificarDecisaoAlteracao: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApprovalsService,
        { provide: I_APROVACAO_REPOSITORIO, useValue: repository },
        { provide: AuditService, useValue: auditService },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = module.get<ApprovalsService>(ApprovalsService);
  });

  it('deve retornar pendência encontrada', async () => {
    const pendencia = { id: 1, equipamento: {}, solicitante: {} };
    repository.obterPendencia.mockResolvedValue(pendencia);

    await expect(service.obterPendencia(1)).resolves.toEqual(pendencia);
    expect(repository.obterPendencia).toHaveBeenCalledWith(1);
  });

  it('deve lançar NotFoundException quando pendência não existir', async () => {
    repository.obterPendencia.mockResolvedValue(null);

    await expect(service.obterPendencia(999)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('deve criar solicitação quando houver alterações', async () => {
    const dadosAntigos = { nome: 'Antigo', patrimonio: '123' };
    const dadosNovos = { nome: 'Novo', patrimonio: '123' };
    const pendencia = {
      id: 7,
      equipamentoId: 1,
      solicitanteId: 2,
      dadosAntigos,
      dadosNovos,
      camposAlterados: ['nome'],
    };

    repository.criar.mockResolvedValue(pendencia);

    await expect(
      service.criarSolicitacao(1, 2, dadosNovos, dadosAntigos),
    ).resolves.toEqual(pendencia);
    expect(repository.criar).toHaveBeenCalledWith(
      1,
      2,
      dadosNovos,
      dadosAntigos,
      ['nome'],
    );
    expect(auditService.gerarDiffComLabels).toHaveBeenCalledWith(
      dadosAntigos,
      dadosNovos,
    );
    expect(notificationsService.notificarAtualizacaoGlobal).toHaveBeenCalled();
  });

  it('deve retornar mensagem quando não houver alterações detectadas', async () => {
    const dadosAntigos = { nome: 'Mesmo' };
    const dadosNovos = { nome: 'Mesmo' };

    await expect(
      service.criarSolicitacao(1, 2, dadosNovos, dadosAntigos),
    ).resolves.toEqual({
      message: 'Nenhuma alteração detectada',
    });
    expect(repository.criar).not.toHaveBeenCalled();
  });

  it('deve listar pendências pendentes por unidade', async () => {
    const pendencias = [{ id: 1 }, { id: 2 }];
    repository.listarPendentesPorUnidade.mockResolvedValue(pendencias);

    await expect(service.listarPendentesPorUnidade(5)).resolves.toEqual(
      pendencias,
    );
    expect(repository.listarPendentesPorUnidade).toHaveBeenCalledWith(5);
  });

  it('deve contar pendências pendentes para unidade', async () => {
    repository.contarPendentes.mockResolvedValue(8);

    await expect(service.contarPendentes(5)).resolves.toBe(8);
    expect(repository.contarPendentes).toHaveBeenCalledWith(5);
  });

  it('deve impedir usuário não autorizado de processar decisão', async () => {
    await expect(
      service.processarDecisao(1, true, { perfil: 'OUTRO' }, 'motivo'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('deve lançar NotFoundException para solicitação inexistente', async () => {
    repository.obterPendencia.mockResolvedValue(null);

    await expect(
      service.processarDecisao(
        1,
        true,
        { perfil: PerfilUsuario.ADMIN_DTEC, id: 10 },
        'motivo',
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('deve lançar BadRequestException se solicitação já tiver sido processada', async () => {
    repository.obterPendencia.mockResolvedValue({
      id: 1,
      aprovado: true,
      equipamento: { secao: { batalhaoId: 1 } },
    });

    await expect(
      service.processarDecisao(
        1,
        true,
        { perfil: PerfilUsuario.ADMIN_DTEC, id: 10 },
        'motivo',
      ),
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

    repository.obterPendencia.mockResolvedValue(solicitacao);
    const pendenciaAtualizada = {
      ...solicitacao,
      aprovado: true,
      aprovadoPorId: 10,
    };

    repository.processarDecisao.mockResolvedValue(pendenciaAtualizada);

    const resultado = await service.processarDecisao(
      1,
      true,
      { perfil: PerfilUsuario.ADMIN_DTEC, id: 10 },
      undefined,
    );

    expect(resultado).toEqual(pendenciaAtualizada);
    expect(repository.processarDecisao).toHaveBeenCalledWith(
      1,
      true,
      10,
      undefined,
      { solicitacao },
    );
    expect(notificationsService.notificarAtualizacaoGlobal).toHaveBeenCalled();
    expect(notificationsService.notificarDecisaoAlteracao).toHaveBeenCalledWith(
      42,
      true,
      'EQP-100',
    );
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

    repository.obterPendencia.mockResolvedValue(solicitacao);
    const pendenciaAtualizada = {
      ...solicitacao,
      aprovado: false,
      aprovadoPorId: 20,
      motivoNegacao: 'Inválido',
    };

    repository.processarDecisao.mockResolvedValue(pendenciaAtualizada);

    const resultado = await service.processarDecisao(
      2,
      false,
      { perfil: PerfilUsuario.COMANDANTE, id: 20, batalhaoId: 1 },
      'Inválido',
    );

    expect(resultado).toEqual(pendenciaAtualizada);
    expect(repository.processarDecisao).toHaveBeenCalledWith(
      2,
      false,
      20,
      'Inválido',
      { solicitacao },
    );
    expect(notificationsService.notificarDecisaoAlteracao).toHaveBeenCalledWith(
      77,
      false,
      'EQP-200',
    );
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { PerfilUsuario, AcaoLog } from '@prisma/client';
import { EquipmentService } from './equipamentos.service';
import { EquipmentRepository } from './equipamentos.repository';
import { ApprovalsService } from '../aprovacoes/aprovacoes.service';
import { AuditService } from '../../compartilhado/servicos/audit.service';

describe('EquipmentService', () => {
  let service: EquipmentService;
  let repository: any;
  let approvalsService: any;
  let auditService: any;

  beforeEach(async () => {
    repository = {
      findUsuarioCompleto: jest.fn(),
      findEquipamentoById: jest.fn(),
      updateEquipamento: jest.fn(),
      deleteEquipamento: jest.fn(),
    };

    approvalsService = {
      criarSolicitacao: jest.fn(),
    };

    auditService = {
      gerarDiffComLabels: jest.fn(),
      registrarLog: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquipmentService,
        { provide: EquipmentRepository, useValue: repository },
        { provide: ApprovalsService, useValue: approvalsService },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<EquipmentService>(EquipmentService);
  });

  it('deve criar solicitação de aprovação ao atualizar equipamento sem perfil administrativo', async () => {
    const equipamentoAtual = {
      id: 5,
      secao: { batalhaoId: 2 },
      patrimonio: 'EQP-5',
    };
    const usuario = { id: 10, perfil: PerfilUsuario.USUARIO_BATALHAO };
    const dados = { nome: 'Novo Nome' } as any;
    const userFull = {
      id: 10,
      perfil: PerfilUsuario.USUARIO_BATALHAO,
      batalhaoId: 2,
      secao: { batalhaoId: 2 },
    };

    repository.findUsuarioCompleto.mockResolvedValue(userFull);
    repository.findEquipamentoById.mockResolvedValue(equipamentoAtual);
    approvalsService.criarSolicitacao.mockResolvedValue({ id: 77 });

    await expect(service.atualizar(5, dados, usuario)).resolves.toEqual({
      id: 77,
    });
    expect(approvalsService.criarSolicitacao).toHaveBeenCalledWith(
      5,
      10,
      dados,
      equipamentoAtual,
    );
  });

  it('deve criar solicitação de exclusão quando usuário comum remover equipamento', async () => {
    const equipamentoAtual = {
      id: 8,
      secao: { batalhaoId: 3 },
      patrimonio: 'EQP-8',
    };
    const usuario = { id: 11, perfil: PerfilUsuario.USUARIO_BATALHAO };

    repository.findEquipamentoById.mockResolvedValue(equipamentoAtual);
    approvalsService.criarSolicitacao.mockResolvedValue({ id: 88 });

    await expect(service.remover(8, usuario)).resolves.toEqual({ id: 88 });
    expect(approvalsService.criarSolicitacao).toHaveBeenCalledWith(
      8,
      11,
      { _acao: 'DELETE' },
      equipamentoAtual,
    );
  });

  it('deve excluir diretamente quando ADMIN_DTEC remover equipamento', async () => {
    const equipamentoAtual = { id: 9, patrimonia: 'EQP-9' };
    const usuario = { id: 1, perfil: PerfilUsuario.ADMIN_DTEC };

    repository.findEquipamentoById.mockResolvedValue(equipamentoAtual);
    repository.deleteEquipamento.mockResolvedValue({ id: 9 });

    await expect(service.remover(9, usuario)).resolves.toEqual({ id: 9 });
    expect(approvalsService.criarSolicitacao).not.toHaveBeenCalled();
    expect(repository.deleteEquipamento).toHaveBeenCalledWith(9);
  });
});

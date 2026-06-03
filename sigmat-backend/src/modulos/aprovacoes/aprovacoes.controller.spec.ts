import { Test, TestingModule } from '@nestjs/testing';
import { ApprovalsController } from './aprovacoes.controller';
import { ApprovalsService } from './aprovacoes.service';
import { DecisionApprovalDto } from './dto/decision-approval.dto';

describe('ApprovalsController', () => {
  let controller: ApprovalsController;
  let approvalsService: any;

  beforeEach(async () => {
    approvalsService = {
      listarPendentesPorUnidade: jest.fn(),
      obterPendencia: jest.fn(),
      contarPendentes: jest.fn(),
      processarDecisao: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApprovalsController],
      providers: [{ provide: ApprovalsService, useValue: approvalsService }],
    }).compile();

    controller = module.get<ApprovalsController>(ApprovalsController);
  });

  it('should list pending approvals for ADMIN_DTEC', async () => {
    approvalsService.listarPendentesPorUnidade.mockResolvedValue(['pendencia']);

    const result = await controller.listarPendentes({ perfil: 'ADMIN_DTEC' });

    expect(result).toEqual(['pendencia']);
    expect(approvalsService.listarPendentesPorUnidade).toHaveBeenCalledWith(undefined);
  });

  it('should list pending approvals for unit user', async () => {
    approvalsService.listarPendentesPorUnidade.mockResolvedValue(['pendencia']);

    const result = await controller.listarPendentes({ perfil: 'COMANDANTE', batalhaoId: 10 });

    expect(result).toEqual(['pendencia']);
    expect(approvalsService.listarPendentesPorUnidade).toHaveBeenCalledWith(10);
  });

  it('should return a single pending approval by id', async () => {
    approvalsService.obterPendencia.mockResolvedValue({ id: 5 });

    const result = await controller.obterPendencia(5);

    expect(result).toEqual({ id: 5 });
    expect(approvalsService.obterPendencia).toHaveBeenCalledWith(5);
  });

  it('should count pending approvals for ADMIN_DTEC', async () => {
    approvalsService.contarPendentes.mockResolvedValue(7);

    const result = await controller.contarPendentes({ perfil: 'ADMIN_DTEC' });

    expect(result).toEqual({ total: 7 });
    expect(approvalsService.contarPendentes).toHaveBeenCalledWith(undefined);
  });

  it('should count pending approvals for unit user', async () => {
    approvalsService.contarPendentes.mockResolvedValue(4);

    const result = await controller.contarPendentes({ perfil: 'COMANDANTE', batalhaoId: 15 });

    expect(result).toEqual({ total: 4 });
    expect(approvalsService.contarPendentes).toHaveBeenCalledWith(15);
  });

  it('should process approval decision', async () => {
    const dto: DecisionApprovalDto = { aprovado: true, justificativa: 'Tudo certo' };
    const usuario = { id: 2, perfil: 'ADMIN_DTEC' };
    approvalsService.processarDecisao.mockResolvedValue({ id: 8 });

    const result = await controller.processarDecisao(8, dto, usuario);

    expect(result).toEqual({ id: 8 });
    expect(approvalsService.processarDecisao).toHaveBeenCalledWith(8, true, usuario, 'Tudo certo');
  });
});

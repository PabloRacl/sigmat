import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';
import { ApprovalsService } from '../src/modules/approvals/approvals.service';
import { EquipmentService } from '../src/modules/equipment/equipment.service';

describe('Approval Flow (e2e)', () => {
  let app: INestApplication;
  let approvalsService: any;
  let equipmentService: any;
  const mockUser = { id: 42, perfil: 'USUARIO_BATALHAO', batalhaoId: 1 };

  beforeAll(async () => {
    approvalsService = {
      listarPendentesPorUnidade: jest.fn().mockResolvedValue([{ id: 101, equipamentoId: 5, aprovado: null }]),
      obterPendencia: jest.fn().mockResolvedValue({ id: 101, equipamentoId: 5, aprovado: true }),
      contarPendentes: jest.fn().mockResolvedValue(1),
      processarDecisao: jest.fn().mockResolvedValue({ id: 101, aprovado: true, aprovadoPorId: 42 }),
      criarSolicitacao: jest.fn().mockResolvedValue({ id: 101, equipamentoId: 5, aprovado: null }),
    };

    equipmentService = {
      atualizar: jest.fn().mockResolvedValue({ id: 101, equipamentoId: 5, aprovado: null }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ApprovalsService)
      .useValue(approvalsService)
      .overrideProvider(EquipmentService)
      .useValue(equipmentService)
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const request = context.switchToHttp().getRequest();
          request.user = mockUser;
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a pending approval request for equipment update', async () => {
    const result = await request(app.getHttpServer())
      .patch('/equipamentos/5')
      .send({ nome: 'Nome atualizado' })
      .expect(200);

    expect(result.body).toEqual({ id: 101, equipamentoId: 5, aprovado: null });
    expect(equipmentService.atualizar).toHaveBeenCalledWith(5, { nome: 'Nome atualizado' }, mockUser);
  });

  it('should list pending approvals', async () => {
    const result = await request(app.getHttpServer())
      .get('/aprovacoes/pendentes')
      .expect(200);

    expect(result.body).toEqual([{ id: 101, equipamentoId: 5, aprovado: null }]);
    expect(approvalsService.listarPendentesPorUnidade).toHaveBeenCalledWith(1);
  });

  it('should process an approval decision', async () => {
    const result = await request(app.getHttpServer())
      .post('/aprovacoes/101/decisao')
      .send({ aprovado: true, justificativa: 'Validado' })
      .expect(201);

    expect(result.body).toEqual({ id: 101, aprovado: true, aprovadoPorId: 42 });
    expect(approvalsService.processarDecisao).toHaveBeenCalledWith(101, true, mockUser, 'Validado');
  });

  it('should retrieve a specific approval request', async () => {
    const result = await request(app.getHttpServer())
      .get('/aprovacoes/101')
      .expect(200);

    expect(result.body).toEqual({ id: 101, equipamentoId: 5, aprovado: true });
    expect(approvalsService.obterPendencia).toHaveBeenCalledWith(101);
  });
});

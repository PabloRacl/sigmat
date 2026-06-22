import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EquipmentController } from './materiais.controller';
import { EquipmentService } from './materiais.service';
import { CriarEquipamentoDto } from './dto/criar-equipamento.dto';
import { AtualizarEquipamentoDto } from './dto/atualizar-equipamento.dto';
import type { UsuarioLogado } from '../../comum/interfaces/usuario-logado.interface';
import { JwtAuthGuard } from '../acesso/guardas/jwt-autenticacao.guard';

describe('EquipmentController', () => {
  let controller: EquipmentController;
  let service: jest.Mocked<EquipmentService>;

  const mockService = {
    listarTodos: jest.fn(),
    buscarPorId: jest.fn(),
    criar: jest.fn(),
    atualizar: jest.fn(),
    remover: jest.fn(),
    obterHistorico: jest.fn(),
    atualizarEmMassa: jest.fn(),
  };

  const usuario = { id: 1, perfil: 'ADMIN_DTEC', nome: 'Admin' } as unknown as UsuarioLogado;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EquipmentController],
      providers: [{ provide: EquipmentService, useValue: mockService }],
    }).compile();
    controller = module.get<EquipmentController>(EquipmentController);
    service = module.get(EquipmentService);
  });

  it('deve aplicar o guard JwtAuthGuard na classe', () => {
    const guards = Reflect.getMetadata('__guards__', EquipmentController);
    expect(guards).toBeDefined();
    expect(guards).toContain(JwtAuthGuard);
  });

  it('deve repassar todos os parametros de consulta ao service.listarTodos', async () => {
    const filtros = {
      page: 2,
      limit: 10,
      search: 'notebook',
      tipoId: 3,
      statusId: 1,
      disponibilidadeId: 2,
      secaoId: 5,
      marcaId: 7,
      patrimonio: 'PAT-001',
      sei: 'SEI-123',
      numeroSerie: 'SN-456',
      dataAquisicao: '2024-01-01',
      observacao: 'teste',
    };
    const resultadoEsperado = {
      itens: [],
      total: 0,
      page: 2,
      limit: 10,
      totalPages: 0,
    };
    mockService.listarTodos.mockResolvedValue(resultadoEsperado);

    const resultado = await controller.listarTodos(
      usuario,
      filtros.page,
      filtros.limit,
      filtros.search,
      filtros.tipoId,
      filtros.statusId,
      filtros.disponibilidadeId,
      filtros.secaoId,
      filtros.marcaId,
      filtros.patrimonio,
      filtros.sei,
      filtros.numeroSerie,
      filtros.dataAquisicao,
      filtros.observacao,
    );

    expect(resultado).toEqual(resultadoEsperado);
    expect(mockService.listarTodos).toHaveBeenCalledWith(usuario, filtros);
  });

  it('deve repassar usuario autenticado ao service.listarTodos', async () => {
    mockService.listarTodos.mockResolvedValue({
      itens: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });

    await controller.listarTodos(usuario);

    expect(mockService.listarTodos).toHaveBeenCalledWith(
      usuario,
      expect.any(Object),
    );
  });

  it('deve chamar listarTodos com valores padrao quando parametros opcionais estiverem ausentes', async () => {
    mockService.listarTodos.mockResolvedValue({
      itens: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });

    await controller.listarTodos(usuario);

    expect(mockService.listarTodos).toHaveBeenCalledWith(usuario, {
      page: undefined,
      limit: undefined,
      search: undefined,
      tipoId: undefined,
      statusId: undefined,
      disponibilidadeId: undefined,
      secaoId: undefined,
      marcaId: undefined,
      patrimonio: undefined,
      sei: undefined,
      numeroSerie: undefined,
      dataAquisicao: undefined,
      observacao: undefined,
    });
  });

  it('deve chamar listarTodos com apenas search e tipoId', async () => {
    mockService.listarTodos.mockResolvedValue({
      itens: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });

    await controller.listarTodos(
      usuario,
      undefined,
      undefined,
      'impressora',
      5,
    );

    expect(mockService.listarTodos).toHaveBeenCalledWith(usuario, {
      page: undefined,
      limit: undefined,
      search: 'impressora',
      tipoId: 5,
      statusId: undefined,
      disponibilidadeId: undefined,
      secaoId: undefined,
      marcaId: undefined,
      patrimonio: undefined,
      sei: undefined,
      numeroSerie: undefined,
      dataAquisicao: undefined,
      observacao: undefined,
    });
  });

  it('deve retornar equipamento por id', async () => {
    const equipamento = { id: 1, patrimonio: 'PAT-001' };
    mockService.buscarPorId.mockResolvedValue(equipamento);

    const resultado = await controller.buscarPorId(1);

    expect(resultado).toEqual(equipamento);
    expect(mockService.buscarPorId).toHaveBeenCalledWith(1);
  });

  it('deve lancar NotFoundException quando buscarPorId nao encontrar', async () => {
    mockService.buscarPorId.mockRejectedValue(
      new NotFoundException('Equipamento com ID 99 nao encontrado'),
    );

    await expect(controller.buscarPorId(99)).rejects.toThrow(NotFoundException);
    expect(mockService.buscarPorId).toHaveBeenCalledWith(99);
  });

  it('deve criar equipamento com dados e usuario', async () => {
    const dto = {
      patrimonio: 'PAT-002',
      tipoEquipamentoId: 1,
      statusId: 1,
      disponibilidadeId: 1,
      secaoId: 2,
    };
    const criado = { id: 10, ...dto };
    mockService.criar.mockResolvedValue(criado);

    const resultado = await controller.criar(dto, usuario);

    expect(resultado).toEqual(criado);
    expect(mockService.criar).toHaveBeenCalledWith(dto, usuario);
  });

  it('deve criar equipamento com todos os campos opcionais', async () => {
    const dto = {
      patrimonio: 'PAT-003',
      numeroSerie: 'SN-789',
      sei: 'SEI-999',
      dataAquisicao: '2024-06-15',
      valor: 5000,
      observacao: 'Obs',
      tipoEquipamentoId: 2,
      marcaId: 3,
      modeloId: 4,
      statusId: 2,
      tipoAquisicaoId: 1,
      disponibilidadeId: 2,
      secaoId: 3,
      usuarioResponsavelId: 5,
      especificacoes: { cor: 'preto' },
      solicitante: 'Joao',
      dataSolicitacao: '2024-06-10',
      dataRetornoEmprestimo: '2024-12-31',
      fotos: [],
    };
    const criado = { id: 11, ...dto };
    mockService.criar.mockResolvedValue(criado);

    const resultado = await controller.criar(dto, usuario);

    expect(resultado).toEqual(criado);
    expect(mockService.criar).toHaveBeenCalledWith(dto, usuario);
  });

  it('deve propagar erro quando criar falhar', async () => {
    const dto = {
      patrimonio: 'PAT-004',
      tipoEquipamentoId: 1,
      statusId: 1,
      disponibilidadeId: 1,
      secaoId: 1,
    };
    mockService.criar.mockRejectedValue(new Error('Erro no banco'));

    await expect(controller.criar(dto as any, usuario)).rejects.toThrow(
      'Erro no banco',
    );
  });

  it('deve atualizar equipamento com dados e usuario', async () => {
    const dto = { patrimonio: 'PAT-ATUALIZADO' };
    const atualizado = { id: 5, patrimonio: 'PAT-ATUALIZADO' };
    mockService.atualizar.mockResolvedValue(atualizado);

    const resultado = await controller.atualizar(5, dto, usuario);

    expect(resultado).toEqual(atualizado);
    expect(mockService.atualizar).toHaveBeenCalledWith(5, dto, usuario);
  });

  it('deve lancar erro quando atualizar receber id invalido', async () => {
    mockService.atualizar.mockRejectedValue(
      new NotFoundException('Equipamento com ID 999 nao encontrado'),
    );

    await expect(controller.atualizar(999, {} as any, usuario)).rejects.toThrow(
      NotFoundException,
    );
    expect(mockService.atualizar).toHaveBeenCalledWith(999, {}, usuario);
  });

  it('deve remover equipamento com id e usuario', async () => {
    const removido = { id: 3, patrimonio: 'PAT-003' };
    mockService.remover.mockResolvedValue(removido);

    const resultado = await controller.remover(3, usuario);

    expect(resultado).toEqual(removido);
    expect(mockService.remover).toHaveBeenCalledWith(3, usuario);
  });

  it('deve lancar erro quando remover receber id inexistente', async () => {
    mockService.remover.mockRejectedValue(
      new NotFoundException('Equipamento com ID 999 nao encontrado'),
    );

    await expect(controller.remover(999, usuario)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('deve atualizar em massa com ids e dados', async () => {
    const body = { ids: [1, 2, 3], dados: { statusId: 5 } };
    const resultado = [{ id: 1 }, { id: 2 }, { id: 3 }];
    mockService.atualizarEmMassa.mockResolvedValue(resultado);

    const retorno = await controller.atualizarEmMassa(body, usuario);

    expect(retorno).toEqual(resultado);
    expect(mockService.atualizarEmMassa).toHaveBeenCalledWith(
      [1, 2, 3],
      { statusId: 5 },
      usuario,
    );
  });

  it('deve chamar atualizarEmMassa com lista vazia de ids', async () => {
    const body = { ids: [], dados: { observacao: 'teste' } };
    mockService.atualizarEmMassa.mockResolvedValue(undefined);

    const retorno = await controller.atualizarEmMassa(body, usuario);

    expect(retorno).toBeUndefined();
    expect(mockService.atualizarEmMassa).toHaveBeenCalledWith(
      [],
      { observacao: 'teste' },
      usuario,
    );
  });

  it('deve retornar historico do equipamento', async () => {
    const historico = [{ id: 1, acao: 'CREATE', descricao: 'Criado' }];
    mockService.obterHistorico.mockResolvedValue(historico);

    const resultado = await controller.obterHistorico(10);

    expect(resultado).toEqual(historico);
    expect(mockService.obterHistorico).toHaveBeenCalledWith(10);
  });

  it('deve retornar historico vazio para equipamento sem logs', async () => {
    mockService.obterHistorico.mockResolvedValue([]);

    const resultado = await controller.obterHistorico(99);

    expect(resultado).toEqual([]);
    expect(mockService.obterHistorico).toHaveBeenCalledWith(99);
  });

  it('deve repassar o usuario autenticado ao service.criar', async () => {
    const outroUsuario = { id: 2, perfil: 'USUARIO_BATALHAO' } as unknown as UsuarioLogado;
    const dto = {
      patrimonio: 'PAT-005',
      tipoEquipamentoId: 1,
      statusId: 1,
      disponibilidadeId: 1,
      secaoId: 2,
    };
    mockService.criar.mockResolvedValue({ id: 20 });

    await controller.criar(dto, outroUsuario);

    expect(mockService.criar).toHaveBeenCalledWith(dto, outroUsuario);
  });

  it('deve repassar o usuario autenticado ao service.atualizar', async () => {
    const outroUsuario = { id: 3, perfil: 'COMANDANTE' } as unknown as UsuarioLogado;
    mockService.atualizar.mockResolvedValue({ id: 7 });

    await controller.atualizar(7, {}, outroUsuario);

    expect(mockService.atualizar).toHaveBeenCalledWith(7, {}, outroUsuario);
  });

  it('deve repassar o usuario autenticado ao service.remover', async () => {
    const outroUsuario = { id: 4, perfil: 'USUARIO_BATALHAO' } as unknown as UsuarioLogado;
    mockService.remover.mockResolvedValue({ id: 9 });

    await controller.remover(9, outroUsuario);

    expect(mockService.remover).toHaveBeenCalledWith(9, outroUsuario);
  });

  it('deve repassar o usuario autenticado ao service.atualizarEmMassa', async () => {
    const outroUsuario = { id: 5, perfil: 'ADMIN_DTEC' } as unknown as UsuarioLogado;
    const body = { ids: [10], dados: { secaoId: 3 } };

    await controller.atualizarEmMassa(body, outroUsuario);

    expect(mockService.atualizarEmMassa).toHaveBeenCalledWith(
      [10],
      { secaoId: 3 },
      outroUsuario,
    );
  });

  it('deve converter id string para numero via ParseIntPipe no buscarPorId', async () => {
    mockService.buscarPorId.mockResolvedValue({ id: 1 });
    await controller.buscarPorId(1);
    expect(mockService.buscarPorId).toHaveBeenCalledWith(1);
  });

  it('deve listar equipamentos sem passar usuario em buscarPorId', async () => {
    mockService.buscarPorId.mockResolvedValue({ id: 2 });
    await controller.buscarPorId(2);
    expect(mockService.buscarPorId).toHaveBeenCalledWith(2);
  });

  it('deve propagar erro de servico do listarTodos', async () => {
    mockService.listarTodos.mockRejectedValue(new Error('Erro interno'));
    await expect(controller.listarTodos(usuario)).rejects.toThrow(
      'Erro interno',
    );
  });

  it('deve propagar erro de servico do obterHistorico', async () => {
    mockService.obterHistorico.mockRejectedValue(
      new Error('Erro no historico'),
    );
    await expect(controller.obterHistorico(1)).rejects.toThrow(
      'Erro no historico',
    );
  });

  it('deve propagar erro de servico do atualizarEmMassa', async () => {
    const body = { ids: [1], dados: {} };
    mockService.atualizarEmMassa.mockRejectedValue(new Error('Erro em massa'));
    await expect(
      controller.atualizarEmMassa(body as any, usuario),
    ).rejects.toThrow('Erro em massa');
  });

  it('deve lidar com atualizarEmMassa contendo todos os campos de dados', async () => {
    const body = {
      ids: [1, 2],
      dados: {
        statusId: 1,
        secaoId: 2,
        disponibilidadeId: 3,
        tipoAquisicaoId: 4,
        observacao: 'Em manutencao',
      },
    };
    mockService.atualizarEmMassa.mockResolvedValue([{}, {}]);

    await controller.atualizarEmMassa(body, usuario);

    expect(mockService.atualizarEmMassa).toHaveBeenCalledWith(
      [1, 2],
      body.dados,
      usuario,
    );
  });

  it('deve permitir atualizarEmMassa com apenas observacao', async () => {
    const body = { ids: [5], dados: { observacao: 'Apenas obs' } };
    mockService.atualizarEmMassa.mockResolvedValue([{}]);

    await controller.atualizarEmMassa(body, usuario);

    expect(mockService.atualizarEmMassa).toHaveBeenCalledWith(
      [5],
      { observacao: 'Apenas obs' },
      usuario,
    );
  });
});

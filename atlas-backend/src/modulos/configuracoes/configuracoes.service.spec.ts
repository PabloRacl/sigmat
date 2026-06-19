import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PerfilUsuario } from '@prisma/client';
import { SettingsService } from './configuracoes.service';
import { PrismaService } from '../../banco-dados/prisma.service';

describe('SettingsService', () => {
  let service: SettingsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      tipoEquipamento: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      marca: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      modelo: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      statusEquipamento: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      disponibilidade: { findMany: jest.fn() },
      tipoAquisicao: { findMany: jest.fn() },
      secao: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      batalhao: { findMany: jest.fn(), findUnique: jest.fn() },
      usuario: { findUnique: jest.fn() },
      equipamento: { count: jest.fn() },
      usuarioTipoEquipamento: { deleteMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
  });

  describe('listarTipos', () => {
    it('deve retornar lista de tipos ordenada por nome', async () => {
      const tipos = [
        { id: 1, nome: 'Computador' },
        { id: 2, nome: 'Impressora' },
      ];
      prisma.tipoEquipamento.findMany.mockResolvedValue(tipos);

      const resultado = await service.listarTipos();

      expect(resultado).toEqual(tipos);
      expect(prisma.tipoEquipamento.findMany).toHaveBeenCalledWith({
        orderBy: { nome: 'asc' },
      });
    });

    it('deve retornar lista vazia quando nao houver tipos', async () => {
      prisma.tipoEquipamento.findMany.mockResolvedValue([]);

      const resultado = await service.listarTipos();

      expect(resultado).toEqual([]);
    });
  });

  describe('listarMarcas', () => {
    it('deve retornar lista de marcas ordenada por nome', async () => {
      const marcas = [{ id: 1, nome: 'Dell' }];
      prisma.marca.findMany.mockResolvedValue(marcas);

      const resultado = await service.listarMarcas();

      expect(resultado).toEqual(marcas);
    });
  });

  describe('listarModelos', () => {
    it('deve retornar todos os modelos quando marcaId nao for informado', async () => {
      const modelos = [{ id: 1, nome: 'Latitude' }];
      prisma.modelo.findMany.mockResolvedValue(modelos);

      const resultado = await service.listarModelos();

      expect(resultado).toEqual(modelos);
      expect(prisma.modelo.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { nome: 'asc' },
      });
    });

    it('deve filtrar modelos por marcaId', async () => {
      prisma.modelo.findMany.mockResolvedValue([]);

      await service.listarModelos(5);

      expect(prisma.modelo.findMany).toHaveBeenCalledWith({
        where: { marcaId: 5 },
        orderBy: { nome: 'asc' },
      });
    });
  });

  describe('criarTipo', () => {
    it('deve criar tipo com nome valido', async () => {
      prisma.tipoEquipamento.findFirst.mockResolvedValue(null);
      prisma.tipoEquipamento.create.mockResolvedValue({
        id: 1,
        nome: 'Notebook',
      });

      const resultado = await service.criarTipo({ nome: 'Notebook' });

      expect(resultado).toEqual({ id: 1, nome: 'Notebook' });
    });

    it('deve lancar BadRequestException para nome vazio', async () => {
      await expect(service.criarTipo({ nome: '' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lancar BadRequestException para nome com apenas espacos', async () => {
      await expect(service.criarTipo({ nome: '   ' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lancar ConflictException quando tipo ja existe com case insensitive', async () => {
      prisma.tipoEquipamento.findFirst.mockResolvedValue({
        id: 1,
        nome: 'notebook',
      });

      await expect(service.criarTipo({ nome: 'Notebook' })).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.tipoEquipamento.create).not.toHaveBeenCalled();
    });

    it('deve normalizar nome trimando antes de criar', async () => {
      prisma.tipoEquipamento.findFirst.mockResolvedValue(null);
      prisma.tipoEquipamento.create.mockResolvedValue({
        id: 2,
        nome: 'Monitor',
      });

      await service.criarTipo({ nome: '  Monitor  ' });

      expect(prisma.tipoEquipamento.create).toHaveBeenCalledWith({
        data: { nome: 'Monitor' },
      });
    });
  });

  describe('criarMarca', () => {
    it('deve criar marca com nome valido', async () => {
      prisma.marca.findFirst.mockResolvedValue(null);
      prisma.marca.create.mockResolvedValue({ id: 1, nome: 'HP' });

      const resultado = await service.criarMarca({ nome: 'HP' });

      expect(resultado).toEqual({ id: 1, nome: 'HP' });
    });

    it('deve lancar BadRequestException para nome vazio', async () => {
      await expect(service.criarMarca({ nome: '' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lancar ConflictException quando marca ja existe', async () => {
      prisma.marca.findFirst.mockResolvedValue({ id: 1, nome: 'hp' });

      await expect(service.criarMarca({ nome: 'HP' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('criarModelo', () => {
    it('deve criar modelo com nome e marcaId validos', async () => {
      prisma.modelo.findFirst.mockResolvedValue(null);
      prisma.modelo.create.mockResolvedValue({
        id: 1,
        nome: 'ProBook',
        marcaId: 1,
      });

      const resultado = await service.criarModelo({
        nome: 'ProBook',
        marcaId: 1,
      });

      expect(resultado).toEqual({ id: 1, nome: 'ProBook', marcaId: 1 });
    });

    it('deve lancar BadRequestException para nome vazio', async () => {
      await expect(
        service.criarModelo({ nome: '', marcaId: 1 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lancar BadRequestException quando marcaId nao for informado', async () => {
      await expect(service.criarModelo({ nome: 'Teste' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lancar ConflictException quando modelo ja existe para a mesma marca', async () => {
      prisma.modelo.findFirst.mockResolvedValue({
        id: 1,
        nome: 'probook',
        marcaId: 1,
      });

      await expect(
        service.criarModelo({ nome: 'ProBook', marcaId: 1 }),
      ).rejects.toThrow(ConflictException);
    });

    it('deve permitir mesmo nome para marcas diferentes', async () => {
      prisma.modelo.findFirst.mockResolvedValue(null);
      prisma.modelo.create.mockResolvedValue({
        id: 2,
        nome: 'Basic',
        marcaId: 2,
      });

      const resultado = await service.criarModelo({
        nome: 'Basic',
        marcaId: 2,
      });

      expect(resultado.id).toBe(2);
    });
  });

  describe('listarStatus', () => {
    it('deve retornar lista de status ordenada', async () => {
      prisma.statusEquipamento.findMany.mockResolvedValue([
        { id: 1, nome: 'Ativo' },
      ]);

      const resultado = await service.listarStatus();

      expect(resultado).toEqual([{ id: 1, nome: 'Ativo' }]);
    });
  });

  describe('listarDisponibilidades', () => {
    it('deve retornar lista de disponibilidades ordenada', async () => {
      prisma.disponibilidade.findMany.mockResolvedValue([
        { id: 1, nome: 'Disponivel' },
      ]);

      const resultado = await service.listarDisponibilidades();

      expect(resultado).toEqual([{ id: 1, nome: 'Disponivel' }]);
    });
  });

  describe('listarTiposAquisicao', () => {
    it('deve retornar lista de tipos de aquisicao ordenada', async () => {
      prisma.tipoAquisicao.findMany.mockResolvedValue([
        { id: 1, nome: 'Compra' },
      ]);

      const resultado = await service.listarTiposAquisicao();

      expect(resultado).toEqual([{ id: 1, nome: 'Compra' }]);
    });
  });

  describe('listarSecoes', () => {
    it('deve retornar todas as secoes quando usuario nao for informado', async () => {
      prisma.secao.findMany.mockResolvedValue([
        {
          id: 1,
          sigla: 'SEC-1',
          batalhao: null,
          diretoria: null,
          _count: { equipamentos: 0 },
        },
      ]);

      const resultado = await service.listarSecoes();

      expect(resultado).toHaveLength(1);
    });

    it('deve retornar todas as secoes para ADMIN_DTEC', async () => {
      prisma.usuario.findUnique.mockResolvedValue({
        id: 1,
        perfil: PerfilUsuario.ADMIN_DTEC,
        secao: null,
        batalhao: null,
        secoesPermitidas: [],
      });
      prisma.secao.findMany.mockResolvedValue([{ id: 1, sigla: 'SEC-1' }]);

      const resultado = await service.listarSecoes({ id: 1 });

      expect(resultado).toHaveLength(1);
      expect(prisma.secao.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { sigla: 'asc' } }),
      );
    });

    it('deve filtrar secoes por diretoria quando DIRETORIA', async () => {
      prisma.usuario.findUnique.mockResolvedValue({
        id: 2,
        perfil: PerfilUsuario.DIRETORIA,
        secao: { diretoriaId: 1 },
        batalhao: null,
        secaoId: 10,
        batalhaoId: null,
        secoesPermitidas: [],
      });
      prisma.secao.findMany.mockResolvedValue([{ id: 10, sigla: 'SEC-10' }]);

      const resultado = await service.listarSecoes({ id: 2 });

      expect(resultado).toHaveLength(1);
    });

    it('deve retornar lista vazia quando usuario sem diretoria nem batalhao', async () => {
      prisma.usuario.findUnique.mockResolvedValue({
        id: 3,
        perfil: PerfilUsuario.USUARIO_BATALHAO,
        secao: null,
        batalhao: null,
        secaoId: null,
        batalhaoId: null,
        secoesPermitidas: [],
      });

      const resultado = await service.listarSecoes({ id: 3 });

      expect(resultado).toEqual([]);
    });

    it('deve retornar array vazio quando usuario nao for encontrado', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);

      const resultado = await service.listarSecoes({ id: 999 });

      expect(resultado).toEqual([]);
    });
  });

  describe('criarSecao', () => {
    const dadosSecao = { sigla: 'SEC-NOVA', nome: 'Secao Nova', batalhaoId: 1 };

    it('deve criar secao com dados validos e permissao ADMIN_DTEC', async () => {
      prisma.usuario.findUnique.mockResolvedValue({
        id: 1,
        perfil: PerfilUsuario.ADMIN_DTEC,
        secao: null,
        batalhao: null,
        secoesPermitidas: [],
      });
      prisma.secao.create.mockResolvedValue({ id: 100, ...dadosSecao });

      const resultado = await service.criarSecao(dadosSecao, { id: 1 });

      expect(resultado).toEqual({ id: 100, ...dadosSecao });
    });

    it('deve lancar ForbiddenException quando perfil sem permissao', async () => {
      prisma.usuario.findUnique.mockResolvedValue({
        id: 5,
        perfil: 'PERFIL_INVALIDO',
        secao: null,
        batalhao: null,
        secoesPermitidas: [],
      });

      await expect(service.criarSecao(dadosSecao, { id: 5 })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('deve lancar NotFoundException quando usuario nao for encontrado na validacao', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);

      await expect(service.criarSecao(dadosSecao, { id: 999 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve validar permissao de DIRETORIA com batalhaoId correto', async () => {
      prisma.usuario.findUnique.mockResolvedValue({
        id: 2,
        perfil: PerfilUsuario.DIRETORIA,
        secao: { diretoriaId: 1 },
        batalhao: null,
        batalhaoId: null,
        secoesPermitidas: [],
      });
      prisma.batalhao.findUnique.mockResolvedValue({ id: 1, diretoriaId: 1 });
      prisma.secao.create.mockResolvedValue({ id: 101 });

      const resultado = await service.criarSecao(
        { sigla: 'SEC-2', nome: 'Secao 2', batalhaoId: 1 },
        { id: 2 },
      );

      expect(resultado).toBeDefined();
    });

    it('deve barrar DIRETORIA criar secao em batalhao de outra diretoria', async () => {
      prisma.usuario.findUnique.mockResolvedValue({
        id: 2,
        perfil: PerfilUsuario.DIRETORIA,
        secao: { diretoriaId: 1 },
        batalhao: null,
        batalhaoId: null,
        secoesPermitidas: [],
      });
      prisma.batalhao.findUnique.mockResolvedValue({ id: 2, diretoriaId: 2 });

      await expect(
        service.criarSecao(
          { sigla: 'SEC-X', nome: 'X', batalhaoId: 2 },
          { id: 2 },
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('atualizarSecao', () => {
    it('deve atualizar secao existente', async () => {
      prisma.usuario.findUnique.mockResolvedValue({
        id: 1,
        perfil: PerfilUsuario.ADMIN_DTEC,
        secao: null,
        batalhao: null,
        secoesPermitidas: [],
      });
      prisma.secao.findUnique.mockResolvedValue({ id: 5, sigla: 'SEC-5' });
      prisma.secao.update.mockResolvedValue({
        id: 5,
        sigla: 'SEC-5-ATUALIZADA',
      });

      const resultado = await service.atualizarSecao(
        5,
        { sigla: 'SEC-5-ATUALIZADA' },
        { id: 1 },
      );

      expect(resultado.sigla).toBe('SEC-5-ATUALIZADA');
    });

    it('deve lancar NotFoundException quando secao nao existir', async () => {
      prisma.usuario.findUnique.mockResolvedValue({
        id: 1,
        perfil: PerfilUsuario.ADMIN_DTEC,
        secao: null,
        batalhao: null,
        secoesPermitidas: [],
      });
      prisma.secao.findUnique.mockResolvedValue(null);

      await expect(
        service.atualizarSecao(999, { nome: 'Nova' }, { id: 1 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listarBatalhoes', () => {
    it('deve retornar lista de batalhoes ordenada', async () => {
      prisma.batalhao.findMany.mockResolvedValue([{ id: 1, sigla: 'BTL-1' }]);

      const resultado = await service.listarBatalhoes();

      expect(resultado).toEqual([{ id: 1, sigla: 'BTL-1' }]);
    });
  });

  describe('excluirTipo', () => {
    it('deve excluir tipo quando nao houver equipamentos vinculados', async () => {
      prisma.equipamento.count.mockResolvedValue(0);
      prisma.usuarioTipoEquipamento.deleteMany.mockResolvedValue({ count: 0 });
      prisma.tipoEquipamento.delete.mockResolvedValue({
        id: 1,
        nome: 'Antigo',
      });

      const resultado = await service.excluirTipo(1);

      expect(resultado).toEqual({ id: 1, nome: 'Antigo' });
    });

    it('deve lancar ConflictException quando houver equipamentos vinculados', async () => {
      prisma.equipamento.count.mockResolvedValue(5);

      await expect(service.excluirTipo(1)).rejects.toThrow(ConflictException);
      expect(prisma.tipoEquipamento.delete).not.toHaveBeenCalled();
    });

    it('deve limpar usuarioTipoEquipamento antes de excluir', async () => {
      prisma.equipamento.count.mockResolvedValue(0);
      prisma.usuarioTipoEquipamento.deleteMany.mockResolvedValue({ count: 2 });
      prisma.tipoEquipamento.delete.mockResolvedValue({ id: 1 });

      await service.excluirTipo(1);

      expect(prisma.usuarioTipoEquipamento.deleteMany).toHaveBeenCalledWith({
        where: { tipoEquipamentoId: 1 },
      });
    });
  });

  describe('excluirMarca', () => {
    it('deve excluir marca quando nao houver modelos nem equipamentos', async () => {
      prisma.modelo.count.mockResolvedValue(0);
      prisma.equipamento.count.mockResolvedValue(0);
      prisma.marca.delete.mockResolvedValue({ id: 2, nome: 'Marca Velha' });

      const resultado = await service.excluirMarca(2);

      expect(resultado).toEqual({ id: 2, nome: 'Marca Velha' });
    });

    it('deve lancar ConflictException quando houver modelos vinculados', async () => {
      prisma.modelo.count.mockResolvedValue(3);

      await expect(service.excluirMarca(2)).rejects.toThrow(ConflictException);
      expect(prisma.marca.delete).not.toHaveBeenCalled();
    });

    it('deve lancar ConflictException quando houver equipamentos vinculados', async () => {
      prisma.modelo.count.mockResolvedValue(0);
      prisma.equipamento.count.mockResolvedValue(2);

      await expect(service.excluirMarca(2)).rejects.toThrow(ConflictException);
    });

    it('deve verificar modelos primeiro, depois equipamentos', async () => {
      prisma.modelo.count.mockResolvedValue(1);

      await expect(service.excluirMarca(2)).rejects.toThrow('modelo');
      expect(prisma.equipamento.count).not.toHaveBeenCalled();
    });
  });

  describe('excluirModelo', () => {
    it('deve excluir modelo quando nao houver equipamentos vinculados', async () => {
      prisma.equipamento.count.mockResolvedValue(0);
      prisma.modelo.delete.mockResolvedValue({ id: 3, nome: 'Modelo Antigo' });

      const resultado = await service.excluirModelo(3);

      expect(resultado).toEqual({ id: 3, nome: 'Modelo Antigo' });
    });

    it('deve lancar ConflictException quando houver equipamentos vinculados', async () => {
      prisma.equipamento.count.mockResolvedValue(2);

      await expect(service.excluirModelo(3)).rejects.toThrow(ConflictException);
      expect(prisma.modelo.delete).not.toHaveBeenCalled();
    });
  });
});

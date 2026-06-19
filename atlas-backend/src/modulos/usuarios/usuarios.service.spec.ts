import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PerfilUsuario } from '@prisma/client';
import { UsersService } from './usuarios.service';
import { UsersRepository } from './usuarios.repository';

describe('UsersService', () => {
  let service: UsersService;
  let repository: any;

  const usuarioAdmin = { id: 1, perfil: PerfilUsuario.ADMIN_DTEC };
  const usuarioDiretoria = { id: 2, perfil: PerfilUsuario.DIRETORIA };
  const usuarioComandante = { id: 3, perfil: PerfilUsuario.COMANDANTE };
  const usuarioBatalhao = { id: 4, perfil: PerfilUsuario.USUARIO_BATALHAO };

  const userFullAdmin = {
    id: 1,
    perfil: PerfilUsuario.ADMIN_DTEC,
    login: 'admin',
    secao: null,
    batalhao: null,
    secaoId: null,
    batalhaoId: null,
    secoesPermitidas: [],
  };
  const userFullDiretoria = {
    id: 2,
    perfil: PerfilUsuario.DIRETORIA,
    login: 'diretor',
    secao: { id: 10, diretoriaId: 1, batalhaoId: null },
    batalhao: null,
    secaoId: 10,
    batalhaoId: null,
    secoesPermitidas: [{ secaoId: 11 }],
  };
  const userFullComandante = {
    id: 3,
    perfil: PerfilUsuario.COMANDANTE,
    login: 'comandante',
    secao: { id: 20, batalhaoId: 5, diretoriaId: 1 },
    batalhao: null,
    secaoId: 20,
    batalhaoId: 5,
    secoesPermitidas: [],
  };
  const userFullBatalhao = {
    id: 4,
    perfil: PerfilUsuario.USUARIO_BATALHAO,
    login: 'usuario',
    secao: { id: 30, batalhaoId: 5, diretoriaId: 1 },
    batalhao: null,
    secaoId: 30,
    batalhaoId: 5,
    secoesPermitidas: [],
  };

  beforeEach(async () => {
    repository = {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteCascade: jest.fn(),
      findDiretoriaFirst: jest.fn(),
      createDiretoria: jest.fn(),
      findBatalhaoFirst: jest.fn(),
      createBatalhao: jest.fn(),
      findSecaoFirst: jest.fn(),
      createSecao: jest.fn(),
      upsert: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: repository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('listarTodos', () => {
    it('deve listar todos os usuarios quando ADMIN_DTEC', async () => {
      repository.findUnique.mockResolvedValue(userFullAdmin);
      repository.findMany.mockResolvedValue([{ id: 1, nome: 'Admin' }]);

      const resultado = await service.listarTodos(usuarioAdmin);

      expect(resultado).toEqual([{ id: 1, nome: 'Admin' }]);
      expect(repository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { login: { not: { startsWith: 'removido_' } } },
        }),
      );
    });

    it('deve filtrar usuarios por diretoria quando DIRETORIA', async () => {
      repository.findUnique.mockResolvedValue(userFullDiretoria);
      repository.findMany.mockResolvedValue([{ id: 5, nome: 'Subordinado' }]);

      const resultado = await service.listarTodos(usuarioDiretoria);

      expect(resultado).toEqual([{ id: 5, nome: 'Subordinado' }]);
      expect(repository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ secao: { diretoriaId: 1 } }),
            ]),
          }),
        }),
      );
    });

    it('deve filtrar usuarios por batalhao quando COMANDANTE', async () => {
      repository.findUnique.mockResolvedValue(userFullComandante);
      repository.findMany.mockResolvedValue([{ id: 6, nome: 'Comandado' }]);

      const resultado = await service.listarTodos(usuarioComandante);

      expect(resultado).toEqual([{ id: 6, nome: 'Comandado' }]);
      expect(repository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ batalhaoId: 5 }),
            ]),
          }),
        }),
      );
    });

    it('deve filtrar usuarios por batalhao quando USUARIO_BATALHAO', async () => {
      repository.findUnique.mockResolvedValue(userFullBatalhao);
      repository.findMany.mockResolvedValue([{ id: 7, nome: 'Colega' }]);

      const resultado = await service.listarTodos(usuarioBatalhao);

      expect(resultado).toEqual([{ id: 7, nome: 'Colega' }]);
      expect(repository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ secaoId: { in: [30] } }),
              expect.objectContaining({ batalhaoId: 5 }),
            ]),
          }),
        }),
      );
    });

    it('deve lancar NotFoundException quando usuario autenticado nao for encontrado', async () => {
      repository.findUnique.mockResolvedValue(null);

      await expect(service.listarTodos(usuarioAdmin)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve retornar lista vazia quando nao houver usuarios visiveis', async () => {
      repository.findUnique.mockResolvedValue(userFullAdmin);
      repository.findMany.mockResolvedValue([]);

      const resultado = await service.listarTodos(usuarioAdmin);

      expect(resultado).toEqual([]);
    });

    it('deve ordenar usuarios por nome ascendente', async () => {
      repository.findUnique.mockResolvedValue(userFullAdmin);
      repository.findMany.mockResolvedValue([]);

      await service.listarTodos(usuarioAdmin);

      expect(repository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { nome: 'asc' },
        }),
      );
    });
  });

  describe('buscarPorId', () => {
    it('deve retornar usuario por id com includes completos', async () => {
      const usuario = {
        id: 1,
        nome: 'Teste',
        secao: { batalhao: true, diretoria: true },
        batalhao: { diretoria: true },
        equipamentosResponsaveis: [],
      };
      repository.findUnique.mockResolvedValue(usuario);

      const resultado = await service.buscarPorId(1);

      expect(resultado).toEqual(usuario);
      expect(repository.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          include: expect.objectContaining({
            secao: { include: { batalhao: true, diretoria: true } },
          }),
        }),
      );
    });

    it('deve lancar NotFoundException quando id nao existir', async () => {
      repository.findUnique.mockResolvedValue(null);

      await expect(service.buscarPorId(999)).rejects.toThrow(NotFoundException);
    });

    it('deve incluir equipamentosResponsaveis limitado a 10', async () => {
      const usuario = {
        id: 2,
        nome: 'Resp',
        equipamentosResponsaveis: [
          { id: 1, patrimonio: 'EQP', tipoEquipamento: {}, status: {} },
        ],
      };
      repository.findUnique.mockResolvedValue(usuario as any);

      const resultado = await service.buscarPorId(2);

      expect((resultado as any).equipamentosResponsaveis).toHaveLength(1);
      expect(repository.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            equipamentosResponsaveis: {
              select: {
                id: true,
                patrimonio: true,
                tipoEquipamento: true,
                status: true,
              },
              take: 10,
            },
          }),
        }),
      );
    });
  });

  describe('buscarPorIdAutorizado', () => {
    it('deve permitir ADMIN_DTEC ver qualquer usuario', async () => {
      const userFull = { ...userFullAdmin };
      const usuarioAlvo = {
        id: 10,
        nome: 'Alvo',
        secao: { batalhaoId: 99, diretoriaId: 99 },
        batalhao: null,
      };
      repository.findUnique.mockResolvedValueOnce(userFull);
      repository.findUnique.mockResolvedValueOnce(usuarioAlvo);

      const resultado = await service.buscarPorIdAutorizado(10, usuarioAdmin);

      expect(resultado).toEqual(usuarioAlvo);
    });

    it('deve permitir usuario mesmo batalhao ver outro', async () => {
      const userFull = { ...userFullBatalhao };
      const usuarioAlvo = {
        id: 11,
        nome: 'Colega',
        secao: { batalhaoId: 5 },
        batalhao: null,
        secaoId: 30,
      };
      repository.findUnique.mockResolvedValueOnce(userFull);
      repository.findUnique.mockResolvedValueOnce(usuarioAlvo);

      const resultado = await service.buscarPorIdAutorizado(
        11,
        usuarioBatalhao,
      );

      expect(resultado).toEqual(usuarioAlvo);
    });

    it('deve negar acesso de batalhao diferente', async () => {
      const userFull = { ...userFullBatalhao };
      const usuarioAlvo = {
        id: 12,
        nome: 'OutraUnidade',
        secao: { batalhaoId: 99 },
        batalhao: null,
        secaoId: 99,
      };
      repository.findUnique.mockResolvedValueOnce(userFull);
      repository.findUnique.mockResolvedValueOnce(usuarioAlvo);

      await expect(
        service.buscarPorIdAutorizado(12, usuarioBatalhao),
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve lancar NotFoundException quando usuario autenticado nao for encontrado', async () => {
      repository.findUnique.mockResolvedValue(null);

      await expect(
        service.buscarPorIdAutorizado(1, usuarioAdmin),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lancar NotFoundException quando usuario alvo nao for encontrado', async () => {
      repository.findUnique.mockResolvedValueOnce(userFullAdmin);
      repository.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.buscarPorIdAutorizado(999, usuarioAdmin),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('buscarPorLogin', () => {
    it('deve retornar usuario por login', async () => {
      const usuario = { id: 1, login: 'joao', secao: true, batalhao: true };
      repository.findUnique.mockResolvedValue(usuario);

      const resultado = await service.buscarPorLogin('joao');

      expect(resultado).toEqual(usuario);
      expect(repository.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { login: 'joao' },
        }),
      );
    });

    it('deve retornar null quando login nao existir', async () => {
      repository.findUnique.mockResolvedValue(null);

      const resultado = await service.buscarPorLogin('inexistente');

      expect(resultado).toBeNull();
    });
  });

  describe('buscarPorLoginAutorizado', () => {
    it('deve permitir ADMIN_DTEC buscar qualquer login', async () => {
      repository.findUnique.mockResolvedValueOnce(userFullAdmin);
      repository.findUnique.mockResolvedValueOnce({
        id: 20,
        login: 'alvo',
        secao: true,
        batalhao: true,
      });

      const resultado = await service.buscarPorLoginAutorizado(
        'alvo',
        usuarioAdmin,
      );

      expect(resultado).toEqual({
        id: 20,
        login: 'alvo',
        secao: true,
        batalhao: true,
      });
    });

    it('deve lancar ForbiddenException quando sem permissao', async () => {
      const userFull = { ...userFullBatalhao };
      const usuarioAlvo = {
        id: 21,
        login: 'outro',
        secao: { batalhaoId: 99 },
        batalhao: null,
      };
      repository.findUnique.mockResolvedValueOnce(userFull);
      repository.findUnique.mockResolvedValueOnce(usuarioAlvo);

      await expect(
        service.buscarPorLoginAutorizado('outro', usuarioBatalhao),
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve lancar NotFoundException quando login alvo nao existir', async () => {
      repository.findUnique.mockResolvedValueOnce(userFullAdmin);
      repository.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.buscarPorLoginAutorizado('inexistente', usuarioAdmin),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lancar NotFoundException quando usuario autenticado nao for encontrado', async () => {
      repository.findUnique.mockResolvedValue(null);

      await expect(
        service.buscarPorLoginAutorizado('alvo', usuarioAdmin),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('criar', () => {
    const dadosCriacao = {
      login: 'novo.usuario',
      matricula: '12345',
      nome: 'Novo Usuario',
      email: 'novo@email.com',
      postoGraduacao: 'Soldado',
      perfil: PerfilUsuario.USUARIO_BATALHAO,
      secaoId: 1,
      batalhaoId: 2,
    };

    it('deve criar usuario com dados validos', async () => {
      repository.findUnique.mockResolvedValue(null);
      repository.create.mockResolvedValue({ id: 50, ...dadosCriacao });

      const resultado = await service.criar(dadosCriacao);

      expect(resultado).toEqual({ id: 50, ...dadosCriacao });
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            login: 'novo.usuario',
            matricula: '12345',
            nome: 'Novo Usuario',
          }),
        }),
      );
    });

    it('deve lancar ConflictException quando login ja existir', async () => {
      repository.findUnique.mockResolvedValue({ id: 1, login: 'novo.usuario' });

      await expect(service.criar(dadosCriacao)).rejects.toThrow(
        ConflictException,
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('deve criar usuario sem campos opcionais', async () => {
      const dadosMinimos = {
        login: 'minimo',
        matricula: '00000',
        nome: 'Minimo',
        perfil: PerfilUsuario.USUARIO_BATALHAO,
      };
      repository.findUnique.mockResolvedValue(null);
      repository.create.mockResolvedValue({ id: 51, ...dadosMinimos });

      const resultado = await service.criar(dadosMinimos);

      expect(resultado.id).toBe(51);
    });
  });

  describe('atualizar', () => {
    it('deve atualizar e retornar usuario', async () => {
      const usuarioExistente = {
        id: 1,
        nome: 'Antigo',
        secao: { batalhao: true, diretoria: true },
        batalhao: { diretoria: true },
        equipamentosResponsaveis: [],
      };
      const dadosAtualizacao = { nome: 'Novo Nome' };
      repository.findUnique.mockResolvedValueOnce(usuarioExistente);
      repository.update.mockResolvedValue({ id: 1, nome: 'Novo Nome' });

      const resultado = await service.atualizar(1, dadosAtualizacao);

      expect(resultado.nome).toBe('Novo Nome');
      expect(repository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: dadosAtualizacao,
        }),
      );
    });

    it('deve lancar NotFoundException quando id nao existir', async () => {
      repository.findUnique.mockResolvedValue(null);

      await expect(service.atualizar(999, { nome: 'Teste' })).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('deve atualizar parcialmente apenas campos fornecidos', async () => {
      const usuarioExistente = {
        id: 2,
        nome: 'Original',
        email: 'ori@email.com',
        secao: { batalhao: true, diretoria: true },
        batalhao: { diretoria: true },
        equipamentosResponsaveis: [],
      };
      repository.findUnique.mockResolvedValueOnce(usuarioExistente);
      repository.update.mockResolvedValue({ id: 2, email: 'novo@email.com' });

      await service.atualizar(2, { email: 'novo@email.com' });

      expect(repository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { email: 'novo@email.com' },
        }),
      );
    });
  });

  describe('remover', () => {
    it('deve remover usuario com cascade', async () => {
      const usuarioExistente = {
        id: 1,
        nome: 'Remover',
        secao: { batalhao: true, diretoria: true },
        batalhao: { diretoria: true },
        equipamentosResponsaveis: [],
      };
      repository.findUnique.mockResolvedValueOnce(usuarioExistente);
      repository.deleteCascade.mockResolvedValue({
        id: 1,
        login: 'removido_1_antigo',
      });

      const resultado = await service.remover(1);

      expect(resultado.login).toContain('removido_');
      expect(repository.deleteCascade).toHaveBeenCalledWith(1);
    });

    it('deve lancar NotFoundException quando id nao existir', async () => {
      repository.findUnique.mockResolvedValue(null);

      await expect(service.remover(999)).rejects.toThrow(NotFoundException);
      expect(repository.deleteCascade).not.toHaveBeenCalled();
    });
  });

  describe('upsertUsuarioCorporativo', () => {
    const dadosBasicos = {
      login: 'corporativo',
      matricula: '99999',
      nome: 'Usuario Corporativo',
      email: 'corp@email.com',
      postoGraduacao: 'Tenente',
    };

    it('deve criar novo usuario corporativo', async () => {
      repository.findDiretoriaFirst.mockResolvedValue(null);
      repository.findSecaoFirst.mockResolvedValue(null);
      repository.upsert.mockResolvedValue({ id: 100, login: 'corporativo' });

      const resultado = await service.upsertUsuarioCorporativo(dadosBasicos);

      expect(resultado.id).toBe(100);
      expect(repository.upsert).toHaveBeenCalled();
    });

    it('deve atualizar usuario corporativo existente', async () => {
      repository.upsert.mockResolvedValue({
        id: 100,
        login: 'corporativo',
        nome: 'Atualizado',
      });

      const resultado = await service.upsertUsuarioCorporativo({
        ...dadosBasicos,
        nome: 'Atualizado',
      });

      expect(resultado.nome).toBe('Atualizado');
      expect(repository.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { login: 'corporativo' },
          update: expect.objectContaining({ nome: 'Atualizado' }),
        }),
      );
    });

    it('deve criar diretoria quando perfil DIRETORIA e diretoria nao existir', async () => {
      repository.findDiretoriaFirst.mockResolvedValue(null);
      repository.createDiretoria.mockResolvedValue({
        id: 50,
        sigla: 'EXERCITO',
      });
      repository.findSecaoFirst.mockResolvedValue(null);
      repository.upsert.mockResolvedValue({ id: 101 });

      await service.upsertUsuarioCorporativo({
        ...dadosBasicos,
        perfil: PerfilUsuario.DIRETORIA,
        organizacaoDisp: 'EXERCITO',
      });

      expect(repository.createDiretoria).toHaveBeenCalledWith({
        data: { sigla: 'EXERCITO', nome: 'EXERCITO' },
      });
    });

    it('deve reutilizar diretoria existente', async () => {
      repository.findDiretoriaFirst.mockResolvedValue({
        id: 50,
        sigla: 'EXERCITO',
      });
      repository.findSecaoFirst.mockResolvedValue(null);
      repository.upsert.mockResolvedValue({ id: 102 });

      await service.upsertUsuarioCorporativo({
        ...dadosBasicos,
        perfil: PerfilUsuario.DIRETORIA,
        organizacaoDisp: 'EXERCITO',
      });

      expect(repository.createDiretoria).not.toHaveBeenCalled();
    });

    it('deve criar batalhao quando nao existir para COMANDANTE', async () => {
      repository.findBatalhaoFirst.mockResolvedValue(null);
      repository.createBatalhao.mockResolvedValue({ id: 60, sigla: 'BTL-1' });
      repository.findSecaoFirst.mockResolvedValue(null);
      repository.upsert.mockResolvedValue({ id: 103 });

      await service.upsertUsuarioCorporativo({
        ...dadosBasicos,
        perfil: PerfilUsuario.COMANDANTE,
        organizacaoDisp: 'BTL-1',
      });

      expect(repository.createBatalhao).toHaveBeenCalled();
    });

    it('deve criar batalhao para USUARIO_BATALHAO', async () => {
      repository.findBatalhaoFirst.mockResolvedValue(null);
      repository.createBatalhao.mockResolvedValue({ id: 61, sigla: 'BTL-2' });
      repository.findSecaoFirst.mockResolvedValue(null);
      repository.upsert.mockResolvedValue({ id: 104 });

      await service.upsertUsuarioCorporativo({
        ...dadosBasicos,
        perfil: PerfilUsuario.USUARIO_BATALHAO,
        organizacaoDisp: 'BTL-2',
      });

      expect(repository.createBatalhao).toHaveBeenCalled();
    });

    it('deve criar secao quando nao existir', async () => {
      repository.findSecaoFirst.mockResolvedValue(null);
      repository.createSecao.mockResolvedValue({ id: 70, sigla: 'SEC-1' });
      repository.upsert.mockResolvedValue({ id: 105 });

      await service.upsertUsuarioCorporativo({
        ...dadosBasicos,
        secaoSigla: 'SEC-1',
      });

      expect(repository.createSecao).toHaveBeenCalled();
    });

    it('deve reutilizar secao existente', async () => {
      repository.findSecaoFirst.mockResolvedValue({
        id: 70,
        sigla: 'SEC-1',
        batalhaoId: null,
        diretoriaId: null,
      });
      repository.upsert.mockResolvedValue({ id: 106 });

      await service.upsertUsuarioCorporativo({
        ...dadosBasicos,
        secaoSigla: 'SEC-1',
      });

      expect(repository.createSecao).not.toHaveBeenCalled();
    });

    it('deve usar matricula como login quando login nao for fornecido', async () => {
      repository.findDiretoriaFirst.mockResolvedValue(null);
      repository.findSecaoFirst.mockResolvedValue(null);
      repository.upsert.mockResolvedValue({ id: 107 });

      const { login: _login, ...dados } = dadosBasicos;

      await service.upsertUsuarioCorporativo(dados);

      expect(repository.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { login: '99999' },
        }),
      );
    });

    it('deve criar usuario com autorizado true por padrao', async () => {
      repository.findDiretoriaFirst.mockResolvedValue(null);
      repository.findSecaoFirst.mockResolvedValue(null);
      repository.upsert.mockResolvedValue({ id: 108 });

      await service.upsertUsuarioCorporativo(dadosBasicos);

      const upsertCall = repository.upsert.mock.calls[0][0];
      expect(upsertCall.create.autorizado).toBe(true);
    });

    it('deve respeitar autorizado false quando fornecido', async () => {
      repository.findDiretoriaFirst.mockResolvedValue(null);
      repository.findSecaoFirst.mockResolvedValue(null);
      repository.upsert.mockResolvedValue({ id: 109 });

      await service.upsertUsuarioCorporativo({
        ...dadosBasicos,
        autorizado: false,
      });

      const upsertCall = repository.upsert.mock.calls[0][0];
      expect(upsertCall.create.autorizado).toBe(false);
    });
  });

  describe('canSeeUsuario (testes de permissao)', () => {
    it('deve permitir DIRETORIA ver usuarios da mesma diretoria', async () => {
      const userFull = { ...userFullDiretoria };
      const usuarioAlvo = {
        id: 8,
        secao: { diretoriaId: 1 },
        batalhao: null,
        secaoId: 8,
      };
      repository.findUnique.mockResolvedValueOnce(userFull);
      repository.findUnique.mockResolvedValueOnce(usuarioAlvo);

      const resultado = await service.buscarPorIdAutorizado(
        8,
        usuarioDiretoria,
      );

      expect(resultado).toEqual(usuarioAlvo);
    });

    it('deve negar DIRETORIA ver usuarios de outra diretoria', async () => {
      const userFull = {
        ...userFullDiretoria,
        secao: { id: 10, diretoriaId: 1, batalhaoId: null },
        secoesPermitidas: [],
      };
      const usuarioAlvo = {
        id: 9,
        secao: { diretoriaId: 2 },
        batalhao: null,
        secaoId: 9,
      };
      repository.findUnique.mockResolvedValueOnce(userFull);
      repository.findUnique.mockResolvedValueOnce(usuarioAlvo);

      await expect(
        service.buscarPorIdAutorizado(9, { ...usuarioDiretoria }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve permitir COMANDANTE ver usuarios do mesmo batalhao', async () => {
      repository.findUnique.mockResolvedValueOnce(userFullComandante);
      repository.findUnique.mockResolvedValueOnce({
        id: 10,
        secao: { batalhaoId: 5 },
        batalhao: null,
        secaoId: 10,
      });

      const resultado = await service.buscarPorIdAutorizado(
        10,
        usuarioComandante,
      );

      expect(resultado).toBeDefined();
    });

    it('deve negar COMANDANTE ver usuarios de outro batalhao', async () => {
      repository.findUnique.mockResolvedValueOnce(userFullComandante);
      repository.findUnique.mockResolvedValueOnce({
        id: 11,
        secao: { batalhaoId: 99 },
        batalhao: null,
        secaoId: 11,
      });

      await expect(
        service.buscarPorIdAutorizado(11, usuarioComandante),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});

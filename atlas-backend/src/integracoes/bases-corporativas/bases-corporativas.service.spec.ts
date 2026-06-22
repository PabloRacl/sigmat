import { Test, TestingModule } from '@nestjs/testing';
import { BasesCorporativasService } from './bases-corporativas.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { PerfilUsuario } from '@prisma/client';
import { PrismaService } from '../../banco-dados/prisma.service';

jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
    end: jest.fn(),
  };
  return {
    Pool: jest.fn(() => mPool),
    types: {
      builtins: {
        INT8: 20,
        TIMESTAMP: 1114,
        TIMESTAMPTZ: 1184,
      },
      setTypeParser: jest.fn(),
      getTypeParser: jest.fn(() => (val: any) => val),
    },
  };
});

describe('BasesCorporativasService', () => {
  let service: BasesCorporativasService;
  let configService: any;
  let prismaService: any;
  let poolMock: any;
  let poolSgpmMock: any;

  beforeEach(async () => {
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'USE_MOCK_AUTH') return 'false';
        if (key === 'SGA_SYSTEM_ID') return 19;
        return null;
      }),
    };

    prismaService = {
      diretoria: { findMany: jest.fn().mockResolvedValue([]) },
      batalhao: { findMany: jest.fn().mockResolvedValue([]) },
      secao: { findMany: jest.fn().mockResolvedValue([]) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BasesCorporativasService,
        { provide: ConfigService, useValue: configService },
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<BasesCorporativasService>(BasesCorporativasService);
    service.onModuleInit();
    // Obtemos a referência do mock criado pela classe
    poolMock = (service as any).poolSga; 
    poolSgpmMock = (service as any).poolSgpm;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('obterPermissao', () => {
    it('deve retornar perfil mapeado e ativo se consulta do SGA retornar sucesso e ativo', async () => {
      const mockResult = {
        rows: [
          {
            nome: 'Test',
            cpf: '123456',
            ativo: true,
            perfil: 'ADMIN_DTEC',
            id_perfil: 1,
            id_sistema: 19,
            sistema: 'Atlas',
          },
        ],
      };

      poolMock.query.mockResolvedValueOnce(mockResult);

      const result = await service.consultarPerfisAcesso('123456');

      expect(poolMock.query).toHaveBeenCalled();
      expect(result.perfil).toBe(PerfilUsuario.ADMIN_DTEC);
      expect(result.ativo).toBe(true);
    });

    it('deve lançar UnauthorizedException se o usuário não for encontrado', async () => {
      poolMock.query.mockResolvedValueOnce({ rows: [] });

      await expect(service.consultarPerfisAcesso('000000')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('deve lançar UnauthorizedException se a consulta no banco falhar', async () => {
      poolMock.query.mockRejectedValueOnce(new Error('DB Connection Failed'));

      await expect(service.consultarPerfisAcesso('123456')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('listarUnidades', () => {
    it('deve retornar unidades do SGPM e salvar no cache se a consulta for bem-sucedida', async () => {
      const mockRows = {
        rows: [{ ome: 'DTEC' }, { ome: '1BPM' }],
      };
      poolSgpmMock.query.mockResolvedValueOnce(mockRows);

      const result = await service.listarUnidades();
      expect(result).toEqual(['DTEC', '1BPM']);
      expect((service as any).cachedUnidades).toEqual(['DTEC', '1BPM']);
    });

    it('deve retornar do cache em memória se a consulta do SGPM falhar e houver cache', async () => {
      (service as any).cachedUnidades = ['CACHED_OME'];
      poolSgpmMock.query.mockRejectedValueOnce(new Error('SGPM connection timeout'));

      const result = await service.listarUnidades();
      expect(result).toEqual(['CACHED_OME']);
    });

    it('deve buscar e retornar do banco local se SGPM falhar e cache estiver vazio', async () => {
      (service as any).cachedUnidades = [];
      poolSgpmMock.query.mockRejectedValueOnce(new Error('SGPM connection timeout'));

      prismaService.diretoria.findMany.mockResolvedValueOnce([{ sigla: 'DIR_A' }]);
      prismaService.batalhao.findMany.mockResolvedValueOnce([{ sigla: 'BAT_B' }]);
      prismaService.secao.findMany.mockResolvedValueOnce([{ sigla: 'SEC_C' }]);

      const result = await service.listarUnidades();
      expect(result).toEqual(['BAT_B', 'DIR_A', 'SEC_C']);
    });

    it('deve retornar fallback estático se SGPM, cache e banco local falharem/estiverem vazios', async () => {
      (service as any).cachedUnidades = [];
      poolSgpmMock.query.mockRejectedValueOnce(new Error('SGPM connection timeout'));

      prismaService.diretoria.findMany.mockRejectedValueOnce(new Error('Local DB Error'));

      const result = await service.listarUnidades();
      expect(result).toEqual(['DTEC', 'DIM', 'BPCHOQUE', 'BPTUR', 'BPGD', 'BOPE', 'CPM', 'EMG']);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { PermissoesService } from './permissoes.service';
import { PrismaService } from '../../banco-dados/prisma.service';
import { PerfilUsuario } from '@prisma/client';

type UsuarioFake = {
  id: number;
  perfil: string;
  secaoId?: number;
  batalhaoId?: number;
  secoesPermitidas?: { secaoId: number }[];
  secao?: { diretoriaId?: number; batalhaoId?: number };
  batalhao?: { diretoriaId?: number };
};

const mockFindUnique = jest.fn();

const mockPrisma = {
  usuario: {
    findUnique: mockFindUnique,
  },
} as unknown as PrismaService;

describe('PermissoesService', () => {
  let service: PermissoesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissoesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PermissoesService>(PermissoesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('ADMIN_DTEC deve retornar filtro vazio', async () => {
    const fake: UsuarioFake = { id: 1, perfil: 'ADMIN_DTEC' };
    mockFindUnique.mockResolvedValueOnce(fake);
    const cond = await service.construirCondicoesVisibilidadeEquipamento(fake);
    expect(cond).toEqual([]);
  });

  it('DIRETORIA deve incluir seções permitidas, diretoria e batalhões da diretoria', async () => {
    const fake: UsuarioFake = {
      id: 2,
      perfil: PerfilUsuario.DIRETORIA,
      secaoId: 10,
      secoesPermitidas: [{ secaoId: 11 }],
      secao: { diretoriaId: 5 },
    };
    mockFindUnique.mockResolvedValueOnce(fake);
    const cond = await service.construirCondicoesVisibilidadeEquipamento(fake);
    expect(cond).toEqual([
      {
        OR: [
          { secaoId: { in: [10, 11] } },
          { secao: { diretoriaId: 5 } },
          { secao: { batalhao: { diretoriaId: 5 } } },
        ],
      },
    ]);
  });

  it('COMANDANTE deve retornar seções permitidas e seu batalhão', async () => {
    const fake: UsuarioFake = {
      id: 3,
      perfil: 'COMANDANTE',
      secaoId: 12,
      secoesPermitidas: [{ secaoId: 13 }],
      secao: { batalhaoId: 4 },
    };
    mockFindUnique.mockResolvedValueOnce(fake);
    const cond = await service.construirCondicoesVisibilidadeEquipamento(fake);
    expect(cond).toEqual([
      {
        OR: [{ secao: { batalhaoId: 4 } }, { secaoId: { in: [12, 13] } }],
      },
    ]);
  });

  it('USUARIO_BATALHAO deve retornar seu batalhão e seções permitidas', async () => {
    const fake: UsuarioFake = {
      id: 4,
      perfil: PerfilUsuario.USUARIO_BATALHAO,
      secaoId: 14,
      secoesPermitidas: [{ secaoId: 15 }],
      secao: { batalhaoId: 6 },
    };
    mockFindUnique.mockResolvedValueOnce(fake);
    const cond = await service.construirCondicoesVisibilidadeEquipamento(fake);
    expect(cond).toEqual([
      {
        OR: [{ secao: { batalhaoId: 6 } }, { secaoId: { in: [14, 15] } }],
      },
    ]);
  });
});

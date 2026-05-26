import { Test, TestingModule } from '@nestjs/testing';
import { SgaService } from './sga.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { UnauthorizedException } from '@nestjs/common';
import { PerfilUsuario } from '@prisma/client';

describe('SgaService', () => {
  let service: SgaService;
  let httpService: any;
  let configService: any;

  beforeEach(async () => {
    httpService = {
      get: jest.fn(),
    };
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'SGA_API_URL') return 'https://sga.sistemas.pm.pe.gov.br/api';
        if (key === 'SGA_SYSTEM_TOKEN') return 'token-teste';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SgaService,
        { provide: HttpService, useValue: httpService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<SgaService>(SgaService);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('obterPermissao', () => {
    it('deve retornar perfil mapeado e ativo se consulta do SGA retornar sucesso e ativo', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production'; // Força chamada real

      const mockResponse = {
        status: 200,
        data: {
          situacao: 'Ativo',
          perfil: 'ADMIN_DTEC',
        },
      };

      httpService.get.mockReturnValue(of(mockResponse));

      const result = await service.obterPermissao('123456');

      expect(httpService.get).toHaveBeenCalled();
      expect(result.perfil).toBe(PerfilUsuario.ADMIN_DTEC);
      expect(result.ativo).toBe(true);

      process.env.NODE_ENV = originalEnv;
    });

    it('deve lançar UnauthorizedException se o usuário estiver inativo no SGA', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const mockResponse = {
        status: 200,
        data: {
          situacao: 'Inativo',
          perfil: 'USUARIO_BATALHAO',
        },
      };

      httpService.get.mockReturnValue(of(mockResponse));

      await expect(service.obterPermissao('123456')).rejects.toThrow(
        UnauthorizedException
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('deve lançar UnauthorizedException se a chamada HTTP do SGA falhar', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const mockError = {
        response: {
          data: {
            message: 'Erro interno no SGA',
          },
        },
      };

      httpService.get.mockReturnValue(throwError(() => mockError));

      await expect(service.obterPermissao('123456')).rejects.toThrow(
        UnauthorizedException
      );

      process.env.NODE_ENV = originalEnv;
    });
  });
});

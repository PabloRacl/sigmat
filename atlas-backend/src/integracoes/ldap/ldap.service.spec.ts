import { Test, TestingModule } from '@nestjs/testing';
import { LdapService } from './ldap.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { UnauthorizedException } from '@nestjs/common';

describe('LdapService', () => {
  let service: LdapService;
  let httpService: any;
  let configService: any;

  beforeEach(async () => {
    httpService = {
      post: jest.fn(),
    };
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'API_LDAP') return 'https://ldap.api.pm.pe.gov.br/api/';
        if (key === 'LDAP_AUTH_ENDPOINT') return 'auth';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LdapService,
        { provide: HttpService, useValue: httpService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<LdapService>(LdapService);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('autenticar', () => {
    it('deve retornar dados do mock em modo de desenvolvimento se usuario de teste', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const result = await service.autenticar(
        'pablo.ricardo',
        'qualquer_senha',
      );

      expect(result.login).toBe('pablo.ricardo');
      expect(result.nome).toBe('Pablo Ricardo');

      process.env.NODE_ENV = originalEnv;
    });

    it('deve autenticar com sucesso via chamada HTTP', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production'; // Força chamada real

      const mockResponse = {
        status: 200,
        data: {
          login: '123456',
          matricula: '123456',
          nome: 'Policial de Teste',
          email: 'teste@pm.pe.gov.br',
          postoGraduacao: 'Cabo',
        },
      };

      httpService.post.mockReturnValue(of(mockResponse));

      const result = await service.autenticar('123456', 'senha_correta');

      expect(httpService.post).toHaveBeenCalled();
      expect(result.nome).toBe('Policial de Teste');
      expect(result.postoGraduacao).toBe('Cabo');

      process.env.NODE_ENV = originalEnv;
    });

    it('deve lançar UnauthorizedException se a chamada HTTP falhar', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const mockError = {
        response: {
          data: {
            message: 'Senha incorreta',
          },
        },
      };

      httpService.post.mockReturnValue(throwError(() => mockError));

      await expect(
        service.autenticar('123456', 'senha_errada'),
      ).rejects.toThrow(UnauthorizedException);

      process.env.NODE_ENV = originalEnv;
    });
  });
});

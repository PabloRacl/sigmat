import { Test, TestingModule } from '@nestjs/testing';
import { ValidacaoLdapService } from './validacao-ldap.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ValidacaoLdapService', () => {
  let service: ValidacaoLdapService;
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    configService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidacaoLdapService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<ValidacaoLdapService>(ValidacaoLdapService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('autenticar', () => {
    it('deve retornar dados do mock em modo de desenvolvimento se usuario de teste', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'USE_MOCK_AUTH') return 'true';
        return null;
      });

      const result = await service.validarNoLdap('pablo.ricardo', '123');
      expect(result).toHaveProperty('login', 'pablo.ricardo');
      expect(result).toHaveProperty('sistema', 'ATLAS');
    });

    it('deve autenticar com sucesso via chamada HTTP do axios', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'USE_MOCK_AUTH') return 'false';
        if (key === 'API_LDAP') return 'https://validacao-ldap.api.pm.pe.gov.br/api/';
        return null;
      });

      const mockResponse = {
        data: {
          status: 'success',
          data: [
            [
              'Login: 123456',
              'Perfil: ADMINISTRADOR',
              'Sistema: ATLAS',
              'Status: ATIVO',
              'Cargo: SD',
              'Matricula: 123456',
              'Nome de Guerra: TESTE',
              'Ome Disposição: DTEC',
              'Secao: DTEC',
            ],
          ],
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await service.validarNoLdap('123456', 'senha_correta');
      expect(result).toHaveProperty('login', '123456');
      expect(result).toHaveProperty('sistema', 'ATLAS');
      expect(result).toHaveProperty('nomeGuerra', 'TESTE');
      expect(mockedAxios.post).toHaveBeenCalled();
    });

    it('deve lançar UnauthorizedException se a chamada HTTP falhar', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'USE_MOCK_AUTH') return 'false';
        if (key === 'API_LDAP') return 'https://validacao-ldap.api.pm.pe.gov.br/api/';
        return null;
      });

      const mockError = {
        response: {
          data: {
            message: 'Senha incorreta',
          },
        },
      };

      mockedAxios.post.mockRejectedValueOnce(mockError);

      await expect(
        service.validarNoLdap('123456', 'senha_errada'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});

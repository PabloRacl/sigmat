/**
 * [Estado Atual]: Serviço de integração com a API de LDAP corporativa da PMPE.
 * [Dependências Técnicas]:
 *   - Axios (Requisições HTTP)
 *   - Https Agent (Resolução IPv4)
 *   - ConfigService (Acesso ao .env)
 * [Histórico de Modificações]:
 *   - Refatorado para o padrão corporativo com cabeçalhos x-www-form-urlencoded e raspagem de CPF no array retornado.
 * [Regras de Negócio Imutáveis]:
 *   - Autenticação e raspagem de login do array "data" recebido.
 *   - Fallback para o modo de desenvolvimento offline se a flag USE_MOCK_AUTH estiver ativada.
 */

import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';

export interface LdapUserData {
  login: string;
  perfil: string;
  sistema: string;
  status: string;
  cargo: string;
  matricula: string;
  nomeGuerra: string;
  omeDisposicao: string;
  secao: string;
}

@Injectable()
export class ValidacaoLdapService {
  private readonly logger = new Logger(ValidacaoLdapService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Valida as credenciais na API LDAP e retorna os dados corporativos já filtrados para o sistema ATLAS.
   */
  async validarNoLdap(usuario: string, senha: string): Promise<LdapUserData> {
    const useMock = this.configService.get<string>('USE_MOCK_AUTH') === 'true';
    const allowedMocks: Record<string, string> = {
      'pablo.ricardo:123': 'pablo.ricardo',
      'diretoria:123': 'diretoria',
      'comandante:123': 'comandante',
      'usuariobatalhao:123': 'usuariobatalhao',
    };

    if (useMock) {
      const key = `${usuario.trim()}:${senha}`;
      const cpfMock = allowedMocks[key];

      if (!cpfMock) {
        this.logger.warn(
          `[MOCK DEV] Login LDAP negado para combinação inválida: ${usuario}`,
        );
        throw new UnauthorizedException(
          'Usuário ou senha incorretos para modo de desenvolvimento.',
        );
      }

      this.logger.log(
        `[MOCK DEV] Login LDAP aceito para modo de desenvolvimento: ${usuario}`,
      );
      
      const perfisMock: Record<string, string> = {
        'pablo.ricardo': 'ADMINISTRADOR',
        'diretoria': 'DIRETORIA',
        'comandante': 'COMANDANTE',
        'usuariobatalhao': 'USUARIO_BATALHAO',
      };
      
      return {
        login: cpfMock,
        perfil: perfisMock[cpfMock] || 'USUARIO_BATALHAO',
        sistema: 'ATLAS',
        status: 'ATIVO',
        cargo: 'SD',
        matricula: '123456',
        nomeGuerra: cpfMock.toUpperCase(),
        omeDisposicao: 'DTEC',
        secao: 'SEC-DTEC',
      };
    }

    // Build full LDAP endpoint URL using base and endpoint variables
    const apiBase = this.configService.get<string>('API_LDAP');
    if (!apiBase) {
      this.logger.error('A variável API_LDAP não está definida no .env');
      throw new Error('Configuração de autenticação LDAP ausente.');
    }
    // LDAP_AUTH_ENDPOINT não deve ser concatenado, pois a API raiz já é o endpoint de auth
    const apiUrl = apiBase;

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    const payload = new URLSearchParams();
    payload.append('usuario', usuario);
    payload.append('senha', senha);

    const httpsAgent = new https.Agent({ 
      family: 4, 
      rejectUnauthorized: false 
    });

    try {
      this.logger.log(
        `Disparando requisição real para o LDAP corporativo: ${apiUrl}`,
      );
      const response = await axios.post(apiUrl, payload, {
        headers,
        httpsAgent,
      });

      if (
        !response.data ||
        response.data === 'Usuário não encontrado' ||
        response.data.status !== 'success'
      ) {
        throw new UnauthorizedException('Usuário ou senha do LDAP incorretos.');
      }

      const body = response.data;
      if (!Array.isArray(body?.data)) {
        this.logger.error('A resposta do LDAP não contém um array data. Resposta bruta: ' + JSON.stringify(body));
        throw new UnauthorizedException('Formato de resposta do LDAP inesperado.');
      }

      const sistemasAtlas = body.data.find((item: string[]) => {
        if (!Array.isArray(item)) return false;
        return item.some((str) => typeof str === 'string' && str.includes('Sistema: ATLAS'));
      });

      if (!sistemasAtlas) {
        this.logger.warn('Usuário não possui permissão para o sistema ATLAS no LDAP.');
        throw new UnauthorizedException('Usuário sem permissão de acesso ao Atlas.');
      }

      const extrairDado = (prefix: string) => {
        const found = sistemasAtlas.find((str: string) => typeof str === 'string' && str.startsWith(prefix));
        return found ? found.replace(prefix, '').trim() : '';
      };

      const ldapData: LdapUserData = {
        login: extrairDado('Login:'),
        perfil: extrairDado('Perfil:'),
        sistema: extrairDado('Sistema:'),
        status: extrairDado('Status:'),
        cargo: extrairDado('Cargo:'),
        matricula: extrairDado('Matricula:'),
        nomeGuerra: extrairDado('Nome de Guerra:'),
        omeDisposicao: extrairDado('Ome Disposição:'), // Tratando possível erro de encoding
        secao: extrairDado('Secao:'),
      };
      
      // Fallback para OME Disposição se o encoding tiver vindo errado da API da PMPE (ex: Ome Disposiǜo:)
      if (!ldapData.omeDisposicao) {
        const omeQuebrada = sistemasAtlas.find((str: string) => typeof str === 'string' && str.startsWith('Ome Disposi'));
        if (omeQuebrada) {
          ldapData.omeDisposicao = omeQuebrada.split(':')[1].trim();
        }
      }

      if (!ldapData.login || ldapData.status !== 'ATIVO') {
        throw new UnauthorizedException('Usuário inativo ou login ausente.');
      }

      fs.appendFileSync(
        path.join(process.cwd(), 'ldap-debug.log'),
        JSON.stringify({ time: new Date().toISOString(), status: 'SUCCESS_PARSED', parsedData: ldapData }, null, 2) + '\n\n'
      );
      return ldapData;
    } catch (error: unknown) {
      // DEBUG: Salvar erro completo em arquivo para análise
      const debugInfo = {
        time: new Date().toISOString(),
        url: apiUrl,
        requestBody: payload.toString(),
        errorName: (error as Error)?.name,
        errorMessage: (error as Error)?.message,
        responseStatus: (error as Record<string, any>)?.['response']?.['status'],
        responseHeaders: (error as Record<string, any>)?.['response']?.['headers'],
        responseData: (error as Record<string, any>)?.['response']?.['data'],
      };
      fs.appendFileSync(
        path.join(process.cwd(), 'ldap-debug.log'),
        JSON.stringify(debugInfo, null, 2) + '\n\n',
      );

      // Se o erro já é uma UnauthorizedException nossa, re-lança sem alterar
      const err = error as Record<string, any>;
      if (err?.['status'] === 401 && err?.['response']?.message) {
        throw error;
      }
      // Tenta extrair a mensagem de erro retornada pela API LDAP
      const apiErrorMessage =
        err?.['response']?.data?.error || err?.['response']?.data?.message;
      const message = apiErrorMessage || (error as Error)?.message || String(error);
      this.logger.error(
        `Erro na autenticação LDAP real para ${usuario}: ${message}`,
      );
      if (apiErrorMessage) {
        throw new UnauthorizedException(`LDAP: ${apiErrorMessage}`);
      }
      throw new UnauthorizedException(
        'Matrícula ou senha incorretas no LDAP corporativo.',
      );
    }
  }
}

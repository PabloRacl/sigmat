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

@Injectable()
export class LdapService {
  private readonly logger = new Logger(LdapService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Valida as credenciais (usuário e senha) na API LDAP do sistema corporativo PMPE e retorna o CPF.
   */
  async autenticar(usuario: string, senha: string): Promise<string> {
    const useMock = this.configService.get<string>('USE_MOCK_AUTH') === 'true';
    const allowedMocks: Record<string, string> = {
      'pablo.ricardo:123': 'pablo.ricardo',
      'diretoria:123': 'diretoria',
      'comandante:123': 'comandante',
      'usuariobatalhao:123': 'usuariobatalhao',
    };

    if (useMock) {
      const usuarioTrimmed = usuario.trim();
      const isAllLower = usuarioTrimmed === usuarioTrimmed.toLowerCase();
      const isAllUpper = usuarioTrimmed === usuarioTrimmed.toUpperCase();

      if (!isAllLower && !isAllUpper) {
        this.logger.warn(`[MOCK DEV] Login LDAP negado por caso misto: ${usuario}`);
        throw new UnauthorizedException('Usuário ou senha incorretos para modo de desenvolvimento.');
      }

      const normalizedUsuario = usuarioTrimmed.toLowerCase();
      const key = `${normalizedUsuario}:${senha}`;
      const cpfMock = allowedMocks[key];

      if (!cpfMock) {
        this.logger.warn(`[MOCK DEV] Login LDAP negado para combinação inválida: ${usuario}`);
        throw new UnauthorizedException('Usuário ou senha incorretos para modo de desenvolvimento.');
      }

      this.logger.log(`[MOCK DEV] Login LDAP aceito para modo de desenvolvimento: ${usuario}`);
      return cpfMock;
    }

    const apiBase = this.configService.get<string>('API_LDAP');
    if (!apiBase) {
      this.logger.error('A variável API_LDAP não está definida no arquivo .env');
      throw new Error('Configuração de autenticação LDAP ausente.');
    }

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    const data = new URLSearchParams();
    data.append('usuario', usuario);
    data.append('senha', senha);

    const httpsAgent = new https.Agent({ family: 4 });

    try {
      this.logger.log(`Disparando requisição real para o LDAP corporativo: ${apiBase}`);
      const response = await axios.post(apiBase, data, { headers, httpsAgent });

      if (!response.data || response.data === 'Usuário nao encontrado' || response.data.status !== 'success') {
        throw new UnauthorizedException('Usuário ou senha do LDAP incorretos.');
      }

      const body = response.data;
      const responseReturn: string[] = [];

      body.data.forEach((item: string[]) => {
        const loginString = item.find((str) => str.includes('Login:'));
        if (loginString) {
          const loginValue = loginString.split(':')[1].trim();
          responseReturn.push(loginValue);
        }
      });

      if (responseReturn.length === 0) {
        throw new UnauthorizedException('Formato de resposta do LDAP inválido.');
      }

      return responseReturn[0];
    } catch (error) {
      const message = (error as any)?.message || String(error);
      this.logger.error(`Erro na autenticação LDAP real para ${usuario}: ${message}`);
      throw new UnauthorizedException('Matrícula ou senha incorretas no LDAP corporativo.');
    }
  }
}

import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class LdapService {
  private readonly logger = new Logger(LdapService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Valida as credenciais (usuário e senha) na API LDAP do sistema corporativo PMPE.
   */
  async autenticar(usuario: string, senha: string): Promise<any> {
    const apiBase = this.configService.get<string>('API_LDAP');
    const endpoint = this.configService.get<string>('LDAP_AUTH_ENDPOINT') || 'auth';
    
    if (!apiBase) {
      this.logger.error('A variável API_LDAP não está definida no arquivo .env');
      throw new Error('Configuração de autenticação LDAP ausente.');
    }

    // Concatena a URL garantindo que não ocorra dupla barra
    const url = `${apiBase.replace(/\/$/, '')}/${endpoint}`;
    
    this.logger.log(`Tentando autenticar usuário ${usuario} no LDAP...`);

    // Mock de desenvolvimento para não bloquear a equipe local
    if (process.env.NODE_ENV !== 'production' && (usuario === 'testabatalhao' || usuario === 'pablo.ricardo' || senha === 'teste123' || senha === '123')) {
      this.logger.log(`[MOCK DEV] Login aceito para fins de desenvolvimento: ${usuario}`);
      return {
        login: usuario,
        matricula: usuario === 'pablo.ricardo' ? '123456' : '7654321',
        nome: usuario === 'pablo.ricardo' ? 'Pablo Ricardo' : 'Usuário Policial de Teste',
        email: `${usuario}@pm.pe.gov.br`,
        postoGraduacao: usuario === 'pablo.ricardo' ? 'Capitão' : 'Soldado',
      };
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, { usuario, senha }, {
          headers: {
            'Content-Type': 'application/json',
          }
        })
      );

      if (response.status === 200 || response.status === 201) {
        const dados = response.data;
        this.logger.log(`Usuário ${usuario} autenticado com sucesso no LDAP.`);
        return {
          login: dados.login || dados.usuario || dados.cpf || dados.matricula || usuario,
          matricula: dados.matricula || dados.cpf || usuario,
          nome: dados.nome || 'Policial Militar',
          email: dados.email || `${usuario}@pm.pe.gov.br`,
          postoGraduacao: dados.postoGraduacao || dados.posto || dados.graduacao || 'Policial',
        };
      }

      throw new UnauthorizedException('Falha na validação das credenciais LDAP.');
    } catch (error) {
      this.logger.error(`Erro na autenticação LDAP para ${usuario}: ${error?.message}`);
      
      if (error?.response) {
        this.logger.error(`Detalhes da resposta LDAP: ${JSON.stringify(error.response.data)}`);
        throw new UnauthorizedException(
          error.response.data?.message || 'Matrícula ou senha LDAP incorretas.'
        );
      }
      
      throw new UnauthorizedException('Serviço de autenticação LDAP temporariamente indisponível.');
    }
  }
}

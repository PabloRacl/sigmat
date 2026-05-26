import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PerfilUsuario } from '@prisma/client';

@Injectable()
export class SgaService {
  private readonly logger = new Logger(SgaService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Obtém as permissões do usuário cadastrado no SGA (Portal de Segurança).
   * Valida se o usuário está ativo para o sistema SIGMAT e qual seu perfil.
   */
  async obterPermissao(cpfOuMatricula: string): Promise<{ perfil: PerfilUsuario; ativo: boolean }> {
    const sgaBase = this.configService.get<string>('SGA_API_URL');
    const token = this.configService.get<string>('SGA_SYSTEM_TOKEN');
    
    if (!sgaBase) {
      this.logger.error('A variável SGA_API_URL não está definida no arquivo .env');
      throw new Error('Configuração de autorização SGA ausente.');
    }

    // Limpa a URL base e monta o endpoint
    const url = `${sgaBase.replace(/\/$/, '')}/permissoes`;
    
    this.logger.log(`Consultando permissões do usuário ${cpfOuMatricula} no SGA para o sistema SIGMAT...`);

    // Mock de desenvolvimento para fins de testes locais
    if (process.env.NODE_ENV !== 'production' && (cpfOuMatricula === 'testabatalhao' || cpfOuMatricula === 'pablo.ricardo' || cpfOuMatricula === '123456' || cpfOuMatricula === '7654321')) {
      this.logger.log(`[MOCK DEV] Retornando permissões fictícias para usuário de teste: ${cpfOuMatricula}`);
      return {
        perfil: cpfOuMatricula === 'testabatalhao' ? PerfilUsuario.USUARIO_BATALHAO : PerfilUsuario.ADMIN_DTEC,
        ativo: true
      };
    }

    try {
      const headers: any = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['x-api-key'] = token; // Aceita múltiplos padrões de autenticação de API
      }

      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: {
            cpf: cpfOuMatricula,
            sistema: 'SIGMAT'
          },
          headers
        })
      );

      if (response.status === 200 && response.data) {
        const dados = response.data;
        this.logger.log(`SGA retornou dados para ${cpfOuMatricula}: ${JSON.stringify(dados)}`);

        // Verifica a situação/status do usuário
        const situacao = dados.situacao || dados.status || dados.situation || '';
        const isAtivo = String(situacao).toUpperCase() === 'ATIVO' || dados.ativo === true || dados.active === true;

        if (!isAtivo) {
          this.logger.warn(`Usuário ${cpfOuMatricula} está inativo no SGA.`);
          throw new UnauthorizedException('Usuário inativo no Portal de Segurança (SGA).');
        }

        // Obtém o perfil retornado e mapeia para a enumeração do Prisma
        const perfilStr = dados.perfil || dados.role || dados.tipo || '';
        const perfilMapeado = this.mapearPerfilSga(perfilStr);

        return {
          perfil: perfilMapeado,
          ativo: true
        };
      }

      throw new UnauthorizedException('Perfil do usuário não encontrado no SGA para o sistema SIGMAT.');
    } catch (error) {
      this.logger.error(`Erro ao consultar permissões no SGA para ${cpfOuMatricula}: ${error?.message}`);

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      if (error?.response) {
        this.logger.error(`Detalhes da resposta SGA: ${JSON.stringify(error.response.data)}`);
        throw new UnauthorizedException(
          error.response.data?.message || 'Acesso não autorizado pelo Portal de Segurança (SGA).'
        );
      }

      // Fallback em caso de indisponibilidade extrema do SGA em homologação/desenvolvimento
      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn(`[SGA OFFLINE - DEV FALLBACK] Permitindo acesso temporário de dev.`);
        return {
          perfil: PerfilUsuario.USUARIO_BATALHAO,
          ativo: true
        };
      }

      throw new UnauthorizedException('Serviço de validação SGA temporariamente indisponível.');
    }
  }

  /**
   * Mapeia os perfis recebidos do SGA para a enumeração PerfilUsuario utilizada pelo Prisma.
   */
  private mapearPerfilSga(perfilSga: string): PerfilUsuario {
    const p = String(perfilSga).toUpperCase().trim();
    
    if (p.includes('ADMIN') || p.includes('DTEC')) {
      return PerfilUsuario.ADMIN_DTEC;
    }
    if (p.includes('DIRETOR') || p.includes('DIRETORIA')) {
      return PerfilUsuario.DIRETORIA;
    }
    if (p.includes('COMANDANTE') || p.includes('CMT')) {
      return PerfilUsuario.COMANDANTE;
    }
    
    // Padrão default para qualquer outro perfil
    return PerfilUsuario.USUARIO_BATALHAO;
  }
}

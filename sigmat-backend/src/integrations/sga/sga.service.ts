/**
 * [Estado Atual]: Serviço de integração direta com as bases PostgreSQL do SGA e SGPM da corporação.
 * [Dependências Técnicas]:
 *   - Driver 'pg' (Pool de Conexão Postgres)
 *   - ConfigService (Variáveis de ambiente)
 * [Histórico de Modificações]:
 *   - Totalmente refatorado de chamadas HTTP mockadas para consultas PostgreSQL reais baseadas no modelo 'login-implantar'.
 * [Regras de Negócio Imutáveis]:
 *   - Habilitação obrigatória do sistema SIGMAT via checagem s.id_sistema no SGA (SGA_SYSTEM_ID).
 *   - Extração do perfil funcional e unidade de lotação direto da view ViewSgpm no banco de dados do SGPM.
 *   - Modo de Fallback se USE_MOCK_AUTH=true no .env para permitir desenvolvimento local/offline.
 */

import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PerfilUsuario } from '@prisma/client';
import { Pool } from 'pg';

@Injectable()
export class SgaService {
  private readonly logger = new Logger(SgaService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Obtém os dados funcionais do militar (matrícula, nome de guerra, OME, etc) a partir de seu CPF no SGPM.
   */
  async obterDadosSgpm(cpf: string): Promise<any> {
    const useMock = this.configService.get<string>('USE_MOCK_AUTH') === 'true';
    if (useMock) {
      this.logger.log(`[MOCK DEV] Retornando dados mockados do SGPM para o CPF: ${cpf}`);

      // Diferencia os dados mock pelo CPF retornado do LDAP
      if (cpf === '1258427') {
        return {
          cpf,
          matricula: '1258427',
          sigla: 'SD',
          nome_completo: 'PABLO RICARDO',
          nome_guerra: 'PABLO',
          rg_funcional: '123456-7',
          organizacao_disp: 'DTEC',
          secao: 'SEC-DTEC',
          id_organizacao_disp: 29
        };
      }

      if (cpf === '22334455') {
        return {
          cpf,
          matricula: '22334455',
          sigla: 'SD',
          nome_completo: 'DIRETORIA TESTE',
          nome_guerra: 'DIRETORIA',
          rg_funcional: '223344-5',
          organizacao_disp: 'DIM',
          secao: 'SEC-DIM',
          id_organizacao_disp: 31
        };
      }

      if (cpf === '33445566') {
        return {
          cpf,
          matricula: '33445566',
          sigla: 'SD',
          nome_completo: 'COMANDANTE TESTE',
          nome_guerra: 'COMANDANTE',
          rg_funcional: '334455-6',
          organizacao_disp: '1BPM',
          secao: 'SEC-1BPM',
          id_organizacao_disp: 30
        };
      }

      if (cpf === '44556677') {
        return {
          cpf,
          matricula: '44556677',
          sigla: 'SD',
          nome_completo: 'USUÁRIO BATALHÃO TESTE',
          nome_guerra: 'USUARIOBATALHAO',
          rg_funcional: '445566-7',
          organizacao_disp: '1BPM',
          secao: '1BPM',
          id_organizacao_disp: 30
        };
      }

      throw new UnauthorizedException('Usuário não cadastrado no modo de desenvolvimento.');
    }

    const host = this.configService.get<string>('SGPM_DB_HOST');
    const port = Number(this.configService.get<number>('SGPM_DB_PORT') || 5432);
    const user = this.configService.get<string>('SGPM_DB_USER');
    const password = this.configService.get<string>('SGPM_DB_PASSWORD');
    const database = this.configService.get<string>('SGPM_DB_DATABASE');

    const pool = new Pool({ host, port, user, password, database, connectionTimeoutMillis: 5000 });

    try {
      this.logger.log(`Consultando SGPM para o CPF: ${cpf}`);
      const query = `
        SELECT cpf, matricula, sigla, nome_completo, nome_guerra, rg_funcional, organizacao_disp, secao, id_organizacao_disp
        FROM "ViewSgpm"
        WHERE cpf = $1
        LIMIT 1;
      `;
      const res = await pool.query(query, [cpf]);
      await pool.end();

      if (res.rows.length === 0) {
        throw new UnauthorizedException('Dados funcionais não encontrados no SGPM.');
      }

      return res.rows[0];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(`Erro ao consultar base SGPM: ${errorMessage}`);
      await pool.end();
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Falha ao obter dados funcionais do SGPM.');
    }
  }

  /**
   * Obtém as permissões do usuário cadastrado no SGA (Portal de Segurança) e valida o acesso.
   */
  async obterPermissao(cpf: string): Promise<{ perfil: PerfilUsuario; ativo: boolean; idSistemas: number[]; idPerfis: number[] }> {
    const useMock = this.configService.get<string>('USE_MOCK_AUTH') === 'true';
    if (useMock) {
      this.logger.log(`[MOCK DEV] Retornando permissões mockadas do SGA para o CPF: ${cpf}`);

      if (cpf === '1258427') {
        return {
          perfil: PerfilUsuario.ADMIN_DTEC,
          ativo: true,
          idSistemas: [19, 1, 2],
          idPerfis: [1, 2]
        };
      }

      if (cpf === '22334455') {
        return {
          perfil: PerfilUsuario.DIRETORIA,
          ativo: true,
          idSistemas: [19],
          idPerfis: [4]
        };
      }

      if (cpf === '33445566') {
        return {
          perfil: PerfilUsuario.COMANDANTE,
          ativo: true,
          idSistemas: [19],
          idPerfis: [5]
        };
      }

      if (cpf === '44556677') {
        return {
          perfil: PerfilUsuario.USUARIO_BATALHAO,
          ativo: true,
          idSistemas: [19],
          idPerfis: [3]
        };
      }

      throw new UnauthorizedException('Usuário não cadastrado no modo de desenvolvimento.');
    }

    const host = this.configService.get<string>('SGA_DB_HOST');
    const port = Number(this.configService.get<number>('SGA_DB_PORT') || 5432);
    const user = this.configService.get<string>('SGA_DB_USER');
    const password = this.configService.get<string>('SGA_DB_PASSWORD');
    const database = this.configService.get<string>('SGA_DB_DATABASE');
    const targetSystemId = Number(this.configService.get<number>('SGA_SYSTEM_ID') || 19);

    const pool = new Pool({ host, port, user, password, database, connectionTimeoutMillis: 5000 });

    try {
      this.logger.log(`Consultando SGA para as permissões do CPF: ${cpf}`);
      const query = `
        SELECT 
          u.nome, 
          u.cpf, 
          u.ativo, 
          p.nome AS perfil, 
          p.id_perfil, 
          s.id_sistema, 
          s.nome AS sistema
        FROM "Usuario_Perfil" up
        JOIN "Usuario" u ON up.id_usuario = u.id_usuario
        JOIN "Perfil" p ON up.id_perfil = p.id_perfil
        JOIN "Sistema" s ON up.id_sistema = s.id_sistema
        WHERE u.cpf = $1;
      `;
      const res = await pool.query(query, [cpf]);
      await pool.end();

      if (res.rows.length === 0) {
        throw new UnauthorizedException('Usuário não cadastrado no Portal de Segurança (SGA).');
      }

      const rows = res.rows;
      const isAtivo = rows[0].ativo === true;

      if (!isAtivo) {
        throw new UnauthorizedException('Acesso não permitido. Usuário inativo no SGA.');
      }

      const idSistemas = rows.map((r) => Number(r.id_sistema));
      const idPerfis = rows.map((r) => Number(r.id_perfil));

      if (!idSistemas.includes(targetSystemId)) {
        throw new UnauthorizedException('Usuário não possui as permissões necessárias para acessar este sistema.');
      }

      const perfilMapeado = this.mapearPerfilSga(rows[0].perfil);

      return {
        perfil: perfilMapeado,
        ativo: true,
        idSistemas,
        idPerfis
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(`Erro ao consultar base SGA: ${errorMessage}`);
      await pool.end();
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Falha de conexão com a base de segurança (SGA).');
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
    
    return PerfilUsuario.USUARIO_BATALHAO;
  }
}

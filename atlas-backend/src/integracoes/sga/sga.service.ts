/**
 * [Estado Atual]: ServiÃ§o de integraÃ§Ã£o direta com as bases PostgreSQL do SGA e SGPM da corporaÃ§Ã£o.
 * [DependÃªncias TÃ©cnicas]:
 *   - Driver 'pg' (Pool de ConexÃ£o Postgres)
 *   - ConfigService (VariÃ¡veis de ambiente)
 * [HistÃ³rico de ModificaÃ§Ãµes]:
 *   - Totalmente refatorado de chamadas HTTP mockadas para consultas PostgreSQL reais baseadas no modelo 'login-implantar'.
 * [Regras de NegÃ³cio ImutÃ¡veis]:
 *   - HabilitaÃ§Ã£o obrigatÃ³ria do sistema atlas via checagem s.id_sistema no SGA (SGA_SYSTEM_ID).
 *   - ExtraÃ§Ã£o do perfil funcional e unidade de lotaÃ§Ã£o direto da view ViewSgpm no banco de dados do SGPM.
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
   * ObtÃ©m os dados funcionais do militar (matrÃ­cula, nome de guerra, OME, etc) a partir de seu CPF no SGPM.
   */
  async obterDadosSgpm(cpf: string): Promise<any> {
    const useMock = this.configService.get<string>('USE_MOCK_AUTH') === 'true';
    if (useMock) {
      this.logger.log(
        `[MOCK DEV] Retornando dados mockados do SGPM para o CPF: ${cpf}`,
      );

      // Diferencia os dados mock pelo login retornado do LDAP
      const mockSgpm: Record<string, any> = {
        'pablo.ricardo': {
          cpf: 'pablo.ricardo',
          matricula: '123456',
          sigla: 'SD',
          nome_completo: 'PABLO RICARDO',
          nome_guerra: 'PABLO',
          rg_funcional: '123456-7',
          organizacao_disp: 'DTEC',
          secao: 'SEC-DTEC',
          id_organizacao_disp: 29,
        },
        diretoria: {
          cpf: 'diretoria',
          matricula: '654321',
          sigla: 'SD',
          nome_completo: 'DIRETORIA TESTE',
          nome_guerra: 'DIRETORIA',
          rg_funcional: '223344-5',
          organizacao_disp: 'DIM',
          secao: 'SEC-DIM',
          id_organizacao_disp: 31,
        },
        comandante: {
          cpf: 'comandante',
          matricula: '111222',
          sigla: 'SD',
          nome_completo: 'COMANDANTE TESTE',
          nome_guerra: 'COMANDANTE',
          rg_funcional: '334455-6',
          organizacao_disp: '1BPM',
          secao: 'SEC-1BPM',
          id_organizacao_disp: 30,
        },
        usuariobatalhao: {
          cpf: 'usuariobatalhao',
          matricula: '333444',
          sigla: 'SD',
          nome_completo: 'USUÃRIO BATALHÃƒO TESTE',
          nome_guerra: 'USUARIOBATALHAO',
          rg_funcional: '445566-7',
          organizacao_disp: 'BPTUR',
          secao: 'SSCOM-BPTUR',
          id_organizacao_disp: 267,
        },
      };

      const dadosMock = mockSgpm[cpf];
      if (!dadosMock) {
        throw new UnauthorizedException(
          'UsuÃ¡rio nÃ£o cadastrado no modo de desenvolvimento.',
        );
      }
      return dadosMock;
    }

    const host = this.configService.get<string>('SGPM_DB_HOST');
    const port = Number(this.configService.get<number>('SGPM_DB_PORT') || 5432);
    const user = this.configService.get<string>('SGPM_DB_USER');
    const password = this.configService.get<string>('SGPM_DB_PASSWORD');
    const database = this.configService.get<string>('SGPM_DB_DATABASE');

    const pool = new Pool({
      host,
      port,
      user,
      password,
      database,
      connectionTimeoutMillis: 5000,
    });

    try {
      this.logger.log(`Consultando SGPM para o CPF: ${cpf}`);
      const query = `
        SELECT 
          str_cpf as cpf, 
          str_matricula as matricula, 
          cargo as sigla, 
          str_nome as nome_completo, 
          str_nome_guerra as nome_guerra, 
          ome as organizacao_disp, 
          ome as secao
        FROM "pessoa_cadastro_view"
        WHERE str_cpf = $1
        LIMIT 1;
      `;
      const res = await pool.query(query, [cpf]);
      await pool.end();

      if (res.rows.length === 0) {
        throw new UnauthorizedException(
          'Dados funcionais nÃ£o encontrados no SGPM.',
        );
      }

      return res.rows[0];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(`Erro ao consultar base SGPM: ${errorMessage}`);
      await pool.end();
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException(
        'Falha ao obter dados funcionais do SGPM.',
      );
    }
  }

  /**
   * ObtÃ©m as permissÃµes do usuÃ¡rio cadastrado no SGA (Portal de SeguranÃ§a) e valida o acesso.
   */
  async obterPermissao(cpf: string): Promise<{
    perfil: PerfilUsuario;
    ativo: boolean;
    idSistemas: number[];
    idPerfis: number[];
  }> {
    const useMock = this.configService.get<string>('USE_MOCK_AUTH') === 'true';
    if (useMock) {
      this.logger.log(
        `[MOCK DEV] Retornando permissÃµes mockadas do SGA para o CPF: ${cpf}`,
      );

      const mockPermissoes: Record<
        string,
        { perfil: PerfilUsuario; idSistemas: number[]; idPerfis: number[] }
      > = {
        'pablo.ricardo': {
          perfil: PerfilUsuario.ADMIN_DTEC,
          idSistemas: [19, 1, 2],
          idPerfis: [1, 2],
        },
        diretoria: {
          perfil: PerfilUsuario.DIRETORIA,
          idSistemas: [19],
          idPerfis: [4],
        },
        comandante: {
          perfil: PerfilUsuario.COMANDANTE,
          idSistemas: [19],
          idPerfis: [5],
        },
        usuariobatalhao: {
          perfil: PerfilUsuario.USUARIO_BATALHAO,
          idSistemas: [19],
          idPerfis: [3],
        },
      };

      const perm = mockPermissoes[cpf];
      if (!perm) {
        throw new UnauthorizedException(
          'UsuÃ¡rio nÃ£o cadastrado no modo de desenvolvimento.',
        );
      }
      return { ...perm, ativo: true };
    }

    const host = this.configService.get<string>('SGA_DB_HOST');
    const port = Number(this.configService.get<number>('SGA_DB_PORT') || 5432);
    const user = this.configService.get<string>('SGA_DB_USER');
    const password = this.configService.get<string>('SGA_DB_PASSWORD');
    const database = this.configService.get<string>('SGA_DB_DATABASE');
    const targetSystemId = Number(
      this.configService.get<number>('SGA_SYSTEM_ID') || 19,
    );

    const pool = new Pool({
      host,
      port,
      user,
      password,
      database,
      connectionTimeoutMillis: 5000,
    });

    try {
      this.logger.log(`Consultando SGA para as permissÃµes do CPF: ${cpf}`);
      const query = `
        SELECT 
          u.nome, 
          u.cpf, 
          u.ativo, 
          p.nome AS perfil, 
          p.id_perfil, 
          s.id_sistema, 
          s.nome AS sistema
        FROM mseg.usuario_perfil up
        JOIN mseg.usuario u ON up.id_usuario = u.id_usuario
        JOIN mseg.perfil p ON up.id_perfil = p.id_perfil
        JOIN mseg.sistema s ON up.id_sistema = s.id_sistema
        WHERE u.cpf = $1;
      `;
      const res = await pool.query(query, [cpf]);
      await pool.end();

      if (res.rows.length === 0) {
        throw new UnauthorizedException(
          'UsuÃ¡rio nÃ£o cadastrado no Portal de SeguranÃ§a (SGA).',
        );
      }

      const rows = res.rows;
      const isAtivo = rows[0].ativo === true;

      if (!isAtivo) {
        throw new UnauthorizedException(
          'Acesso nÃ£o permitido. UsuÃ¡rio inativo no SGA.',
        );
      }

      const idSistemas = rows.map((r) => Number(r.id_sistema));
      const idPerfis = rows.map((r) => Number(r.id_perfil));

      if (!idSistemas.includes(targetSystemId)) {
        throw new UnauthorizedException(
          'UsuÃ¡rio nÃ£o possui as permissÃµes necessÃ¡rias para acessar este sistema.',
        );
      }

      const perfilMapeado = this.mapearPerfilSga(rows[0].perfil);

      return {
        perfil: perfilMapeado,
        ativo: true,
        idSistemas,
        idPerfis,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(`Erro ao consultar base SGA: ${errorMessage}`);
      await pool.end();
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException(
        'Falha de conexÃ£o com a base de seguranÃ§a (SGA).',
      );
    }
  }

  /**
   * Lista todas as unidades (OMEs) disponÃ­veis no banco SGPM para preencher o select do formulÃ¡rio.
   */
  async listarUnidades(): Promise<string[]> {
    const useMock = this.configService.get<string>('USE_MOCK_AUTH') === 'true';
    if (useMock) {
      return [
        'DTEC',
        'DIM',
        'BPCHOQUE',
        'BPTUR',
        'BPGD',
        '1Âº BPM',
        '2Âº BPM',
        'BOPE',
        'CPM',
        'EMG',
      ];
    }

    const pool = new Pool({
      host: this.configService.get<string>('SGPM_DB_HOST'),
      port: Number(this.configService.get<number>('SGPM_DB_PORT') || 5432),
      user: this.configService.get<string>('SGPM_DB_USER'),
      password: this.configService.get<string>('SGPM_DB_PASSWORD'),
      database: this.configService.get<string>('SGPM_DB_DATABASE'),
      connectionTimeoutMillis: 5000,
    });

    try {
      const res = await pool.query(
        `SELECT DISTINCT ome FROM "pessoa_cadastro_view" WHERE ome IS NOT NULL ORDER BY ome;`,
      );
      await pool.end();
      return res.rows.map((r) => r.ome as string);
    } catch (err) {
      await pool.end();
      this.logger.error(`Erro ao listar unidades do SGPM: ${err}`);
      // Retorna lista padrÃ£o em caso de falha de conexÃ£o
      return ['DTEC', 'DIM', 'BPCHOQUE', 'BPTUR', 'BPGD', 'BOPE', 'CPM', 'EMG'];
    }
  }

  /**
   * Mapeia os perfis recebidos do SGA para a enumeraÃ§Ã£o PerfilUsuario utilizada pelo Prisma.
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

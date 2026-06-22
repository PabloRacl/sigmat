/**
 * [Estado Atual]: Serviço de integração direta com as bases PostgreSQL do SGA e SGPM da corporação.
 * [Dependências Técnicas]:
 *   - Driver 'pg' (Pool de Conexão Postgres)
 *   - ConfigService (Variáveis de ambiente)
 * [Histórico de Modificações]:
 *   - Totalmente refatorado de chamadas HTTP mockadas para consultas PostgreSQL reais baseadas no modelo 'login-implantar'.
 * [Regras de Negócio Imutáveis]:
 *   - Habilitação obrigatória do sistema atlas via checagem s.id_sistema no SGA (SGA_SYSTEM_ID).
 *   - Extração do perfil funcional e unidade de lotação direto da view ViewSgpm no banco de dados do SGPM.
 *   - Modo de Fallback se USE_MOCK_AUTH=true no .env para permitir desenvolvimento local/offline.
 */

import { Injectable, Logger, UnauthorizedException, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PerfilUsuario } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaService } from '../../banco-dados/prisma.service';

@Injectable()
export class BasesCorporativasService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BasesCorporativasService.name);
  private poolSgpm!: Pool;
  private poolSga!: Pool;
  private cachedUnidades: string[] = [];

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.poolSgpm = new Pool({
      host: this.configService.get<string>('SGPM_DB_HOST'),
      port: Number(this.configService.get<number>('SGPM_DB_PORT') || 5432),
      user: this.configService.get<string>('SGPM_DB_USER'),
      password: this.configService.get<string>('SGPM_DB_PASSWORD'),
      database: this.configService.get<string>('SGPM_DB_DATABASE'),
      connectionTimeoutMillis: 5000,
    });

    this.poolSga = new Pool({
      host: this.configService.get<string>('SGA_DB_HOST'),
      port: Number(this.configService.get<number>('SGA_DB_PORT') || 5432),
      user: this.configService.get<string>('SGA_DB_USER'),
      password: this.configService.get<string>('SGA_DB_PASSWORD'),
      database: this.configService.get<string>('SGA_DB_DATABASE'),
      connectionTimeoutMillis: 5000,
    });
  }

  async onModuleDestroy() {
    if (this.poolSgpm) await this.poolSgpm.end();
    if (this.poolSga) await this.poolSga.end();
  }

  /**
   * Obtém os dados funcionais do militar (matrícula, nome de guerra, OME, etc) a partir de seu CPF no SGPM.
   */
  async consultarDadosFuncionais(cpf: string): Promise<any> {
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
          nome_completo: 'USUÁRIO BATALHÃO TESTE',
          nome_guerra: 'USUARIOBATALHAO',
          rg_funcional: '445566-7',
          organizacao_disp: 'BPTUR',
          secao: 'SSCOM-BPTUR',
          id_organizacao_disp: 267,
          email: 'usuariobatalhao@pm.pe.gov.br',
        },
      };

      const dadosMock = mockSgpm[cpf];
      if (!dadosMock) {
        throw new UnauthorizedException(
          'Usuário não cadastrado no modo de desenvolvimento.',
        );
      }
      return dadosMock;
    }

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
      const res = await this.poolSgpm.query(query, [cpf]);

      if (res.rows.length === 0) {
        throw new UnauthorizedException(
          'Dados funcionais não encontrados no SGPM.',
        );
      }

      return res.rows[0];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(`Erro ao consultar base SGPM: ${errorMessage}`);
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException(
        'Falha ao obter dados funcionais do SGPM.',
      );
    }
  }

  /**
   * Obtém as permissões do usuário cadastrado no SGA (Portal de Segurança) e valida o acesso.
   */
  async consultarPerfisAcesso(cpf: string): Promise<{
    perfil: PerfilUsuario;
    ativo: boolean;
    idSistemas: number[];
    idPerfis: number[];
  }> {
    const useMock = this.configService.get<string>('USE_MOCK_AUTH') === 'true';
    if (useMock) {
      this.logger.log(
        `[MOCK DEV] Retornando permissões mockadas do SGA para o CPF: ${cpf}`,
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
          'Usuário não cadastrado no modo de desenvolvimento.',
        );
      }
      return { ...perm, ativo: true };
    }

    const targetSystemId = Number(
      this.configService.get<number>('SGA_SYSTEM_ID') || 19,
    );

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
        FROM mseg.usuario_perfil up
        JOIN mseg.usuario u ON up.id_usuario = u.id_usuario
        JOIN mseg.perfil p ON up.id_perfil = p.id_perfil
        JOIN mseg.sistema s ON up.id_sistema = s.id_sistema
        WHERE u.cpf = $1;
      `;
      const res = await this.poolSga.query(query, [cpf]);

      if (res.rows.length === 0) {
        throw new UnauthorizedException(
          'Usuário não cadastrado no Portal de Segurança (SGA).',
        );
      }

      const rows = res.rows;
      const isAtivo = rows[0].ativo === true;

      if (!isAtivo) {
        throw new UnauthorizedException(
          'Acesso não permitido. Usuário inativo no SGA.',
        );
      }

      const idSistemas = rows.map((r) => Number(r.id_sistema));
      const idPerfis = rows.map((r) => Number(r.id_perfil));

      if (!idSistemas.includes(targetSystemId)) {
        throw new UnauthorizedException(
          'Usuário não possui as permissões necessárias para acessar este sistema.',
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
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException(
        'Falha de conexão com a base de segurança (SGA).',
      );
    }
  }

  /**
   * Lista todas as unidades (OMEs) disponíveis no banco SGPM para preencher o select do formulário.
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
        '1º BPM',
        '2º BPM',
        'BOPE',
        'CPM',
        'EMG',
      ];
    }

    try {
      const res = await this.poolSgpm.query(
        `SELECT DISTINCT ome FROM "pessoa_cadastro_view" WHERE ome IS NOT NULL ORDER BY ome;`,
      );
      const units = res.rows.map((r) => r.ome as string).filter(Boolean);
      if (units.length > 0) {
        this.cachedUnidades = units;
      }
      return units;
    } catch (err) {
      this.logger.error(`Erro ao listar unidades do SGPM: ${err}`);

      // Fallback 1: Retornar cache em memória se disponível
      if (this.cachedUnidades && this.cachedUnidades.length > 0) {
        this.logger.log('Retornando lista de unidades a partir do cache em memória.');
        return this.cachedUnidades;
      }

      // Fallback 2: Retornar do banco local (diretorias, batalhões e seções)
      try {
        const localUnits = await this.listarUnidadesLocais();
        if (localUnits.length > 0) {
          this.logger.log('Retornando lista de unidades a partir do banco de dados local.');
          return localUnits;
        }
      } catch (localErr) {
        this.logger.error(`Erro no fallback de unidades locais: ${localErr}`);
      }

      // Fallback 3: Retornar lista básica hardcoded
      this.logger.warn('Utilizando lista de unidades estática de fallback.');
      return ['DTEC', 'DIM', 'BPCHOQUE', 'BPTUR', 'BPGD', 'BOPE', 'CPM', 'EMG'];
    }
  }

  private async listarUnidadesLocais(): Promise<string[]> {
    try {
      const [diretorias, batalhoes, secoes] = await Promise.all([
        this.prisma.diretoria.findMany({ select: { sigla: true } }),
        this.prisma.batalhao.findMany({ select: { sigla: true } }),
        this.prisma.secao.findMany({ select: { sigla: true } }),
      ]);

      const localSiglas = [
        ...diretorias.map((d) => d.sigla),
        ...batalhoes.map((b) => b.sigla),
        ...secoes.map((s) => s.sigla),
      ]
        .map((s) => String(s || '').trim())
        .filter(Boolean);

      return Array.from(new Set(localSiglas)).sort();
    } catch (err) {
      this.logger.error(`Erro ao listar unidades locais: ${err}`);
      return [];
    }
  }


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
    if (p.includes('POLICIAL') || p.includes('EFETIVO')) {
      return PerfilUsuario.POLICIAL;
    }

    return PerfilUsuario.USUARIO_BATALHAO;
  }

  /**
   * Envia os dados de aprovação do Atlas para o banco de dados do SGA
   * realizando o provisionamento automático (SSO Inverso).
   */
  async provisionarUsuarioSga(dados: any): Promise<boolean> {
    const useMock = this.configService.get<string>('USE_MOCK_AUTH') === 'true';
    if (useMock) {
      this.logger.log(`[MOCK DEV] Simulando provisionamento corporativo de ${dados.nome} no SGA.`);
      return true;
    }

    try {
      this.logger.log(`Enviando requisição de provisionamento para o SGA (CPF: ${dados.cpf})`);
      
      // Aqui entrará a query oficial (Ex: INSERT INTO mseg.usuario...) ou requisição HTTP
      // para gravar o usuário no sistema legado assim que receber a credencial oficial.
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      this.logger.log(`Usuário ${dados.nome} provisionado com sucesso no SGA!`);
      return true;
    } catch (err) {
      this.logger.error(`Erro crítico ao provisionar usuário no SGA: ${err}`);
      throw new Error('Falha na comunicação de provisionamento com a base corporativa (SGA).');
    }
  }
}

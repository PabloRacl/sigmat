import {
  Injectable,
  OnModuleInit,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

function normalizePostgresUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    const sslmode = url.searchParams.get('sslmode')?.toLowerCase();
    const hasCompat = url.searchParams.has('uselibpqcompat');

    if (
      sslmode &&
      ['prefer', 'require', 'verify-ca'].includes(sslmode) &&
      !hasCompat
    ) {
      url.searchParams.set('uselibpqcompat', 'true');
    }

    return url.toString();
  } catch {
    return rawUrl;
  }
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const rawConnectionString = process.env.DATABASE_URL;
    const connectionString = rawConnectionString
      ? normalizePostgresUrl(rawConnectionString)
      : undefined;

    if (!connectionString) {
      console.error(
        '❌ ERRO: Variável de ambiente DATABASE_URL não encontrada!',
      );
    }

    const pool = new Pool({
      connectionString,
      ssl: connectionString?.includes('neon.tech')
        ? { rejectUnauthorized: false }
        : false,
    });

    const adapter = new PrismaPg(pool);

    super({
      adapter,
      log: ['error', 'warn'],
    });

    console.log('📦 Prisma inicializado com Driver Adapter PG.');
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Prisma conectado ao banco de dados com sucesso.');
    } catch (err) {
      this.logger.error('❌ Erro ao conectar o Prisma ao banco:', err.message);
      throw err;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

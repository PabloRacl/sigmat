import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    // Configura a string de conexão usando a variável de ambiente
    const connectionString = process.env.DATABASE_URL;
    // Cria um pool de conexões do PostgreSQL
    const pool = new Pool({ connectionString });
    // Configura o adaptador do Prisma para PostgreSQL
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    // Conecta ao banco de dados ao iniciar o módulo
    await this.$connect();
  }

  // enableShutdownHooks não é mais necessário no Prisma 5+ e causa crash.

}






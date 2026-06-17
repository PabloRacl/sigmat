import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function check() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  
  try {
    console.log('Iniciando checagem do banco...');
    const tables: any[] = await prisma.$queryRaw`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'`;
    console.log('Tabelas encontradas:', tables.map(t => t.tablename).join(', '));
    
    const count = await prisma.usuario.count();
    console.log('Total de usuários:', count);
    
    const user = await prisma.usuario.findFirst({ where: { login: 'pablo.ricardo' } });
    console.log('Usuário pablo.ricardo:', user ? 'Encontrado' : 'Não encontrado');

    const rtCount = await prisma.refreshToken.count();
    console.log('Total de refresh tokens:', rtCount);

  } catch (error) {
    console.error('Erro na checagem:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

check();

require('dotenv').config({ path: 'import.env' });
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const rawConnectionString = process.env.DATABASE_URL;
const connectionString = rawConnectionString?.includes('sslmode=require')
  ? rawConnectionString.replace('sslmode=require', 'sslmode=require&uselibpqcompat=true')
  : rawConnectionString;
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
async function run() {
  const users = await prisma.usuario.findMany({
    where: {
      OR: [
        { perfil: { in: ['COMANDANTE', 'USUARIO_BATALHAO'] } },
        { nome: { contains: 'batalhao', mode: 'insensitive' } },
        { login: { contains: 'batalhao', mode: 'insensitive' } },
      ],
    },
    take: 100,
    include: {
      secao: { include: { batalhao: true } },
      batalhao: true,
    },
  });
  console.log(JSON.stringify(users, null, 2));
}
run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

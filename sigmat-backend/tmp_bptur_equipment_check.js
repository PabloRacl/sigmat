require('dotenv').config({ path: 'import.env' });
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function run() {
  const count = await prisma.equipamento.count({
    where: { secao: { batalhaoId: 267 } }
  });
  const sample = await prisma.equipamento.findMany({
    where: { secao: { batalhaoId: 267 } },
    take: 5,
    select: {
      id: true,
      patrimonio: true,
      secaoId: true,
      secao: { select: { sigla: true, batalhaoId: true } }
    }
  });
  console.log('COUNT', count);
  console.log('SAMPLE', JSON.stringify(sample, null, 2));
}

run()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  console.log('URL do Banco:', process.env.DATABASE_URL);
  console.log('--- Verificando Logs de Operação ---');
  const logs = await prisma.logOperacao.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
  console.log('Logs:', JSON.stringify(logs, null, 2));

  console.log('\n--- Verificando Últimos Equipamentos ---');
  const equips = await prisma.equipamento.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { tipoEquipamento: true }
  });
  console.log('Equipamentos:', JSON.stringify(equips, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

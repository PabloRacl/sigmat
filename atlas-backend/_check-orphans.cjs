const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv/config');

const rawUrl = process.env.DATABASE_URL;
const connectionString = rawUrl.replace('sslmode=require', 'sslmode=require&ssl=true');
const pool = new Pool({
  connectionString,
  ssl: rawUrl.includes('neon.tech') ? { rejectUnauthorized: false } : false,
});
const adapter = new PrismaPg(pool);
const p = new PrismaClient({ adapter });

async function main() {
  const manutencao = await p.statusEquipamento.findFirst({
    where: { nome: { contains: 'Manuten', mode: 'insensitive' } },
  });
  const ativo = await p.statusEquipamento.findFirst({
    where: { nome: { contains: 'Ativo', mode: 'insensitive' } },
  });
  console.log('Status Manutencao ID:', manutencao?.id);
  console.log('Status Ativo ID:', ativo?.id);

  const orphans = await p.$queryRawUnsafe(
    `SELECT e.id, e.patrimonio FROM equipamentos e
     LEFT JOIN ordens_servico os ON os.equipamento_id = e.id
     WHERE e.status_id = $1 AND os.id IS NULL`,
    manutencao.id
  );
  console.log('Orphans (MANUTENCAO sem OS):', orphans.length);
  for (const o of orphans) {
    console.log('  -', o.id, o.patrimonio);
  }

  const allManutencao = await p.equipamento.count({
    where: { statusId: manutencao.id },
  });
  const totalOS = await p.ordemServico.count();
  const openOS = await p.ordemServico.count({
    where: { status: { in: ['ABERTA', 'EM_ANDAMENTO', 'AGUARDANDO_PECA'] } },
  });
  console.log('Total equipamentos em MANUTENCAO:', allManutencao);
  console.log('Total OS (qualquer status):', totalOS);
  console.log('Total OS abertas:', openOS);

  await p.$disconnect();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});

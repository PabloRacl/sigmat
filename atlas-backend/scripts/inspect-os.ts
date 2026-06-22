import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const rawConnectionString = process.env.DATABASE_URL;
const pool = new Pool({
  connectionString: rawConnectionString,
  ssl: rawConnectionString?.includes('neon.tech') ? { rejectUnauthorized: false } : false,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('=== Verificando Órfãos em Manutenção ===');

  // 1. Procurar quais IDs de status correspondem a "Manutenção"
  const statuses = await prisma.statusEquipamento.findMany();
  const statusManutencaoIds = statuses
    .filter(s => s.nome.toLowerCase().includes('manuten'))
    .map(s => s.id);

  if (statusManutencaoIds.length === 0) {
    console.log('Nenhum status relacionado a "manutenção" foi encontrado.');
    return;
  }
  console.log(`Encontrados IDs de Status de Manutenção: ${statusManutencaoIds.join(', ')}`);

  // 2. Buscar equipamentos com esses status que NÃO tenham OS aberta
  const equipamentosOrfaos = await prisma.equipamento.findMany({
    where: {
      statusId: { in: statusManutencaoIds },
      // Opcional: garantir que ele não tem NENHUMA OrdemServico com status ABERTA, EM_ANDAMENTO ou AGUARDANDO_PECA
      ordensServico: {
        none: {
          status: { in: ['ABERTA', 'EM_ANDAMENTO', 'AGUARDANDO_PECA'] }
        }
      }
    },
    select: {
      id: true,
      patrimonio: true,
      tipoEquipamento: { select: { nome: true } },
      secao: { select: { sigla: true } }
    }
  });

  console.log(`Foram encontrados ${equipamentosOrfaos.length} equipamentos com status de manutenção SEM O.S. ativa atrelada.`);
  if (equipamentosOrfaos.length > 0) {
    console.log('Amostra de órfãos:', equipamentosOrfaos.slice(0, 3));
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

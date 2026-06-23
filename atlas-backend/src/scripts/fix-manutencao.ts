import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Buscando equipamentos com status Manutenção...');

  const statusManutencao = await prisma.statusEquipamento.findFirst({
    where: { nome: { in: ['Manutenção', 'Em Manutenção'] } }
  });

  if (!statusManutencao) {
    console.log('Status Manutenção não encontrado no banco.');
    return;
  }

  const equipEmManutencao = await prisma.equipamento.findMany({
    where: { statusId: statusManutencao.id },
    include: {
      ordensServico: {
        where: {
          status: { in: ['ABERTA', 'EM_ANDAMENTO', 'AGUARDANDO_PECA'] }
        }
      }
    }
  });

  const equipSemOS = equipEmManutencao.filter(e => e.ordensServico.length === 0);

  console.log(`Total de equipamentos com status de Manutenção: ${equipEmManutencao.length}`);
  console.log(`Equipamentos precisando de O.S.: ${equipSemOS.length}`);

  let criadas = 0;
  for (const eq of equipSemOS) {
    try {
      await prisma.ordemServico.create({
        data: {
          equipamentoId: eq.id,
          // Associando ao primeiro usuário admin ou diretoria só para ter um solicitante (ou usar ID 1)
          solicitanteId: 1, 
          descricaoProblema: "O.S. gerada automaticamente para regularizar o status manual do equipamento.",
          status: 'ABERTA',
          dataAbertura: new Date()
        }
      });
      criadas++;
    } catch (error) {
      console.log(`Erro ao criar OS para equipamento ${eq.id}: ${error.message}`);
    }
  }

  console.log(`✅ ${criadas} Ordens de Serviço geradas com sucesso!`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    pool.end();
  });

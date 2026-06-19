const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const statusManutencao = await prisma.statusEquipamento.findFirst({
    where: { nome: { in: ['Manutenção', 'Em Manutenção'] } }
  });

  if (!statusManutencao) {
    console.log('Status Manutencao not found');
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

  console.log(`Total equipamentos com status Manutenção: ${equipEmManutencao.length}`);
  console.log(`Equipamentos sem OS aberta: ${equipSemOS.length}`);
  console.log('Equipamentos que precisam de OS:', equipSemOS.map(e => e.id));
}

main().catch(console.error).finally(() => prisma.$disconnect());

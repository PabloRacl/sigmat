import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const status = await prisma.statusEquipamento.findFirst({
    where: { nome: { equals: 'Manutenção', mode: 'insensitive' } },
  });
  console.log('Status Manutencao:', status);

  const os = await prisma.ordemServico.findMany({ orderBy: { id: 'desc' }, take: 1 });
  console.log('Ultima OS:', os);
}
main().finally(() => prisma.$disconnect());

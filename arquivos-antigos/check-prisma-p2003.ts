import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  try {
    const os = await prisma.ordemServico.findFirst({ select: { equipamentoId: true } });
    if (os) {
      console.log('Tentando apagar equipamento:', os.equipamentoId);
      await prisma.equipamento.delete({ where: { id: os.equipamentoId } });
    }
  } catch (error: any) {
    console.log('Error meta:', error.meta);
    console.log('Error message:', error.message);
  }
}
main().finally(() => prisma.$disconnect());

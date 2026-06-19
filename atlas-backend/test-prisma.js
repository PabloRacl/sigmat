const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Testando query de pendentes...');
    const result = await prisma.solicitacaoAcesso.findMany({
      where: { status: 'PENDENTE' },
      orderBy: { createdAt: 'desc' },
    });
    console.log('Sucesso! Resultado:', result);
  } catch (err) {
    console.error('Erro no Prisma:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();

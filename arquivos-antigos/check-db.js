const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const count = await prisma.equipamento.count();
    const users = await prisma.usuario.count();
    
    console.log('--- DIAGNÓSTICO NEON ---');
    console.log(`Equipamentos: ${count}`);
    console.log(`Usuários: ${users}`);
    
    if (count > 0) {
      const first = await prisma.equipamento.findFirst();
      console.log('Banco OK! Exemplo:', first.patrimonio);
    } else {
      console.log('Banco Vazio! Precisamos rodar o seed novamente.');
    }
  } catch (e) {
    console.error('Erro:', e);
  } finally {
    await prisma.$disconnect();
  }
}

check();

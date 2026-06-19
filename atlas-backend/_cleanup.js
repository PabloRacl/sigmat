const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const result = await prisma.$executeRawUnsafe(`
    UPDATE equipamentos SET status_id = (SELECT id FROM status_equipamento WHERE nome = 'Ativo')
    WHERE status_id = (SELECT id FROM status_equipamento WHERE nome = 'Manutenção')
    AND id NOT IN (SELECT equipamento_id FROM ordens_servico)
  `);
  console.log('Linhas atualizadas:', result);
  const remaining = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*) as count FROM equipamentos 
    WHERE status_id = (SELECT id FROM status_equipamento WHERE nome = 'Manutenção')
    AND id NOT IN (SELECT equipamento_id FROM ordens_servico)
  `);
  console.log('Remaining orphans:', JSON.stringify(remaining));
  await prisma.$disconnect();
})();

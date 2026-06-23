const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('Iniciando limpeza de contas de teste...');
  
  // Buscar usuários com "teste" no login ou no nome
  const usuariosTeste = await prisma.usuario.findMany({
    where: {
      OR: [
        { login: { contains: 'teste', mode: 'insensitive' } },
        { nome: { contains: 'teste', mode: 'insensitive' } }
      ]
    }
  });

  if (usuariosTeste.length === 0) {
    console.log('Nenhum usuário de teste encontrado.');
    return;
  }

  console.log(`Encontrados ${usuariosTeste.length} usuários de teste.`);
  
  for (const u of usuariosTeste) {
    console.log(`- Apagando usuário: ${u.login} (${u.nome})`);
    
    // Deletar possíveis vínculos (tokens, logs, etc) se a regra do banco não for Cascade
    await prisma.refreshToken.deleteMany({ where: { usuarioId: u.id } });
    await prisma.usuarioSecao.deleteMany({ where: { usuarioId: u.id } });
    await prisma.usuarioTipoEquipamento.deleteMany({ where: { usuarioId: u.id } });
    await prisma.logOperacao.deleteMany({ where: { usuarioId: u.id } });
    
    // Outros vínculos (aprovador, solicitante) que possam travar a exclusão
    // Para simplificar vamos remover apenas se não houver vínculos rígidos de equipamento.
    try {
      await prisma.usuario.delete({ where: { id: u.id } });
      console.log(`  [OK] Usuário ${u.login} apagado.`);
    } catch (e) {
      console.log(`  [ERRO] Não foi possível apagar ${u.login}. Pode estar vinculado a equipamentos.`);
    }
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

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
  console.log('=== Iniciando Higienização de Status ===');

  // 1. Puxar todos os status para identificar duplicados em memória (para evitar problemas de case-sensitivity do BD)
  const todosStatus = await prisma.statusEquipamento.findMany();
  
  const statusAtivos = todosStatus.filter(s => s.nome.toLowerCase() === 'ativo');
  
  if (statusAtivos.length === 0) {
    console.log('Nenhum status com a palavra "Ativo" foi encontrado no banco.');
    return;
  }

  // 2. Eleger ou criar o status MESTRE ("ATIVO")
  let masterStatus = statusAtivos.find(s => s.nome === 'ATIVO');
  
  if (!masterStatus) {
    console.log('Status "ATIVO" (caixa alta) não existe. Convertendo o primeiro ("' + statusAtivos[0].nome + '") em Mestre...');
    masterStatus = statusAtivos[0];
    masterStatus = await prisma.statusEquipamento.update({
      where: { id: masterStatus.id },
      data: { nome: 'ATIVO' }
    });
  }

  console.log(`[MESTRE] Definido o Status: ${masterStatus.nome} (ID: ${masterStatus.id})`);

  // 3. Separar as "sujeiras"
  const outrosStatus = statusAtivos.filter(s => s.id !== masterStatus.id);
  
  if (outrosStatus.length === 0) {
    console.log('Não há status duplicados ("ativo", "Ativo") para migrar. A tabela já está limpa.');
    return;
  }

  console.log(`\nEncontrados ${outrosStatus.length} status impuros/duplicados. Iniciando migração...`);
  const idsParaDeletar = outrosStatus.map(s => s.id);

  // 4. Executar transação fechada
  await prisma.$transaction(async (tx) => {
    // A. Migra todos os equipamentos que estão com os status errados para o Mestre
    const updateResult = await tx.equipamento.updateMany({
      where: {
        statusId: { in: idsParaDeletar }
      },
      data: {
        statusId: masterStatus.id
      }
    });
    console.log(`-> MIGRAÇÃO: ${updateResult.count} equipamentos foram redirecionados para o Status Mestre.`);

    // B. Agora que os status errados não têm mais filhos, podemos deletá-los
    const deleteResult = await tx.statusEquipamento.deleteMany({
      where: {
        id: { in: idsParaDeletar }
      }
    });
    console.log(`-> LIMPEZA: ${deleteResult.count} status impuros foram deletados do banco de dados.`);
  });

  console.log('\n=== HIGIENIZAÇÃO CONCLUÍDA COM SUCESSO! ===');
}

main()
  .catch(e => {
    console.error('Erro na migração:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

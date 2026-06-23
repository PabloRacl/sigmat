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
  console.log('=== Iniciando Geração em Lote de O.S. Fictícias ===');

  // 1. Procurar um administrador para ser o "autor" da O.S.
  const admin = await prisma.usuario.findFirst({
    where: { perfil: 'ADMIN_DTEC' }
  });

  if (!admin) {
    console.log('Nenhum usuário com perfil ADMIN_DTEC encontrado para ser o solicitante.');
    return;
  }
  console.log(`Usuário Eleito para Abertura das O.S.: ID ${admin.id}`);

  // 2. Coletar os Status de Manutenção
  const statuses = await prisma.statusEquipamento.findMany();
  const statusManutencaoIds = statuses
    .filter(s => s.nome.toLowerCase().includes('manuten'))
    .map(s => s.id);

  if (statusManutencaoIds.length === 0) return;

  // 3. Coletar os 2.353 equipamentos órfãos
  const equipamentosOrfaos = await prisma.equipamento.findMany({
    where: {
      statusId: { in: statusManutencaoIds },
      ordensServico: {
        none: {
          status: { in: ['ABERTA', 'EM_ANDAMENTO', 'AGUARDANDO_PECA'] }
        }
      }
    },
    select: { id: true, patrimonio: true }
  });

  if (equipamentosOrfaos.length === 0) {
    console.log('Não há equipamentos órfãos. A base já está redonda.');
    return;
  }

  // 4. Frases fictícias realistas de testes
  const descricoes = [
    "Manutenção preventiva solicitada via sistema de lotes automáticos.",
    "Falha intermitente na inicialização. Hardware precisa de inspeção completa.",
    "Troca periódica de suprimentos/limpeza interna para preservação.",
    "Usuário relatou desligamentos repentinos. Possível problema elétrico.",
    "Equipamento travando recorrentemente. Reinstalação de SO recomendada."
  ];

  // 5. Montar o bloco de inserção de O.S. (Payload)
  const payload = equipamentosOrfaos.map((eq, i) => {
    return {
      equipamentoId: eq.id,
      solicitanteId: admin.id,
      tecnicoResponsavel: "Sistema Autogerador (BOT)",
      descricaoProblema: descricoes[i % descricoes.length] + ` [Gerado para fins de teste. Ref: PAT-${eq.patrimonio}]`,
      status: 'ABERTA' as const,
      dataAbertura: new Date()
    };
  });

  console.log(`Estruturando bloco de inserção para ${payload.length} Ordens de Serviço...`);

  // 6. Inserir em partes (chunks) de 500 para não estourar a memória/timeout da string SQL
  const chunkSize = 500;
  let totalCriadas = 0;

  for (let i = 0; i < payload.length; i += chunkSize) {
    const chunk = payload.slice(i, i + chunkSize);
    const result = await prisma.ordemServico.createMany({
      data: chunk
    });
    totalCriadas += result.count;
    console.log(`Lote processado: +${result.count} novas O.S.`);
  }

  console.log(`\n=== SUCESSO ABSOLUTO! ${totalCriadas} Ordens de Serviço inseridas no banco. ===`);
}

main()
  .catch(e => {
    console.error('Erro durante a injeção em lote:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

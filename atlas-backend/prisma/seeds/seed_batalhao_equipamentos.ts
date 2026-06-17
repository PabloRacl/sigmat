import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const sectionNames = ['SSCOM', 'P1', 'P3', 'P4', 'ALMOX'];
const tipoIds = [1, 2, 3, 4, 5, 6, 8, 13, 12, 9, 7, 10, 11, 999];
const statusIds = {
  ATIVO: 1,
  INATIVO: 2,
  EXTRAVIADO: 3,
  MANUTENCAO: 4,
  DANO: 5,
  DISPONIVEL: 6,
  RESERVA: 7,
  PENDENTE_APROVACAO: 23
};
const disponibilidadeIds = {
  CARGA: 1,
  EMPRESTIMO: 2
};

function getRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function pad(value: number, length = 3): string {
  return String(value).padStart(length, '0');
}

function randomDateInPast(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * days));
  return date;
}

function randomDateInFuture(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(Math.random() * days));
  return date;
}

/** Generate an array with exactly 100 status IDs following the required distribution */
function generateStatusDistribution(): number[] {
  const distribution = [] as number[];
  // 20 ATIVO
  for (let i = 0; i < 20; i++) distribution.push(statusIds.ATIVO);
  // 20 INATIVO
  for (let i = 0; i < 20; i++) distribution.push(statusIds.INATIVO);
  // 20 EXTRAVIADO
  for (let i = 0; i < 20; i++) distribution.push(statusIds.EXTRAVIADO);
  // 20 MANUTENCAO
  for (let i = 0; i < 20; i++) distribution.push(statusIds.MANUTENCAO);
  // 20 PENDENTE_APROVACAO
  for (let i = 0; i < 20; i++) distribution.push(statusIds.PENDENTE_APROVACAO);
  // Shuffle for randomness
  for (let i = distribution.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [distribution[i], distribution[j]] = [distribution[j], distribution[i]];
  }
  return distribution;
}

/** Generate an array with exactly 100 disponibilidade IDs (50 CARGA, 50 EMPRESTIMO) */
function generateDisponibilidadeDistribution(): number[] {
  const distribution = [] as number[];
  for (let i = 0; i < 50; i++) distribution.push(disponibilidadeIds.CARGA);
  for (let i = 0; i < 50; i++) distribution.push(disponibilidadeIds.EMPRESTIMO);
  // Shuffle
  for (let i = distribution.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [distribution[i], distribution[j]] = [distribution[j], distribution[i]];
  }
  return distribution;
}

async function main() {
  const defaultUser = await prisma.usuario.findFirst({ select: { id: true } });
  const defaultUserId = defaultUser?.id || null;

  const batalhoes = await prisma.batalhao.findMany({ include: { diretoria: true } });
  console.log(`Total de batalhões encontrados: ${batalhoes.length}`);

  for (const batalhao of batalhoes) {
    console.log(`\nGerando 100 equipamentos para batalhão ${batalhao.sigla} (${batalhao.id})`);

    const secoes: any[] = [];
    for (const nome of sectionNames) {
      const sigla = `${batalhao.sigla}-${nome}`;
      const secao = await prisma.secao.upsert({
        where: { sigla },
        update: {
          nome,
          batalhaoId: batalhao.id,
          diretoriaId: batalhao.diretoriaId
        },
        create: {
          sigla,
          nome,
          batalhaoId: batalhao.id,
          diretoriaId: batalhao.diretoriaId
        }
      });
      secoes.push(secao);
    }

    const statusDist = generateStatusDistribution();
    const disponibilidadeDist = generateDisponibilidadeDistribution();
    let equipamentoSequence = 1;
    let statusIndex = 0;

    for (const secao of secoes) {
      for (let i = 0; i < 20; i++) { // 20 equipments per seção => 100 total per batalhão
        let statusId = statusDist[statusIndex % statusDist.length];
        let disponibilidadeId = disponibilidadeDist[statusIndex % disponibilidadeDist.length];
        const patrimonySuffix = pad(equipamentoSequence);
        const patrimonio = `AUTO-${batalhao.sigla}-${secao.nome}-${patrimonySuffix}`;
        const tipoEquipamentoId = tipoIds[(equipamentoSequence - 1) % tipoIds.length];

        // Default fields
        let dataRetornoEmprestimo: Date | null = null;
        let dataSolicitacao: Date | null = null;
        let dataAprovacao: Date | null = null;
        let solicitante: string | null = null;

        if (disponibilidadeId === disponibilidadeIds.EMPRESTIMO) {
          dataRetornoEmprestimo = randomDateInFuture(40);
          dataSolicitacao = randomDateInPast(30);
          dataAprovacao = randomDateInPast(20);
          solicitante = `Usuário ${batalhao.sigla}`;
        }

        // Ensure pending approval equipment uses CARGA availability
        if (statusId === statusIds.PENDENTE_APROVACAO) {
          disponibilidadeId = disponibilidadeIds.CARGA;
        }

        const equipamento = await prisma.equipamento.upsert({
          where: { patrimonio },
          update: {
            numeroSerie: `SN-${patrimonio}`,
            sei: `SEI-${batalhao.sigla}-${pad(equipamentoSequence, 4)}`,
            dataAquisicao: randomDateInPast(365 * 2),
            observacao: `Equipamento auto-gerado para ${batalhao.sigla} / ${secao.nome}`,
            tipoEquipamentoId,
            statusId,
            disponibilidadeId,

            dataRetornoEmprestimo,
            dataSolicitacao,
            dataAprovacao,
            solicitante
          },
          create: {
            patrimonio,
            numeroSerie: `SN-${patrimonio}`,
            sei: `SEI-${batalhao.sigla}-${pad(equipamentoSequence, 4)}`,
            dataAquisicao: randomDateInPast(365 * 2),
            observacao: `Equipamento auto-gerado para ${batalhao.sigla} / ${secao.nome}`,
            tipoEquipamentoId,
            statusId,
            disponibilidadeId,
            secaoId: secao.id,
            dataRetornoEmprestimo,
            dataSolicitacao,
            dataAprovacao,
            solicitante
          }
        });

        if (disponibilidadeId === disponibilidadeIds.EMPRESTIMO && defaultUserId) {
          const destino = secoes[(secoes.indexOf(secao) + 1) % secoes.length];
          await prisma.transferencia.create({
            data: {
              equipamentoId: equipamento.id,
              origemId: secao.id,
              destinoId: destino.id,
              solicitanteId: defaultUserId,
              status: statusIndex % 2 === 0 ? 'CONCLUIDA' : 'PENDENTE',
              observacao: `Transferência auto-gerada para ${patrimonio}`,
              dataEnvio: randomDateInPast(40),
              dataRecebimento: statusIndex % 2 === 0 ? randomDateInPast(10) : null
            }
          });
        }

        equipamentoSequence++;
        statusIndex++;
      }
    }

    console.log(`  Seções criadas: ${secoes.length}. Equipamentos gerados: 100.`);
  }

  console.log('\nGeração finalizada.');
}

main()
  .catch(error => {
    console.error('Erro ao gerar equipamentos:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

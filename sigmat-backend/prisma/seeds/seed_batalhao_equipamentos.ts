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
  'MANUTENÇÃO': 4,
  DANO: 5,
  DISPONÍVEL: 6,
  RESERVA: 7,
  PENDENTE_APROVACAO: 23
};
const disponibilidadeIds = {
  CARGA: 1,
  EMPRESTIMO: 2
};

function getRandom<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function pad(value: number, length = 3) {
  return String(value).padStart(length, '0');
}

function randomDateInPast(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * days));
  return date;
}

function randomDateInFuture(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(Math.random() * days));
  return date;
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

    let equipamentoSequence = 1;

    for (const secao of secoes) {
      for (let index = 1; index <= 20; index++) {
        const patrimonySuffix = pad(index);
        const patrimonio = `AUTO-${batalhao.sigla}-${secao.nome}-${patrimonySuffix}`;
        const tipoEquipamentoId = tipoIds[(equipamentoSequence - 1) % tipoIds.length];

        const isLoan = index % 5 === 0;
        const isMaintenance = index % 7 === 0;
        const isReserve = index % 13 === 0;
        const isDamaged = index % 19 === 0;
        const isMissing = index % 23 === 0;
        const isPendingApproval = index % 17 === 0;

        let statusId = statusIds.ATIVO;
        let disponibilidadeId = disponibilidadeIds.CARGA;
        let dataRetornoEmprestimo = null;
        let dataSolicitacao = null;
        let dataAprovacao = null;
        let solicitante = null;

        if (isLoan) {
          disponibilidadeId = disponibilidadeIds.EMPRESTIMO;
          statusId = statusIds.DISPONÍVEL;
          dataRetornoEmprestimo = randomDateInFuture(40);
          dataSolicitacao = randomDateInPast(30);
          dataAprovacao = randomDateInPast(20);
          solicitante = `Usuário ${batalhao.sigla}`;
        } else if (isMaintenance) {
          statusId = statusIds['MANUTENÇÃO'];
          disponibilidadeId = disponibilidadeIds.CARGA;
        } else if (isReserve) {
          statusId = statusIds.RESERVA;
          disponibilidadeId = disponibilidadeIds.CARGA;
        } else if (isDamaged) {
          statusId = statusIds.DANO;
          disponibilidadeId = disponibilidadeIds.CARGA;
        } else if (isMissing) {
          statusId = statusIds.EXTRAVIADO;
          disponibilidadeId = disponibilidadeIds.CARGA;
        } else if (isPendingApproval) {
          statusId = statusIds.PENDENTE_APROVACAO;
          disponibilidadeId = disponibilidadeIds.CARGA;
        } else {
          statusId = statusIds.ATIVO;
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
            secaoId: secao.id,
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

        if (isLoan && defaultUserId) {
          const destino = secoes[(secoes.indexOf(secao) + 1) % secoes.length];
          await prisma.transferencia.create({
            data: {
              equipamentoId: equipamento.id,
              origemId: secao.id,
              destinoId: destino.id,
              solicitanteId: defaultUserId,
              status: index % 2 === 0 ? 'CONCLUIDA' : 'PENDENTE',
              observacao: `Transferência auto-gerada para ${patrimonio}`,
              dataEnvio: randomDateInPast(40),
              dataRecebimento: index % 2 === 0 ? randomDateInPast(10) : null
            }
          });
        }

        equipamentoSequence++;
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

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Encontrar referências
  const tipo = await prisma.tipoEquipamento.findFirst({ where: { nome: 'RÁDIO PORTÁTIL' } }) 
            || await prisma.tipoEquipamento.findFirst();
  const marca = await prisma.marca.findFirst({ where: { nome: 'MOTOROLA' } })
            || await prisma.marca.findFirst();
  const status = await prisma.statusEquipamento.findFirst({ where: { nome: 'ATIVO' } })
            || await prisma.statusEquipamento.findFirst();
  const disp = await prisma.disponibilidade.findFirst({ where: { nome: 'DISPONÍVEL' } })
            || await prisma.disponibilidade.findFirst();
  const secao = await prisma.secao.findFirst({ where: { sigla: 'DTEC' } })
            || await prisma.secao.findFirst();
  const secaoDestino = await prisma.secao.findFirst({ where: { sigla: { not: secao?.sigla } } })
            || secao;

  if (!secao || !tipo || !status || !disp) {
    console.error('Não foi possível encontrar dados básicos no banco.');
    return;
  }

  const patrimonio = 'TESTE-FLOW-' + Date.now();

  // 2. Criar Equipamento de Teste
  const eq = await prisma.equipamento.create({
    data: {
      patrimonio,
      numeroSerie: 'SN-TESTE-123',
      sei: '0000.TESTE.2026',
      tipoEquipamentoId: tipo.id,
      marcaId: marca?.id,
      statusId: status.id,
      disponibilidadeId: disp.id,
      secaoId: secao.id,
      observacao: 'ITEM DE TESTE PARA VALIDAR FLUXO DE TRANSFERÊNCIA E APROVAÇÃO.'
    }
  });

  console.log('ITEM_CRIADO:', eq.id, eq.patrimonio);
  console.log('SECAO_ORIGEM:', secao.sigla, secao.id);
  console.log('SECAO_DESTINO:', secaoDestino?.sigla, secaoDestino?.id);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

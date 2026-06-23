import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tipo = await prisma.tipoEquipamento.findFirst();
  const marca = await prisma.marca.findFirst();
  const status = await prisma.statusEquipamento.findFirst();
  const disp = await prisma.disponibilidade.findFirst();
  const secao = await prisma.secao.findFirst();

  console.log('TIPO:', tipo?.id, tipo?.nome);
  console.log('MARCA:', marca?.id, marca?.nome);
  console.log('STATUS:', status?.id, status?.nome);
  console.log('DISP:', disp?.id, disp?.nome);
  console.log('SECAO:', secao?.id, secao?.sigla);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

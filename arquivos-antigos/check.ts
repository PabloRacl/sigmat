import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  console.log(await prisma.statusEquipamento.findMany());
}
main().finally(() => prisma.$disconnect());

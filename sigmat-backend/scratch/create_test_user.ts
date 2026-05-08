import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  let secao = await prisma.secao.findFirst({
    where: { sigla: 'A DEFINIR' }
  });

  if (!secao) {
    // Create it if it doesn't exist
    secao = await prisma.secao.create({
      data: {
        sigla: 'A DEFINIR',
        nome: 'A DEFINIR'
      }
    });
  }

  const user = await prisma.usuario.upsert({
    where: { login: 'testabatalhao' },
    update: {
      secaoId: secao.id,
      batalhaoId: secao.batalhaoId,
      perfil: 'USUARIO_BATALHAO'
    },
    create: {
      login: 'testabatalhao',
      matricula: '12345678',
      nome: 'Usuário Batalhão Teste',
      email: 'testabatalhao@pm.pe.gov.br',
      postoGraduacao: 'Soldado',
      perfil: 'USUARIO_BATALHAO',
      secaoId: secao.id,
      batalhaoId: secao.batalhaoId
    }
  });

  console.log("User successfully created/updated:", user);
}

main().catch(console.error).finally(() => prisma.$disconnect());

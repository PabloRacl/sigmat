
import { PrismaClient, PerfilUsuario } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Populando banco de dados manualmente...');

  // Diretorias
  const dir1 = await prisma.diretoria.upsert({
    where: { sigla: 'DTEC' },
    update: {},
    create: { sigla: 'DTEC', nome: 'Diretoria de Tecnologia' }
  });

  // Batalhões
  const bat1 = await prisma.batalhao.upsert({
    where: { sigla: '1BPM' },
    update: {},
    create: { sigla: '1BPM', nome: '1º Batalhão', diretoriaId: dir1.id }
  });

  // Seções
  const sec1 = await prisma.secao.upsert({
    where: { sigla: 'SEC-DTEC' },
    update: {},
    create: { sigla: 'SEC-DTEC', nome: 'Seção de Informática', diretoriaId: dir1.id }
  });

  const sec2 = await prisma.secao.upsert({
    where: { sigla: 'SEC-1BPM' },
    update: {},
    create: { sigla: 'SEC-1BPM', nome: 'Seção de Logística 1BPM', batalhaoId: bat1.id }
  });

  // Usuário Pablo
  await prisma.usuario.upsert({
    where: { login: 'pablo.ricardo' },
    update: { perfil: PerfilUsuario.ADMIN_DTEC, secaoId: sec1.id },
    create: {
      login: 'pablo.ricardo',
      matricula: '123456',
      nome: 'Pablo Ricardo',
      email: 'pablo.ricardo@pm.pe.gov.br',
      perfil: PerfilUsuario.ADMIN_DTEC,
      secaoId: sec1.id
    }
  });

  // Tipos
  const tipoCel = await prisma.tipoEquipamento.upsert({
    where: { nome: 'Celular' },
    update: {},
    create: { nome: 'Celular' }
  });

  // Marcas
  const marcaSamsung = await prisma.marca.upsert({
    where: { nome: 'Samsung' },
    update: {},
    create: { nome: 'Samsung' }
  });

  // Status
  const statusAtivo = await prisma.statusEquipamento.upsert({
    where: { nome: 'Ativo' },
    update: {},
    create: { nome: 'Ativo' }
  });

  // Disponibilidade
  const dispDisp = await prisma.disponibilidade.upsert({
    where: { nome: 'Disponível' },
    update: {},
    create: { nome: 'Disponível' }
  });

  await prisma.disponibilidade.upsert({
    where: { nome: 'Empréstimo' },
    update: {},
    create: { nome: 'Empréstimo' }
  });

  await prisma.statusEquipamento.upsert({
    where: { nome: 'Manutenção' },
    update: {},
    create: { nome: 'Manutenção' }
  });


  // Equipamentos (Celulares para DTEC)
  for (let i = 1; i <= 55; i++) {
    await prisma.equipamento.upsert({
      where: { patrimonio: `CEL-DTEC-${100 + i}` },
      update: {},
      create: {
        patrimonio: `CEL-DTEC-${100 + i}`,
        numeroSerie: `SN-${1000 + i}`,
        tipoEquipamentoId: tipoCel.id,
        marcaId: marcaSamsung.id,
        statusId: statusAtivo.id,
        disponibilidadeId: dispDisp.id,
        secaoId: sec1.id,
        valor: 1200
      }
    });
  }

  console.log('Seed manual finalizado! 55 celulares criados na DTEC.');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('Buscando usuário Pablo Ricardo...');
  const users = await prisma.usuario.findMany({
    where: {
      nome: { contains: 'Pablo', mode: 'insensitive' }
    }
  });

  console.log('Usuários encontrados:', users);

  for (const u of users) {
    await prisma.usuario.update({
      where: { id: u.id },
      data: { perfil: 'ADMIN_DTEC' }
    });
    console.log(`✅ Usuário ${u.nome} elevado a ADMIN_DTEC!`);
  }

  await prisma.$disconnect();
}

main();

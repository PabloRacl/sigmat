const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.usuario.findFirst({ orderBy: { id: 'desc' } }).then(u => {
  console.log(u.id, u.login);
  prisma.$disconnect();
});

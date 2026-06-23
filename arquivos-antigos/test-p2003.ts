import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { PrismaService } from './src/banco-dados/prisma.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  
  try {
    const os = await prisma.ordemServico.findFirst({ select: { equipamentoId: true }});
    if (os) {
      await prisma.equipamento.delete({ where: { id: os.equipamentoId } });
    }
  } catch (error: any) {
    console.log('Error meta:', error.meta);
    console.log('Error code:', error.code);
  }
  
  await app.close();
}
bootstrap();

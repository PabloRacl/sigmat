import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurações globais
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Habilita CORS para o frontend local e produção
  app.enableCors();

  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  console.log(`\n🚀 Servidor Backend SIGMAT rodando localmente!`);
  console.log(`📡 URL: http://localhost:${port}`);
  console.log(`📝 Documentação Swagger: http://localhost:${port}/api\n`);
}

bootstrap();

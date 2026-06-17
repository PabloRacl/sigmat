import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './comum/filtros/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurações globais
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Habilita CORS para o frontend local e produção
  app.enableCors();

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`\n🚀 Servidor Backend ATLAS rodando localmente!`);
  console.log(`📡 URL: http://localhost:${port}`);
  console.log(`📝 Documentação Swagger: http://localhost:${port}/api\n`);
}

bootstrap();

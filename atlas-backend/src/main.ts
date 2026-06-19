import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './comum/filtros/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ConfiguraÃ§Ãµes globais
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Habilita CORS para o frontend local e produÃ§Ã£o
  app.enableCors();

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`\nðŸš€ Servidor Backend atlas rodando localmente!`);
  console.log(`ðŸ“¡ URL: http://localhost:${port}`);
  console.log(`ðŸ“ DocumentaÃ§Ã£o Swagger: http://localhost:${port}/api\n`);
}

bootstrap();

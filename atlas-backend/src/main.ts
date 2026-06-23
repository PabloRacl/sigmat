import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './comum/filtros/global-exception.filter';
import * as express from 'express';
import { join } from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Servir arquivos estáticos do diretório de uploads
  app.use('/uploads/equipamentos', express.static(join(process.cwd(), 'uploads', 'equipamentos')));
  app.use('/uploads/materiais', express.static(join(process.cwd(), 'uploads', 'equipamentos')));
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

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

  const config = new DocumentBuilder()
    .setTitle('ATLAS API')
    .setDescription('API do Sistema de Gestão Patrimonial ATLAS da PMPE')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`\n🚀 Servidor Backend atlas rodando localmente!`);
  console.log(`📡 URL: http://localhost:${port}`);
  console.log(`📝 Documentação Swagger: http://localhost:${port}/api\n`);
}

bootstrap();

// trigger restart

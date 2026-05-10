import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { join } from 'path';
import * as express from 'express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function inicializarApp() {
  const logger = new Logger('Bootstrap');
  logger.log('Iniciando aplicação SIGMAT (Version Debug 1.0.2)...');

  const app = await NestFactory.create(AppModule);

  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  app.enableCors({
    origin: [
      'https://sigmat.vercel.app',
      'http://localhost:4200',
      'http://127.0.0.1:4200'
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  const config = new DocumentBuilder()
    .setTitle('SIGMAT V2 - API')
    .setDescription('Documentação da API do Sistema de Gestão de Materiais e Tecnologias da PMPE')
    .setVersion('2.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(port, '0.0.0.0');
  logger.log(`Servidor rodando na porta ${port} - SIGMAT Pronto.`);
}
inicializarApp();

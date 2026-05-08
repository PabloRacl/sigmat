import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import * as express from 'express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { PrismaService } from './database/prisma.service';

async function inicializarApp() {
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

  // NestJS 10+ e Prisma 5+ gerenciam o shutdown automaticamente

  await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
}
inicializarApp();







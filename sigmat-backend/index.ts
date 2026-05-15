import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

const server = express();
let cachedApp: any;

export const bootstrap = async (expressInstance: any) => {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressInstance),
  );

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors();

  await app.init();
  return app;
};

export default async (req: any, res: any) => {
  try {
    if (!cachedApp) {
      console.log('Iniciando Bootstrap do NestJS...');
      cachedApp = await bootstrap(server);
      console.log('Bootstrap concluído com sucesso.');
    }
    return server(req, res);
  } catch (err: any) {
    console.error('ERRO CRÍTICO NO VERCEL:', err);
    res.status(500).json({
      error: 'Falha na inicialização do servidor (Bootstrap Failed)',
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      db_configured: !!process.env.DATABASE_URL
    });
  }
};

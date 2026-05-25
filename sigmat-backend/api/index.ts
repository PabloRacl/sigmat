import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

const server = express();
let cachedApp: any;

// ── CORS manual: garante headers mesmo em caso de erro no bootstrap ──────────
const ALLOWED_ORIGINS = [
  'https://sigmat.vercel.app',
  'http://localhost:4200',
  'http://localhost:3000',
];

server.use((req: any, res: any, next: any) => {
  const origin = req.headers.origin;
  if (!origin || ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

export const bootstrap = async (expressInstance: any) => {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressInstance),
  );

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  await app.init();
  return app;
};

export default async (req: any, res: any) => {
  try {
    if (!cachedApp) {
      console.log('Iniciando Bootstrap do NestJS no Vercel (api/index.ts)...');
      cachedApp = await bootstrap(server);
      console.log('Bootstrap concluído com sucesso.');
    }
    return server(req, res);
  } catch (err: any) {
    console.error('ERRO CRÍTICO NO VERCEL:', err);
    res.status(500).json({
      error: 'Falha na inicialização do servidor (Bootstrap Failed)',
      message: err.message,
      db_configured: !!process.env.DATABASE_URL,
    });
  }
};


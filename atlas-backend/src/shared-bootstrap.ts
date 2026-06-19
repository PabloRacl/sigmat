import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import type { Express } from 'express';

export const ALLOWED_ORIGINS = [
  'https://atlas.vercel.app',
  'http://localhost:4200',
  'http://localhost:3000',
];

export function createCorsMiddleware() {
  return (req: any, res: any, next: any) => {
    const origin = req.headers.origin;
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization',
    );
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    next();
  };
}

export async function bootstrapNestjs(expressInstance: Express) {
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
}

export function createErrorHandler(req: any, res: any) {
  return (err: any) => {
    console.error('ERRO CRITICO NO BOOTSTRAP:', err);
    const origin = req.headers.origin;
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization',
    );
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.status(500).json({
      error: 'Falha na inicializacao do servidor (Bootstrap Failed)',
      message: err.message,
      db_configured: !!process.env.DATABASE_URL,
      mock_auth: process.env.USE_MOCK_AUTH,
    });
  };
}

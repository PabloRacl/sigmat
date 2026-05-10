import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
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
      cachedApp = await bootstrap(server);
    }
    server(req, res);
  } catch (err: any) {
    console.error('ERRO NO VERCEL:', err);
    res.status(500).json({
      error: 'Crashed during bootstrap',
      message: err.message,
      stack: err.stack,
      env_check: {
        has_db_url: !!process.env.DATABASE_URL,
        db_url_length: process.env.DATABASE_URL?.length || 0
      }
    });
  }
};

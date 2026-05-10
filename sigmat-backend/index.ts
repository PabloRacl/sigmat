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
      cachedApp = await bootstrap(server);
    }
    server(req, res);
  } catch (err: any) {
    console.error('VERCEL_CRASH:', err);
    res.status(500).json({
      error: 'Bootstrap Failed',
      message: err.message,
      check: { db: !!process.env.DATABASE_URL }
    });
  }
};

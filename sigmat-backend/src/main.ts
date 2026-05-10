import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

let cachedApp: any;

async function bootstrap() {
  const expressApp = express();
  const nestApp = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
  );

  nestApp.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  nestApp.enableCors();

  await nestApp.init();
  return expressApp;
}

export default async (req: any, res: any) => {
  try {
    if (!cachedApp) {
      cachedApp = await bootstrap();
    }
    cachedApp(req, res);
  } catch (err: any) {
    res.status(500).json({
      error: 'Falha na inicialização do NestJS no Vercel',
      message: err.message,
      env_check: {
        has_db_url: !!process.env.DATABASE_URL,
      }
    });
  }
};

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

// Variável global para cache da instância do NestJS (Crucial para Vercel)
let cachedApp: any;

async function bootstrap() {
  if (!cachedApp) {
    const expressApp = express();
    const nestApp = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
    );

    nestApp.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    nestApp.enableCors({
      origin: '*', // Temporariamente aberto para facilitar o teste inicial no Vercel
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });

    const config = new DocumentBuilder()
      .setTitle('SIGMAT V2 - API')
      .setVersion('2.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(nestApp, config);
    SwaggerModule.setup('api-docs', nestApp, document);

    await nestApp.init();
    cachedApp = expressApp;
  }
  return cachedApp;
}

// Handler principal para o Vercel
export default async (req: any, res: any) => {
  const app = await bootstrap();
  app(req, res);
};

// Suporte para rodar localmente
if (process.env.NODE_ENV !== 'production') {
  bootstrap().then((app) => {
    const port = process.env.PORT ?? 3001;
    app.listen(port, () => {
      console.log(`[LOCAL] Servidor rodando na porta ${port}`);
    });
  });
}

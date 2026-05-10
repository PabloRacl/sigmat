import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

// Instância do Express que será usada pelo Vercel
const server = express();

async function bootstrap(expressInstance: any) {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressInstance),
  );

  // Configurações globais (CORS, Pipes, etc.)
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

  // Swagger apenas se necessário
  const config = new DocumentBuilder()
    .setTitle('SIGMAT V2 - API')
    .setVersion('2.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // Inicializa o app NestJS sem chamar o listen() (quem controla o listen é o Vercel ou o modo local)
  await app.init();
}

// Handler para o Vercel
export default async (req: any, res: any) => {
  await bootstrap(server);
  server(req, res);
};

// Código para rodar LOCALMENTE (não afeta o Vercel)
if (process.env.NODE_ENV !== 'production') {
  const localApp = express();
  bootstrap(localApp).then(() => {
    const port = process.env.PORT ?? 3001;
    localApp.listen(port, () => {
      console.log(`[LOCAL] Servidor rodando na porta ${port}`);
    });
  });
}

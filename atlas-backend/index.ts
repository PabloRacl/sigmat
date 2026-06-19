import 'dotenv/config';
import 'reflect-metadata';
import express from 'express';
import { createCorsMiddleware, bootstrapNestjs, createErrorHandler } from './src/shared-bootstrap';

const server = express();
let cachedApp: any;

server.use(createCorsMiddleware());

export default async (req: any, res: any) => {
  try {
    if (!cachedApp) {
      console.log('Iniciando Bootstrap do NestJS...');
      cachedApp = await bootstrapNestjs(server);
      console.log('Bootstrap concluido com sucesso.');
    }
    return server(req, res);
  } catch (err: any) {
    createErrorHandler(req, res)(err);
  }
};

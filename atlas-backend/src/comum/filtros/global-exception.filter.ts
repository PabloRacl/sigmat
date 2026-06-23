import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Erro interno do servidor';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any).message || res;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Prisma Error Handling
      switch (exception.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          let campos = 'desconhecido';
          
          if (exception.meta && Array.isArray(exception.meta.target)) {
            campos = exception.meta.target.join(', ');
          } else if (exception.meta && typeof exception.meta.target === 'string') {
            campos = exception.meta.target;
          } else if (exception.message) {
            // Tenta extrair o campo direto da mensagem nativa de erro caso o meta falhe no Driver Adapter
            const match = exception.message.match(/fields?: \(`([^`]+)`\)/i) || exception.message.match(/constraint ".*_([^_]+)_key"/i);
            if (match && match[1]) {
              campos = match[1];
            } else {
              campos = `(ver detalhes: ${exception.message.split('\\n').pop()?.trim() || 'desconhecido'})`;
            }
          }
          
          message = `Já existe um registro cadastrado com o mesmo dado no(s) campo(s): ${campos} (violação de exclusividade).`;
          break;
        case 'P2003':
          status = HttpStatus.BAD_REQUEST;
          let dependencia = 'registros ou dependências no sistema';
          
          if (exception.meta && typeof exception.meta.field_name === 'string') {
            const fName = exception.meta.field_name.toLowerCase();
            if (fName.includes('ordem_servicos') || fName.includes('manutencao')) dependencia = 'Ordens de Serviço';
            else if (fName.includes('transferencias')) dependencia = 'Transferências';
            else if (fName.includes('cautelas') || fName.includes('emprestimo')) dependencia = 'Cautelas/Empréstimos';
            else if (fName.includes('alteracoes_pendentes')) dependencia = 'Solicitações de Alteração Pendentes';
            else if (fName.includes('log_operacoes') || fName.includes('auditoria')) dependencia = 'Registros de Auditoria';
          } else if (exception.message) {
             const fName = exception.message.toLowerCase();
             if (fName.includes('ordem_servicos')) dependencia = 'Ordens de Serviço';
             else if (fName.includes('transferencias')) dependencia = 'Transferências';
             else if (fName.includes('cautelas') || fName.includes('emprestimo')) dependencia = 'Cautelas/Empréstimos';
          }
          
          message = `A operação foi bloqueada para proteger o histórico. Não é possível apagar pois há ${dependencia} atrelados a este registro.`;
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'O registro solicitado não foi encontrado no banco de dados.';
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          message = `Erro no banco de dados: código ${exception.code}.`;
      }
      this.logger.warn(`PrismaException (Code: ${exception.code}): ${message}`);
    } else if (exception instanceof Error) {
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack,
      );
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: message,
    });
  }
}

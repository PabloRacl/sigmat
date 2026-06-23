import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../banco-dados/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    try {
      // Tenta executar uma query ultra-leve para validar se o DB está vivo
      await this.prisma.$queryRaw`SELECT 1`;
      
      return {
        status: 'ok',
        database: 'up',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      // Lança erro 503 se o DB não responder, ativando alertas do orquestrador
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'down',
        timestamp: new Date().toISOString(),
        details: error.message,
      });
    }
  }
}

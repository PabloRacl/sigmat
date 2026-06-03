import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let servico: PrismaService;

  beforeEach(async () => {
    const modulo: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    servico = modulo.get<PrismaService>(PrismaService);
  });

  it('deve estar definido', () => {
    expect(servico).toBeDefined();
  });
});






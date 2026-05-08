import { Test, TestingModule } from '@nestjs/testing';
import { SeiService } from './sei.service';

describe('SeiService', () => {
  let servico: SeiService;

  beforeEach(async () => {
    const modulo: TestingModule = await Test.createTestingModule({
      providers: [SeiService],
    }).compile();

    servico = modulo.get<SeiService>(SeiService);
  });

  it('deve estar definido', () => {
    expect(servico).toBeDefined();
  });
});






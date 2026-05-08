import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('raiz', () => {
    it('deve retornar "Olá Mundo! - SIGMAT PMPE API rodando."', () => {
      expect(appController.obterSaudacao()).toBe('Olá Mundo! - SIGMAT PMPE API rodando.');
    });
  });
});






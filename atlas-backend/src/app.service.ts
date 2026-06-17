import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  obterSaudacao(): string {
    return 'Olá Mundo! - ATLAS PMPE API rodando (v1.0.3).';
  }
}






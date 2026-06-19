import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  obterSaudacao(): string {
    return 'OlÃ¡ Mundo! - atlas PMPE API rodando (v1.0.3).';
  }
}

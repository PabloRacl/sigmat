import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SeiService {
  private readonly logger = new Logger(SeiService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Simula a autenticação com a API do SEI.
   * Em produção, isso faria uma chamada POST para o endpoint do SEI.
   */
  async autenticarComSei(usuario: string, senha: string) {
    const seiUrl = this.configService.get<string>('SEI_API_URL');
    
    this.logger.log(`Tentando autenticar usuário ${usuario} no SEI...`);

    // Simulação de chamada externa
    // const response = await firstValueFrom(this.httpService.post(`${seiUrl}/login`, { usuario, senha }));
    
    if (usuario === 'testabatalhao') {
      return {
        sucesso: true,
        dados: {
          login: usuario,
          matricula: '12345678',
          nome: 'Usuário Batalhão Teste',
          email: `${usuario}@pm.pe.gov.br`,
          unidade: 'A DEFINIR',
          postoGraduacao: 'Soldado',
          perfil: 'USUARIO_BATALHAO',
        }
      };
    }

    // Mock de resposta para desenvolvimento (ACEITA QUALQUER SENHA)
    return {
      sucesso: true,
      dados: {
        login: usuario,
        matricula: usuario === 'pablo.ricardo' ? '123456' : '7654321',
        nome: usuario === 'pablo.ricardo' ? 'Pablo Ricardo' : 'Usuário Policial de Teste',
        email: `${usuario}@pm.pe.gov.br`,
        unidade: 'DTEC',
        postoGraduacao: 'Capitão',
        perfil: 'ADMIN_DTEC',
      }
    };
  }
}






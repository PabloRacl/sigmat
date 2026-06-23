import { Controller, Post, UseInterceptors, UploadedFile, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportacaoService } from './importacao.service';
import { JwtAuthGuard } from '../acesso/guardas/jwt-autenticacao.guard';

@ApiTags('Importação em Lote')
@ApiBearerAuth()
@Controller('importacao')
@UseGuards(JwtAuthGuard)
export class ImportacaoController {
  constructor(private readonly importacaoService: ImportacaoService) {}

  @Post('equipamentos')
  @ApiOperation({ summary: 'Importar equipamentos em lote via arquivo Excel/CSV' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        arquivo: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('arquivo'))
  async importarEquipamentos(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any
  ) {
    // O usuário que enviou a planilha (pego do Token de Autenticação)
    const usuarioId = req.user.userId;
    
    // Entrega o arquivo e a identidade do usuário para o Motor de Ingestão (ETL)
    return await this.importacaoService.processarPlanilhaExcel(file, usuarioId);
  }
}

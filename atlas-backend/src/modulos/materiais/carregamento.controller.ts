import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { JwtAuthGuard } from '../acesso/guardas/jwt-autenticacao.guard';
import { existsSync, mkdirSync } from 'fs';
import { Request } from 'express';

@ApiTags('Uploads (Carregamento de Fotos)')
@ApiBearerAuth()
@Controller('upload')
@UseGuards(JwtAuthGuard)
export class CarregamentoController {
  @Post('equipamento')
  @ApiOperation({ summary: 'Fazer upload de foto do equipamento' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req: Request, file: Express.Multer.File, cb: any) => {
          const uploadPath = join(process.cwd(), 'uploads', 'equipamentos');
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req: Request, file: Express.Multer.File, cb: any) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `eq-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req: Request, file: Express.Multer.File, cb: any) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
          return cb(
            new BadRequestException('Apenas imagens (JPG, PNG) são permitidas'),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  uploadFoto(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('Arquivo não enviado');
    }
    // Retorna a URL relativa para salvar no banco
    return {
      url: `/uploads/equipamentos/${file.filename}`,
      originalName: file.originalname,
    };
  }
}

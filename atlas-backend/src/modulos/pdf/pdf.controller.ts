import { Controller, Post, Body, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PdfService } from './pdf.service';

@Controller('pdf')
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Post('cautela')
  async gerarCautela(@Body() item: any, @Res() res: Response) {
    try {
      const buffer = await this.pdfService.gerarCautela(item);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="cautela_${item.patrimonio}_${new Date().toISOString().slice(0, 10)}.pdf"`,
      );
      res.send(buffer);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  @Post('etiqueta')
  async gerarEtiqueta(@Body() item: any, @Res() res: Response) {
    try {
      const buffer = await this.pdfService.gerarEtiqueta(item);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="etiqueta_${item.patrimonio}_${new Date().getTime()}.pdf"`,
      );
      res.send(buffer);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  @Post('tabela')
  async gerarTabelaPDF(
    @Body()
    data: {
      titulo: string;
      subtitulo: string;
      colunas: string[];
      linhas: string[][];
    },
    @Res() res: Response,
  ) {
    try {
      const buffer = await this.pdfService.gerarTabelaPDF(
        data.titulo,
        data.subtitulo,
        data.colunas,
        data.linhas,
      );
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="relatorio_${new Date().toISOString().slice(0, 10)}.pdf"`,
      );
      res.send(buffer);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

import { Controller, Post, Body, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';
import { PdfService } from './pdf.service';

@ApiTags('Geração de PDF e Etiquetas')
@Controller('pdf')
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Post('cautela')
  @ApiOperation({ summary: 'Gerar termo de cautela em PDF' })
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
  @ApiOperation({ summary: 'Gerar etiqueta de patrimônio em PDF' })
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
  @ApiOperation({ summary: 'Gerar tabela customizada para relatórios PDF' })
  async gerarTabelaPDF(
    @Body()
    data: {
      titulo: string;
      fiscal?: string;
      matricula?: string;
      ome?: string;
      grupos: {
        tituloGeral?: string;
        operacao?: string;
        local?: string;
        omeBeneficiada?: string;
        omeCedente?: string;
        evento?: string;
        data?: string;
        periodo?: string;
        modalidade?: string;
        colunas: string[];
        linhas: string[][];
      }[];
    },
    @Res() res: Response,
  ) {
    try {
      const buffer = await this.pdfService.gerarTabelaPDF(data);
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

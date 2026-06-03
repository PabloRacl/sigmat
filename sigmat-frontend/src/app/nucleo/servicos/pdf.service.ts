import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class PdfService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api';

  async gerarCautela(item: any) {
    try {
      const response = await this.http
        .post(`${this.apiUrl}/pdf/cautela`, item, { responseType: 'blob' })
        .toPromise();

      if (response) {
        this.downloadBlob(response, `cautela_${item.patrimonio}_${new Date().toISOString().slice(0, 10)}.pdf`);
      }
    } catch (error) {
      console.error('Erro ao gerar cautela:', error);
    }
  }

  async gerarCautelaColetiva(itens: any[]) {
    try {
      const data = {
        titulo: 'Cautela Coletiva de Materiais',
        subtitulo: `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')} | Total: ${itens.length} itens`,
        colunas: ['Patrimônio', 'Tipo', 'Marca', 'Série', 'Seção'],
        linhas: itens.map(it => [
          it.patrimonio || '',
          it.tipoEquipamento?.nome || '',
          it.marca?.nome || '',
          it.numeroSerie || '',
          it.secao?.sigla || ''
        ])
      };

      const response = await this.http
        .post(`${this.apiUrl}/pdf/tabela`, data, { responseType: 'blob' })
        .toPromise();

      if (response) {
        this.downloadBlob(response, `cautela_coletiva_${new Date().getTime()}.pdf`);
      }
    } catch (error) {
      console.error('Erro ao gerar cautela coletiva:', error);
    }
  }

  async gerarEtiquetas(itens: any[]) {
    try {
      for (const item of itens) {
        const response = await this.http
          .post(`${this.apiUrl}/pdf/etiqueta`, item, { responseType: 'blob' })
          .toPromise();

        if (response) {
          this.downloadBlob(response, `etiqueta_${item.patrimonio}_${new Date().getTime()}.pdf`);
        }
      }
    } catch (error) {
      console.error('Erro ao gerar etiquetas:', error);
    }
  }

  async gerarTabelaPDF(titulo: string, subtitulo: string, colunas: string[], linhas: string[][]) {
    try {
      const data = { titulo, subtitulo, colunas, linhas };

      const response = await this.http
        .post(`${this.apiUrl}/pdf/tabela`, data, { responseType: 'blob' })
        .toPromise();

      if (response) {
        this.downloadBlob(response, `relatorio_${new Date().getTime()}.pdf`);
      }
    } catch (error) {
      console.error('Erro ao gerar tabela PDF:', error);
    }
  }

  private downloadBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }
}


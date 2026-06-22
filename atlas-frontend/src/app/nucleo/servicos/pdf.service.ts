import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environment';

@Injectable({ providedIn: 'root' })
export class PdfService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  private headers() {
    const token = localStorage.getItem('atlas_token');
    return { headers: { Authorization: `Bearer ${token}`, Accept: 'application/pdf' } };
  }

  async gerarCautela(item: Record<string, any>) {
    try {
      const response = await this.http
        .post(`${this.apiUrl}/pdf/cautela`, item, { responseType: 'blob', ...this.headers() })
        .toPromise();

      if (response && response.type && response.type.includes('pdf') && response.size > 0) {
        this.downloadBlob(response, `cautela_${item['patrimonio']}_${new Date().toISOString().slice(0, 10)}.pdf`);
      } else {
        console.error('Resposta não é um PDF válido ou está vazia', response);
      }
    } catch (error) {
      console.error('Erro ao gerar cautela:', error);
    }
  }


  async gerarCautelaColetiva(itens: Record<string, any>[]) {
    try {
      const data = {
        titulo: 'Cautela Coletiva de Materiais',
        subtitulo: `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')} | Total: ${itens.length} itens`,
        colunas: ['Patrimônio', 'Tipo', 'Marca', 'Série', 'Seção'],
        linhas: itens.map(it => [
          (it['patrimonio'] as string) || '',
          (it['tipoEquipamento'] as Record<string, any>)?.['nome'] || '',
          (it['marca'] as Record<string, any>)?.['nome'] || '',
          (it['numeroSerie'] as string) || '',
          (it['secao'] as Record<string, any>)?.['sigla'] || ''
        ])
      };

      const response = await this.http
        .post(`${this.apiUrl}/pdf/tabela`, data, { responseType: 'blob', ...this.headers() })
        .toPromise();

      if (response) {
        this.downloadBlob(response, `cautela_coletiva_${new Date().getTime()}.pdf`);
      }
    } catch (error) {
      console.error('Erro ao gerar cautela coletiva:', error);
    }
  }

  async gerarEtiquetas(itens: Record<string, any>[]): Promise<boolean> {
    try {
      let downloadOccurred = false;
      for (const item of itens) {

        const payload = {
          ...item,
          layout: (item['tipoEquipamento'] as Record<string, any>)?.['nome']?.toLowerCase() === 'celular' ? 'vertical' : 'horizontal'
        };
        const blob = await this.http
          .post(`${this.apiUrl}/pdf/etiqueta`, payload, { responseType: 'blob', ...this.headers() })
          .toPromise();

        console.log('Etiqueta response blob:', blob?.type, blob?.size);


        if (blob && blob.size && blob.size > 0) {
          this.downloadBlob(blob, `etiqueta_${item['patrimonio']}_${new Date().getTime()}.pdf`);
          downloadOccurred = true;
        } else {
          console.error('Resposta não é PDF válida ou está vazia', blob);
        }
      }
      return downloadOccurred;
    } catch (error) {
      console.error('Erro ao gerar etiquetas:', error);
      return false;
    }
  }

  async gerarTabelaPDF(titulo: string, subtitulo: string, colunas: string[], linhas: string[][]) {
    try {
      const data = { titulo, subtitulo, colunas, linhas };

      const response = await this.http
        .post(`${this.apiUrl}/pdf/tabela`, data, { responseType: 'blob', ...this.headers() })
        .toPromise();

      if (response) {
        this.downloadBlob(response, `relatorio_${new Date().getTime()}.pdf`);
      }
    } catch (error) {
      console.error('Erro ao gerar tabela PDF:', error);
    }
  }

  async gerarRelatorioOficial(data: any) {
    try {
      const response = await this.http
        .post(`${this.apiUrl}/pdf/tabela`, data, { responseType: 'blob', ...this.headers() })
        .toPromise();

      if (response) {
        this.downloadBlob(response, `relatorio_pmpe_${new Date().getTime()}.pdf`);
      }
    } catch (error) {
      console.error('Erro ao gerar relatorio PDF:', error);
    }
  }

  private downloadBlob(blob: Blob, fileName: string) {
    // Garantir que o Blob tenha o tipo correto de PDF
    const pdfBlob = blob.type && blob.type.includes('pdf')
      ? blob
      : new Blob([blob], { type: 'application/pdf' });
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }
}


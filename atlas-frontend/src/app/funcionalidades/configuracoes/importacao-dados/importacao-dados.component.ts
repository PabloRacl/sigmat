import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { environment } from '../../../environment';
import * as xlsx from 'xlsx';

@Component({
  selector: 'app-importacao-dados',
  standalone: true,
  imports: [CommonModule, ButtonModule, FileUploadModule, TableModule, CardModule, ToastModule, TagModule],
  providers: [MessageService],
  templateUrl: './importacao-dados.component.html',
  styleUrls: ['./importacao-dados.component.scss']
})
export class ImportacaoDadosComponent {
  
  carregando = false;
  resultadoUpload: any = null;
  
  constructor(private http: HttpClient, private messageService: MessageService) {}

  uploadPlanilha(event: any, fileUploadRef: any) {
    const file = event.files[0];
    if (!file) return;

    this.carregando = true;
    this.resultadoUpload = null;
    
    const formData = new FormData();
    formData.append('arquivo', file);

    this.http.post(`${environment.apiUrl}/importacao/equipamentos`, formData).subscribe({
      next: (res: any) => {
        this.resultadoUpload = res;
        this.messageService.add({ severity: 'success', summary: 'Processamento Concluído', detail: `Importação gerou ${res.sucessos} sucessos e ${res.erros} falhas.` });
        this.carregando = false;
        fileUploadRef.clear();
      },
      error: (err) => {
        const mensagemErro = err.error?.message || 'Erro ao comunicar com o servidor.';
        this.messageService.add({ severity: 'error', summary: 'Falha na Importação', detail: mensagemErro });
        this.carregando = false;
        fileUploadRef.clear();
      }
    });
  }

  baixarTemplate() {
    const colunas = ["PATRIMONIO", "NUMERO_SERIE", "TIPO_EQUIPAMENTO", "MARCA", "MODELO", "BATALHAO", "SECAO", "STATUS", "OBSERVACAO"];
    const csvContent = "data:text/csv;charset=utf-8," + colunas.join(";");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Modelo_Importacao_Atlas.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  baixarTemplateExcel() {
    const colunas = ["PATRIMONIO", "NUMERO_SERIE", "TIPO_EQUIPAMENTO", "MARCA", "MODELO", "BATALHAO", "SECAO", "STATUS", "OBSERVACAO"];
    const ws = xlsx.utils.aoa_to_sheet([colunas]);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Equipamentos");
    xlsx.writeFile(wb, "Modelo_Importacao_Atlas.xlsx");
  }
}

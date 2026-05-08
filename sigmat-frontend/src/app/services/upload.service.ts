import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/upload`;

  uploadFotoEquipamento(file: File): Observable<{ url: string; originalName: string }> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<{ url: string; originalName: string }>(
      `${this.API}/equipamento`, 
      formData
    );
  }

  getUrlCompleta(urlRelativa: string): string {
    if (!urlRelativa) return '';
    if (urlRelativa.startsWith('http')) return urlRelativa;
    return `${environment.apiUrl}${urlRelativa}`;
  }
}



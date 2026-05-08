import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/configuracoes`;

  listarTipos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/tipos`);
  }

  listarMarcas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/marcas`);
  }

  listarModelos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/modelos`);
  }

  listarStatus(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/status`);
  }

  listarDisponibilidades(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/disponibilidades`);
  }

  listarTiposAquisicao(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/tipos-aquisicao`);
  }

  listarSecoes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/secoes`);
  }

  listarBatalhoes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/batalhoes`);
  }
}



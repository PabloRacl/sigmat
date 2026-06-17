import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/usuarios`;

  private headers() {
    const token = localStorage.getItem('atlas_token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  listarTodos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { headers: this.headers() });
  }

  buscarPorId(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, { headers: this.headers() });
  }

  criar(dados: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, dados, { headers: this.headers() });
  }

  atualizar(id: number, dados: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, dados, { headers: this.headers() });
  }

  remover(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers: this.headers() });
  }
}


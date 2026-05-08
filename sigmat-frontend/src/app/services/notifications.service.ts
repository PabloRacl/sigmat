import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApprovalsService } from './approvals.service';
import { AuthService } from './auth.service';
import { io, Socket } from 'socket.io-client';
import { environment } from '../environment';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private approvalsService = inject(ApprovalsService);
  private authService = inject(AuthService);
  
  private pendentesSubject = new BehaviorSubject<number>(0);
  pendentes$ = this.pendentesSubject.asObservable();
  
  private socket!: Socket;

  constructor() {
    this.iniciarConexao();
  }

  private iniciarConexao() {
    this.socket = io(`${environment.apiUrl}/notificacoes`, {
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('🔗 WebSocket conectado (Notificações)');
      const user = this.authService.getUsuario();
      if (user && user.id) {
        this.socket.emit('registrar_usuario', user.id);
      }
      this.atualizarContagem(); // Atualiza ao conectar
    });

    // Escuta eventos genéricos ou específicos do backend
    this.socket.on('atualizar_notificacoes', () => {
      this.atualizarContagem();
    });

    // Fallback: ainda mantém um polling de backup mais longo (a cada 5 min) 
    // caso a conexão WS fique ociosa ou falhe silenciosamente
    setInterval(() => {
      this.atualizarContagem();
    }, 300000);
  }

  atualizarContagem() {
    const user = this.authService.getUsuario();
    if (!user) return; // Só busca se estiver logado

    this.approvalsService.obterContagem().subscribe({
      next: (res: any) => this.pendentesSubject.next(res.total || 0),
      error: () => {}
    });
  }
}



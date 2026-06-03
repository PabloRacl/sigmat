import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApprovalsService } from './aprovacoes.service';
import { TransfersService } from './transferencias.service';
import { AuthService } from './autenticacao.service';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environment';
import { MockModeService } from './modo-mock.service';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private approvalsService = inject(ApprovalsService);
  private transfersService = inject(TransfersService);
  private authService = inject(AuthService);
  private mockMode = inject(MockModeService);
  
  private pendentesSubject = new BehaviorSubject<number>(0);
  pendentes$ = this.pendentesSubject.asObservable();
  
  private socket!: Socket;

  constructor() {
    if (this.mockMode.useMock) {
      this.atualizarContagem();
    } else {
      this.iniciarConexao();
    }
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

    // Fallback
    setInterval(() => {
      this.atualizarContagem();
    }, 300000);
  }

  atualizarContagem() {
    const user = this.authService.getUsuario();
    if (!user) return; 

    if (this.mockMode.useMock) {
      this.pendentesSubject.next(0);
      return;
    }

    forkJoin({
      aprovacoes: this.approvalsService.obterContagem().pipe(catchError(() => of({ total: 0 }))),
      transferencias: this.transfersService.listarPendentes().pipe(catchError(() => of([])))
    }).subscribe(({ aprovacoes, transferencias }) => {
      let total = (aprovacoes as any).total || 0;
      
      const isAdmin = user.perfil === 'ADMIN_DTEC' || user.perfil === 'DIRETORIA';
      const recebidas = isAdmin 
        ? transferencias 
        : (transferencias as any[]).filter(t => t.destinoId === user.secaoId);

      total += recebidas.length;
      this.pendentesSubject.next(total);
    });
  }
}




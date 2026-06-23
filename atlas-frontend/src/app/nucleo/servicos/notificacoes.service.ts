import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApprovalsService } from './aprovacoes.service';
import { TransfersService } from './transferencias.service';
import { MaintenanceService } from './manutencao.service';
import { AuthService } from './autenticacao.service';
import { AccessRequestsFrontendService } from './solicitacoes-acesso.service';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environment';

export interface NotificacaoDetalhes {
  total: number;
  aprovacoes: number;
  transferencias: number;
  manutencao: number;
  acesso: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private approvalsService = inject(ApprovalsService);
  private transfersService = inject(TransfersService);
  private maintenanceService = inject(MaintenanceService);
  private authService = inject(AuthService);
  private accessRequestsService = inject(AccessRequestsFrontendService);


  private pendentesSubject = new BehaviorSubject<NotificacaoDetalhes>({ total: 0, aprovacoes: 0, transferencias: 0, manutencao: 0, acesso: 0 });
  pendentes$ = this.pendentesSubject.asObservable();

  private socket!: Socket;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.iniciarConexao();
  }

  private iniciarConexao() {
    this.socket = io(`${environment.apiUrl}/notificacoes`, {
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('WebSocket conectado (Notificações)');
      const user = this.authService.getUsuario();
      if (user && user.id) {
        this.socket.emit('registrar_usuario', user.id);
      }
      this.atualizarContagem();
    });

    this.socket.on('atualizar_notificacoes', () => {
      this.atualizarContagem();
    });

    this.intervalId = setInterval(() => {
      this.atualizarContagem();
    }, 300000);
  }

  atualizarContagem() {
    const user = this.authService.getUsuario();
    if (!user) return;



    const isAdminDtec = user.perfil === 'ADMIN_DTEC';
    const isAdmin = isAdminDtec || user.perfil === 'DIRETORIA';

    forkJoin({
      aprovacoes: this.approvalsService.obterContagem().pipe(catchError(() => of({ total: 0 }))),
      transferencias: this.transfersService.listarPendentes().pipe(catchError(() => of([]))),
      manutencao: this.maintenanceService.contarPendentes().pipe(catchError(() => of({ total: 0 }))),
      acesso: isAdminDtec ? this.accessRequestsService.listarPendentes().pipe(catchError(() => of([]))) : of([]),
    }).subscribe(({ aprovacoes, transferencias, manutencao, acesso }) => {
      const totalAprovacoes = (aprovacoes as { total?: number }).total || 0;

      const transferenciasList = transferencias as { destinoId?: number }[];
      const recebidas = isAdmin
        ? transferenciasList.length
        : transferenciasList.filter(t => t.destinoId === user.secaoId).length;

      const totalManutencao = (manutencao as { total?: number }).total || 0;
      const totalAcesso = (acesso as unknown[]).length;

      this.pendentesSubject.next({
        total: totalAprovacoes + recebidas + totalManutencao + totalAcesso,
        aprovacoes: totalAprovacoes,
        transferencias: recebidas,
        manutencao: totalManutencao,
        acesso: totalAcesso,
      });
    });
  }
}




import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  },
  namespace: 'notificacoes',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private logger: Logger = new Logger('NotificationsGateway');
  private userSockets: Map<number, string[]> = new Map();

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
    // Remover o socket ID do mapa de usuários
    for (const [userId, sockets] of this.userSockets.entries()) {
      const index = sockets.indexOf(client.id);
      if (index !== -1) {
        sockets.splice(index, 1);
        if (sockets.length === 0) {
          this.userSockets.delete(userId);
        }
        break;
      }
    }
  }

  @SubscribeMessage('registrar_usuario')
  handleRegister(client: Socket, userId: number) {
    this.logger.log(`Registrando usuário ${userId} para o socket ${client.id}`);
    const sockets = this.userSockets.get(userId) || [];
    sockets.push(client.id);
    this.userSockets.set(userId, sockets);
  }

  /**
   * Envia uma notificação para um usuário específico
   */
  enviarParaUsuario(userId: number, evento: string, payload: any) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.forEach((socketId) => {
        this.server.to(socketId).emit(evento, payload);
      });
    }
  }

  /**
   * Envia uma notificação para todos os usuários
   */
  enviarParaTodos(evento: string, payload: any) {
    this.server.emit(evento, payload);
  }
}

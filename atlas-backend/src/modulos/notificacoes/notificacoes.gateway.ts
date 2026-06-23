import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../banco-dados/prisma.service';

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
  // Mantemos o mapa para mensagens diretas (enviarParaUsuario)
  private userSockets: Map<number, string[]> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
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
  async handleRegister(client: Socket, userId: number) {
    this.logger.log(`Registrando usuário ${userId} para o socket ${client.id}`);
    const sockets = this.userSockets.get(userId) || [];
    sockets.push(client.id);
    this.userSockets.set(userId, sockets);

    // Buscar informações do usuário para alocá-lo em rooms específicos
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      include: { secao: true }
    });

    if (user) {
      if (user.perfil === 'ADMIN_DTEC') {
        client.join('admin_dtec');
        this.logger.log(`Socket ${client.id} entrou na room: admin_dtec`);
      }

      const batalhaoId = user.batalhaoId || user.secao?.batalhaoId;
      if (batalhaoId) {
        const roomName = `batalhao_${batalhaoId}`;
        client.join(roomName);
        this.logger.log(`Socket ${client.id} entrou na room: ${roomName}`);
      }
    }
  }

  /**
   * Envia uma notificação para um usuário específico
   */
  enviarParaUsuario(userId: number, evento: string, payload: Record<string, any>) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.forEach((socketId) => {
        this.server.to(socketId).emit(evento, payload);
      });
    }
  }

  /**
   * Envia notificação apenas para membros de um batalhão específico
   */
  enviarParaBatalhao(batalhaoId: number, evento: string, payload: Record<string, any>) {
    this.server.to(`batalhao_${batalhaoId}`).emit(evento, payload);
  }

  /**
   * Envia notificação apenas para usuários administradores (DTEC)
   */
  enviarParaAdmin(evento: string, payload: Record<string, any>) {
    this.server.to('admin_dtec').emit(evento, payload);
  }

  /**
   * Envia uma notificação global (apenas quando estritamente necessário)
   */
  enviarParaTodos(evento: string, payload: Record<string, any>) {
    this.server.emit(evento, payload);
  }
}


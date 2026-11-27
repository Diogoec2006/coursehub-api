import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import type { Server, Socket } from 'socket.io';
import { Course } from '../entities/course.entity.js';
import { CourseNotifier } from '../ports/course-notifier.port.js';

/**
 * Sesión 30 · Extensión Tecnológica: WebSockets
 * - Evento: course.updated
 * - Actor: docente propietario
 * - Resultado: notificación en tiempo real a suscriptores conectados
 * - Límite técnico: memoria volátil, no garantiza entrega persistente ni retransmisión offline
 */
@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/courses',
})
export class CoursesGateway
  implements CourseNotifier, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(CoursesGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado al namespace /courses: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado de /courses: ${client.id}`);
  }

  notifyCourseUpdated(course: Course): void {
    if (this.server) {
      this.server.emit('course.updated', {
        event: 'course.updated',
        timestamp: new Date().toISOString(),
        data: {
          id: course.id,
          title: course.title,
          level: course.level,
          teacherId: course.teacherId,
        },
      });
      this.logger.log(`Evento [course.updated] emitido para curso ${course.id}`);
    }
  }
}

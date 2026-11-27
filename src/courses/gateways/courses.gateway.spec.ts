import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CoursesGateway } from './courses.gateway.js';
import { Course } from '../entities/course.entity.js';

describe('Sesión 30 · Extensión Tecnológica (CoursesGateway - WebSockets)', () => {
  let gateway: CoursesGateway;
  let mockServer: any;

  beforeEach(() => {
    gateway = new CoursesGateway();
    mockServer = {
      emit: vi.fn(),
    };
    gateway.server = mockServer;
  });

  it('debe estar definido', () => {
    expect(gateway).toBeDefined();
  });

  it('emite el evento "course.updated" con la información del curso actualizado', () => {
    const course: Course = {
      id: 5,
      title: 'NestJS en Tiempo Real',
      level: 'avanzado',
      teacherId: 10,
    } as Course;

    gateway.notifyCourseUpdated(course);

    expect(mockServer.emit).toHaveBeenCalledWith(
      'course.updated',
      expect.objectContaining({
        event: 'course.updated',
        timestamp: expect.any(String),
        data: {
          id: 5,
          title: 'NestJS en Tiempo Real',
          level: 'avanzado',
          teacherId: 10,
        },
      }),
    );
  });

  it('registra conexiones y desconexiones de clientes sin lanzar excepciones', () => {
    const mockSocket = { id: 'socket-client-123' } as any;
    expect(() => gateway.handleConnection(mockSocket)).not.toThrow();
    expect(() => gateway.handleDisconnect(mockSocket)).not.toThrow();
  });
});

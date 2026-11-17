import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { CoursesController } from '../src/courses/courses.controller.js';
import { CoursesService } from '../src/courses/courses.service.js';
import { AuthGuard } from '../src/auth/guards/auth.guard.js';
import { RolesGuard } from '../src/auth/guards/roles.guard.js';
import { UserRole } from '../src/users/enums/user-role.enum.js';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('Sesión 19 · Roles, Permisos y Propiedad de Recursos (Integration / HTTP)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const JWT_TEST_SECRET = 'secret-key-para-pruebas-de-autorizacion-roles-2026';

  let adminToken: string;
  let teacher1Token: string;
  let teacher2Token: string;
  let studentToken: string;

  // Repositorio simulado en memoria para cursos
  const dbCourses = new Map<number, any>();

  const mockCoursesService = {
    findAll: vi.fn(),
    findOne: vi.fn().mockImplementation((id: number) => {
      const course = dbCourses.get(id);
      if (!course) {
        throw new NotFoundException(`Course with ID ${id} not found`);
      }
      return course;
    }),
    create: vi.fn().mockImplementation((createCourseDto, teacherId) => {
      const id = dbCourses.size + 1;
      const newCourse = { id, ...createCourseDto, teacherId };
      dbCourses.set(id, newCourse);
      return newCourse;
    }),
    update: vi.fn().mockImplementation((id: number, updateDto: any, user?: any) => {
      const course = dbCourses.get(id);
      if (!course) {
        throw new NotFoundException(`Course with ID ${id} not found`);
      }

      // Regla de negocio de la Sesión 19:
      // • Admin: puede modificar cualquier curso.
      // • Docente: solo cursos creados por su cuenta.
      // • Estudiante: no modifica cursos.
      if (user) {
        if (user.role === UserRole.ADMIN) {
          // Permitido
        } else if (user.role === UserRole.TEACHER) {
          const userId = user.id ?? user.sub;
          if (course.teacherId && course.teacherId !== userId) {
            throw new ForbiddenException(
              'No tienes permiso para modificar un curso creado por otro docente',
            );
          }
          if (!course.teacherId) {
            throw new ForbiddenException(
              'No tienes permiso para modificar un curso sin docente asignado',
            );
          }
        } else {
          throw new ForbiddenException(
            'Los estudiantes no tienen permiso para modificar cursos',
          );
        }
      }

      const updated = { ...course, ...updateDto };
      dbCourses.set(id, updated);
      return updated;
    }),
    remove: vi.fn().mockImplementation((id: number) => {
      const course = dbCourses.get(id);
      if (!course) {
        throw new NotFoundException(`Course with ID ${id} not found`);
      }
      dbCourses.delete(id);
      return course;
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: JWT_TEST_SECRET,
          signOptions: { expiresIn: '1h' },
        }),
      ],
      controllers: [CoursesController],
      providers: [
        {
          provide: CoursesService,
          useValue: mockCoursesService,
        },
        AuthGuard,
        RolesGuard,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);

    // Emitimos tokens firmados para cada rol con payload explícito { sub, email, role }
    adminToken = await jwtService.signAsync({
      sub: 1,
      email: 'admin@coursehub.edu',
      role: UserRole.ADMIN,
    });

    teacher1Token = await jwtService.signAsync({
      sub: 10,
      email: 'docente1@coursehub.edu',
      role: UserRole.TEACHER,
    });

    teacher2Token = await jwtService.signAsync({
      sub: 20,
      email: 'docente2@coursehub.edu',
      role: UserRole.TEACHER,
    });

    studentToken = await jwtService.signAsync({
      sub: 99,
      email: 'estudiante@coursehub.edu',
      role: UserRole.STUDENT,
    });

    // Semilla de cursos para pruebas de propiedad:
    // Curso 1 creado por Docente 1 (teacherId: 10)
    dbCourses.set(1, {
      id: 1,
      title: 'Arquitectura Segura NestJS',
      level: 'intermedio',
      teacherId: 10,
    });

    // Curso 2 creado por Docente 2 (teacherId: 20)
    dbCourses.set(2, {
      id: 2,
      title: 'Bases de Datos con TypeORM',
      level: 'avanzado',
      teacherId: 20,
    });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('1. Ruta Administrativa (DELETE /courses/:id) protegida con @Roles(ADMIN)', () => {
    it('Caso 401 Unauthorized: debe rechazar si la solicitud no incluye token JWT', async () => {
      await request(app.getHttpServer())
        .delete('/courses/1')
        .expect(401);
    });

    it('Caso 401 Unauthorized: debe rechazar si el token es alterado o inválido', async () => {
      await request(app.getHttpServer())
        .delete('/courses/1')
        .set('Authorization', 'Bearer token_invalido_123')
        .expect(401);
    });

    it('Caso 403 Forbidden: debe rechazar con 403 si el usuario tiene rol TEACHER (no tiene permiso administrativo)', async () => {
      await request(app.getHttpServer())
        .delete('/courses/1')
        .set('Authorization', `Bearer ${teacher1Token}`)
        .expect(403);
    });

    it('Caso 403 Forbidden: debe rechazar con 403 si el usuario tiene rol STUDENT (no tiene permiso administrativo)', async () => {
      await request(app.getHttpServer())
        .delete('/courses/1')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('Caso Permitido (200 OK): debe permitir la eliminación si el usuario tiene rol ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .delete('/courses/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', 1);
      expect(mockCoursesService.remove).toHaveBeenCalledWith(1);
    });
  });

  describe('2. Ruta de Docente (POST /courses) protegida con @Roles(TEACHER, ADMIN)', () => {
    it('Caso 401 Unauthorized: debe rechazar la creación si no se provee token', async () => {
      await request(app.getHttpServer())
        .post('/courses')
        .send({ title: 'Nuevo Curso', level: 'principiante' })
        .expect(401);
    });

    it('Caso 403 Forbidden: debe rechazar con 403 si un STUDENT intenta crear un curso', async () => {
      await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ title: 'Curso de Estudiante', level: 'principiante' })
        .expect(403);
    });

    it('Caso Permitido (201 Created): debe permitir la creación a un TEACHER y asociar su teacherId', async () => {
      const response = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${teacher1Token}`)
        .send({ title: 'Microservicios con RabbitMQ', level: 'avanzado' })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Microservicios con RabbitMQ');
      expect(response.body.teacherId).toBe(10); // Id extraído de req.user.sub
    });

    it('Caso Permitido (201 Created): debe permitir la creación también a un ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'DevOps con Docker y Kubernetes', level: 'avanzado' })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('DevOps con Docker y Kubernetes');
      expect(response.body.teacherId).toBe(1);
    });
  });

  describe('3. Propiedad de Recursos (PATCH /courses/:id) - Autorización = Identidad + Política + Contexto', () => {
    it('Caso 401 Unauthorized: debe rechazar modificación si no hay token', async () => {
      await request(app.getHttpServer())
        .patch('/courses/2')
        .send({ title: 'Nuevo Título' })
        .expect(401);
    });

    it('Caso 403 Forbidden (Detenido por RolesGuard): un STUDENT es rechazado antes de llegar al servicio', async () => {
      await request(app.getHttpServer())
        .patch('/courses/2')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ title: 'Modificación no permitida' })
        .expect(403);
    });

    it('Caso 403 Forbidden (Detenido por Regla de Negocio en el Servicio): un Docente NO puede modificar cursos creados por otro docente', async () => {
      // El Curso 2 fue creado por Docente 2 (teacherId: 20)
      // Docente 1 (sub: 10) supera RolesGuard, pero el servicio rechaza con 403 por falta de propiedad
      const response = await request(app.getHttpServer())
        .patch('/courses/2')
        .set('Authorization', `Bearer ${teacher1Token}`)
        .send({ title: 'Intento de toma de control' })
        .expect(403);

      expect(response.body.message).toContain('No tienes permiso para modificar un curso creado por otro docente');
    });

    it('Caso Permitido (200 OK): Docente modifica exitosamente el curso que él mismo creó', async () => {
      // El Curso 2 pertenece a Docente 2 (sub: 20)
      const response = await request(app.getHttpServer())
        .patch('/courses/2')
        .set('Authorization', `Bearer ${teacher2Token}`)
        .send({ title: 'Bases de Datos Avanzadas con PostgreSQL' })
        .expect(200);

      expect(response.body.title).toBe('Bases de Datos Avanzadas con PostgreSQL');
      expect(response.body.teacherId).toBe(20);
    });

    it('Caso Permitido (200 OK): Admin puede modificar cualquier curso independientemente de quién lo creó', async () => {
      // El Curso 2 pertenece a Docente 2, pero Admin tiene facultad global
      const response = await request(app.getHttpServer())
        .patch('/courses/2')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Título Auditado y Modificado por el Administrador' })
        .expect(200);

      expect(response.body.title).toBe('Título Auditado y Modificado por el Administrador');
    });
  });
});

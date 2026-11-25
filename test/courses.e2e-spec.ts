import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { CoursesController } from '../src/courses/courses.controller.js';
import { CoursesService } from '../src/courses/courses.service.js';
import { UpdateCourseUseCase } from '../src/courses/use-cases/update-course.use-case.js';
import { COURSE_REPOSITORY, type CourseRepository } from '../src/courses/ports/course.repository.js';
import { AuthGuard } from '../src/auth/guards/auth.guard.js';
import { RolesGuard } from '../src/auth/guards/roles.guard.js';
import { UserRole } from '../src/users/enums/user-role.enum.js';
import { Course } from '../src/courses/entities/course.entity.js';

describe('Sesión 25 & 28 · Integración, E2E y Versionado por URI (/v1)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const JWT_SECRET = 'secret-key-para-pruebas-e2e-supertest-2026';
  let adminToken: string;
  let teacher1Token: string;
  let teacher2Token: string;
  let studentToken: string;

  // Base de datos exclusiva de prueba en memoria (sin arrastre de datos)
  let inMemoryDb: Course[] = [];

  const testRepository: CourseRepository = {
    findById: async (id: number) => {
      const found = inMemoryDb.find((c) => c.id === id);
      return found ? { ...found } : null;
    },
    save: async (course: Course) => {
      const index = inMemoryDb.findIndex((c) => c.id === course.id);
      if (index >= 0) {
        inMemoryDb[index] = { ...course };
        return inMemoryDb[index];
      }
      const newCourse = { ...course, id: inMemoryDb.length + 1 };
      inMemoryDb.push(newCourse);
      return newCourse;
    },
  };

  const mockCoursesService = {
    findAll: async () => inMemoryDb,
    findOne: async (id: number) => {
      const course = inMemoryDb.find((c) => c.id === id);
      if (!course) throw new Error('Not found');
      return course;
    },
    create: async (dto: any, teacherId?: number) => {
      const newCourse: Course = {
        id: inMemoryDb.length + 1,
        title: dto.title,
        level: dto.level,
        teacherId,
        createdByUserId: teacherId,
        enrollments: [],
      } as Course;
      inMemoryDb.push(newCourse);
      return newCourse;
    },
    remove: async (id: number) => {
      const index = inMemoryDb.findIndex((c) => c.id === id);
      if (index >= 0) {
        const [deleted] = inMemoryDb.splice(index, 1);
        return deleted;
      }
      return null;
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: JWT_SECRET,
          signOptions: { expiresIn: '1h' },
        }),
      ],
      controllers: [CoursesController],
      providers: [
        {
          provide: CoursesService,
          useValue: mockCoursesService,
        },
        UpdateCourseUseCase,
        {
          provide: COURSE_REPOSITORY,
          useValue: testRepository,
        },
        AuthGuard,
        RolesGuard,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Sesión 28: Versionado por URI observable (/v1)
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);

    // Identidades de práctica conocidas
    adminToken = await jwtService.signAsync({ sub: 1, email: 'admin@test.edu', role: UserRole.ADMIN });
    teacher1Token = await jwtService.signAsync({ sub: 10, email: 'teacher1@test.edu', role: UserRole.TEACHER });
    teacher2Token = await jwtService.signAsync({ sub: 20, email: 'teacher2@test.edu', role: UserRole.TEACHER });
    studentToken = await jwtService.signAsync({ sub: 99, email: 'student@test.edu', role: UserRole.STUDENT });
  });

  // Limpieza o reinicio entre casos para evitar arrastre de datos entre escenarios
  beforeEach(() => {
    inMemoryDb = [
      {
        id: 1,
        title: 'Curso de Arquitectura Limpia',
        level: 'intermedio',
        teacherId: 10,
        createdByUserId: 10,
        enrollments: [],
      } as Course,
    ];
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('1. Ruta pública → 200 OK (Supertest comprueba GET /v1/courses sin autenticación)', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/courses')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(1);
  });

  it('2. Ruta protegida sin token → 401 Unauthorized', async () => {
    await request(app.getHttpServer())
      .post('/v1/courses')
      .send({ title: 'Curso Sin Auth', level: 'beginner' })
      .expect(401);
  });

  it('3. Rol insuficiente → 403 Forbidden (Estudiante intentando crear curso)', async () => {
    await request(app.getHttpServer())
      .post('/v1/courses')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ title: 'Curso de Estudiante', level: 'beginner' })
      .expect(403);
  });

  it('4. Identidad autorizada → 201 Created (Docente crea curso con éxito)', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/courses')
      .set('Authorization', `Bearer ${teacher1Token}`)
      .send({ title: 'NestJS Microservicios E2E', level: 'avanzado' })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.title).toBe('NestJS Microservicios E2E');
    expect(response.body.teacherId).toBe(10);
  });

  it('5. Entrada inválida → 400 Bad Request (ValidationPipe rechaza DTO malformado)', async () => {
    await request(app.getHttpServer())
      .post('/v1/courses')
      .set('Authorization', `Bearer ${teacher1Token}`)
      .send({ title: '', level: 'invalido' })
      .expect(400);
  });

  it('6. Regla de propiedad → 403 Forbidden (Docente intenta modificar curso ajeno)', async () => {
    await request(app.getHttpServer())
      .patch('/v1/courses/1')
      .set('Authorization', `Bearer ${teacher2Token}`)
      .send({ title: 'Modificación no autorizada' })
      .expect(403);
  });

  it('7. Modificación autorizada por propietario → 200 OK', async () => {
    const response = await request(app.getHttpServer())
      .patch('/v1/courses/1')
      .set('Authorization', `Bearer ${teacher1Token}`)
      .send({ title: 'Título Actualizado por Docente 1' })
      .expect(200);

    expect(response.body.title).toBe('Título Actualizado por Docente 1');
  });

  it('8. Determinismo: El conjunto se repite igual sin arrastrar mutaciones', async () => {
    expect(inMemoryDb[0].title).toBe('Curso de Arquitectura Limpia');
  });
});

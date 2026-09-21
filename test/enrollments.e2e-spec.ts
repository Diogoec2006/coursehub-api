import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';

describe('EnrollmentsModule (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
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
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /enrollments', () => {
    it('debe registrar una matrícula válida exitosamente (201)', async () => {
      // Estudiante 1 (Ana García, activa) en Curso 1 (NestJS Fundamentals)
      const response = await request(app.getHttpServer())
        .post('/enrollments')
        .send({ studentId: 1, courseId: 1 })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.id).toBe(1);
      expect(response.body.studentId).toBe(1);
      expect(response.body.courseId).toBe(1);
    });

    it('debe rechazar la matrícula si el estudiante está inactivo (400)', async () => {
      // Estudiante 2 (Carlos López) se encuentra inactivo (isActive: false)
      const response = await request(app.getHttpServer())
        .post('/enrollments')
        .send({ studentId: 2, courseId: 1 })
        .expect(400);

      expect(response.body.message).toContain('inactivo');
    });

    it('debe rechazar la matrícula si ya existe la combinación studentId y courseId (409)', async () => {
      // Matricular por primera vez
      await request(app.getHttpServer())
        .post('/enrollments')
        .send({ studentId: 1, courseId: 1 })
        .expect(201);

      // Intentar matricular nuevamente
      const response = await request(app.getHttpServer())
        .post('/enrollments')
        .send({ studentId: 1, courseId: 1 })
        .expect(409);

      expect(response.body.message).toContain('ya se encuentra matriculado');
    });

    it('debe rechazar la matrícula si el estudiante no existe (404)', async () => {
      const response = await request(app.getHttpServer())
        .post('/enrollments')
        .send({ studentId: 999, courseId: 1 })
        .expect(404);

      expect(response.body.message).toContain('no encontrado');
    });

    it('debe rechazar la matrícula si el curso no existe (404)', async () => {
      const response = await request(app.getHttpServer())
        .post('/enrollments')
        .send({ studentId: 1, courseId: 999 })
        .expect(404);

      expect(response.body.message).toContain('no encontrado');
    });

    it('debe validar el DTO y rechazar datos inválidos o extra (400)', async () => {
      await request(app.getHttpServer())
        .post('/enrollments')
        .send({ studentId: -5, courseId: 'invalido' })
        .expect(400);

      await request(app.getHttpServer())
        .post('/enrollments')
        .send({ studentId: 1, courseId: 1, extraProp: 'no permitida' })
        .expect(400);
    });
  });

  describe('GET /enrollments', () => {
    beforeEach(async () => {
      // Matricular estudiante 1 en curso 1 y curso 2, estudiante 3 en curso 1
      await request(app.getHttpServer())
        .post('/enrollments')
        .send({ studentId: 1, courseId: 1 });

      await request(app.getHttpServer())
        .post('/enrollments')
        .send({ studentId: 1, courseId: 2 });

      await request(app.getHttpServer())
        .post('/enrollments')
        .send({ studentId: 3, courseId: 1 });
    });

    it('debe listar todas las matrículas', async () => {
      const response = await request(app.getHttpServer())
        .get('/enrollments')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(3);
    });

    it('debe filtrar por studentId', async () => {
      const response = await request(app.getHttpServer())
        .get('/enrollments?studentId=1')
        .expect(200);

      expect(response.body.length).toBe(2);
      expect(response.body.every((e: any) => e.studentId === 1)).toBe(true);
    });

    it('debe filtrar por courseId', async () => {
      const response = await request(app.getHttpServer())
        .get('/enrollments?courseId=2')
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].studentId).toBe(1);
      expect(response.body[0].courseId).toBe(2);
    });

    it('debe filtrar de manera combinada por studentId y courseId', async () => {
      const response = await request(app.getHttpServer())
        .get('/enrollments?studentId=3&courseId=1')
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].studentId).toBe(3);
      expect(response.body[0].courseId).toBe(1);
    });
  });

  describe('GET /enrollments/:id', () => {
    it('debe obtener una matrícula existente por su ID', async () => {
      const created = await request(app.getHttpServer())
        .post('/enrollments')
        .send({ studentId: 1, courseId: 1 });

      const response = await request(app.getHttpServer())
        .get(`/enrollments/${created.body.id}`)
        .expect(200);

      expect(response.body.id).toBe(created.body.id);
      expect(response.body.studentId).toBe(1);
      expect(response.body.courseId).toBe(1);
    });

    it('debe retornar 404 si la matrícula no existe', async () => {
      await request(app.getHttpServer())
        .get('/enrollments/999')
        .expect(404);
    });

    it('debe retornar 400 si el parámetro id es inválido (ParseIdPipe)', async () => {
      await request(app.getHttpServer())
        .get('/enrollments/abc')
        .expect(400);
    });
  });

  describe('GET /students/:studentId/enrollments', () => {
    it('debe obtener las matrículas de un estudiante específico', async () => {
      await request(app.getHttpServer())
        .post('/enrollments')
        .send({ studentId: 1, courseId: 1 });

      await request(app.getHttpServer())
        .post('/enrollments')
        .send({ studentId: 1, courseId: 2 });

      const response = await request(app.getHttpServer())
        .get('/students/1/enrollments')
        .expect(200);

      expect(response.body.length).toBe(2);
      expect(response.body.every((e: any) => e.studentId === 1)).toBe(true);
    });

    it('debe retornar 404 si el estudiante no existe', async () => {
      await request(app.getHttpServer())
        .get('/students/999/enrollments')
        .expect(404);
    });
  });

  describe('GET /courses/:courseId/enrollments', () => {
    it('debe obtener las matrículas de un curso específico', async () => {
      await request(app.getHttpServer())
        .post('/enrollments')
        .send({ studentId: 1, courseId: 1 });

      await request(app.getHttpServer())
        .post('/enrollments')
        .send({ studentId: 3, courseId: 1 });

      const response = await request(app.getHttpServer())
        .get('/courses/1/enrollments')
        .expect(200);

      expect(response.body.length).toBe(2);
      expect(response.body.every((e: any) => e.courseId === 1)).toBe(true);
    });

    it('debe retornar 404 si el curso no existe', async () => {
      await request(app.getHttpServer())
        .get('/courses/999/enrollments')
        .expect(404);
    });
  });

  describe('DELETE /enrollments/:id', () => {
    it('debe cancelar una matrícula existente exitosamente (200)', async () => {
      const created = await request(app.getHttpServer())
        .post('/enrollments')
        .send({ studentId: 1, courseId: 1 });

      const response = await request(app.getHttpServer())
        .delete(`/enrollments/${created.body.id}`)
        .expect(200);

      expect(response.body.id).toBe(created.body.id);

      // Verificar que ya no existe
      await request(app.getHttpServer())
        .get(`/enrollments/${created.body.id}`)
        .expect(404);
    });

    it('debe retornar 404 si la matrícula a cancelar no existe', async () => {
      await request(app.getHttpServer())
        .delete('/enrollments/999')
        .expect(404);
    });

    it('debe retornar 400 si el parámetro ID no es válido (ParseIdPipe)', async () => {
      await request(app.getHttpServer())
        .delete('/enrollments/no-valido')
        .expect(400);
    });
  });
});

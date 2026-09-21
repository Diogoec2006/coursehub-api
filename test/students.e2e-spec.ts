import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';

describe('StudentsModule (e2e)', () => {
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

  describe('GET /students', () => {
    it('debe listar todos los estudiantes iniciales', async () => {
      const response = await request(app.getHttpServer())
        .get('/students')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(3);
    });

    it('debe filtrar por carrera', async () => {
      const response = await request(app.getHttpServer())
        .get('/students?career=Medicina')
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].name).toBe('Carlos López');
    });

    it('debe filtrar por semestre', async () => {
      const response = await request(app.getHttpServer())
        .get('/students?semester=4')
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].name).toBe('Ana García');
    });

    it('debe filtrar por isActive', async () => {
      const response = await request(app.getHttpServer())
        .get('/students?isActive=false')
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].name).toBe('Carlos López');
    });

    it('debe soportar filtros combinados', async () => {
      const response = await request(app.getHttpServer())
        .get('/students?career=Ingeniería de Sistemas&semester=4&isActive=true')
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe(1);
    });
  });

  describe('GET /students/:id', () => {
    it('debe obtener un estudiante existente por su id', async () => {
      const response = await request(app.getHttpServer())
        .get('/students/1')
        .expect(200);

      expect(response.body.id).toBe(1);
      expect(response.body.email).toBe('ana.garcia@example.com');
    });

    it('debe retornar 404 si el estudiante no existe', async () => {
      const response = await request(app.getHttpServer())
        .get('/students/999')
        .expect(404);

      expect(response.body.message).toContain('no encontrado');
    });

    it('debe retornar 400 si el parámetro id no es un entero positivo (ParseIdPipe)', async () => {
      const response = await request(app.getHttpServer())
        .get('/students/invalido')
        .expect(400);

      expect(response.body.message).toContain('no es válido');
    });
  });

  describe('POST /students', () => {
    it('debe registrar un nuevo estudiante exitosamente', async () => {
      const newStudentData = {
        name: 'Laura Gómez',
        email: 'laura.gomez@example.com',
        age: 21,
        career: 'Derecho',
        semester: 3,
        isActive: true,
      };

      const response = await request(app.getHttpServer())
        .post('/students')
        .send(newStudentData)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.email).toBe('laura.gomez@example.com');
    });

    it('debe retornar 409 si el correo electrónico ya existe', async () => {
      const duplicateStudent = {
        name: 'Ana Clon',
        email: 'ana.garcia@example.com',
        age: 23,
        career: 'Ingeniería',
        semester: 5,
      };

      const response = await request(app.getHttpServer())
        .post('/students')
        .send(duplicateStudent)
        .expect(409);

      expect(response.body.message).toContain('ya se encuentra registrado');
    });

    it('debe retornar 400 si el semestre está fuera de rango (1 a 10)', async () => {
      const invalidSemester = {
        name: 'Pedro Páramo',
        email: 'pedro@example.com',
        age: 20,
        career: 'Literatura',
        semester: 12,
      };

      await request(app.getHttpServer())
        .post('/students')
        .send(invalidSemester)
        .expect(400);
    });

    it('debe retornar 400 si se intenta enviar el campo id en el body', async () => {
      const withId = {
        id: 99,
        name: 'Hacker',
        email: 'hacker@example.com',
        age: 25,
        career: 'Sistemas',
        semester: 5,
      };

      await request(app.getHttpServer())
        .post('/students')
        .send(withId)
        .expect(400);
    });
  });

  describe('PATCH /students/:id', () => {
    it('debe modificar parcialmente un estudiante', async () => {
      const updateData = {
        career: 'Ingeniería de Software',
        semester: 5,
      };

      const response = await request(app.getHttpServer())
        .patch('/students/1')
        .send(updateData)
        .expect(200);

      expect(response.body.id).toBe(1);
      expect(response.body.career).toBe('Ingeniería de Software');
      expect(response.body.semester).toBe(5);
      expect(response.body.name).toBe('Ana García');
    });

    it('debe rechazar modificar el correo si ya pertenece a otro estudiante (409)', async () => {
      const updateEmail = {
        email: 'carlos.lopez@example.com',
      };

      await request(app.getHttpServer())
        .patch('/students/1')
        .send(updateEmail)
        .expect(409);
    });

    it('debe retornar 404 si el estudiante a modificar no existe', async () => {
      await request(app.getHttpServer())
        .patch('/students/999')
        .send({ name: 'Desconocido' })
        .expect(404);
    });
  });

  describe('PATCH /students/:id/status', () => {
    it('debe cambiar exclusivamente el estado activo/inactivo', async () => {
      const response = await request(app.getHttpServer())
        .patch('/students/2/status')
        .send({ isActive: true })
        .expect(200);

      expect(response.body.id).toBe(2);
      expect(response.body.isActive).toBe(true);
    });
  });

  describe('DELETE /students/:id', () => {
    it('debe rechazar la eliminación si el estudiante está inactivo (400)', async () => {
      // Carlos López (id: 2) empieza inactivo (isActive: false)
      const response = await request(app.getHttpServer())
        .delete('/students/2')
        .expect(400);

      expect(response.body.message).toContain('inactivo');
    });

    it('debe eliminar un estudiante si está activo', async () => {
      // Ana García (id: 1) está activa
      const response = await request(app.getHttpServer())
        .delete('/students/1')
        .expect(200);

      expect(response.body.id).toBe(1);

      // Verificamos que ya no existe
      await request(app.getHttpServer()).get('/students/1').expect(404);
    });

    it('debe retornar 404 si se intenta eliminar un estudiante inexistente', async () => {
      await request(app.getHttpServer()).delete('/students/999').expect(404);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import bcrypt from 'bcrypt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { User } from '../src/users/entities/user.entity.js';
import { UsersService } from '../src/users/users.service.js';

describe('AuthModule (e2e)', () => {
  let app: INestApplication;
  let usersRepository: Repository<User>;
  let usersService: UsersService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Replicamos la configuración exacta de main.ts para validar Pipes globales
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    usersRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    usersService = moduleFixture.get<UsersService>(UsersService);

    // Limpieza previa de cuentas de prueba para garantizar idempotencia
    await usersRepository.delete({ email: 'practica@coursehub.edu' });
    await usersRepository.delete({ email: 'practica-mayus@coursehub.edu' });
  });

  afterAll(async () => {
    if (usersRepository) {
      await usersRepository.delete({ email: 'practica@coursehub.edu' });
      await usersRepository.delete({ email: 'practica-mayus@coursehub.edu' });
    }
    if (app) {
      await app.close();
    }
  });

  describe('1. Registra una cuenta de práctica y verifica respuesta segura (201)', () => {
    it('debe registrar exitosamente un usuario y retornar 201 sin exponer el hash ni la contraseña', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'practica@coursehub.edu',
          password: 'PasswordSeguro123!',
        })
        .expect(201);

      // Verificamos propiedades devueltas
      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe('practica@coursehub.edu');

      // CRÍTICO: La contraseña en texto plano y el hash NUNCA salen del servidor
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('passwordHash');
    });
  });

  describe('2. Verifica solo hash en la base local (inspección de persistencia)', () => {
    it('debe almacenar en la base de datos únicamente el passwordHash con costo 12 y jamás el texto plano', async () => {
      // Obtenemos el registro con passwordHash explícito
      const userInDb = await usersService.findByEmailWithPassword('practica@coursehub.edu');

      expect(userInDb).toBeDefined();
      expect(userInDb?.email).toBe('practica@coursehub.edu');

      // La entidad no tiene propiedad de contraseña en texto plano
      expect((userInDb as any).password).toBeUndefined();

      // El hash debe existir y seguir el formato bcrypt ($2b$12$...)
      expect(userInDb?.passwordHash).toBeDefined();
      expect(userInDb?.passwordHash).toMatch(/^\$2[aby]\$12\$/);

      // Verificamos que la contraseña original sea comprobable mediante bcrypt.compare
      const isValid = await bcrypt.compare('PasswordSeguro123!', userInDb!.passwordHash);
      expect(isValid).toBe(true);

      // Una contraseña incorrecta debe ser rechazada
      const isInvalid = await bcrypt.compare('ClaveIncorrecta999', userInDb!.passwordHash);
      expect(isInvalid).toBe(false);
    });
  });

  describe('3. Prueba mayúsculas y duplicado (409 Conflict)', () => {
    it('debe normalizar mayúsculas/espacios y rechazar con 409 cuando el correo ya existe', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: '   PRACTICA@CourseHub.EDU   ',
          password: 'OtraPasswordSegura456!',
        })
        .expect(409);

      expect(response.body.message).toContain('ya está registrado');
    });
  });

  describe('4. Prueba DTOs inválidos en registro (400 Bad Request)', () => {
    it('debe rechazar con 400 si el correo no tiene un formato válido (DTO inválido 1)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'correo-sin-formato-valido',
          password: 'PasswordSeguro123!',
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('debe rechazar con 400 si la contraseña es menor a 8 caracteres (DTO inválido 2)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'usuario.nuevo@coursehub.edu',
          password: '12345',
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('5. Cinco pruebas explican el contrato de Login (POST /auth/login)', () => {
    // Prueba 1: Correcto → 200 + accessToken
    it('Prueba 1: Login correcto → debe retornar 200 OK con accessToken y usuario sin password ni passwordHash', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: '  PRACTICA@CourseHub.EDU  ', // Se normaliza a practica@coursehub.edu
          password: 'PasswordSeguro123!',
        })
        .expect(200);

      // Verificamos presencia y estructura del accessToken (header.payload.signature)
      expect(response.body).toHaveProperty('accessToken');
      expect(typeof response.body.accessToken).toBe('string');
      const parts = response.body.accessToken.split('.');
      expect(parts).toHaveLength(3);

      // Audita payload decodificado: sub, email, iat, exp
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
      expect(payload).toHaveProperty('sub');
      expect(payload.email).toBe('practica@coursehub.edu');
      expect(payload).toHaveProperty('iat');
      expect(payload).toHaveProperty('exp');
      expect(payload.exp).toBeGreaterThan(payload.iat);

      // Verificamos usuario seguro devuelto
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe('practica@coursehub.edu');
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    // Prueba 2: Password errónea → 401 sin token
    it('Prueba 2: Password errónea → debe retornar 401 Unauthorized con "Invalid credentials" sin token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'practica@coursehub.edu',
          password: 'PasswordIncorrecta999!',
        })
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials');
      expect(response.body).not.toHaveProperty('accessToken');
    });

    // Prueba 3: Correo inexistente → mismo 401 sin token
    it('Prueba 3: Correo inexistente → debe retornar el mismo 401 Unauthorized genérico (evita enumeración) sin token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'no.existe@coursehub.edu',
          password: 'PasswordCualquiera123!',
        })
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials');
      expect(response.body).not.toHaveProperty('accessToken');
    });

    // Prueba 4: Correo mal formado → 400
    it('Prueba 4: Correo mal formado → debe rechazar con 400 Bad Request sin consultar la base de datos', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'correo-invalido-sin-dominio',
          password: 'PasswordValido123!',
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    // Prueba 5: Password corta → 400
    it('Prueba 5: Password corta (<8 caracteres) → debe rechazar con 400 Bad Request', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'practica@coursehub.edu',
          password: '12345',
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('6. Protección de rutas: GET /auth/me con Bearer token', () => {
    let validAccessToken: string;

    beforeAll(async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'practica@coursehub.edu',
          password: 'PasswordSeguro123!',
        });
      validAccessToken = loginRes.body.accessToken;
    });

    it('debe responder 200 y el payload del usuario autenticado si se envía Bearer token válido', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('sub');
      expect(response.body.email).toBe('practica@coursehub.edu');
    });

    it('debe responder 401 Unauthorized si se consulta /auth/me sin encabezado Authorization', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });

    it('debe responder 401 Unauthorized si se envía un token alterado o inválido', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${validAccessToken}modificado`)
        .expect(401);
    });
  });

  describe('7. Ruta de negocio protegida: POST /courses', () => {
    let validAccessToken: string;

    beforeAll(async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'practica@coursehub.edu',
          password: 'PasswordSeguro123!',
        });
      validAccessToken = loginRes.body.accessToken;
    });

    it('debe rechazar con 401 sin token y verificar que no modifica datos', async () => {
      await request(app.getHttpServer())
        .post('/courses')
        .send({
          title: 'Curso No Autorizado',
          level: 'beginner',
        })
        .expect(401);
    });

    it('con token válido pero DTO inválido, debe aplicar las reglas del DTO y responder 400', async () => {
      const response = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({
          title: '', // título vacío infringe @IsNotEmpty
          level: 'beginner',
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('con token válido y DTO correcto, debe procesar la regla de negocio y responder 201', async () => {
      const response = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({
          title: 'Arquitectura Segura NestJS',
          level: 'intermedio',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Arquitectura Segura NestJS');
    });
  });
});

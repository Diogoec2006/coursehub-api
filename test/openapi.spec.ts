import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';
import { CoursesController } from '../src/courses/courses.controller.js';
import { AuthController } from '../src/auth/auth.controller.js';
import { CoursesService } from '../src/courses/courses.service.js';
import { AuthService } from '../src/auth/auth.service.js';
import { UpdateCourseUseCase } from '../src/courses/use-cases/update-course.use-case.js';
import { COURSE_REPOSITORY } from '../src/courses/ports/course.repository.js';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('Sesión 27 & 28 · Contrato OpenAPI, Swagger, Seguridad y Versionado URI', () => {
  let app: INestApplication;
  let openApiDoc: OpenAPIObject;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CoursesController, AuthController],
      providers: [
        {
          provide: CoursesService,
          useValue: { findAll: vi.fn(), findOne: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
        },
        {
          provide: AuthService,
          useValue: { register: vi.fn(), login: vi.fn() },
        },
        {
          provide: UpdateCourseUseCase,
          useValue: { execute: vi.fn() },
        },
        {
          provide: COURSE_REPOSITORY,
          useValue: { findById: vi.fn(), save: vi.fn() },
        },
        {
          provide: JwtService,
          useValue: { signAsync: vi.fn(), verifyAsync: vi.fn() },
        },
        {
          provide: ConfigService,
          useValue: { get: vi.fn(), getOrThrow: vi.fn().mockReturnValue('jwt_secret_test') },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Sesión 28: Versionado por URI
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

    // Sesión 27: Generación de OpenAPI Document
    const config = new DocumentBuilder()
      .setTitle('CourseHub API')
      .setDescription('Contrato formal OpenAPI de CourseHub: cursos, autenticación, inscripciones y seguridad')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Auth')
      .addTag('Courses')
      .build();

    openApiDoc = SwaggerModule.createDocument(app, config);
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('OpenAPI define título, versión y descripción del contrato', () => {
    expect(openApiDoc.info.title).toBe('CourseHub API');
    expect(openApiDoc.info.version).toBe('1.0');
    expect(openApiDoc.info.description).toContain('CourseHub');
  });

  it('OpenAPI define el esquema de seguridad Bearer JWT', () => {
    expect(openApiDoc.components?.securitySchemes).toBeDefined();
    const bearerScheme = openApiDoc.components?.securitySchemes?.['bearer'] as any;
    expect(bearerScheme).toBeDefined();
    expect(bearerScheme.type).toBe('http');
    expect(bearerScheme.scheme).toBe('bearer');
  });

  it('URI Versioning: Los paths del contrato están versionados bajo /v1/', () => {
    const paths = Object.keys(openApiDoc.paths);
    expect(paths).toContain('/v1/courses');
    expect(paths).toContain('/v1/courses/{id}');
    expect(paths).toContain('/v1/auth/login');
    expect(paths).toContain('/v1/auth/register');
    expect(paths).toContain('/v1/auth/me');
  });

  it('Seguridad documentada: endpoints protegidos documentan 401 y 403', () => {
    const postCourse = openApiDoc.paths['/v1/courses']?.post;
    expect(postCourse).toBeDefined();
    expect(postCourse?.responses['201']).toBeDefined();
    expect(postCourse?.responses['400']).toBeDefined();
    expect(postCourse?.responses['401']).toBeDefined();
    expect(postCourse?.responses['403']).toBeDefined();

    const patchCourse = openApiDoc.paths['/v1/courses/{id}']?.patch;
    expect(patchCourse).toBeDefined();
    expect(patchCourse?.responses['200']).toBeDefined();
    expect(patchCourse?.responses['401']).toBeDefined();
    expect(patchCourse?.responses['403']).toBeDefined();
    expect(patchCourse?.responses['404']).toBeDefined();
  });

  it('El contrato no expone secretos, SQL ni detalles internos del servidor', () => {
    const docString = JSON.stringify(openApiDoc);
    expect(docString).not.toContain('passwordHash');
    expect(docString).not.toContain('SELECT *');
    expect(docString).not.toContain('TypeOrmCourseRepository');
  });
});

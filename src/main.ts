import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Control de acceso de origen cruzado (CORS explícito)
  app.enableCors({
    origin: ['https://coursehub.example.edu'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Versionado por URI: /v1/... (Sesión 28)
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

  // Documentación de contrato OpenAPI y Swagger (Sesión 27)
  const config = new DocumentBuilder()
    .setTitle('CourseHub API')
    .setDescription('Contrato formal OpenAPI de CourseHub: cursos, autenticación, inscripciones y seguridad')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Autenticación y tokens JWT')
    .addTag('Courses', 'Gestión y catálogo de cursos')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const appConfig = app.get(ConfigService);
  const port = appConfig.getOrThrow<number>('PORT');
  const nodeEnv = appConfig.getOrThrow<string>('NODE_ENV');
  await app.listen(port);
  logger.log(`Application running in "${nodeEnv}" mode on port ${port}`);
  logger.log(`Swagger documentation available at: http://localhost:${port}/docs`);
}
await bootstrap();

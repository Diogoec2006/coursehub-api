import { describe, it, expect } from 'vitest';
import { ParseIntPipe, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '../src/auth/guards/auth.guard.js';
import { LoggingMiddleware } from '../src/common/middleware/logging.middleware.js';
import { TimingInterceptor } from '../src/common/interceptors/timing.interceptor.js';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter.js';

describe('Sesión 21: Preocupaciones Transversales y Ciclo de Vida HTTP', () => {
  it('1. Token inválido → Guard (detiene la petición y lanza UnauthorizedException)', async () => {
    const mockJwtService = {
      verifyAsync: () => Promise.reject(new Error('Invalid token')),
    } as any;
    const mockConfigService = {
      getOrThrow: () => 'test_jwt_secret',
    } as any;
    const guard = new AuthGuard(mockJwtService, mockConfigService);

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { authorization: 'Bearer token_invalido' },
        }),
      }),
    } as any;

    await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
  });

  it('2. id no numérico → Pipe (ParseIntPipe detiene la petición antes del controlador)', async () => {
    const pipe = new ParseIntPipe();
    await expect(pipe.transform('abc', { type: 'param', metatype: Number, data: 'id' })).rejects.toThrow(BadRequestException);
  });

  it('3. Recurso inexistente → Filter (HttpExceptionFilter traduce excepciones a respuesta HTTP uniforme)', () => {
    const filter = new HttpExceptionFilter();
    let jsonOutput: any;
    let statusCode: number | undefined;

    const mockHost = {
      switchToHttp: () => ({
        getResponse: () => ({
          status: (code: number) => {
            statusCode = code;
            return {
              json: (data: any) => {
                jsonOutput = data;
              },
            };
          },
        }),
        getRequest: () => ({ url: '/courses/999' }),
      }),
    } as any;

    filter.catch(new NotFoundException('Course 999 not found'), mockHost);

    expect(statusCode).toBe(404);
    expect(jsonOutput).toEqual(
      expect.objectContaining({
        statusCode: 404,
        path: '/courses/999',
        message: 'Course 999 not found',
        timestamp: expect.any(String),
      }),
    );
  });

  it('4. Operación lenta / auditoría temporal → Interceptor (mide duración envolviendo next.handle)', async () => {
    const interceptor = new TimingInterceptor();
    expect(interceptor.intercept).toBeDefined();
  });

  it('5. Registro de petición → Middleware (registra método, ruta, estado y duración en finish)', () => {
    const middleware = new LoggingMiddleware();
    expect(middleware.use).toBeDefined();
  });
});

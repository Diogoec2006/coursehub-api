import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './auth.guard.js';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  const mockJwtService = {
    verifyAsync: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    guard = new AuthGuard(mockJwtService as any);
  });

  const createMockContext = (authHeader?: string): ExecutionContext => {
    const request = {
      headers: {
        authorization: authHeader,
      },
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as any;
  };

  it('debe estar definido', () => {
    expect(guard).toBeDefined();
  });

  it('debe lanzar UnauthorizedException si falta el encabezado Authorization', async () => {
    const context = createMockContext();
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('debe lanzar UnauthorizedException si el formato no es Bearer', async () => {
    const context = createMockContext('Basic dXNlcjpwYXNz');
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('debe lanzar UnauthorizedException si el token está alterado o expirado', async () => {
    const context = createMockContext('Bearer token-alterado');
    mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('debe retornar true y adjuntar el payload en request.user si el token es válido', async () => {
    const context = createMockContext('Bearer token-valido');
    const payload = { sub: 1, email: 'estudiante@coursehub.edu' };
    mockJwtService.verifyAsync.mockResolvedValue(payload);

    const result = await guard.canActivate(context);
    expect(result).toBe(true);

    const req = context.switchToHttp().getRequest();
    expect(req.user).toEqual(payload);
  });
});

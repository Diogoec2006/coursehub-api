import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard.js';
import { UserRole } from '../../users/enums/user-role.enum.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockContext = (user?: any): ExecutionContext => {
    const request = { user };
    return {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as any;
  };

  it('debe estar definido', () => {
    expect(guard).toBeDefined();
  });

  it('debe permitir acceso si la ruta no tiene la metadata @Roles() definida', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const context = createMockContext({ sub: 1, email: 'user@test.com', role: UserRole.STUDENT });
    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('debe permitir acceso si el usuario posee el rol exacto requerido', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);

    const context = createMockContext({ sub: 1, email: 'admin@test.com', role: UserRole.ADMIN });
    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('debe permitir acceso si el usuario posee uno de los múltiples roles autorizados', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
      UserRole.ADMIN,
      UserRole.TEACHER,
    ]);

    const context = createMockContext({ sub: 2, email: 'docente@test.com', role: UserRole.TEACHER });
    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('debe denegar acceso (retornar false -> 403 Forbidden) si el rol del usuario no está en la política', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);

    const context = createMockContext({ sub: 3, email: 'student@test.com', role: UserRole.STUDENT });
    const result = guard.canActivate(context);

    expect(result).toBe(false);
  });

  it('debe denegar acceso si el request no contiene la propiedad user', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);

    const context = createMockContext(undefined);
    const result = guard.canActivate(context);

    expect(result).toBe(false);
  });

  it('debe denegar acceso si el usuario autenticado carece de la propiedad role', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);

    const context = createMockContext({ sub: 4, email: 'sinrol@test.com' });
    const result = guard.canActivate(context);

    expect(result).toBe(false);
  });

  it('debe consultar reflector.getAllAndOverride con ROLES_KEY y [handler, class]', () => {
    const spy = vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    const context = createMockContext({ role: UserRole.ADMIN });

    guard.canActivate(context);

    expect(spy).toHaveBeenCalledWith(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  });
});

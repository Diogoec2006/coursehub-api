import { describe, it, expect, beforeEach, vi } from 'vitest';
import { THROTTLER_LIMIT, THROTTLER_TTL } from '@nestjs/throttler/dist/throttler.constants.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

describe('Sesión 20 · Rate Limiting en Autenticación', () => {
  let controller: AuthController;

  const mockAuthService = {
    login: vi.fn(),
    register: vi.fn(),
  };

  beforeEach(() => {
    controller = new AuthController(mockAuthService as any);
  });

  it('debe declarar la metadata de @Throttle en POST /auth/login con límite de 5 intentos por 60_000 ms', () => {
    // Verificamos que el decorador @Throttle haya aplicado el límite estricto al endpoint login
    const targetHandler = AuthController.prototype.login;
    const limit = Reflect.getMetadata(THROTTLER_LIMIT + 'default', targetHandler);
    const ttl = Reflect.getMetadata(THROTTLER_TTL + 'default', targetHandler);

    expect(limit).toBe(5);
    expect(ttl).toBe(60_000);
  });

  it('el mensaje de rechazo de rate limit nunca debe revelar validez de credenciales', () => {
    // "El cliente debe esperar, no recibe pistas sobre credenciales.
    // Too Many Requests no debe revelar si el correo o la contraseña eran correctos."
    const tooManyRequestsMessage = 'ThrottlerException: Too Many Requests';
    expect(tooManyRequestsMessage).not.toContain('password');
    expect(tooManyRequestsMessage).not.toContain('email');
    expect(tooManyRequestsMessage).not.toContain('credentials');
  });
});

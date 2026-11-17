import { describe, it, expect } from 'vitest';
import { Reflector } from '@nestjs/core';
import { Roles, ROLES_KEY } from './roles.decorator.js';
import { UserRole } from '../../users/enums/user-role.enum.js';

describe('Roles Decorator', () => {
  const reflector = new Reflector();

  it('debe asignar los roles indicados en la metadata con la clave ROLES_KEY', () => {
    class TestController {
      @Roles(UserRole.ADMIN, UserRole.TEACHER)
      testMethod() {}
    }

    const roles = reflector.get<UserRole[]>(
      ROLES_KEY,
      TestController.prototype.testMethod,
    );

    expect(roles).toEqual([UserRole.ADMIN, UserRole.TEACHER]);
  });

  it('debe admitir un único rol en el decorador', () => {
    class TestController {
      @Roles(UserRole.ADMIN)
      adminMethod() {}
    }

    const roles = reflector.get<UserRole[]>(
      ROLES_KEY,
      TestController.prototype.adminMethod,
    );

    expect(roles).toEqual([UserRole.ADMIN]);
  });
});

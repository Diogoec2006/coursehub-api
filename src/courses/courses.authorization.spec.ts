import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CoursesController } from './courses.controller.js';
import { CoursesService } from './courses.service.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { ROLES_KEY } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../users/enums/user-role.enum.js';

describe('Sesión 19 · Autorización en Rutas y Propiedad de Recursos (Unit & Policy)', () => {
  let controller: CoursesController;
  let service: CoursesService;
  let authGuard: AuthGuard;
  let rolesGuard: RolesGuard;
  let reflector: Reflector;

  const mockJwtService = {
    verifyAsync: vi.fn(),
  };

  const mockCourseRepository = {
    findOneBy: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    remove: vi.fn(),
    findAndCount: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    reflector = new Reflector();
    authGuard = new AuthGuard(mockJwtService as any);
    rolesGuard = new RolesGuard(reflector);

    service = new CoursesService(mockCourseRepository as any);
    controller = new CoursesController(service);
  });

  const createMockContext = (
    handler: Function,
    targetClass: Function,
    authHeader?: string,
    user?: any,
  ): ExecutionContext => {
    const request = {
      headers: {
        authorization: authHeader,
      },
      user,
    };

    return {
      getHandler: () => handler,
      getClass: () => targetClass,
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as any;
  };

  describe('1. Ruta Administrativa (DELETE /courses/:id)', () => {
    it('Política: debe declarar explícitamente @Roles(UserRole.ADMIN)', () => {
      const roles = reflector.get<UserRole[]>(
        ROLES_KEY,
        CoursesController.prototype.remove,
      );
      expect(roles).toEqual([UserRole.ADMIN]);
    });

    it('Caso 401 Unauthorized: AuthGuard rechaza si no hay token o es inválido', async () => {
      const contextWithoutToken = createMockContext(
        CoursesController.prototype.remove,
        CoursesController,
        undefined,
      );
      await expect(authGuard.canActivate(contextWithoutToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('Caso 403 Forbidden: RolesGuard detiene el acceso si el usuario es TEACHER', () => {
      const contextTeacher = createMockContext(
        CoursesController.prototype.remove,
        CoursesController,
        'Bearer token_teacher',
        { sub: 10, role: UserRole.TEACHER },
      );
      const isAllowed = rolesGuard.canActivate(contextTeacher);
      expect(isAllowed).toBe(false);
    });

    it('Caso 403 Forbidden: RolesGuard detiene el acceso si el usuario es STUDENT', () => {
      const contextStudent = createMockContext(
        CoursesController.prototype.remove,
        CoursesController,
        'Bearer token_student',
        { sub: 99, role: UserRole.STUDENT },
      );
      const isAllowed = rolesGuard.canActivate(contextStudent);
      expect(isAllowed).toBe(false);
    });

    it('Caso Permitido (200 OK): RolesGuard autoriza a ADMIN y el controlador ejecuta la eliminación', async () => {
      const contextAdmin = createMockContext(
        CoursesController.prototype.remove,
        CoursesController,
        'Bearer token_admin',
        { sub: 1, role: UserRole.ADMIN },
      );
      const isAllowed = rolesGuard.canActivate(contextAdmin);
      expect(isAllowed).toBe(true);

      const courseToDelete = { id: 1, title: 'Curso Obsoleto', level: 'beginner' };
      mockCourseRepository.findOneBy.mockResolvedValue(courseToDelete);
      mockCourseRepository.remove.mockResolvedValue(courseToDelete);

      const result = await controller.remove('1');
      expect(result).toEqual(courseToDelete);
      expect(mockCourseRepository.remove).toHaveBeenCalledWith(courseToDelete);
    });
  });

  describe('2. Ruta de Docente (POST /courses)', () => {
    it('Política: debe declarar @Roles(UserRole.TEACHER, UserRole.ADMIN)', () => {
      const roles = reflector.get<UserRole[]>(
        ROLES_KEY,
        CoursesController.prototype.create,
      );
      expect(roles).toEqual([UserRole.TEACHER, UserRole.ADMIN]);
    });

    it('Caso 401 Unauthorized: AuthGuard rechaza si falta el encabezado Bearer', async () => {
      const contextNoToken = createMockContext(
        CoursesController.prototype.create,
        CoursesController,
        undefined,
      );
      await expect(authGuard.canActivate(contextNoToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('Caso 403 Forbidden: RolesGuard detiene el acceso si el usuario es STUDENT', () => {
      const contextStudent = createMockContext(
        CoursesController.prototype.create,
        CoursesController,
        'Bearer token_student',
        { sub: 99, role: UserRole.STUDENT },
      );
      const isAllowed = rolesGuard.canActivate(contextStudent);
      expect(isAllowed).toBe(false);
    });

    it('Caso Permitido (201 Created): RolesGuard autoriza a TEACHER y vincula su id como creador', async () => {
      const teacherUser = { sub: 15, role: UserRole.TEACHER };
      const contextTeacher = createMockContext(
        CoursesController.prototype.create,
        CoursesController,
        'Bearer token_teacher',
        teacherUser,
      );
      const isAllowed = rolesGuard.canActivate(contextTeacher);
      expect(isAllowed).toBe(true);

      const createDto = { title: 'NestJS Microservicios', level: 'avanzado' };
      const createdCourse = { id: 5, ...createDto, teacherId: 15 };
      mockCourseRepository.create.mockReturnValue(createdCourse);
      mockCourseRepository.save.mockResolvedValue(createdCourse);

      const mockReq = { user: teacherUser } as any;
      const result = await controller.create(createDto, mockReq);

      expect(mockCourseRepository.create).toHaveBeenCalledWith({
        ...createDto,
        teacherId: 15,
      });
      expect(result).toEqual(createdCourse);
    });

    it('Caso Permitido (201 Created): RolesGuard autoriza también a ADMIN', async () => {
      const adminUser = { sub: 1, role: UserRole.ADMIN };
      const contextAdmin = createMockContext(
        CoursesController.prototype.create,
        CoursesController,
        'Bearer token_admin',
        adminUser,
      );
      const isAllowed = rolesGuard.canActivate(contextAdmin);
      expect(isAllowed).toBe(true);
    });
  });

  describe('3. Propiedad de Recursos (PATCH /courses/:id) - Autorización = Identidad + Política + Contexto', () => {
    it('Política: RolesGuard restringe la ruta a ADMIN y TEACHER', () => {
      const roles = reflector.get<UserRole[]>(
        ROLES_KEY,
        CoursesController.prototype.update,
      );
      expect(roles).toEqual([UserRole.ADMIN, UserRole.TEACHER]);

      const contextStudent = createMockContext(
        CoursesController.prototype.update,
        CoursesController,
        'Bearer token',
        { sub: 99, role: UserRole.STUDENT },
      );
      expect(rolesGuard.canActivate(contextStudent)).toBe(false);
    });

    it('Contexto en Servicio: Docente NO puede modificar curso de otro docente (403 Forbidden)', async () => {
      const courseTeacher2 = {
        id: 2,
        title: 'Curso de Profesor 2',
        level: 'intermedio',
        teacherId: 20, // Perteneciente al docente con ID 20
      };
      mockCourseRepository.findOneBy.mockResolvedValue(courseTeacher2);

      const teacher1 = { sub: 10, role: UserRole.TEACHER }; // Docente con ID 10 intenta modificarlo

      await expect(
        service.update(2, { title: 'Modificación ilegítima' }, teacher1),
      ).rejects.toThrow(ForbiddenException);

      expect(mockCourseRepository.save).not.toHaveBeenCalled();
    });

    it('Contexto en Servicio: Docente modifica con éxito su propio curso (200 OK Permitido)', async () => {
      const courseTeacher1 = {
        id: 1,
        title: 'Curso de Profesor 1',
        level: 'intermedio',
        teacherId: 10, // Creado por docente 10
      };
      mockCourseRepository.findOneBy.mockResolvedValue({ ...courseTeacher1 });
      mockCourseRepository.save.mockImplementation((entity) => Promise.resolve(entity));

      const teacher1 = { sub: 10, role: UserRole.TEACHER };

      const result = await service.update(
        1,
        { title: 'Curso de Profesor 1 Actualizado' },
        teacher1,
      );

      expect(result.title).toBe('Curso de Profesor 1 Actualizado');
      expect(mockCourseRepository.save).toHaveBeenCalled();
    });

    it('Contexto en Servicio: Admin puede modificar cualquier curso (200 OK Permitido)', async () => {
      const courseTeacher2 = {
        id: 2,
        title: 'Curso de Profesor 2',
        level: 'intermedio',
        teacherId: 20,
      };
      mockCourseRepository.findOneBy.mockResolvedValue({ ...courseTeacher2 });
      mockCourseRepository.save.mockImplementation((entity) => Promise.resolve(entity));

      const admin = { sub: 1, role: UserRole.ADMIN };

      const result = await service.update(
        2,
        { title: 'Título auditado y corregido por Admin' },
        admin,
      );

      expect(result.title).toBe('Título auditado y corregido por Admin');
      expect(mockCourseRepository.save).toHaveBeenCalled();
    });
  });
});

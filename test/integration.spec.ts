import { describe, it, expect, beforeEach } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CoursesController } from '../src/courses/courses.controller.js';
import { UpdateCourseUseCase } from '../src/courses/use-cases/update-course.use-case.js';
import { type CourseRepository } from '../src/courses/ports/course.repository.js';
import { UserRole } from '../src/users/enums/user-role.enum.js';
import { Course } from '../src/courses/entities/course.entity.js';

describe('Sesión 25 · Integración de Capas (Controller ↔ UseCase ↔ Port)', () => {
  let controller: CoursesController;
  let useCase: UpdateCourseUseCase;
  let inMemoryDb: Course[];

  const testRepo: CourseRepository = {
    findById: async (id: number) => {
      const c = inMemoryDb.find((item) => item.id === id);
      return c ? { ...c } : null;
    },
    save: async (c: Course) => {
      const idx = inMemoryDb.findIndex((item) => item.id === c.id);
      if (idx >= 0) inMemoryDb[idx] = { ...c };
      else inMemoryDb.push({ ...c });
      return c;
    },
  };

  const mockCoursesService = {
    findAll: async () => inMemoryDb,
    findOne: async (id: number) => {
      const c = inMemoryDb.find((item) => item.id === id);
      if (!c) throw new NotFoundException('Course not found');
      return c;
    },
    create: async (dto: any, teacherId: number) => {
      const c = { id: inMemoryDb.length + 1, ...dto, teacherId, createdByUserId: teacherId } as Course;
      inMemoryDb.push(c);
      return c;
    },
    remove: async (id: number) => {
      const idx = inMemoryDb.findIndex((item) => item.id === id);
      if (idx >= 0) return inMemoryDb.splice(idx, 1)[0];
      throw new NotFoundException('Course not found');
    },
  };

  beforeEach(() => {
    inMemoryDb = [
      {
        id: 1,
        title: 'Curso Inicial',
        level: 'intermedio',
        teacherId: 10,
        createdByUserId: 10,
        enrollments: [],
      } as Course,
    ];
    useCase = new UpdateCourseUseCase(testRepo);
    controller = new CoursesController(mockCoursesService as any, useCase);
  });

  it('Ruta pública / listado colabora entre controlador y repositorio', async () => {
    const list = await controller.findAll({} as any);
    expect(list).toHaveLength(1);
  });

  it('Flujo de modificación: docente propietario actualiza correctamente a través del caso de uso', async () => {
    const mockReq = { user: { sub: 10, role: UserRole.TEACHER } } as any;
    const updated = await controller.update(1, { title: 'Curso Actualizado' }, mockReq);
    expect(updated.title).toBe('Curso Actualizado');
    expect(inMemoryDb[0].title).toBe('Curso Actualizado');
  });

  it('Flujo de rechazo: docente ajeno recibe 403 Forbidden', async () => {
    const mockReq = { user: { sub: 99, role: UserRole.TEACHER } } as any;
    await expect(controller.update(1, { title: 'Hack' }, mockReq)).rejects.toThrow(ForbiddenException);
    expect(inMemoryDb[0].title).toBe('Curso Inicial');
  });

  it('Flujo de ausencia: curso inexistente lanza 404 NotFoundException', async () => {
    const mockReq = { user: { sub: 10, role: UserRole.TEACHER } } as any;
    await expect(controller.update(999, { title: 'Inexistente' }, mockReq)).rejects.toThrow(NotFoundException);
  });
});

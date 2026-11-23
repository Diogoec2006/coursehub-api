import { describe, it, expect } from 'vitest';
import { COURSE_REPOSITORY, CourseRepository } from '../src/courses/ports/course.repository.js';
import { UpdateCourseUseCase } from '../src/courses/use-cases/update-course.use-case.js';
import { TypeOrmCourseRepository } from '../src/courses/adapters/typeorm-course.repository.js';
import { Course } from '../src/courses/entities/course.entity.js';
import { UserRole } from '../src/users/enums/user-role.enum.js';

describe('Sesión 22: Arquitectura Hexagonal y Desacoplamiento (Puertos y Adaptadores)', () => {
  it('1. El puerto COURSE_REPOSITORY es un símbolo desacoplado que no depende de TypeORM', () => {
    expect(typeof COURSE_REPOSITORY).toBe('symbol');
  });

  it('2. El caso de uso UpdateCourseUseCase depende del puerto y puede ejecutarse con un mock en memoria sin base de datos', async () => {
    const inMemoryDb: Course[] = [
      { id: 1, title: 'In Memory Course', level: 'beginner', teacherId: 10 } as Course,
    ];

    const inMemoryRepo: CourseRepository = {
      findById: async (id: number) => inMemoryDb.find((c) => c.id === id) ?? null,
      save: async (course: Course) => {
        const index = inMemoryDb.findIndex((c) => c.id === course.id);
        if (index >= 0) inMemoryDb[index] = course;
        else inMemoryDb.push(course);
        return course;
      },
    };

    const useCase = new UpdateCourseUseCase(inMemoryRepo);
    const updated = await useCase.execute(
      1,
      { title: 'Curso Actualizado en Memoria' },
      { id: 10, role: UserRole.TEACHER },
    );

    expect(updated.title).toBe('Curso Actualizado en Memoria');
    expect(inMemoryDb[0].title).toBe('Curso Actualizado en Memoria');
  });

  it('3. El adaptador TypeOrmCourseRepository implementa el contrato CourseRepository', () => {
    const mockRepo = { findOneBy: () => Promise.resolve(null), save: (c: any) => Promise.resolve(c) } as any;
    const adapter = new TypeOrmCourseRepository(mockRepo);
    expect(typeof adapter.findById).toBe('function');
    expect(typeof adapter.save).toBe('function');
  });
});

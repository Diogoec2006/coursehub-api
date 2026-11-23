import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UpdateCourseUseCase } from './update-course.use-case.js';
import { CourseRepository } from '../ports/course.repository.js';
import { Course } from '../entities/course.entity.js';
import { UserRole } from '../../users/enums/user-role.enum.js';

describe('UpdateCourseUseCase (Sesión 22: Clean Architecture & Use Case)', () => {
  let useCase: UpdateCourseUseCase;
  let mockRepository: CourseRepository;

  const mockCourse: Course = {
    id: 1,
    title: 'Arquitectura Limpia',
    level: 'avanzado',
    teacherId: 10,
    createdByUserId: 10,
    enrollments: [],
  } as Course;

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      save: vi.fn(),
    };
    useCase = new UpdateCourseUseCase(mockRepository);
  });

  it('debe actualizar el curso si el actor es el docente propietario', async () => {
    vi.mocked(mockRepository.findById).mockResolvedValue({ ...mockCourse });
    vi.mocked(mockRepository.save).mockImplementation((c) => Promise.resolve(c));

    const actor = { id: 10, role: UserRole.TEACHER };
    const changes = { title: 'Arquitectura Limpia y Hexagonal' };

    const result = await useCase.execute(1, changes, actor);

    expect(mockRepository.findById).toHaveBeenCalledWith(1);
    expect(result.title).toBe('Arquitectura Limpia y Hexagonal');
    expect(mockRepository.save).toHaveBeenCalled();
  });

  it('debe actualizar el curso si el actor es ADMIN aunque no sea el propietario', async () => {
    vi.mocked(mockRepository.findById).mockResolvedValue({ ...mockCourse });
    vi.mocked(mockRepository.save).mockImplementation((c) => Promise.resolve(c));

    const adminActor = { id: 99, role: UserRole.ADMIN };
    const changes = { title: 'Título Auditado por Admin' };

    const result = await useCase.execute(1, changes, adminActor);

    expect(result.title).toBe('Título Auditado por Admin');
    expect(mockRepository.save).toHaveBeenCalled();
  });

  it('debe lanzar NotFoundException si el curso no existe en el repositorio', async () => {
    vi.mocked(mockRepository.findById).mockResolvedValue(null);

    const actor = { id: 10, role: UserRole.TEACHER };
    await expect(useCase.execute(999, { title: 'X' }, actor)).rejects.toThrow(
      NotFoundException,
    );
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('debe lanzar ForbiddenException si un docente intenta modificar el curso de otro docente', async () => {
    vi.mocked(mockRepository.findById).mockResolvedValue({ ...mockCourse }); // teacherId: 10

    const anotherTeacher = { id: 25, role: UserRole.TEACHER }; // ID diferente
    await expect(
      useCase.execute(1, { title: 'Intento ilegítimo' }, anotherTeacher),
    ).rejects.toThrow(ForbiddenException);

    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('debe lanzar ForbiddenException si un estudiante intenta modificar un curso', async () => {
    vi.mocked(mockRepository.findById).mockResolvedValue({ ...mockCourse });

    const student = { id: 99, role: UserRole.STUDENT };
    await expect(
      useCase.execute(1, { title: 'Intento estudiante' }, student),
    ).rejects.toThrow(ForbiddenException);

    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});

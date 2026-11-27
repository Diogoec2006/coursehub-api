import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UpdateCourseUseCase } from './update-course.use-case.js';
import { COURSE_REPOSITORY, type CourseRepository } from '../ports/course.repository.js';
import { Course } from '../entities/course.entity.js';
import { UserRole } from '../../users/enums/user-role.enum.js';
import { UpdateCourseDto } from '../dto/update-couerse.dto.js';

describe('Sesión 23 · Reglas de negocio con Jest / Vitest (UpdateCourseUseCase)', () => {
  let useCase: UpdateCourseUseCase;
  let mockCourses: CourseRepository;

  const sampleCourse: Course = {
    id: 7,
    title: 'NestJS básico',
    level: 'intermedio',
    teacherId: 10,
    createdByUserId: 10,
    enrollments: [],
  } as Course;

  beforeEach(async () => {
    mockCourses = {
      findById: vi.fn(),
      save: vi.fn(),
    };

    // Inyección de dependencias con puerto desacoplado
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateCourseUseCase,
        {
          provide: COURSE_REPOSITORY,
          useValue: mockCourses,
        },
      ],
    }).compile();

    useCase = module.get<UpdateCourseUseCase>(UpdateCourseUseCase);
  });

  it('allows the owner teacher to update a course (Arrange, Act, Assert)', async () => {
    // Arrange: preparar entradas y mockear el repositorio
    const changes: UpdateCourseDto = { title: 'NestJS avanzado' };
    const actor = { id: 10, role: UserRole.TEACHER };
    vi.mocked(mockCourses.findById).mockResolvedValue({ ...sampleCourse });
    vi.mocked(mockCourses.save).mockImplementation(async (value) => value);

    // Act: ejecutar la regla de negocio pura
    const result = await useCase.execute(7, changes, actor);

    // Assert: comprobar el resultado y la persistencia
    expect(result.title).toBe('NestJS avanzado');
    expect(mockCourses.findById).toHaveBeenCalledWith(7);
    expect(mockCourses.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 7, title: 'NestJS avanzado' }),
    );
  });

  it('rejects with NotFoundException and does not call save when course does not exist', async () => {
    // Arrange: curso inexistente en el repositorio
    vi.mocked(mockCourses.findById).mockResolvedValue(null);
    const changes: UpdateCourseDto = { title: 'X' };
    const actor = { id: 10, role: UserRole.TEACHER };

    // Act & Assert: lanza 404 y jamás llama a save
    await expect(useCase.execute(999, changes, actor)).rejects.toThrow(NotFoundException);
    expect(mockCourses.save).not.toHaveBeenCalled();
  });

  it('rejects with ForbiddenException and prevents saving when another teacher attempts to update', async () => {
    // Arrange: curso pertenece al docente 10, intenta docente 99
    vi.mocked(mockCourses.findById).mockResolvedValue({ ...sampleCourse });
    const changes: UpdateCourseDto = { title: 'Modificación Ilegítima' };
    const otherTeacher = { id: 99, role: UserRole.TEACHER };

    // Act & Assert: regla de seguridad impide continuar y no guarda
    await expect(useCase.execute(7, changes, otherTeacher)).rejects.toThrow(ForbiddenException);
    expect(mockCourses.save).not.toHaveBeenCalled();
  });

  it('allows an administrator to update any course according to policy', async () => {
    // Arrange: administrador con ID distinto al docente
    vi.mocked(mockCourses.findById).mockResolvedValue({ ...sampleCourse });
    vi.mocked(mockCourses.save).mockImplementation(async (value) => value);
    const adminActor = { id: 1, role: UserRole.ADMIN };
    const changes: UpdateCourseDto = { title: 'Título Auditado por Admin' };

    // Act
    const result = await useCase.execute(7, changes, adminActor);

    // Assert: admin autorizado para actualizar
    expect(result.title).toBe('Título Auditado por Admin');
    expect(mockCourses.save).toHaveBeenCalled();
  });

  it('rejects with ForbiddenException and does not save when a student attempts to update', async () => {
    // Arrange
    vi.mocked(mockCourses.findById).mockResolvedValue({ ...sampleCourse });
    const studentActor = { id: 10, role: UserRole.STUDENT };
    const changes: UpdateCourseDto = { title: 'Intento de Estudiante' };

    // Act & Assert
    await expect(useCase.execute(7, changes, studentActor)).rejects.toThrow(ForbiddenException);
    expect(mockCourses.save).not.toHaveBeenCalled();
  });

  it('notifies subscribers via CourseNotifier port when course is updated successfully (Sesión 30)', async () => {
    const mockNotifier = { notifyCourseUpdated: vi.fn() };
    const customUseCase = new UpdateCourseUseCase(mockCourses, mockNotifier);
    vi.mocked(mockCourses.findById).mockResolvedValue({ ...sampleCourse });
    vi.mocked(mockCourses.save).mockImplementation(async (value) => value);

    const changes: UpdateCourseDto = { title: 'Título con Notificación en Tiempo Real' };
    const actor = { id: 10, role: UserRole.TEACHER };

    const result = await customUseCase.execute(7, changes, actor);

    expect(result.title).toBe('Título con Notificación en Tiempo Real');
    expect(mockNotifier.notifyCourseUpdated).toHaveBeenCalledWith(
      expect.objectContaining({ id: 7, title: 'Título con Notificación en Tiempo Real' }),
    );
  });
});

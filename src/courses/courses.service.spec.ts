import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CoursesService } from './courses.service.js';
import { Course } from './entities/course.entity.js';
import { CoursesQueryDto } from './dto/courses-query.dto.js';
import { UserRole } from '../users/enums/user-role.enum.js';

describe('CoursesService', () => {
  let service: CoursesService;

  const mockCourseRepository = {
    find: vi.fn(),
    findAndCount: vi.fn(),
    findOneBy: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        {
          provide: getRepositoryToken(Course),
          useValue: mockCourseRepository,
        },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('debe devolver la primera página ordenada por defecto cuando no se pasan parámetros', async () => {
      const mockCourses: Course[] = [
        { id: 1, title: 'TypeScript Básico', level: 'beginner' },
        { id: 2, title: 'NestJS Avanzado', level: 'advanced' },
      ];
      mockCourseRepository.findAndCount.mockResolvedValue([mockCourses, 2]);

      const result = await service.findAll(new CoursesQueryDto());

      expect(mockCourseRepository.findAndCount).toHaveBeenCalledWith({
        where: {},
        order: { id: 'ASC' },
        skip: 0,
        take: 10,
      });

      expect(result).toEqual({
        items: mockCourses,
        meta: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });

    it('debe filtrar por nivel y aplicar paginación y ordenamiento personalizados', async () => {
      const query: CoursesQueryDto = {
        level: 'beginner',
        page: 2,
        limit: 5,
        sortBy: 'title',
        order: 'ASC',
      };

      const mockCourses: Course[] = [
        { id: 6, title: 'NodeJS Intro', level: 'beginner' },
      ];
      mockCourseRepository.findAndCount.mockResolvedValue([mockCourses, 11]);

      const result = await service.findAll(query);

      expect(mockCourseRepository.findAndCount).toHaveBeenCalledWith({
        where: { level: 'beginner' },
        order: { title: 'ASC' },
        skip: 5,
        take: 5,
      });

      expect(result).toEqual({
        items: mockCourses,
        meta: {
          total: 11,
          page: 2,
          limit: 5,
          totalPages: 3,
        },
      });
    });

    it('debe calcular correctamente totalPages cuando el total es 0', async () => {
      mockCourseRepository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll(new CoursesQueryDto());

      expect(result.meta.totalPages).toBe(0);
      expect(result.items).toEqual([]);
    });

    it('dos páginas sucesivas usan skip/take con orden para evitar repeticiones', async () => {
      mockCourseRepository.findAndCount.mockResolvedValue([[], 20]);

      await service.findAll({ page: 1, limit: 10, sortBy: 'id', order: 'ASC' });
      expect(mockCourseRepository.findAndCount).toHaveBeenLastCalledWith({
        where: {},
        order: { id: 'ASC' },
        skip: 0,
        take: 10,
      });

      await service.findAll({ page: 2, limit: 10, sortBy: 'id', order: 'ASC' });
      expect(mockCourseRepository.findAndCount).toHaveBeenLastCalledWith({
        where: {},
        order: { id: 'ASC' },
        skip: 10,
        take: 10,
      });
    });
  });

  describe('findOne', () => {
    it('debe retornar el curso si existe', async () => {
      const mockCourse = { id: 1, title: 'NestJS', level: 'intermedio', teacherId: 10 };
      mockCourseRepository.findOneBy.mockResolvedValue(mockCourse);

      const result = await service.findOne(1);
      expect(result).toEqual(mockCourse);
    });

    it('debe lanzar NotFoundException si el curso no existe', async () => {
      mockCourseRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('debe crear y persistir el curso asociando el teacherId', async () => {
      const createDto = { title: 'NestJS Auth', level: 'intermedio' };
      const createdEntity = { id: 1, ...createDto, teacherId: 5 };
      mockCourseRepository.create.mockReturnValue(createdEntity);
      mockCourseRepository.save.mockResolvedValue(createdEntity);

      const result = await service.create(createDto, 5);

      expect(mockCourseRepository.create).toHaveBeenCalledWith({
        ...createDto,
        teacherId: 5,
      });
      expect(mockCourseRepository.save).toHaveBeenCalledWith(createdEntity);
      expect(result).toEqual(createdEntity);
    });
  });

  describe('update (Propiedad de recursos: Admin, Docente, Estudiante)', () => {
    const existingCourse = {
      id: 1,
      title: 'TypeScript Avanzado',
      level: 'avanzado',
      teacherId: 10,
    };

    it('Admin: puede modificar cualquier curso independientemente del creador', async () => {
      mockCourseRepository.findOneBy.mockResolvedValue({ ...existingCourse });
      mockCourseRepository.save.mockImplementation((c) => Promise.resolve(c));

      const adminUser = { sub: 999, role: UserRole.ADMIN };
      const result = await service.update(
        1,
        { title: 'TypeScript Modificado por Admin' },
        adminUser,
      );

      expect(result.title).toBe('TypeScript Modificado por Admin');
      expect(mockCourseRepository.save).toHaveBeenCalled();
    });

    it('Docente: puede modificar un curso creado por su cuenta (propiedad válida)', async () => {
      mockCourseRepository.findOneBy.mockResolvedValue({ ...existingCourse });
      mockCourseRepository.save.mockImplementation((c) => Promise.resolve(c));

      const teacherOwner = { sub: 10, role: UserRole.TEACHER };
      const result = await service.update(
        1,
        { title: 'TypeScript Actualizado por Propietario' },
        teacherOwner,
      );

      expect(result.title).toBe('TypeScript Actualizado por Propietario');
      expect(mockCourseRepository.save).toHaveBeenCalled();
    });

    it('Docente: NO puede modificar un curso creado por otro docente (403 Forbidden)', async () => {
      mockCourseRepository.findOneBy.mockResolvedValue({ ...existingCourse }); // teacherId: 10

      const anotherTeacher = { sub: 20, role: UserRole.TEACHER }; // teacherId diferente

      await expect(
        service.update(1, { title: 'Intento Ilegítimo' }, anotherTeacher),
      ).rejects.toThrow(ForbiddenException);

      expect(mockCourseRepository.save).not.toHaveBeenCalled();
    });

    it('Docente: NO puede modificar un curso que no tiene teacherId asignado (403 Forbidden)', async () => {
      mockCourseRepository.findOneBy.mockResolvedValue({
        id: 2,
        title: 'Curso Huérfano',
        level: 'intermedio',
        teacherId: null,
      });

      const teacher = { sub: 10, role: UserRole.TEACHER };

      await expect(
        service.update(2, { title: 'Intento en huérfano' }, teacher),
      ).rejects.toThrow(ForbiddenException);

      expect(mockCourseRepository.save).not.toHaveBeenCalled();
    });

    it('Estudiante: NO modifica cursos bajo ninguna circunstancia (403 Forbidden)', async () => {
      mockCourseRepository.findOneBy.mockResolvedValue({ ...existingCourse });

      const studentUser = { sub: 10, role: UserRole.STUDENT };

      await expect(
        service.update(1, { title: 'Intento de Estudiante' }, studentUser),
      ).rejects.toThrow(ForbiddenException);

      expect(mockCourseRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('debe eliminar el curso y retornarlo', async () => {
      const mockCourse = { id: 1, title: 'Eliminar', level: 'beginner' };
      mockCourseRepository.findOneBy.mockResolvedValue(mockCourse);
      mockCourseRepository.remove.mockResolvedValue(mockCourse);

      const result = await service.remove(1);
      expect(mockCourseRepository.remove).toHaveBeenCalledWith(mockCourse);
      expect(result).toEqual(mockCourse);
    });
  });
});

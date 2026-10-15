import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CoursesService } from './courses.service.js';
import { Course } from './entities/course.entity.js';
import { CoursesQueryDto } from './dto/courses-query.dto.js';

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
});

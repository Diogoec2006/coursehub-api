import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service.js';
import { Enrollment } from './entities/enrollment.entity.js';
import { StudentsService } from '../students/students.service.js';
import { CoursesService } from '../courses/courses.service.js';
import { EnrollmentsQueryDto } from './dto/enrollments-query.dto.js';

describe('EnrollmentsService', () => {
  let service: EnrollmentsService;
  let studentsService: StudentsService;
  let coursesService: CoursesService;

  const mockQueryBuilder = {
    leftJoinAndSelect: vi.fn().mockReturnThis(),
    andWhere: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    take: vi.fn().mockReturnThis(),
    getManyAndCount: vi.fn(),
  };

  const mockEnrollmentRepository = {
    createQueryBuilder: vi.fn(() => mockQueryBuilder),
    findOne: vi.fn(),
    find: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    remove: vi.fn(),
  };

  const mockStudentsService = {
    findOne: vi.fn(),
  };

  const mockCoursesService = {
    findOne: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnrollmentsService,
        {
          provide: getRepositoryToken(Enrollment),
          useValue: mockEnrollmentRepository,
        },
        {
          provide: StudentsService,
          useValue: mockStudentsService,
        },
        {
          provide: CoursesService,
          useValue: mockCoursesService,
        },
      ],
    }).compile();

    service = module.get<EnrollmentsService>(EnrollmentsService);
    studentsService = module.get<StudentsService>(StudentsService);
    coursesService = module.get<CoursesService>(CoursesService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('findAll con QueryBuilder', () => {
    it('debe cargar relaciones con student y course y aplicar paginación por defecto', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([
        [
          {
            id: 1,
            student: { id: 1, name: 'Ana García', isActive: true },
            course: { id: 1, title: 'NestJS' },
          },
        ],
        1,
      ]);

      const result = await service.findAll(new EnrollmentsQueryDto());

      expect(mockEnrollmentRepository.createQueryBuilder).toHaveBeenCalledWith('enrollment');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('enrollment.student', 'student');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('enrollment.course', 'course');
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('enrollment.id', 'ASC');
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);

      expect(result).toEqual({
        items: [
          {
            id: 1,
            student: { id: 1, name: 'Ana García', isActive: true },
            course: { id: 1, title: 'NestJS' },
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });

    it('debe buscar de forma segura por nombre o título sin concatenar SQL', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const query: EnrollmentsQueryDto = {
        search: 'NestJS',
        page: 1,
        limit: 10,
      };

      await service.findAll(query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(student.name ILIKE :search OR course.title ILIKE :search)',
        { search: '%NestJS%' },
      );
    });

    it('debe parametrizar de forma segura entradas parecidas a inyección SQL', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const maliciousSqlInput = "'; DROP TABLE enrollments; --";
      const query: EnrollmentsQueryDto = {
        search: maliciousSqlInput,
        page: 1,
        limit: 10,
      };

      const result = await service.findAll(query);

      // Comprobamos que el input malicioso se trata estrictamente como un valor parametrizado
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(student.name ILIKE :search OR course.title ILIKE :search)',
        { search: `%${maliciousSqlInput.trim()}%` },
      );

      // Una búsqueda sin coincidencias retorna 200 con colección vacía, no lanza error 404
      expect(result.items).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });

    it('debe combinar filtros opcionales de studentId, courseId y activeOnly', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const query: EnrollmentsQueryDto = {
        studentId: 3,
        courseId: 5,
        activeOnly: 'true',
        page: 2,
        limit: 5,
      };

      await service.findAll(query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('student.id = :studentId', {
        studentId: 3,
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('course.id = :courseId', {
        courseId: 5,
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('student.isActive = :active', {
        active: true,
      });
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(5);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
    });

    it('no debe lanzar 404 cuando la colección está vacía', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll(new EnrollmentsQueryDto());

      expect(result).toEqual({
        items: [],
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
      });
    });
  });

  describe('create', () => {
    it('debe crear una matrícula exitosamente', async () => {
      const student = { id: 1, name: 'Ana García', isActive: true };
      const course = { id: 1, title: 'NestJS' };
      const savedEnrollment = { id: 1, student, course };

      mockStudentsService.findOne.mockResolvedValue(student);
      mockCoursesService.findOne.mockResolvedValue(course);
      mockEnrollmentRepository.findOne.mockResolvedValue(null);
      mockEnrollmentRepository.create.mockReturnValue(savedEnrollment);
      mockEnrollmentRepository.save.mockResolvedValue(savedEnrollment);

      const result = await service.create({ studentId: 1, courseId: 1 });

      expect(result).toEqual(savedEnrollment);
    });

    it('debe lanzar BadRequestException si el estudiante está inactivo', async () => {
      mockStudentsService.findOne.mockResolvedValue({ id: 2, name: 'Carlos', isActive: false });

      await expect(service.create({ studentId: 2, courseId: 1 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe lanzar ConflictException si la matrícula ya existe', async () => {
      mockStudentsService.findOne.mockResolvedValue({ id: 1, name: 'Ana', isActive: true });
      mockCoursesService.findOne.mockResolvedValue({ id: 1, title: 'NestJS' });
      mockEnrollmentRepository.findOne.mockResolvedValue({ id: 1 });

      await expect(service.create({ studentId: 1, courseId: 1 })).rejects.toThrow(
        ConflictException,
      );
    });
  });
});

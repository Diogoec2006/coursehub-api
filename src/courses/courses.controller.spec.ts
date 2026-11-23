import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CoursesController } from './courses.controller.js';
import { CoursesService } from './courses.service.js';
import { UpdateCourseUseCase } from './use-cases/update-course.use-case.js';
import { CoursesQueryDto } from './dto/courses-query.dto.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { UserRole } from '../users/enums/user-role.enum.js';

describe('CoursesController', () => {
  let controller: CoursesController;
  let service: CoursesService;

  const mockCoursesService = {
    findAll: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  const mockUpdateCourseUseCase = {
    execute: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoursesController],
      providers: [
        {
          provide: CoursesService,
          useValue: mockCoursesService,
        },
        {
          provide: UpdateCourseUseCase,
          useValue: mockUpdateCourseUseCase,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CoursesController>(CoursesController);
    service = module.get<CoursesService>(CoursesService);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('debe llamar a findAll pasando el query DTO', async () => {
    const query: CoursesQueryDto = {
      level: 'beginner',
      page: 2,
      limit: 5,
      sortBy: 'title',
      order: 'ASC',
    };

    const expectedResponse = {
      items: [{ id: 1, title: 'Intro', level: 'beginner' }],
      meta: { total: 1, page: 2, limit: 5, totalPages: 1 },
    };

    mockCoursesService.findAll.mockResolvedValue(expectedResponse);

    const result = await controller.findAll(query);

    expect(service.findAll).toHaveBeenCalledWith(query);
    expect(result).toEqual(expectedResponse);
  });

  it('debe llamar a findOne con el id numérico', async () => {
    const course = { id: 1, title: 'Curso 1', level: 'intermedio' };
    mockCoursesService.findOne.mockResolvedValue(course);

    const result = await controller.findOne('1');
    expect(service.findOne).toHaveBeenCalledWith(1);
    expect(result).toEqual(course);
  });

  it('debe llamar a create pasando el DTO y el id del docente extraído de req.user', async () => {
    const createDto = { title: 'Curso de Prueba', level: 'intermedio' };
    const mockReq = { user: { sub: 5, role: UserRole.TEACHER } } as any;
    const createdCourse = { id: 10, ...createDto, teacherId: 5 };

    mockCoursesService.create.mockResolvedValue(createdCourse);

    const result = await controller.create(createDto, mockReq);
    expect(service.create).toHaveBeenCalledWith(createDto, 5);
    expect(result).toEqual(createdCourse);
  });

  describe('update (Sesión 24 · Controladores, Cobertura y Calidad de Pruebas)', () => {
    it('comprueba que el puente HTTP conserva los argumentos y delega al caso de uso', async () => {
      const dto = { title: 'NestJS avanzado' };
      const actor = { id: 7, role: UserRole.TEACHER };
      const mockReq = { user: { sub: 7, role: UserRole.TEACHER } } as any;
      const expectedCourse = { id: 7, ...dto, teacherId: 7 } as any;

      mockUpdateCourseUseCase.execute.mockResolvedValue(expectedCourse);

      await expect(controller.update(7, dto, mockReq)).resolves.toEqual(expectedCourse);
      expect(mockUpdateCourseUseCase.execute).toHaveBeenCalledWith(7, dto, actor);
    });

    it('un error del caso de uso (ForbiddenException) no se convierte en un falso 200 y se propaga', async () => {
      const dto = { title: 'Intento Ilegítimo' };
      const mockReq = { user: { sub: 99, role: UserRole.TEACHER } } as any;

      mockUpdateCourseUseCase.execute.mockRejectedValue(
        new ForbiddenException('You cannot modify this course'),
      );

      await expect(controller.update(7, dto, mockReq)).rejects.toThrow(ForbiddenException);
      expect(mockUpdateCourseUseCase.execute).toHaveBeenCalledWith(7, dto, {
        id: 99,
        role: UserRole.TEACHER,
      });
    });

    it('un error de recurso inexistente (NotFoundException) se propaga sin alteración', async () => {
      const dto = { title: 'Curso Inexistente' };
      const mockReq = { user: { sub: 7, role: UserRole.TEACHER } } as any;

      mockUpdateCourseUseCase.execute.mockRejectedValue(
        new NotFoundException('Course not found'),
      );

      await expect(controller.update(999, dto, mockReq)).rejects.toThrow(NotFoundException);
    });

    it('delega en coursesService.update si no se proporciona updateCourseUseCase (compatibilidad)', async () => {
      const fallbackController = new CoursesController(service);
      const updateDto = { title: 'Fallback' };
      const mockReq = { user: { sub: 5, role: UserRole.TEACHER } } as any;
      const fallbackCourse = { id: 1, title: 'Fallback' } as any;

      mockCoursesService.update.mockResolvedValue(fallbackCourse);

      const result = await fallbackController.update(1, updateDto, mockReq);
      expect(service.update).toHaveBeenCalledWith(1, updateDto, mockReq.user);
      expect(result).toEqual(fallbackCourse);
    });
  });

  it('debe llamar a remove con el id numérico', async () => {
    const deletedCourse = { id: 1, title: 'Curso Eliminado' };
    mockCoursesService.remove.mockResolvedValue(deletedCourse);

    const result = await controller.remove('1');
    expect(service.remove).toHaveBeenCalledWith(1);
    expect(result).toEqual(deletedCourse);
  });
});

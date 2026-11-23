import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
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

  it('debe llamar a update pasando el id, DTO y req.user delegando a updateCourseUseCase', async () => {
    const updateDto = { title: 'Nuevo Título' };
    const mockReq = { user: { sub: 5, role: UserRole.TEACHER } } as any;
    const updatedCourse = { id: 1, title: 'Nuevo Título', level: 'intermedio', teacherId: 5 };

    mockUpdateCourseUseCase.execute.mockResolvedValue(updatedCourse);

    const result = await controller.update('1' as any, updateDto, mockReq);
    expect(mockUpdateCourseUseCase.execute).toHaveBeenCalledWith(1, updateDto, {
      id: 5,
      role: UserRole.TEACHER,
    });
    expect(result).toEqual(updatedCourse);
  });

  it('debe llamar a remove con el id numérico', async () => {
    const deletedCourse = { id: 1, title: 'Curso Eliminado' };
    mockCoursesService.remove.mockResolvedValue(deletedCourse);

    const result = await controller.remove('1');
    expect(service.remove).toHaveBeenCalledWith(1);
    expect(result).toEqual(deletedCourse);
  });
});

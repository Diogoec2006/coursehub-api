import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CoursesController } from './courses.controller.js';
import { CoursesService } from './courses.service.js';
import { CoursesQueryDto } from './dto/courses-query.dto.js';

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

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoursesController],
      providers: [
        {
          provide: CoursesService,
          useValue: mockCoursesService,
        },
      ],
    }).compile();

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
});

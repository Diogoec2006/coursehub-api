import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EnrollmentsController } from './enrollments.controller.js';
import { EnrollmentsService } from './enrollments.service.js';
import { EnrollmentsQueryDto } from './dto/enrollments-query.dto.js';

describe('EnrollmentsController', () => {
  let controller: EnrollmentsController;
  let service: EnrollmentsService;

  const mockEnrollmentsService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    findByStudentId: vi.fn(),
    findByCourseId: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnrollmentsController],
      providers: [
        {
          provide: EnrollmentsService,
          useValue: mockEnrollmentsService,
        },
      ],
    }).compile();

    controller = module.get<EnrollmentsController>(EnrollmentsController);
    service = module.get<EnrollmentsService>(EnrollmentsService);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('debe llamar a create en el servicio', async () => {
    const dto = { studentId: 1, courseId: 1 };
    const expected = { id: 1, studentId: 1, courseId: 1 };
    mockEnrollmentsService.create.mockResolvedValue(expected);

    const result = await controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expected);
  });

  it('debe llamar a findAll en el servicio con EnrollmentsQueryDto', async () => {
    const query: EnrollmentsQueryDto = {
      search: 'TypeScript',
      studentId: 1,
      page: 1,
      limit: 10,
    };
    const expected = {
      items: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
    };
    mockEnrollmentsService.findAll.mockResolvedValue(expected);

    const result = await controller.findAll(query);
    expect(service.findAll).toHaveBeenCalledWith(query);
    expect(result).toEqual(expected);
  });

  it('debe llamar a findOne en el servicio', async () => {
    const expected = { id: 1, student: { id: 1 }, course: { id: 1 } };
    mockEnrollmentsService.findOne.mockResolvedValue(expected);

    const result = await controller.findOne(1);
    expect(service.findOne).toHaveBeenCalledWith(1);
    expect(result).toEqual(expected);
  });

  it('debe llamar a findByStudent en el servicio', async () => {
    const expected = [{ id: 1, student: { id: 1 }, course: { id: 1 } }];
    mockEnrollmentsService.findByStudentId.mockResolvedValue(expected);

    const result = await controller.findByStudent(1);
    expect(service.findByStudentId).toHaveBeenCalledWith(1);
    expect(result).toEqual(expected);
  });

  it('debe llamar a findByCourse en el servicio', async () => {
    const expected = [{ id: 1, student: { id: 1 }, course: { id: 1 } }];
    mockEnrollmentsService.findByCourseId.mockResolvedValue(expected);

    const result = await controller.findByCourse(1);
    expect(service.findByCourseId).toHaveBeenCalledWith(1);
    expect(result).toEqual(expected);
  });

  it('debe llamar a remove en el servicio', async () => {
    const expected = { id: 1 };
    mockEnrollmentsService.remove.mockResolvedValue(expected);

    const result = await controller.remove(1);
    expect(service.remove).toHaveBeenCalledWith(1);
    expect(result).toEqual(expected);
  });
});

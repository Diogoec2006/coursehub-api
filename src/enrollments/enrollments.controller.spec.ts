import { Test, TestingModule } from '@nestjs/testing';
import { EnrollmentsController } from './enrollments.controller.js';
import { EnrollmentsService } from './enrollments.service.js';
import { StudentsService } from '../students/students.service.js';
import { CoursesService } from '../courses/courses.service.js';

describe('EnrollmentsController', () => {
  let controller: EnrollmentsController;
  let service: EnrollmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnrollmentsController],
      providers: [EnrollmentsService, StudentsService, CoursesService],
    }).compile();

    controller = module.get<EnrollmentsController>(EnrollmentsController);
    service = module.get<EnrollmentsService>(EnrollmentsService);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('debe llamar a create en el servicio', () => {
    const result = controller.create({ studentId: 1, courseId: 1 });
    expect(result).toEqual({ id: 1, studentId: 1, courseId: 1 });
  });

  it('debe llamar a findAll en el servicio', () => {
    controller.create({ studentId: 1, courseId: 1 });
    expect(controller.findAll({})).toHaveLength(1);
  });

  it('debe llamar a findOne en el servicio', () => {
    const created = controller.create({ studentId: 1, courseId: 1 });
    expect(controller.findOne(created.id)).toEqual(created);
  });

  it('debe llamar a findByStudent en el servicio', () => {
    controller.create({ studentId: 1, courseId: 1 });
    expect(controller.findByStudent(1)).toHaveLength(1);
  });

  it('debe llamar a findByCourse en el servicio', () => {
    controller.create({ studentId: 1, courseId: 1 });
    expect(controller.findByCourse(1)).toHaveLength(1);
  });

  it('debe llamar a remove en el servicio', () => {
    const created = controller.create({ studentId: 1, courseId: 1 });
    expect(controller.remove(created.id)).toEqual(created);
  });
});

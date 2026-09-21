import { Test, TestingModule } from '@nestjs/testing';
import { EnrollmentsService } from './enrollments.service.js';
import { StudentsService } from '../students/students.service.js';
import { CoursesService } from '../courses/courses.service.js';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

describe('EnrollmentsService', () => {
  let service: EnrollmentsService;
  let studentsService: StudentsService;
  let coursesService: CoursesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EnrollmentsService, StudentsService, CoursesService],
    }).compile();

    service = module.get<EnrollmentsService>(EnrollmentsService);
    studentsService = module.get<StudentsService>(StudentsService);
    coursesService = module.get<CoursesService>(CoursesService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debe crear una matrícula exitosamente', () => {
    const enrollment = service.create({ studentId: 1, courseId: 1 });
    expect(enrollment).toEqual({ id: 1, studentId: 1, courseId: 1 });
  });

  it('debe lanzar BadRequestException si el estudiante está inactivo', () => {
    expect(() => service.create({ studentId: 2, courseId: 1 })).toThrow(
      BadRequestException,
    );
  });

  it('debe lanzar ConflictException si la matrícula ya existe', () => {
    service.create({ studentId: 1, courseId: 1 });
    expect(() => service.create({ studentId: 1, courseId: 1 })).toThrow(
      ConflictException,
    );
  });

  it('debe lanzar NotFoundException si el curso no existe', () => {
    expect(() => service.create({ studentId: 1, courseId: 999 })).toThrow(
      NotFoundException,
    );
  });

  it('debe filtrar matrículas por studentId y courseId', () => {
    service.create({ studentId: 1, courseId: 1 });
    service.create({ studentId: 1, courseId: 2 });
    service.create({ studentId: 3, courseId: 1 });

    expect(service.findAll({ studentId: 1 })).toHaveLength(2);
    expect(service.findAll({ courseId: 2 })).toHaveLength(1);
    expect(service.findAll({ studentId: 3, courseId: 1 })).toHaveLength(1);
  });

  it('debe cancelar una matrícula existente', () => {
    const created = service.create({ studentId: 1, courseId: 1 });
    const removed = service.remove(created.id);
    expect(removed.id).toBe(created.id);
    expect(() => service.findOne(created.id)).toThrow(NotFoundException);
  });
});

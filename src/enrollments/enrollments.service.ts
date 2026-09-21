import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Enrollment } from './entities/enrollment.entity.js';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto.js';
import { GetEnrollmentsFilterDto } from './dto/get-enrollments-filter.dto.js';
import { StudentsService } from '../students/students.service.js';
import { CoursesService } from '../courses/courses.service.js';

@Injectable()
export class EnrollmentsService {
  private readonly enrollments: Enrollment[] = [];
  private nextId = 1;

  constructor(
    private readonly studentsService: StudentsService,
    private readonly coursesService: CoursesService,
  ) {}

  create(createEnrollmentDto: CreateEnrollmentDto): Enrollment {
    const { studentId, courseId } = createEnrollmentDto;

    // 1. Validar existencia del estudiante
    const student = this.studentsService.findOne(studentId);

    // 2. Validar que el estudiante esté activo
    if (!student.isActive) {
      throw new BadRequestException(
        `El estudiante '${student.name}' (ID: ${studentId}) se encuentra inactivo y no puede matricularse en ningún curso.`,
      );
    }

    // 3. Validar existencia del curso
    const course = this.coursesService.findOne(courseId);
    if (!course) {
      throw new NotFoundException(
        `Curso con identificador ${courseId} no encontrado.`,
      );
    }

    // 4. Validar que no exista matrícula duplicada
    const alreadyEnrolled = this.enrollments.some(
      (enrollment) =>
        enrollment.studentId === studentId && enrollment.courseId === courseId,
    );

    if (alreadyEnrolled) {
      throw new ConflictException(
        `El estudiante con identificador ${studentId} ya se encuentra matriculado en el curso ${courseId}.`,
      );
    }

    const newEnrollment: Enrollment = {
      id: this.nextId++,
      studentId,
      courseId,
    };

    this.enrollments.push(newEnrollment);
    return newEnrollment;
  }

  findAll(filterDto?: GetEnrollmentsFilterDto): Enrollment[] {
    let result = [...this.enrollments];

    if (!filterDto) {
      return result;
    }

    const { studentId, courseId } = filterDto;

    if (studentId !== undefined) {
      result = result.filter((e) => e.studentId === studentId);
    }

    if (courseId !== undefined) {
      result = result.filter((e) => e.courseId === courseId);
    }

    return result;
  }

  findOne(id: number): Enrollment {
    const enrollment = this.enrollments.find((e) => e.id === id);
    if (!enrollment) {
      throw new NotFoundException(
        `Matrícula con identificador ${id} no encontrada.`,
      );
    }
    return enrollment;
  }

  findByStudentId(studentId: number): Enrollment[] {
    // Valida que el estudiante exista (lanza NotFoundException si no existe)
    this.studentsService.findOne(studentId);
    return this.enrollments.filter((e) => e.studentId === studentId);
  }

  findByCourseId(courseId: number): Enrollment[] {
    // Valida que el curso exista (lanza NotFoundException si no existe)
    const course = this.coursesService.findOne(courseId);
    if (!course) {
      throw new NotFoundException(
        `Curso con identificador ${courseId} no encontrado.`,
      );
    }
    return this.enrollments.filter((e) => e.courseId === courseId);
  }

  remove(id: number): Enrollment {
    const index = this.enrollments.findIndex((e) => e.id === id);
    if (index === -1) {
      throw new NotFoundException(
        `Matrícula con identificador ${id} no encontrada.`,
      );
    }

    const [removedEnrollment] = this.enrollments.splice(index, 1);
    return removedEnrollment;
  }
}

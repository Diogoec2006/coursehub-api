import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment } from './entities/enrollment.entity.js';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto.js';
import { GetEnrollmentsFilterDto } from './dto/get-enrollments-filter.dto.js';
import { StudentsService } from '../students/students.service.js';
import { CoursesService } from '../courses/courses.service.js';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentsRepository: Repository<Enrollment>,
    private readonly studentsService: StudentsService,
    private readonly coursesService: CoursesService,
  ) {}

  async create(createEnrollmentDto: CreateEnrollmentDto): Promise<Enrollment> {
    const { studentId, courseId } = createEnrollmentDto;

    // 1. Validar existencia del estudiante (lanza 404 si no existe)
    const student = await this.studentsService.findOne(studentId);

    // 2. Validar que el estudiante esté activo
    if (!student.isActive) {
      throw new BadRequestException(
        `El estudiante '${student.name}' (ID: ${studentId}) se encuentra inactivo y no puede matricularse en ningún curso.`,
      );
    }

    // 3. Validar existencia del curso (lanza 404 si no existe)
    const course = await this.coursesService.findOne(courseId);

    // 4. Validar que no exista matrícula duplicada en la BD
    const existingEnrollment = await this.enrollmentsRepository.findOne({
      where: {
        student: { id: studentId },
        course: { id: courseId },
      },
    });

    if (existingEnrollment) {
      throw new ConflictException(
        `El estudiante con identificador ${studentId} ya se encuentra matriculado en el curso ${courseId}.`,
      );
    }

    // 5. Crear y guardar la relación en PostgreSQL
    const enrollment = this.enrollmentsRepository.create({
      student,
      course,
    });

    return this.enrollmentsRepository.save(enrollment);
  }

  async findAll(filterDto?: GetEnrollmentsFilterDto): Promise<Enrollment[]> {
    const query = this.enrollmentsRepository.createQueryBuilder('enrollment')
      .leftJoinAndSelect('enrollment.student', 'student')
      .leftJoinAndSelect('enrollment.course', 'course');

    if (filterDto?.studentId) {
      query.andWhere('student.id = :studentId', { studentId: filterDto.studentId });
    }

    if (filterDto?.courseId) {
      query.andWhere('course.id = :courseId', { courseId: filterDto.courseId });
    }

    return query.getMany();
  }

  async findOne(id: number): Promise<Enrollment> {
    const enrollment = await this.enrollmentsRepository.findOne({
      where: { id },
      relations: { student: true, course: true }, // Carga los datos relacionados
    });

    if (!enrollment) {
      throw new NotFoundException(
        `Matrícula con identificador ${id} no encontrada.`,
      );
    }
    return enrollment;
  }

  async findByStudentId(studentId: number): Promise<Enrollment[]> {
    await this.studentsService.findOne(studentId); // Valida existencia
    return this.enrollmentsRepository.find({
      where: { student: { id: studentId } },
      relations: { student: true, course: true },
    });
  }

  async findByCourseId(courseId: number): Promise<Enrollment[]> {
    await this.coursesService.findOne(courseId); // Valida existencia
    return this.enrollmentsRepository.find({
      where: { course: { id: courseId } },
      relations: { student: true, course: true },
    });
  }

  async remove(id: number): Promise<Enrollment> {
    const enrollment = await this.findOne(id);
    return this.enrollmentsRepository.remove(enrollment);
  }
}
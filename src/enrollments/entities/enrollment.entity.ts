import { Entity, PrimaryGeneratedColumn, ManyToOne, Unique } from 'typeorm';
import { Student } from '../../students/entities/student.entity.js';
import { Course } from '../../courses/entities/course.entity.js';

@Entity('enrollments')
@Unique(['student', 'course']) // Evita matrículas duplicadas a nivel de base de datos[cite: 23]
export class Enrollment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Student, { onDelete: 'RESTRICT' }) // Evita borrados accidentales de estudiantes con matrículas activas
  student: Student;

  @ManyToOne(() => Course, { onDelete: 'RESTRICT' }) // Evita borrados accidentales de cursos con matrículas activas
  course: Course;
}
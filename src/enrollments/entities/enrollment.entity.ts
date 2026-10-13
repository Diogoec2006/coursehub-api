import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Student } from '../../students/entities/student.entity.js';
import { Course } from '../../courses/entities/course.entity.js';

@Entity('enrollments')
@Unique(['student', 'course']) // Evita matrículas duplicadas a nivel de base de datos
export class Enrollment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Student, (student) => student.enrollments, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'student_id' }) // Clave foránea explícita hacia students
  student: Student;

  @ManyToOne(() => Course, (course) => course.enrollments, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'course_id' }) // Clave foránea explícita hacia courses
  course: Course;
}
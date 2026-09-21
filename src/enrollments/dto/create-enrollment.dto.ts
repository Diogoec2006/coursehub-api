import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class CreateEnrollmentDto {
  @IsNotEmpty({ message: 'El studentId es obligatorio.' })
  @Type(() => Number)
  @IsInt({ message: 'El studentId debe ser un número entero.' })
  @Min(1, { message: 'El studentId debe ser un número entero mayor a 0.' })
  studentId: number;

  @IsNotEmpty({ message: 'El courseId es obligatorio.' })
  @Type(() => Number)
  @IsInt({ message: 'El courseId debe ser un número entero.' })
  @Min(1, { message: 'El courseId debe ser un número entero mayor a 0.' })
  courseId: number;
}

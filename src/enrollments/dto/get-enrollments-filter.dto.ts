import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class GetEnrollmentsFilterDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El filtro studentId debe ser un número entero.' })
  @Min(1, { message: 'El filtro studentId debe ser un número entero mayor a 0.' })
  studentId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El filtro courseId debe ser un número entero.' })
  @Min(1, { message: 'El filtro courseId debe ser un número entero mayor a 0.' })
  courseId?: number;
}

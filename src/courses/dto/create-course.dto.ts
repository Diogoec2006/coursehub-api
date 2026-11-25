import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({
    example: 'NestJS Avanzado y Microservicios',
    description: 'Título descriptivo del curso',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'intermedio',
    enum: ['principiante', 'intermedio', 'avanzado'],
    description: 'Nivel de dificultad del curso',
  })
  @IsIn(['principiante', 'intermedio', 'avanzado']) // 5
  level: string;
}

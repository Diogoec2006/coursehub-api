import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CoursesQueryDto {
  @ApiPropertyOptional({
    example: 'intermedio',
    description: 'Filtrar cursos por nivel de dificultad',
  })
  @IsString()
  @IsOptional()
  level?: string;

  @ApiPropertyOptional({
    example: 1,
    default: 1,
    description: 'Número de página para paginación',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page: number = 1;

  @ApiPropertyOptional({
    example: 10,
    default: 10,
    description: 'Cantidad de elementos por página (máximo 50)',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  limit: number = 10;

  @ApiPropertyOptional({
    example: 'id',
    enum: ['id', 'title', 'level'],
    default: 'id',
    description: 'Campo por el cual ordenar los resultados',
  })
  @IsIn(['id', 'title', 'level'])
  @IsOptional()
  sortBy: 'id' | 'title' | 'level' = 'id';

  @ApiPropertyOptional({
    example: 'ASC',
    enum: ['ASC', 'DESC'],
    default: 'ASC',
    description: 'Dirección del ordenamiento (ASC o DESC)',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @IsIn(['ASC', 'DESC'])
  @IsOptional()
  order: 'ASC' | 'DESC' = 'ASC';
}

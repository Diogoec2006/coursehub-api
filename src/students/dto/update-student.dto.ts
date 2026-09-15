import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateStudentDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  age?: number;

  @IsString()
  @IsOptional()
  career?: string;

  @IsInt()
  @Min(1, { message: 'El semestre mínimo permitido es 1' })
  @Max(10, { message: 'El semestre máximo permitido es 10' })
  @IsOptional()
  semester?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

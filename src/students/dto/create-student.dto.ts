import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsInt()
  @Min(1)
  age: number;

  @IsString()
  @IsNotEmpty()
  career: string;

  @IsInt()
  @Min(1, { message: 'El semestre mínimo permitido es 1' })
  @Max(10, { message: 'El semestre máximo permitido es 10' })
  semester: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsIn(['principiante', 'intermedio', 'avanzado']) // 5
  level: string;
}

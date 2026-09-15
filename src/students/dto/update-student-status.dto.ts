import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateStudentStatusDto {
  @IsBoolean({ message: 'isActive debe ser un valor booleano (true o false)' })
  @IsNotEmpty({ message: 'El campo isActive es obligatorio' })
  isActive: boolean;
}

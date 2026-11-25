import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../users/enums/user-role.enum.js';

export class RegisterDto {
  @ApiProperty({
    example: 'nuevo.docente@coursehub.edu',
    description: 'Correo electrónico único para el registro',
  })
  @Transform(({ value }) => String(value).trim().toLowerCase())
  @IsEmail({}, { message: 'El correo debe ser una dirección válida' })
  @IsNotEmpty({ message: 'El correo es obligatorio' })
  email: string;

  @ApiProperty({
    example: 'PasswordSegura2026!',
    description: 'Contraseña de la cuenta (entre 8 y 72 caracteres)',
  })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(8, { message: 'La contraseña debe tener como mínimo 8 caracteres' })
  @MaxLength(72, { message: 'La contraseña no puede exceder los 72 caracteres' })
  password: string;

  @ApiPropertyOptional({
    example: UserRole.TEACHER,
    enum: UserRole,
    default: UserRole.STUDENT,
    description: 'Rol asignado al nuevo usuario',
  })
  @IsOptional()
  @IsEnum(UserRole, {
    message: 'El rol debe ser un valor válido (admin, teacher o student)',
  })
  role?: UserRole;
}

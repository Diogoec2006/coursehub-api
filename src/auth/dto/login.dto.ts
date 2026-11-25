import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'teacher1@coursehub.edu',
    description: 'Correo electrónico registrado del usuario',
  })
  @Transform(({ value }) => String(value).trim().toLowerCase())
  @IsEmail({}, { message: 'El correo debe ser una dirección válida' })
  @IsNotEmpty({ message: 'El correo es obligatorio' })
  email: string;

  @ApiProperty({
    example: 'DocentePass123!',
    description: 'Contraseña del usuario (mínimo 8 caracteres)',
  })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(8, { message: 'La contraseña debe tener como mínimo 8 caracteres' })
  @MaxLength(72, { message: 'La contraseña no puede exceder los 72 caracteres' })
  password: string;
}

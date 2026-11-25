import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { AuthGuard } from './guards/auth.guard.js';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar un nuevo usuario',
    description: 'Crea una cuenta en el sistema asegurando hashing de contraseña con bcrypt (costo 12).',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado exitosamente (retorna datos públicos sin credenciales sensibles).',
  })
  @ApiResponse({
    status: 400,
    description: 'DTO inválido (email inválido o contraseña menor a 8 caracteres).',
  })
  @ApiResponse({
    status: 409,
    description: 'El correo electrónico ya se encuentra registrado.',
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  // Límite de solicitudes para mitigar ataques de fuerza bruta en inicio de sesión (Sesión 20)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesión y obtener token JWT',
    description: 'Autentica credenciales y genera un accessToken firmado con payload explícito { sub, email, role }.',
  })
  @ApiResponse({
    status: 200,
    description: 'Inicio de sesión exitoso. Retorna accessToken y datos del usuario.',
  })
  @ApiResponse({
    status: 400,
    description: 'DTO inválido.',
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas (UnauthorizedException).',
  })
  @ApiResponse({
    status: 429,
    description: 'Demasiadas solicitudes: Límite de Throttle alcanzado.',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener información de identidad autenticada',
    description: 'Extrae y devuelve el payload del token Bearer JWT verificado por AuthGuard.',
  })
  @ApiResponse({
    status: 200,
    description: 'Identidad del usuario autenticado.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autenticado: Token Bearer ausente, expirado o manipulado.',
  })
  getProfile(@Req() req: Request) {
    return (req as any).user;
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async register(dto: RegisterDto) {
    // Hash primero, persistencia después (costo 12 para mitigar ataques de fuerza bruta)
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Persistimos el usuario pasando únicamente email y passwordHash
    return this.usersService.create(dto.email, passwordHash);
  }

  async login(dto: LoginDto) {
    // El hash se recupera exclusivamente para esta operación explícita
    const user = await this.usersService.findByEmailWithPassword(dto.email);

    // El mismo fallo público para dos causas privadas: evita ataques de enumeración
    const matches = user
      ? await bcrypt.compare(dto.password, user.passwordHash)
      : false;

    if (!user || !matches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Respuesta segura: jamás exponer el hash ni secretos al cliente
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }
}

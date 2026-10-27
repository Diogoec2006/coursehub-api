import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtPayload } from './types/jwt-payload.type.js';

export type { JwtPayload } from './types/jwt-payload.type.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // Hash primero, persistencia después (costo 12 para mitigar ataques de fuerza bruta)
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Persistimos el usuario pasando únicamente email y passwordHash
    return this.usersService.create(dto.email, passwordHash);
  }

  async validateCredentials(email: string, password: string) {
    const user = await this.usersService.findByEmailWithPassword(email);
    const passwordMatches = user
      ? await bcrypt.compare(password, user.passwordHash)
      : false;

    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return { id: user.id, email: user.email, createdAt: user.createdAt };
  }

  async login(dto: LoginDto) {
    const user = await this.validateCredentials(dto.email, dto.password);
    const payload: JwtPayload = { sub: user.id, email: user.email };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user,
    };
  }
}


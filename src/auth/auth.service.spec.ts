import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import bcrypt from 'bcrypt';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersService = {
    create: vi.fn(),
    findByEmailWithPassword: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('debe transformar la contraseña con bcrypt (costo 12) antes de persistir y jamás enviar la contraseña en texto plano', async () => {
      const registerDto = {
        email: 'estudiante@coursehub.edu',
        password: 'ClaveSuperSegura123!',
      };

      const fakeCreatedUser = {
        id: 10,
        email: 'estudiante@coursehub.edu',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.create.mockImplementation(async (email: string, passwordHash: string) => {
        expect(passwordHash).not.toBe(registerDto.password);
        expect(passwordHash).toMatch(/^\$2[aby]\$12\$/);
        const isMatch = await bcrypt.compare(registerDto.password, passwordHash);
        expect(isMatch).toBe(true);

        return fakeCreatedUser;
      });

      const result = await service.register(registerDto);

      expect(mockUsersService.create).toHaveBeenCalledTimes(1);
      const [calledEmail, calledHash] = mockUsersService.create.mock.calls[0];
      expect(calledEmail).toBe('estudiante@coursehub.edu');
      expect(calledHash).not.toBe('ClaveSuperSegura123!');
      expect(result).toEqual(fakeCreatedUser);
    });
  });

  describe('login', () => {
    it('debe autenticar con credenciales correctas y retornar el usuario seguro sin passwordHash', async () => {
      const rawPassword = 'MiPasswordSeguro123!';
      const hash = await bcrypt.hash(rawPassword, 12);

      const fakeUserWithHash = {
        id: 1,
        email: 'estudiante@coursehub.edu',
        passwordHash: hash,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.findByEmailWithPassword.mockResolvedValue(fakeUserWithHash);

      const result = await service.login({
        email: 'estudiante@coursehub.edu',
        password: rawPassword,
      });

      expect(mockUsersService.findByEmailWithPassword).toHaveBeenCalledWith('estudiante@coursehub.edu');
      expect(result).not.toHaveProperty('passwordHash');
      expect(result.id).toBe(1);
      expect(result.email).toBe('estudiante@coursehub.edu');
    });

    it('debe lanzar UnauthorizedException ("Invalid credentials") si la contraseña es errónea', async () => {
      const correctPassword = 'PasswordCorrecto123!';
      const hash = await bcrypt.hash(correctPassword, 12);

      mockUsersService.findByEmailWithPassword.mockResolvedValue({
        id: 1,
        email: 'estudiante@coursehub.edu',
        passwordHash: hash,
      });

      await expect(
        service.login({
          email: 'estudiante@coursehub.edu',
          password: 'PasswordErroneo999!',
        }),
      ).rejects.toThrow(new UnauthorizedException('Invalid credentials'));
    });

    it('debe lanzar el mismo UnauthorizedException ("Invalid credentials") si el usuario no existe', async () => {
      mockUsersService.findByEmailWithPassword.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'no.existe@coursehub.edu',
          password: 'CualquierPassword123!',
        }),
      ).rejects.toThrow(new UnauthorizedException('Invalid credentials'));
    });
  });
});

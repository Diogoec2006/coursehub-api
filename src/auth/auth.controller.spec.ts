import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    register: vi.fn(),
    login: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('debe llamar a authService.register y retornar el usuario seguro', async () => {
      const dto: RegisterDto = {
        email: 'nuevo@coursehub.edu',
        password: 'PasswordSeguro123',
      };

      const expectedResponse = {
        id: 1,
        email: 'nuevo@coursehub.edu',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthService.register.mockResolvedValue(expectedResponse);

      const result = await controller.register(dto);

      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('login', () => {
    it('debe llamar a authService.login y retornar el usuario autenticado', async () => {
      const dto: LoginDto = {
        email: 'estudiante@coursehub.edu',
        password: 'PasswordSeguro123',
      };

      const expectedUser = {
        id: 1,
        email: 'estudiante@coursehub.edu',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthService.login.mockResolvedValue(expectedUser);

      const result = await controller.login(dto);

      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedUser);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UsersService } from './users.service.js';
import { User } from './entities/user.entity.js';

describe('UsersService', () => {
  let service: UsersService;

  const mockUsersRepository = {
    findOneBy: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    createQueryBuilder: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe crear y persistir un usuario, retornando el usuario sin passwordHash', async () => {
      mockUsersRepository.findOneBy.mockResolvedValue(null);
      const fakeUser = {
        id: 1,
        email: 'usuario@example.com',
        passwordHash: '$2b$12$fakeHashCalculadoPorBcrypt',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockUsersRepository.create.mockReturnValue(fakeUser);
      mockUsersRepository.save.mockResolvedValue(fakeUser);

      const result = await service.create(
        'usuario@example.com',
        '$2b$12$fakeHashCalculadoPorBcrypt',
      );

      expect(mockUsersRepository.findOneBy).toHaveBeenCalledWith({ email: 'usuario@example.com' });
      expect(mockUsersRepository.create).toHaveBeenCalledWith({
        email: 'usuario@example.com',
        passwordHash: '$2b$12$fakeHashCalculadoPorBcrypt',
      });
      expect(mockUsersRepository.save).toHaveBeenCalledWith(fakeUser);

      // Verificamos que passwordHash NO esté expuesto en la respuesta
      expect(result).not.toHaveProperty('passwordHash');
      expect(result.email).toBe('usuario@example.com');
      expect(result.id).toBe(1);
    });

    it('debe lanzar ConflictException (409) si el correo ya existe previamente', async () => {
      mockUsersRepository.findOneBy.mockResolvedValue({
        id: 2,
        email: 'repetido@example.com',
      });

      await expect(
        service.create('repetido@example.com', '$2b$12$hashValido'),
      ).rejects.toThrow(ConflictException);

      expect(mockUsersRepository.save).not.toHaveBeenCalled();
    });

    it('debe lanzar ConflictException (409) si la base de datos dispara error 23505 (unique_violation)', async () => {
      mockUsersRepository.findOneBy.mockResolvedValue(null);
      mockUsersRepository.create.mockReturnValue({ email: 'race@example.com' });
      const dbError: any = new Error('duplicate key value violates unique constraint');
      dbError.code = '23505';
      mockUsersRepository.save.mockRejectedValue(dbError);

      await expect(
        service.create('race@example.com', '$2b$12$hashValido'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findById', () => {
    it('debe retornar el usuario si existe', async () => {
      const user = { id: 1, email: 'test@example.com' };
      mockUsersRepository.findOneBy.mockResolvedValue(user);

      const result = await service.findById(1);
      expect(result).toEqual(user);
    });

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      mockUsersRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });
});

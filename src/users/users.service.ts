import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(email: string, passwordHash: string): Promise<Omit<User, 'passwordHash'>> {
    const existing = await this.usersRepository.findOneBy({ email });
    if (existing) {
      throw new ConflictException(`El correo ${email} ya está registrado`);
    }

    try {
      const user = this.usersRepository.create({
        email,
        passwordHash,
      });
      const savedUser = await this.usersRepository.save(user);

      // Eliminamos passwordHash del objeto retornado para evitar cualquier fuga
      const { passwordHash: _, ...safeUser } = savedUser;
      return safeUser;
    } catch (error: any) {
      // Postgres error code 23505 = unique_violation
      if (error?.code === '23505') {
        throw new ConflictException(`El correo ${email} ya está registrado`);
      }
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findById(id: number): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }
    return user;
  }
}

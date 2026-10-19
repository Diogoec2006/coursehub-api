import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, it, expect } from 'vitest';
import { RegisterDto } from './register.dto.js';

describe('RegisterDto', () => {
  it('debe validar exitosamente un registro válido y normalizar el correo a minúsculas y sin espacios', async () => {
    const rawData = {
      email: '  Usuario.PRACTICA@Dominio.COM  ',
      password: 'PasswordSeguro123',
    };
    const dto = plainToInstance(RegisterDto, rawData);
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
    expect(dto.email).toBe('usuario.practica@dominio.com');
    // La contraseña nunca debe ser alterada (preserva mayúsculas y caracteres exactos)
    expect(dto.password).toBe('PasswordSeguro123');
  });

  it('debe rechazar un correo con formato inválido', async () => {
    const dto = plainToInstance(RegisterDto, {
      email: 'correo-no-valido',
      password: 'PasswordSeguro123',
    });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const emailError = errors.find((e) => e.property === 'email');
    expect(emailError).toBeDefined();
    expect(emailError?.constraints).toHaveProperty('isEmail');
  });

  it('debe rechazar una contraseña menor a 8 caracteres', async () => {
    const dto = plainToInstance(RegisterDto, {
      email: 'test@example.com',
      password: '1234567', // 7 caracteres
    });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const passError = errors.find((e) => e.property === 'password');
    expect(passError).toBeDefined();
    expect(passError?.constraints).toHaveProperty('minLength');
  });

  it('debe rechazar una contraseña que supere el límite de 72 caracteres de bcrypt', async () => {
    const longPassword = 'a'.repeat(73);
    const dto = plainToInstance(RegisterDto, {
      email: 'test@example.com',
      password: longPassword,
    });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const passError = errors.find((e) => e.property === 'password');
    expect(passError).toBeDefined();
    expect(passError?.constraints).toHaveProperty('maxLength');
  });

  it('debe rechazar cuando los campos están vacíos', async () => {
    const dto = plainToInstance(RegisterDto, {});
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const emailError = errors.find((e) => e.property === 'email');
    const passError = errors.find((e) => e.property === 'password');
    expect(emailError).toBeDefined();
    expect(passError).toBeDefined();
  });
});

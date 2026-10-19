import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, it, expect } from 'vitest';
import { LoginDto } from './login.dto.js';

describe('LoginDto', () => {
  it('debe validar un login correcto y normalizar el correo eliminando espacios y convirtiendo a minúsculas', async () => {
    const rawData = {
      email: '  Usuario.Login@DOMINIO.com  ',
      password: 'MiPasswordSeguro123',
    };
    const dto = plainToInstance(LoginDto, rawData);
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
    expect(dto.email).toBe('usuario.login@dominio.com');
    expect(dto.password).toBe('MiPasswordSeguro123');
  });

  it('debe rechazar un correo con formato inválido con error de validación (isEmail)', async () => {
    const dto = plainToInstance(LoginDto, {
      email: 'correo-invalido-sin-arroba',
      password: 'PasswordValido123',
    });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const emailError = errors.find((e) => e.property === 'email');
    expect(emailError).toBeDefined();
    expect(emailError?.constraints).toHaveProperty('isEmail');
  });

  it('debe rechazar una contraseña con menos de 8 caracteres (minLength)', async () => {
    const dto = plainToInstance(LoginDto, {
      email: 'usuario@dominio.com',
      password: '12345',
    });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const passError = errors.find((e) => e.property === 'password');
    expect(passError).toBeDefined();
    expect(passError?.constraints).toHaveProperty('minLength');
  });

  it('debe rechazar una contraseña con más de 72 caracteres (maxLength)', async () => {
    const dto = plainToInstance(LoginDto, {
      email: 'usuario@dominio.com',
      password: 'a'.repeat(73),
    });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const passError = errors.find((e) => e.property === 'password');
    expect(passError).toBeDefined();
    expect(passError?.constraints).toHaveProperty('maxLength');
  });

  it('debe rechazar cuando los campos son requeridos y están vacíos', async () => {
    const dto = plainToInstance(LoginDto, {});
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'email')).toBe(true);
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });
});

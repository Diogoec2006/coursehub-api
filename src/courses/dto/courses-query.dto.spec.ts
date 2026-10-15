import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, it, expect } from 'vitest';
import { CoursesQueryDto } from './courses-query.dto.js';

describe('CoursesQueryDto', () => {
  it('debe tener valores por defecto cuando no se envían parámetros', async () => {
    const dto = plainToInstance(CoursesQueryDto, {});
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(10);
    expect(dto.sortBy).toBe('id');
    expect(dto.order).toBe('ASC');
    expect(dto.level).toBeUndefined();
  });

  it('debe validar exitosamente parámetros válidos', async () => {
    const dto = plainToInstance(CoursesQueryDto, {
      level: 'beginner',
      page: '2',
      limit: '5',
      sortBy: 'title',
      order: 'asc',
    });
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
    expect(dto.level).toBe('beginner');
    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(5);
    expect(dto.sortBy).toBe('title');
    expect(dto.order).toBe('ASC');
  });

  it('debe rechazar page=0 con error de validación (Min)', async () => {
    const dto = plainToInstance(CoursesQueryDto, { page: '0' });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const pageError = errors.find((e) => e.property === 'page');
    expect(pageError).toBeDefined();
    expect(pageError?.constraints).toHaveProperty('min');
  });

  it('debe rechazar limit=200 con error de validación (Max)', async () => {
    const dto = plainToInstance(CoursesQueryDto, { limit: '200' });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const limitError = errors.find((e) => e.property === 'limit');
    expect(limitError).toBeDefined();
    expect(limitError?.constraints).toHaveProperty('max');
  });

  it('debe rechazar sortBy=createdAt con error de validación (IsIn)', async () => {
    const dto = plainToInstance(CoursesQueryDto, { sortBy: 'createdAt' });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const sortByError = errors.find((e) => e.property === 'sortBy');
    expect(sortByError).toBeDefined();
    expect(sortByError?.constraints).toHaveProperty('isIn');
  });

  it('debe rechazar order inválido con error de validación (IsIn)', async () => {
    const dto = plainToInstance(CoursesQueryDto, { order: 'invalid' });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const orderError = errors.find((e) => e.property === 'order');
    expect(orderError).toBeDefined();
    expect(orderError?.constraints).toHaveProperty('isIn');
  });
});

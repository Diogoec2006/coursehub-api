import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, it, expect } from 'vitest';
import { EnrollmentsQueryDto } from './enrollments-query.dto.js';

describe('EnrollmentsQueryDto', () => {
  it('debe tener valores por defecto para paginación cuando no se envían parámetros', async () => {
    const dto = plainToInstance(EnrollmentsQueryDto, {});
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(10);
    expect(dto.search).toBeUndefined();
    expect(dto.studentId).toBeUndefined();
    expect(dto.courseId).toBeUndefined();
    expect(dto.activeOnly).toBeUndefined();
  });

  it('debe validar exitosamente parámetros válidos', async () => {
    const dto = plainToInstance(EnrollmentsQueryDto, {
      search: 'NestJS',
      studentId: '1',
      courseId: '2',
      activeOnly: 'true',
      page: '2',
      limit: '5',
    });
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
    expect(dto.search).toBe('NestJS');
    expect(dto.studentId).toBe(1);
    expect(dto.courseId).toBe(2);
    expect(dto.activeOnly).toBe('true');
    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(5);
  });

  it('debe rechazar page=0 por validación Min(1)', async () => {
    const dto = plainToInstance(EnrollmentsQueryDto, { page: '0' });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const pageError = errors.find((e) => e.property === 'page');
    expect(pageError?.constraints).toHaveProperty('min');
  });

  it('debe rechazar limit=200 por validación Max(50)', async () => {
    const dto = plainToInstance(EnrollmentsQueryDto, { limit: '200' });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const limitError = errors.find((e) => e.property === 'limit');
    expect(limitError?.constraints).toHaveProperty('max');
  });

  it('debe rechazar activeOnly con valor distinto de true/false', async () => {
    const dto = plainToInstance(EnrollmentsQueryDto, { activeOnly: 'yes' });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const activeOnlyError = errors.find((e) => e.property === 'activeOnly');
    expect(activeOnlyError?.constraints).toHaveProperty('isIn');
  });
});

import { describe, it, expect } from 'vitest';
import Joi from 'joi';

describe('Configuración Segura y Validación de Entorno (Semana 7 - Etapa 2)', () => {
  const validationSchema = Joi.object({
    NODE_ENV: Joi.string()
      .valid('development', 'production', 'test')
      .default('development'),
    PORT: Joi.number().port().default(3000),
    DB_HOST: Joi.string().required(),
    DB_PORT: Joi.number().port().default(5432),
    DB_NAME: Joi.string().required(),
    DB_USER: Joi.string().required(),
    DB_PASSWORD: Joi.string().allow('').default(''),
  });

  it('debe validar exitosamente un entorno completo de desarrollo', () => {
    const devEnv = {
      NODE_ENV: 'development',
      PORT: '3000',
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_NAME: 'coursehub',
      DB_USER: 'postgres',
      DB_PASSWORD: 'secretpassword',
    };

    const { error, value } = validationSchema.validate(devEnv);
    expect(error).toBeUndefined();
    expect(value.PORT).toBe(3000);
    expect(value.DB_PORT).toBe(5432);
    expect(value.NODE_ENV).toBe('development');
  });

  it('debe detener el arranque si falta DB_NAME', () => {
    const invalidEnv = {
      NODE_ENV: 'development',
      PORT: '3000',
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_USER: 'postgres',
    };

    const { error } = validationSchema.validate(invalidEnv);
    expect(error).toBeDefined();
    expect(error?.message).toContain('"DB_NAME" is required');
  });

  it('debe detener el arranque si falta DB_HOST', () => {
    const invalidEnv = {
      NODE_ENV: 'development',
      PORT: '3000',
      DB_NAME: 'coursehub',
      DB_USER: 'postgres',
    };

    const { error } = validationSchema.validate(invalidEnv);
    expect(error).toBeDefined();
    expect(error?.message).toContain('"DB_HOST" is required');
  });

  it('debe activar synchronize solo en development y desactivarlo en production', () => {
    const getSynchronizeFlag = (nodeEnv: string) => nodeEnv === 'development';

    expect(getSynchronizeFlag('development')).toBe(true);
    expect(getSynchronizeFlag('production')).toBe(false);
    expect(getSynchronizeFlag('test')).toBe(false);
  });
});

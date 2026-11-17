import { describe, it, expect, beforeEach } from 'vitest';
import { WelcomeService } from './welcome.service.js';

describe('WelcomeService', () => {
  let service: WelcomeService;

  beforeEach(() => {
    service = new WelcomeService();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debe retornar { message: "Bienvenido a CourseHub API" }', () => {
    const result = service.getMessage();
    expect(result).toEqual({ message: 'Bienvenido a CourseHub API' });
  });
});

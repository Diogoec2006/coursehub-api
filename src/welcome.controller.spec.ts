import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { WelcomeController } from './welcome.controller.js';
import { WelcomeService } from './welcome.service.js';

describe('WelcomeController', () => {
  let controller: WelcomeController;
  let service: WelcomeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WelcomeController],
      providers: [WelcomeService],
    }).compile();

    controller = module.get<WelcomeController>(WelcomeController);
    service = module.get<WelcomeService>(WelcomeService);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  it('debe responder GET /welcome con el mensaje de bienvenida de WelcomeService', () => {
    const response = controller.getWelcome();
    expect(response).toEqual({ message: 'Bienvenido a CourseHub API' });
  });
});

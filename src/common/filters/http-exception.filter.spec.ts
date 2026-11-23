import { describe, it, expect, vi } from 'vitest';
import { HttpExceptionFilter } from './http-exception.filter.js';
import { HttpStatus, NotFoundException } from '@nestjs/common';

describe('HttpExceptionFilter', () => {
  it('debe formatear excepciones HTTP estándar (e.g. 404) con statusCode, path, timestamp y message', () => {
    const filter = new HttpExceptionFilter();

    const mockJson = vi.fn();
    const mockStatus = vi.fn().mockReturnValue({ json: mockJson });
    const mockResponse = { status: mockStatus };
    const mockRequest = { url: '/courses/999' };

    const mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as any;

    const exception = new NotFoundException('Course not found');
    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: HttpStatus.NOT_FOUND,
      path: '/courses/999',
      timestamp: expect.any(String),
      message: 'Course not found',
    });
  });

  it('debe ocultar detalles de errores 500 no controlados devolviendo "Internal server error"', () => {
    const filter = new HttpExceptionFilter();

    const mockJson = vi.fn();
    const mockStatus = vi.fn().mockReturnValue({ json: mockJson });
    const mockResponse = { status: mockStatus };
    const mockRequest = { url: '/critical' };

    const mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as any;

    const exception = new Error('Database connection failed credentials leak');
    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      path: '/critical',
      timestamp: expect.any(String),
      message: 'Internal server error',
    });
  });
});

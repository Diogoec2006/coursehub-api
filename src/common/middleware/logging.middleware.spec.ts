import { describe, it, expect, vi } from 'vitest';
import { LoggingMiddleware } from './logging.middleware.js';

describe('LoggingMiddleware', () => {
  it('debe registrar método, ruta, status y durationMs al finalizar la petición', () => {
    const middleware = new LoggingMiddleware();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    let finishCallback: () => void = () => {};
    const mockReq = {
      method: 'GET',
      originalUrl: '/courses/1',
    } as any;

    const mockRes = {
      statusCode: 200,
      on: vi.fn((event: string, cb: () => void) => {
        if (event === 'finish') {
          finishCallback = cb;
        }
      }),
    } as any;

    const next = vi.fn();

    middleware.use(mockReq, mockRes, next);

    expect(next).toHaveBeenCalled();
    expect(mockRes.on).toHaveBeenCalledWith('finish', expect.any(Function));

    // Simula que la petición finaliza
    finishCallback();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        path: '/courses/1',
        status: 200,
        durationMs: expect.any(Number),
      }),
    );

    consoleSpy.mockRestore();
  });
});

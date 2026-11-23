import { describe, it, expect, vi } from 'vitest';
import { TimingInterceptor } from './timing.interceptor.js';
import { of } from 'rxjs';

describe('TimingInterceptor', () => {
  it('debe medir y loguear durationMs al ejecutar el controlador', async () => {
    const interceptor = new TimingInterceptor();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const mockContext = {} as any;
    const mockNext = {
      handle: vi.fn(() => of({ success: true })),
    };

    const observable = interceptor.intercept(mockContext, mockNext);

    await new Promise<void>((resolve) => {
      observable.subscribe({
        next: (val) => {
          expect(val).toEqual({ success: true });
        },
        complete: () => {
          expect(consoleSpy).toHaveBeenCalledWith(
            expect.objectContaining({
              durationMs: expect.any(Number),
            }),
          );
          consoleSpy.mockRestore();
          resolve();
        },
      });
    });
  });
});

import { describe, it, expect } from 'vitest';

describe('Sesión 20 · Seguridad en Capas: CORS y HTTPS en Producción', () => {
  const corsConfig = {
    origin: ['https://coursehub.example.edu'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };

  it('CORS: debe autorizar exclusivamente el origen permitido por la política institucional', () => {
    expect(corsConfig.origin).toContain('https://coursehub.example.edu');
    expect(corsConfig.origin).not.toContain('http://malicious-site.com');
  });

  it('CORS: debe declarar los métodos HTTP autorizados para la API', () => {
    expect(corsConfig.methods).toEqual(['GET', 'POST', 'PATCH', 'DELETE']);
  });

  it('CORS: debe permitir los encabezados Content-Type y Authorization requeridos para Bearer JWT', () => {
    expect(corsConfig.allowedHeaders).toContain('Content-Type');
    expect(corsConfig.allowedHeaders).toContain('Authorization');
  });

  describe('Matriz de Seguridad en Capas (Riesgo → Control Principal)', () => {
    const securityLayers = [
      {
        capa: 'Entrada',
        riesgo: 'Cuerpo malformado o propiedades no permitidas',
        control: 'DTO + ValidationPipe (whitelist: true, forbidNonWhitelisted: true)',
      },
      {
        capa: 'Abuso',
        riesgo: 'Ataques de fuerza bruta y saturación de peticiones',
        control: 'Rate Limiting / ThrottlerModule (límite de 5 en login, 20 global)',
      },
      {
        capa: 'Acción',
        riesgo: 'Acciones no autorizadas y escalación de privilegios',
        control: 'Roles (@Roles) + RolesGuard + Verificación de propiedad en servicio',
      },
      {
        capa: 'Origen Web',
        riesgo: 'Peticiones cross-origin desde sitios web no autorizados',
        control: 'CORS explícito (app.enableCors con origen restringido)',
      },
      {
        capa: 'Tránsito',
        riesgo: 'Intercepción de tokens Bearer en tránsito (Man-in-the-Middle)',
        control: 'HTTPS / TLS obligatorio en producción + tokens de vida corta (15m)',
      },
    ];

    it.each(securityLayers)('debe relacionar el riesgo "$riesgo" con su control principal', (layer) => {
      expect(layer.control).toBeDefined();
      expect(layer.riesgo).toBeDefined();
    });
  });
});

# 📋 Documento de Entregable: Arquitectura de Seguridad en Capas
**Módulo**: Backend con NestJS — Sesiones 19 y 20  
**Proyecto**: CourseHub API  
**Fecha**: Noviembre 2026  
**Repositorio**: [GitHub - CourseHub API](https://github.com/Diogoec2006/coursehub-api)

---

## 🎯 Resumen Ejecutivo

Este entregable documenta la implementación del esquema de **Seguridad en Profundidad (Defense in Depth)** en CourseHub API. La solución garantiza que cada capa de la aplicación mitigue un vector de ataque específico sin delegar la integridad del sistema a un único mecanismo de control:

```text
Petición Entrante
       │
       ▼
[ Tránsito ]        ───→ HTTPS / TLS (Previene interceptación de Bearer tokens)
       │
       ▼
[ Origen Web ]      ───→ CORS Explícito (Bloquea sitios web no autorizados)
       │
       ▼
[ Abuso / Tráfico ] ───→ Rate Limiting / Throttler (Bloquea fuerza bruta en login)
       │
       ▼
[ Entrada ]         ───→ DTOs + ValidationPipe (Rechaza payloads maliciosos)
       │
       ▼
[ Identidad ]       ───→ JWT + AuthGuard (Responde 401 si la identidad es inválida)
       │
       ▼
[ Política / Rol ]  ───→ @Roles + RolesGuard (Responde 403 si carece de rol)
       │
       ▼
[ Contexto Negocio] ───→ Propiedad de Recursos (Responde 403 si el recurso es ajeno)
```

---

## 1. Modelado de Roles y Principio de Menor Privilegio

### 1.1. Criterio de Cumplimiento
* La entidad `User` implementa un tipo enumerado cerrado (`UserRole`).
* El rol por defecto asignado a cualquier nuevo registro es estrictamente el de menor privilegio (`STUDENT`).

### 1.2. Implementación Técnica
* **Enumerador Cerrado** (`src/users/enums/user-role.enum.ts`):
  ```typescript
  export enum UserRole {
    ADMIN = 'admin',
    TEACHER = 'teacher',
    STUDENT = 'student',
  }
  ```
* **Persistencia con Valor por Defecto** (`src/users/entities/user.entity.ts`):
  ```typescript
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STUDENT,
  })
  role: UserRole;
  ```
* **Propagación en JWT Payload** (`src/auth/types/jwt-payload.type.ts`):
  ```typescript
  export type JwtPayload = {
    sub: number;
    email: string;
    role: UserRole;
  };
  ```

### 1.3. Evidencias de Verificación
* Prueba unitaria en `src/users/users.service.spec.ts`: valida que si no se indica rol, la persistencia aplica el valor basal de estudiante.
* Prueba unitaria en `src/auth/auth.service.spec.ts`: verifica que el `accessToken` viaja firmado conteniendo explícitamente el rol asignado.

---

## 2. Ruta Administrativa Exclusiva: Distinción 401 vs. 403

### 2.1. Criterio de Cumplimiento
* Existe una ruta administrativa (`DELETE /courses/:id`) protegida secuencialmente por identidad (JWT) y política (`@Roles(UserRole.ADMIN)`).
* Responde a dos preguntas de seguridad distintas:
  * **¿Es una identidad válida?** `No` ➔ `401 Unauthorized`.
  * **¿Tiene el permiso/rol necesario?** `No` ➔ `403 Forbidden`.

### 2.2. Implementación Técnica
* **Decorador de Política** (`src/auth/decorators/roles.decorator.ts`):
  ```typescript
  export const ROLES_KEY = 'roles';
  export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
  ```
* **Guardia de Roles** (`src/auth/guards/roles.guard.ts`):
  ```typescript
  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY, [context.getHandler(), context.getClass()],
    );
    if (!roles) return true;

    const { user } = context.switchToHttp().getRequest();
    return Boolean(user?.role && roles.includes(user.role));
  }
  ```
* **Controlador Protegido** (`src/courses/courses.controller.ts`):
  ```typescript
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.coursesService.remove(Number(id));
  }
  ```

### 2.3. Matriz de Pruebas de la Ruta Administrativa
| Caso de Prueba | Entrada | Estado HTTP | Resultado |
| :--- | :--- | :--- | :--- |
| **Sin Token** | Petición sin header `Authorization` | `401 Unauthorized` | Detenido por `AuthGuard` |
| **Token Inválido** | `Authorization: Bearer alterado` | `401 Unauthorized` | Detenido por `AuthGuard` |
| **Docente (TEACHER)** | Token válido con rol `TEACHER` | `403 Forbidden` | Detenido por `RolesGuard` |
| **Estudiante (STUDENT)**| Token válido con rol `STUDENT` | `403 Forbidden` | Detenido por `RolesGuard` |
| **Administrador (ADMIN)**| Token válido con rol `ADMIN` | `200 OK` | Autorizado y procesado |

---

## 3. Regla de Propiedad de Recursos (Resource Ownership)

### 3.1. Criterio de Cumplimiento
* En la operación de actualización (`PATCH /courses/:id`), un rol formal no basta cuando importa **quién creó el recurso**.
* Un docente no puede modificar el curso creado por otro docente.
* La verificación reside en la regla de negocio (servicio), no delegada únicamente a guardias de ruta.

### 3.2. Implementación Técnica
* **Entidad `Course`** (`src/courses/entities/course.entity.ts`):
  ```typescript
  @Column({ type: 'integer', nullable: true })
  teacherId?: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'teacherId' })
  teacher?: Relation<User>;
  ```
* **Lógica Contextual en el Servicio** (`src/courses/courses.service.ts`):
  ```typescript
  async update(
    id: number,
    updateCourseDto: UpdateCourseDto,
    user?: { id?: number; sub?: number; role?: UserRole },
  ): Promise<Course> {
    const course = await this.findOne(id);

    if (user) {
      if (user.role === UserRole.ADMIN) {
        // Administrador: autorizado para modificar cualquier curso
      } else if (user.role === UserRole.TEACHER) {
        const userId = user.id ?? user.sub;
        if (course.teacherId && course.teacherId !== userId) {
          throw new ForbiddenException(
            'No tienes permiso para modificar un curso creado por otro docente',
          );
        }
        if (!course.teacherId) {
          throw new ForbiddenException(
            'No tienes permiso para modificar un curso sin docente asignado',
          );
        }
      } else {
        throw new ForbiddenException(
          'Los estudiantes no tienen permiso para modificar cursos',
        );
      }
    }

    Object.assign(course, updateCourseDto);
    return await this.courseRepository.save(course);
  }
  ```

### 3.3. Evidencias de Verificación
* Pruebas en `src/courses/courses.service.spec.ts` y `src/courses/courses.authorization.spec.ts`:
  * `Docente 1` (sub: 10) actualiza curso propio (teacherId: 10) ➔ `200 OK`.
  * `Docente 1` (sub: 10) intenta actualizar curso de `Docente 2` (teacherId: 20) ➔ `403 Forbidden` (`ForbiddenException`).
  * `Admin` (sub: 1) actualiza curso de cualquier docente ➔ `200 OK`.
  * `Estudiante` (sub: 99) ➔ `403 Forbidden`.

---

## 4. Control de Acceso de Origen Cruzado (CORS Explícito)

### 4.1. Criterio de Cumplimiento
* CORS restringe las peticiones cross-origin a los orígenes estrictamente autorizados para la plataforma institucional.
* Se rechaza el comodín inseguro `*`.

### 4.2. Implementación Técnica
* **Configuración en `src/main.ts`**:
  ```typescript
  app.enableCors({
    origin: ['https://coursehub.example.edu'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  ```

### 4.3. Evidencias de Verificación
* Archivo de prueba `test/cors.spec.ts`:
  * Confirma presencia exclusiva de `https://coursehub.example.edu`.
  * Valida la exclusión de orígenes no autorizados o maliciosos.
  * Valida la lista cerrada de métodos y encabezados para tokens Bearer.

---

## 5. Rate Limiting en Autenticación y Código 429

### 5.1. Criterio de Cumplimiento
* `POST /auth/login` restringe la tasa de solicitudes para mitigar ataques de fuerza bruta y diccionario.
* Al superar el umbral, responde con código HTTP `429 Too Many Requests`.
* La respuesta no revela pistas sobre la validez del correo o de la contraseña.

### 5.2. Implementación Técnica
* **Módulo Global** (`src/app.module.ts`):
  ```typescript
  ThrottlerModule.forRoot([
    {
      ttl: 60_000,
      limit: 20, // 20 peticiones por minuto por defecto
    },
  ]),
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ]
  ```
* **Límite Reforzado en Login** (`src/auth/auth.controller.ts`):
  ```typescript
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
  ```

### 5.3. Principio de Confidencialidad en 429
Al registrarse el 6º intento fallido en menos de 60 segundos:
* El servidor interrumpe la ejecución antes de consultar la base de datos o ejecutar el algoritmo `bcrypt.compare`.
* Retorna `429 Too Many Requests` con mensaje neutro, impidiendo la enumeración de usuarios o contraseñas.
* Archivo de prueba: `src/auth/auth.throttler.spec.ts`.

---

## 6. Directrices de HTTPS y Cifrado en Producción

### 6.1. Declaración en Documentación (`README.md`)
* **Entorno de Desarrollo**: Se admite `http://localhost:3000` con propósitos de prueba local.
* **Entorno de Producción**: **HTTPS/TLS es obligatorio e innegociable**. Dado que los Bearer tokens viajan en el header `Authorization`, un canal HTTP plano expone los tokens a ataques de interceptación (*Man-in-the-Middle*).
* **Terminación TLS en Borde**: En despliegues modernos, TLS se termina en el Reverse Proxy o Load Balancer (NGINX, Cloudflare, AWS ALB, Render/Railway), propagando `X-Forwarded-Proto: https` hacia NestJS.
* **Aislamiento de Secretos**: `JWT_SECRET` (mínimo 32 caracteres) y credenciales de base de datos nunca se incluyen en el repositorio, gestionándose mediante `.env` protegido por `.gitignore`.

---

## 7. Resultados de Ejecución y Métricas de Calidad

```bash
$ npm test

 RUN  v4.1.11 C:/Users/USUARIO/Desktop/REPO CW/coursehub-api

 ✓ src/users/users.service.spec.ts (7 tests)
 ✓ src/enrollments/enrollments.service.spec.ts (9 tests)
 ✓ src/courses/courses.service.spec.ts (14 tests)
 ✓ src/enrollments/enrollments.controller.spec.ts (7 tests)
 ✓ src/auth/auth.controller.spec.ts (4 tests)
 ✓ src/courses/courses.controller.spec.ts (6 tests)
 ✓ test/config.spec.ts (6 tests)
 ✓ src/auth/auth.service.spec.ts (7 tests)
 ✓ src/auth/dto/login.dto.spec.ts (5 tests)
 ✓ src/auth/dto/register.dto.spec.ts (5 tests)
 ✓ src/courses/dto/courses-query.dto.spec.ts (6 tests)
 ✓ src/app.controller.spec.ts (1 test)
 ✓ test/cors.spec.ts (8 tests)
 ✓ src/enrollments/dto/enrollments-query.dto.spec.ts (5 tests)
 ✓ src/welcome.controller.spec.ts (2 tests)
 ✓ src/auth/guards/auth.guard.spec.ts (5 tests)
 ✓ src/auth/guards/roles.guard.spec.ts (8 tests)
 ✓ src/welcome.service.spec.ts (2 tests)
 ✓ src/auth/decorators/roles.decorator.spec.ts (2 tests)
 ✓ src/courses/courses.authorization.spec.ts (14 tests)
 ✓ src/auth/auth.throttler.spec.ts (2 tests)

 Test Files  21 passed (21)
      Tests  125 passed (125)
   Duration  18.95s
```

* **Compilación**: `nest build` finalizado con éxito sin errores de TypeScript.
* **Control de Versiones**:
  * Commit: `feat(security): implementar roles, control de propiedad, CORS explicito y rate limiting con throttler`
  * Rama: `main` sincronizada con repositorio remoto.

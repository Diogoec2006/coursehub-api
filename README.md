# CourseHub API 🚀

API REST desarrollada con **NestJS**, **TypeScript** y **Node.js** para la gestión integral de cursos, estudiantes y matrículas (*Enrollments*).

---

## 🏗️ Arquitectura y Estructura del Proyecto

El proyecto está modularizado en tres módulos principales registrados en `AppModule`:
- **`CoursesModule`**: Administración de cursos (creación, consulta, actualización y eliminación).
- **`StudentsModule`**: Gestión de estudiantes con filtros, control de estado activo/inactivo y validaciones de unicidad de correo.
- **`EnrollmentsModule`**: Administración de matrículas en memoria, relacionando estudiantes y cursos con validaciones de existencia, estado activo y unicidad de combinación `(studentId, courseId)`.

```
src/
├── app.controller.ts
├── app.module.ts                   # Registra CoursesModule, StudentsModule y EnrollmentsModule
├── app.service.ts
├── main.ts                         # Configuración de ValidationPipe global
├── welcome.controller.ts
├── welcome.service.ts
├── courses/
│   ├── courses.controller.ts
│   ├── courses.module.ts           # Exporta CoursesService
│   ├── courses.service.ts
│   └── dto/
│       └── create-course.dto.ts
├── students/
│   ├── students.controller.ts
│   ├── students.module.ts          # Exporta StudentsService
│   ├── students.service.ts
│   ├── dto/
│   │   ├── create-student.dto.ts
│   │   ├── get-students-filter.dto.ts
│   │   ├── update-student-status.dto.ts
│   │   └── update-student.dto.ts
│   ├── entities/
│   │   └── student.entity.ts
│   └── pipes/
│       └── parse-id.pipe.ts        # Pipe personalizado para validar enteros positivos (> 0)
└── enrollments/
    ├── enrollments.controller.ts   # Endpoints de matrículas
    ├── enrollments.module.ts       # Importa StudentsModule y CoursesModule
    ├── enrollments.service.ts      # Lógica de negocio y almacenamiento en memoria
    ├── dto/
    │   ├── create-enrollment.dto.ts
    │   └── get-enrollments-filter.dto.ts
    └── entities/
        └── enrollment.entity.ts
```

---

## ⚙️ Instalación y Ejecución

### 1. Instalar dependencias
```bash
npm install
```

### 2. Iniciar la aplicación
```bash
# Modo desarrollo (watch)
npm run start:dev

# Compilar proyecto
npm run build
```

### 3. Ejecutar Pruebas
```bash
# Pruebas unitarias
npm run test

# Pruebas e2e (End-to-End)
npm run test:e2e
```

---

## 🛡️ Validaciones y Pipes

1. **`ValidationPipe` Global** (`main.ts`):
   - `whitelist: true`: Elimina propiedades que no estén explícitamente definidas en los DTOs.
   - `forbidNonWhitelisted: true`: Lanza un error HTTP `400 Bad Request` si la petición incluye propiedades no permitidas.
   - `transform: true`: Convierte automáticamente los tipos según los decoradores `@Type()` de `class-transformer`.

2. **`ParseIdPipe` Personalizado** (`src/students/pipes/parse-id.pipe.ts`):
   - Valida y transforma los parámetros de ruta (`:id`, `:studentId`, `:courseId`).
   - Rechaza valores no numéricos, números menores o iguales a 0 y decimales con un error `400 Bad Request`.

---

## 📋 Tabla de Endpoints de la API

| Módulo | Método | Endpoint | Descripción | Body / Query | Código Éxito | Códigos Error |
| :--- | :---: | :--- | :--- | :--- | :---: | :---: |
| **App** | `GET` | `/` | Estado general de la API | N/A | `200 OK` | - |
| **Courses** | `GET` | `/courses` | Listar cursos paginados, filtrados y ordenados | Query: `level`, `page`, `limit`, `sortBy`, `order` | `200 OK` | `400` |
| **Courses** | `GET` | `/courses/:id` | Obtener curso por ID | Param: `id` | `200 OK` | `404` |
| **Courses** | `POST` | `/courses` | Crear nuevo curso | Body: `CreateCourseDto` | `201 Created` | `400` |
| **Courses** | `PATCH` | `/courses/:id` | Modificar curso | Body: `{ title?, level? }` | `200 OK` | `404` |
| **Courses** | `DELETE` | `/courses/:id` | Eliminar curso | Param: `id` | `200 OK` | `404` |
| **Students** | `GET` | `/students` | Listar estudiantes con filtros | Query: `career`, `semester`, `isActive` | `200 OK` | `400` |
| **Students** | `GET` | `/students/:id` | Obtener estudiante por ID | Param: `id` (ParseIdPipe) | `200 OK` | `400, 404` |
| **Students** | `POST` | `/students` | Registrar estudiante | Body: `CreateStudentDto` | `201 Created` | `400, 409` |
| **Students** | `PATCH` | `/students/:id` | Actualizar datos del estudiante | Body: `UpdateStudentDto` | `200 OK` | `400, 404, 409` |
| **Students** | `PATCH` | `/students/:id/status` | Cambiar estado activo/inactivo | Body: `UpdateStudentStatusDto` | `200 OK` | `400, 404` |
| **Students** | `DELETE` | `/students/:id` | Eliminar estudiante (solo si activo) | Param: `id` (ParseIdPipe) | `200 OK` | `400, 404` |
| **Enrollments** | `POST` | `/enrollments` | Registrar matrícula | Body: `CreateEnrollmentDto` | `201 Created` | `400, 404, 409` |
| **Enrollments** | `GET` | `/enrollments` | Listar matrículas con búsqueda compuesta, JOINs y paginación | Query: `search`, `studentId`, `courseId`, `activeOnly`, `page`, `limit` | `200 OK` | `400` |
| **Enrollments** | `GET` | `/enrollments/:id` | Obtener matrícula por ID | Param: `id` (ParseIdPipe) | `200 OK` | `400, 404` |
| **Enrollments** | `GET` | `/students/:studentId/enrollments` | Matrículas de un estudiante | Param: `studentId` (ParseIdPipe) | `200 OK` | `400, 404` |
| **Enrollments** | `GET` | `/courses/:courseId/enrollments` | Matrículas de un curso | Param: `courseId` (ParseIdPipe) | `200 OK` | `400, 404` |
| **Auth** | `POST` | `/auth/register` | Registrar usuario con contraseña hasheada (bcrypt) | Body: `RegisterDto` | `201 Created` | `400, 409` |
| **Auth** | `POST` | `/auth/login` | Validar credenciales y emitir access token JWT | Body: `LoginDto` | `200 OK` | `400, 401` |
| **Enrollments** | `DELETE` | `/enrollments/:id` | Cancelar/eliminar matrícula | Param: `id` (ParseIdPipe) | `200 OK` | `400, 404` |

---

## 🧪 Evidencias y Demostraciones Paso a Paso

Los datos iniciales de prueba en memoria son:
- **Estudiantes**:
  - `ID: 1` -> Ana García (`isActive: true`)
  - `ID: 2` -> Carlos López (`isActive: false`)
  - `ID: 3` -> María Rodríguez (`isActive: true`)
- **Cursos**:
  - `ID: 1` -> NestJS Fundamentals (`level: beginner`)
  - `ID: 2` -> REST APIs with NestJS (`level: beginner`)
  - `ID: 3` -> NestJS Architecture (`level: intermediate`)

---

### 1️⃣ Demostración: Matrícula Válida (`POST /enrollments` -> `201 Created`)

**Request**:
```http
POST /enrollments HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "studentId": 1,
  "courseId": 1
}
```

**Response**: `201 Created`
```json
{
  "id": 1,
  "studentId": 1,
  "courseId": 1
}
```

---

### 2️⃣ Demostración: Matrícula Duplicada (`POST /enrollments` -> `409 Conflict`)

Intentar matricular al mismo estudiante (`studentId: 1`) en el mismo curso (`courseId: 1`) por segunda vez.

**Request**:
```http
POST /enrollments HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "studentId": 1,
  "courseId": 1
}
```

**Response**: `409 Conflict`
```json
{
  "message": "El estudiante con identificador 1 ya se encuentra matriculado en el curso 1.",
  "error": "Conflict",
  "statusCode": 409
}
```

---

### 3️⃣ Demostración: Matrícula con Estudiante Inactivo (`POST /enrollments` -> `400 Bad Request`)

El estudiante con `ID: 2` (Carlos López) se encuentra en estado inactivo (`isActive: false`).

**Request**:
```http
POST /enrollments HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "studentId": 2,
  "courseId": 1
}
```

**Response**: `400 Bad Request`
```json
{
  "message": "El estudiante 'Carlos López' (ID: 2) se encuentra inactivo y no puede matricularse en ningún curso.",
  "error": "Bad Request",
  "statusCode": 400
}
```

---

### 4️⃣ Demostración: Matrícula con Identificador Inexistente (`POST /enrollments` -> `404 Not Found`)

#### A. Estudiante Inexistente (`studentId: 999`)
**Request**:
```http
POST /enrollments HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "studentId": 999,
  "courseId": 1
}
```

**Response**: `404 Not Found`
```json
{
  "message": "Estudiante con identificador 999 no encontrado.",
  "error": "Not Found",
  "statusCode": 404
}
```

#### B. Curso Inexistente (`courseId: 999`)
**Request**:
```http
POST /enrollments HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "studentId": 1,
  "courseId": 999
}
```

**Response**: `404 Not Found`
```json
{
  "message": "Curso con identificador 999 no encontrado.",
  "error": "Not Found",
  "statusCode": 404
}
```

---

### 5️⃣ Demostración: Filtros Combinados en Matrículas (`GET /enrollments`)

Asumiendo que existen matrículas registradas:
- Matrícula 1: `studentId: 1, courseId: 1`
- Matrícula 2: `studentId: 1, courseId: 2`
- Matrícula 3: `studentId: 3, courseId: 1`

#### A. Filtrar por estudiante (`GET /enrollments?studentId=1`)
**Response**: `200 OK`
```json
[
  { "id": 1, "studentId": 1, "courseId": 1 },
  { "id": 2, "studentId": 1, "courseId": 2 }
]
```

#### B. Filtrar por curso (`GET /enrollments?courseId=1`)
**Response**: `200 OK`
```json
[
  { "id": 1, "studentId": 1, "courseId": 1 },
  { "id": 3, "studentId": 3, "courseId": 1 }
]
```

#### C. Filtro Combinado (`GET /enrollments?studentId=3&courseId=1`)
**Response**: `200 OK`
```json
[
  { "id": 3, "studentId": 3, "courseId": 1 }
]
```

#### D. Consultar por ruta anidada de estudiante (`GET /students/1/enrollments`)
**Response**: `200 OK`
```json
[
  { "id": 1, "studentId": 1, "courseId": 1 },
  { "id": 2, "studentId": 1, "courseId": 2 }
]
```

#### E. Consultar por ruta anidada de curso (`GET /courses/1/enrollments`)
**Response**: `200 OK`
```json
[
  { "id": 1, "studentId": 1, "courseId": 1 },
  { "id": 3, "studentId": 3, "courseId": 1 }
]
```

---

### 6️⃣ Demostración: Cancelación de una Matrícula (`DELETE /enrollments/:id`)

#### A. Cancelar matrícula existente con `ID: 1`
**Request**:
```http
DELETE /enrollments/1 HTTP/1.1
Host: localhost:3000
```

**Response**: `200 OK`
```json
{
  "id": 1,
  "studentId": 1,
  "courseId": 1
}
```

#### B. Verificar que ya no existe (`GET /enrollments/1` -> `404 Not Found`)
**Request**:
```http
GET /enrollments/1 HTTP/1.1
Host: localhost:3000
```

**Response**: `404 Not Found`
```json
{
  "message": "Matrícula con identificador 1 no encontrada.",
  "error": "Not Found",
  "statusCode": 404
}
```

#### C. Validación de parámetro inválido con Pipe (`DELETE /enrollments/abc` -> `400 Bad Request`)
**Response**: `400 Bad Request`
```json
{
  "message": "El identificador 'abc' no es válido. Debe ser un número entero positivo mayor a 0.",
  "error": "Bad Request",
  "statusCode": 400
}
```

---

### 7️⃣ Demostración: Navegación Predecible en Cursos (`GET /courses`)

Un listado útil no devuelve todo el conjunto de datos de golpe. El endpoint `GET /courses` ofrece una navegación determinista y robusta mediante validación estricta de parámetros en URL con `CoursesQueryDto`.

#### URL Documentada
```http
GET /courses?level=beginner&page=2&limit=5&sortBy=title&order=ASC HTTP/1.1
Host: localhost:3000
```

#### Responsabilidad de Cada Parámetro
| Parámetro | Tipo / Decoradores | Valor por Defecto | Responsabilidad |
| :--- | :--- | :---: | :--- |
| `level` | `@IsString() @IsOptional()` | Opcional | Filtra los cursos que coincidan con el nivel indicado. |
| `page` | `@Type(() => Number) @IsInt() @Min(1)` | `1` | Número de página solicitada. |
| `limit` | `@Type(() => Number) @IsInt() @Min(1) @Max(50)` | `10` | Cantidad máxima de elementos por página (máximo 50). |
| `sortBy` | `@IsIn(['id', 'title', 'level'])` | `'id'` | Campo de ordenamiento (lista cerrada para prevenir inyección). |
| `order` | `@IsIn(['ASC', 'DESC'])` | `'ASC'` | Dirección del ordenamiento (ascendente o descendente). |

> **¿Por qué ordenar aun sin que lo pidan?**  
> Porque una página sin orden estable puede variar entre consultas sucesivas debido a la naturaleza no determinista de los motores de bases de datos, provocando que se repitan u oculten resultados al navegar entre páginas.

#### Implementación con `findAndCount`
```typescript
const [items, total] = await repository.findAndCount({
  where: level ? { level } : {},
  order: { [sortBy]: order },
  skip: (page - 1) * limit,
  take: limit,
});

const totalPages = Math.ceil(total / limit);
```

#### Estructura de Respuesta (Items y Metadatos de Navegación)
**Response**: `200 OK`
```json
{
  "items": [
    {
      "id": 6,
      "title": "Docker para Desarrolladores",
      "level": "beginner"
    },
    {
      "id": 7,
      "title": "Git y GitHub Profesional",
      "level": "beginner"
    }
  ],
  "meta": {
    "total": 12,
    "page": 2,
    "limit": 5,
    "totalPages": 3
  }
}
```

#### Contrato y Casos Límite (Rechazo 400 Bad Request)
Los casos límite son parte integral del contrato de la API:
- **`page=0`** → Retorna `400 Bad Request` (`page must not be less than 1`).
- **`limit=200`** → Retorna `400 Bad Request` (`limit must not be greater than 50`).
- **`sortBy=createdAt`** → Retorna `400 Bad Request` (`sortBy must be one of the following values: id, title, level`).
- **Sin parámetros (`GET /courses`)** → Retorna la primera página (`page=1`, `limit=10`), ordenada de manera predecible por `id ASC`.
- **Dos páginas consecutivas** → Al estar indexadas con orden estable y cálculo exacto de `skip` y `take`, no presentan repeticiones entre páginas.

---

### 8️⃣ Demostración: Consulta Compuesta y Búsqueda Segura (`GET /enrollments`)

Buscar datos relacionados exige una consulta compuesta sin abandonar la seguridad del ORM. Conectamos `Enrollment` con `Student` y `Course` utilizando `QueryBuilder`, `JOINs`, búsqueda insensible a mayúsculas/minúsculas y parámetros estrictamente parametrizados para blindar la aplicación contra inyección SQL.

```
Enrollment ──join──> Student
     │
     └──join──> Course
```

#### URL Documentada
```http
GET /enrollments?search=NestJS&activeOnly=true&page=1&limit=10 HTTP/1.1
Host: localhost:3000
```

#### Responsabilidad de Parámetros en `EnrollmentsQueryDto`
| Parámetro | Tipo / Decoradores | Valor por Defecto | Responsabilidad |
| :--- | :--- | :---: | :--- |
| `search` | `@IsString() @IsOptional()` | Opcional | Busca por coincidencia parcial (`ILIKE`) en `student.name` o `course.title`. |
| `studentId` | `@Type(() => Number) @IsInt() @Min(1)` | Opcional | Filtra matrículas de un estudiante específico por ID. |
| `courseId` | `@Type(() => Number) @IsInt() @Min(1)` | Opcional | Filtra matrículas de un curso específico por ID. |
| `activeOnly` | `@IsIn(['true', 'false']) @IsOptional()` | Opcional | Si es `'true'`, filtra únicamente matrículas de estudiantes activos. |
| `page` | `@Type(() => Number) @IsInt() @Min(1)` | `1` | Número de página solicitada. |
| `limit` | `@Type(() => Number) @IsInt() @Min(1) @Max(50)` | `10` | Cantidad máxima de registros por página (máximo 50). |

#### Implementación con QueryBuilder y Parametrización Segura
```typescript
const qb = repository
  .createQueryBuilder('enrollment')
  .leftJoinAndSelect('enrollment.student', 'student')
  .leftJoinAndSelect('enrollment.course', 'course');

// El texto es un valor, nunca una instrucción SQL
if (query.search && query.search.trim() !== '') {
  qb.andWhere(
    '(student.name ILIKE :search OR course.title ILIKE :search)',
    { search: `%${query.search.trim()}%` },
  );
}

// Cada condición se agrega solo si llegó
if (query.studentId) {
  qb.andWhere('student.id = :studentId', { studentId: query.studentId });
}

if (query.courseId) {
  qb.andWhere('course.id = :courseId', { courseId: query.courseId });
}

if (query.activeOnly === 'true') {
  qb.andWhere('student.isActive = :active', { active: true });
}

qb.orderBy('enrollment.id', 'ASC')
  .skip((page - 1) * limit)
  .take(limit);

const [items, total] = await qb.getManyAndCount();
```

#### Estructura de Respuesta
**Response**: `200 OK`
```json
{
  "items": [
    {
      "id": 1,
      "student": {
        "id": 1,
        "name": "Ana García",
        "email": "ana.garcia@example.com",
        "semester": 4,
        "isActive": true
      },
      "course": {
        "id": 1,
        "title": "NestJS Fundamentals",
        "level": "beginner"
      }
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

#### Seguridad y Casos Límite
1. **Protección anti Inyección SQL**:  
   Entradas con fragmentos SQL maliciosos como `'; DROP TABLE enrollments; --` son tratadas estrictamente como cadenas de texto literal dentro de `:search`, impidiendo la alteración de la consulta.
2. **Búsqueda sin coincidencias**:  
   Una búsqueda que no produzca resultados no es un `404 Not Found`. La ruta existe y responde `200 OK` con `items: []` y `total: 0`.
3. **Validación de Límites**:  
   - `page=0` → `400 Bad Request`
   - `limit=200` → `400 Bad Request`

---

## 🔐 Configuración Segura y Variables de Entorno (Semana 7 - Etapa 2)

La configuración de CourseHub API sigue los principios de aplicaciones *Twelve-Factor*: la configuración varía por entorno y **nunca pertenece al código ni se versiona en el repositorio**.

### 1. Variables de Entorno y Plantilla `.env.example`

Para desplegar o levantar la aplicación localmente, cree un archivo `.env` basado en la plantilla segura `.env.example`:

```bash
cp .env.example .env
```

Contenido de `.env.example`:
```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=coursehub
DB_USER=postgres
DB_PASSWORD=replace-with-your-local-password
```

### 2. Validación Temprana con Joi

El arranque de la API valida estrictamente las variables de entorno antes de iniciar cualquier conexión a la base de datos mediante `ConfigModule.forRoot`:

```typescript
ConfigModule.forRoot({
  isGlobal: true,
  validationSchema: Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    PORT: Joi.number().port().default(3000),
    DB_HOST: Joi.string().required(),
    DB_PORT: Joi.number().port().default(5432),
    DB_NAME: Joi.string().required(),
    DB_USER: Joi.string().required(),
    DB_PASSWORD: Joi.string().allow('').default(''),
  }),
});
```

> **Detención en fallo de configuración**: Si una variable requerida (como `DB_NAME` o `DB_HOST`) no está presente o el puerto no es válido, la API se detiene inmediatamente arrojando un error claro de validación y protegiendo el sistema.

### 3. Diferenciación de Ambientes: Política de `synchronize`

La conexión con TypeORM se realiza de forma asíncrona mediante `TypeOrmModule.forRootAsync`, inyectando `ConfigService`:

```typescript
TypeOrmModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    type: 'postgres',
    host: config.getOrThrow<string>('DB_HOST'),
    port: Number(config.getOrThrow('DB_PORT')),
    username: config.getOrThrow<string>('DB_USER'),
    password: config.get<string>('DB_PASSWORD', ''),
    database: config.getOrThrow<string>('DB_NAME'),
    autoLoadEntities: true,
    synchronize: config.getOrThrow<string>('NODE_ENV') === 'development',
  }),
});
```

* **Desarrollo (`development`)**: `synchronize: true` está permitido localmente para facilitar la evolución de entidades.
* **Producción (`production`)**: `synchronize: false` obligatorio para prevenir pérdida o alteración accidental de datos en la base de datos real.

### 4. Seguridad de Secretos y Diagnóstico
* `.env` está explicitamente ignorado en `.gitignore` y nunca se sube a control de versiones.
* Se prohíbe el uso de `console.log(config)` o volcados de secretos en logs de inicio o ejecución. Solo se registran datos no sensibles (`NODE_ENV` y `PORT`).

---

## 🔑 Autenticación y Emisión de Tokens JWT (Semana 9 - Sesión 17)

CourseHub implementa un esquema de autenticación desacoplada donde el inicio de sesión valida credenciales y emite un token de acceso temporal (**JSON Web Token - RFC 7519**) para evitar la retransmisión continua de contraseñas.

### Contrato de `POST /auth/login`

#### 1. Entrada (`Body: LoginDto`)
```json
{
  "email": "estudiante@coursehub.edu",
  "password": "PasswordSeguro123!"
}
```
* **Normalización**: El correo se normaliza a minúsculas y se limpia de espacios antes de la consulta.
* **Validación**: DTO validado con `ValidationPipe` (`email` válido y contraseña de al menos 8 caracteres).

#### 2. Salida Exitosa (`200 OK`)
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiZXN0dWRpYW50ZUBjb3Vyc2VodWIuZWR1IiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjE3MDAwMDA5MDB9.SIGNATURE_MOCK",
  "user": {
    "id": 1,
    "email": "estudiante@coursehub.edu",
    "createdAt": "2026-10-27T18:00:00.000Z"
  }
}
```

* **Carga Mínima (`JwtPayload`)**:
  * `sub`: Identificador numérico único del usuario (`id`).
  * `email`: Correo normalizado del usuario.
  * `iat`: Marca de tiempo de emisión generada automáticamente.
  * `exp`: Marca de tiempo de caducidad calculada según `JWT_EXPIRES_IN`.
* **Caducidad aproximada**: Por defecto `15m` (15 minutos).
* **Respuesta segura**: `user` nunca incluye `password` ni `passwordHash`.

#### 3. Casos de Rechazo
* **Credenciales incorrectas (`401 Unauthorized`)**:
  * Retorna mensaje genérico `{"statusCode": 401, "message": "Invalid credentials"}`.
  * Se aplica tanto a contraseñas erróneas como a correos inexistentes para prevenir ataques de enumeración.
  * **Crítico**: Nunca se emite ni firma un token cuando las credenciales no son válidas.
* **DTO inválido (`400 Bad Request`)**:
  * Formato de correo incorrecto o contraseña corta (< 8 caracteres).

> [!WARNING]
> **Advertencia de Seguridad y Protección de Credenciales:**
> * Un JWT viaja firmado, **no cifrado**. Cualquier receptor puede decodificar el payload en base64url. Jamás incluya contraseñas, hashes, roles no autorizados ni información confidencial dentro de la carga útil.
> * Los tokens de acceso emitidos son credenciales vivas: nunca los comparta en capturas de pantalla, foros, repositorios ni chats.
> * `JWT_SECRET` se gestiona exclusivamente por entorno mediante `.env` (mínimo 32 caracteres) y nunca se incluye en el código fuente.





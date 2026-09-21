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
| **Courses** | `GET` | `/courses` | Listar cursos (filtro opcional por nivel) | Query: `level` | `200 OK` | - |
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
| **Enrollments** | `GET` | `/enrollments` | Listar matrículas con filtros | Query: `studentId`, `courseId` | `200 OK` | `400` |
| **Enrollments** | `GET` | `/enrollments/:id` | Obtener matrícula por ID | Param: `id` (ParseIdPipe) | `200 OK` | `400, 404` |
| **Enrollments** | `GET` | `/students/:studentId/enrollments` | Matrículas de un estudiante | Param: `studentId` (ParseIdPipe) | `200 OK` | `400, 404` |
| **Enrollments** | `GET` | `/courses/:courseId/enrollments` | Matrículas de un curso | Param: `courseId` (ParseIdPipe) | `200 OK` | `400, 404` |
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

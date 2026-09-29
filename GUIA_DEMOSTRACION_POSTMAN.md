# 🎓 GUÍA DE DEMOSTRACIÓN EN POSTMAN — COURSEHUB API

Esta guía contiene la explicación detallada de lo que se construyó en el proyecto y el **guion paso a paso** para realizar la sustentación y pruebas en vivo mediante **Postman**.

---

## 1. 📌 ¿QUÉ SE HIZO EN EL PROYECTO? (Resumen para la Sustentación)

1. **Unificación e Integración Modular (`AppModule`)**:
   - Se integraron los 3 módulos funcionales de la aplicación en `AppModule`:
     - `CoursesModule`: CRUD y gestión de cursos.
     - `StudentsModule`: CRUD, filtros, cambio de estado activo/inactivo y control de unicidad de correo.
     - `EnrollmentsModule`: Registro, consulta filtrada y cancelación de matrículas.
   - `EnrollmentsService` interactúa con `StudentsService` y `CoursesService` mediante inyección de dependencias para validar la existencia y estado de los recursos.

2. **Diseño de `EnrollmentsModule`**:
   - **Entidad**: `Enrollment` con campos `id`, `studentId` y `courseId`.
   - **Persistencia temporal**: Almacenamiento en memoria mediante un array privado (`enrollments`) con auto-incremento de ID consecutivo (`nextId`).

3. **Reglas de Negocio Implementadas**:
   - **Existencia**: Comprueba que el estudiante (`studentId`) y el curso (`courseId`) existan antes de matricular. Si alguno no existe, responde con `404 Not Found`.
   - **Estudiante Activo**: Comprueba que el estudiante tenga `isActive === true`. Si está inactivo, responde con `400 Bad Request`.
   - **No Duplicidad**: Comprueba que no exista una matrícula previa con el mismo par `(studentId, courseId)`. Si existe, responde con `409 Conflict`.

4. **Validaciones y Pipes**:
   - **`ValidationPipe` Global**: Con `whitelist: true` (ignora campos desconocidos), `forbidNonWhitelisted: true` (lanza `400` si envían campos extra no permitidos) y `transform: true` (conversión automática de tipos con `class-transformer`).
   - **`ParseIdPipe` Personalizado**: Valida que los parámetros de ruta (`:id`, `:studentId`, `:courseId`) sean enteros positivos mayores a 0. Si se envía texto o números inválidos, responde con `400 Bad Request`.

---

## 2. 🚀 CÓMO INICIAR EL SERVIDOR

Abre una terminal en la raíz del proyecto y ejecuta:

```bash
npm run start:dev
```

El servidor estará escuchando en: `http://localhost:3000`

---

## 3. 📊 DATOS INICIALES EN MEMORIA

Al arrancar el servidor, los datos iniciales precargados son:

### 👨‍🎓 Estudiantes:
- **ID 1**: `Ana García` — Estado: **`isActive: true`** (Activo)
- **ID 2**: `Carlos López` — Estado: **`isActive: false`** (Inactivo)
- **ID 3**: `María Rodríguez` — Estado: **`isActive: true`** (Activo)

### 📚 Cursos:
- **ID 1**: `NestJS Fundamentals` (`beginner`)
- **ID 2**: `REST APIs with NestJS` (`beginner`)
- **ID 3**: `NestJS Architecture` (`intermediate`)

---

## 4. 🧪 GUION PASO A PASO PARA POSTMAN (Orden de Demostración)

---

### PASO 0: Verificar que la API esté en línea
- **Método**: `GET`
- **URL**: `http://localhost:3000/`
- **Respuesta esperada**: `200 OK`
```text
Course Hub API esta en línea
```

---

### PRUEBA 1: Matrícula Exitosa (Caso Válido)
> **Objetivo**: Demostrar que un estudiante activo puede matricularse en un curso existente y se le genera un ID autonumérico.

- **Método**: `POST`
- **URL**: `http://localhost:3000/enrollments`
- **Headers**: `Content-Type: application/json`
- **Body (raw JSON)**:
```json
{
  "studentId": 1,
  "courseId": 1
}
```
- **Código de Respuesta esperado**: `201 Created`
- **Body de Respuesta**:
```json
{
  "id": 1,
  "studentId": 1,
  "courseId": 1
}
```

---

### PRUEBA 2: Matrícula Duplicada (Regla de Negocio)
> **Objetivo**: Demostrar que el sistema previene que un estudiante se matricule dos veces en el mismo curso.

- **Método**: `POST`
- **URL**: `http://localhost:3000/enrollments`
- **Headers**: `Content-Type: application/json`
- **Body (raw JSON)** *(Enviar exactamente el mismo cuerpo que la Prueba 1)*:
```json
{
  "studentId": 1,
  "courseId": 1
}
```
- **Código de Respuesta esperado**: `409 Conflict`
- **Body de Respuesta**:
```json
{
  "message": "El estudiante con identificador 1 ya se encuentra matriculado en el curso 1.",
  "error": "Conflict",
  "statusCode": 409
}
```

---

### PRUEBA 3: Estudiante Inactivo (Regla de Negocio)
> **Objetivo**: Demostrar que un estudiante inactivo (`Carlos López`, ID 2) no puede matricularse.

- **Método**: `POST`
- **URL**: `http://localhost:3000/enrollments`
- **Headers**: `Content-Type: application/json`
- **Body (raw JSON)**:
```json
{
  "studentId": 2,
  "courseId": 1
}
```
- **Código de Respuesta esperado**: `400 Bad Request`
- **Body de Respuesta**:
```json
{
  "message": "El estudiante 'Carlos López' (ID: 2) se encuentra inactivo y no puede matricularse en ningún curso.",
  "error": "Bad Request",
  "statusCode": 400
}
```

---

### PRUEBA 4: Estudiante Inexistente (Manejo de Errores)
> **Objetivo**: Demostrar que si el estudiante no existe, responde con 404.

- **Método**: `POST`
- **URL**: `http://localhost:3000/enrollments`
- **Headers**: `Content-Type: application/json`
- **Body (raw JSON)**:
```json
{
  "studentId": 999,
  "courseId": 1
}
```
- **Código de Respuesta esperado**: `404 Not Found`
- **Body de Respuesta**:
```json
{
  "message": "Estudiante con identificador 999 no encontrado.",
  "error": "Not Found",
  "statusCode": 404
}
```

---

### PRUEBA 5: Curso Inexistente (Manejo de Errores)
> **Objetivo**: Demostrar que si el curso no existe, responde con 404.

- **Método**: `POST`
- **URL**: `http://localhost:3000/enrollments`
- **Headers**: `Content-Type: application/json`
- **Body (raw JSON)**:
```json
{
  "studentId": 1,
  "courseId": 999
}
```
- **Código de Respuesta esperado**: `404 Not Found`
- **Body de Respuesta**:
```json
{
  "message": "Curso con identificador 999 no encontrado.",
  "error": "Not Found",
  "statusCode": 404
}
```

---

### PRUEBA 6: Validación de Body y `forbidNonWhitelisted`
> **Objetivo**: Demostrar que el `ValidationPipe` rechaza propiedades no autorizadas o valores inválidos.

- **Método**: `POST`
- **URL**: `http://localhost:3000/enrollments`
- **Headers**: `Content-Type: application/json`
- **Body (raw JSON)**:
```json
{
  "studentId": 1,
  "courseId": 2,
  "campoInfiltrado": "hack"
}
```
- **Código de Respuesta esperado**: `400 Bad Request`
- **Body de Respuesta**:
```json
{
  "message": [
    "property campoInfiltrado should not exist"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

---

### PRUEBA 7: Registrar un par de matrículas adicionales para probar consultas y filtros
> **Objetivo**: Crear datos para las consultas.

1. Matricular al Estudiante 1 en el Curso 2:
   - `POST http://localhost:3000/enrollments` con `{"studentId": 1, "courseId": 2}` -> **201 Created** (ID: 2)
2. Matricular al Estudiante 3 en el Curso 1:
   - `POST http://localhost:3000/enrollments` con `{"studentId": 3, "courseId": 1}` -> **201 Created** (ID: 3)

---

### PRUEBA 8: Consultar Todas las Matrículas
- **Método**: `GET`
- **URL**: `http://localhost:3000/enrollments`
- **Código de Respuesta esperado**: `200 OK`
- **Body de Respuesta**:
```json
[
  { "id": 1, "studentId": 1, "courseId": 1 },
  { "id": 2, "studentId": 1, "courseId": 2 },
  { "id": 3, "studentId": 3, "courseId": 1 }
]
```

---

### PRUEBA 9: Filtros Combinables por Query Params
> **Objetivo**: Demostrar los filtros opcionales de `GET /enrollments`.

#### A. Filtrar solo por Estudiante 1:
- **URL**: `http://localhost:3000/enrollments?studentId=1`
- **Respuesta**: Lista las 2 matrículas del estudiante 1 (IDs 1 y 2).

#### B. Filtrar solo por Curso 1:
- **URL**: `http://localhost:3000/enrollments?courseId=1`
- **Respuesta**: Lista las 2 matrículas en el curso 1 (IDs 1 y 3).

#### C. Filtro Combinado (Estudiante 3 y Curso 1):
- **URL**: `http://localhost:3000/enrollments?studentId=3&courseId=1`
- **Código de Respuesta esperado**: `200 OK`
- **Body de Respuesta**:
```json
[
  { "id": 3, "studentId": 3, "courseId": 1 }
]
```

---

### PRUEBA 10: Rutas Anidadas de Consulta
> **Objetivo**: Demostrar los endpoints anidados por entidad.

#### A. Matrículas de un estudiante específico:
- **Método**: `GET`
- **URL**: `http://localhost:3000/students/1/enrollments`
- **Código de Respuesta esperado**: `200 OK`
- **Body de Respuesta**:
```json
[
  { "id": 1, "studentId": 1, "courseId": 1 },
  { "id": 2, "studentId": 1, "courseId": 2 }
]
```

#### B. Matrículas de un curso específico:
- **Método**: `GET`
- **URL**: `http://localhost:3000/courses/1/enrollments`
- **Código de Respuesta esperado**: `200 OK`
- **Body de Respuesta**:
```json
[
  { "id": 1, "studentId": 1, "courseId": 1 },
  { "id": 3, "studentId": 3, "courseId": 1 }
]
```

---

### PRUEBA 11: Validación con `ParseIdPipe` (Parámetros de Ruta Inválidos)
> **Objetivo**: Demostrar el funcionamiento del Pipe personalizado cuando se pasa un texto en lugar de un número entero positivo.

- **Método**: `GET`
- **URL**: `http://localhost:3000/enrollments/invalido`
- **Código de Respuesta esperado**: `400 Bad Request`
- **Body de Respuesta**:
```json
{
  "message": "El identificador 'invalido' no es válido. Debe ser un número entero positivo mayor a 0.",
  "error": "Bad Request",
  "statusCode": 400
}
```

---

### PRUEBA 12: Cancelar una Matrícula (`DELETE`) y Confirmar su Eliminación
> **Objetivo**: Demostrar la cancelación exitosa y la posterior respuesta 404 al intentar buscarla o cancelarla de nuevo.

#### A. Cancelar Matrícula con ID 1:
- **Método**: `DELETE`
- **URL**: `http://localhost:3000/enrollments/1`
- **Código de Respuesta esperado**: `200 OK`
- **Body de Respuesta**:
```json
{
  "id": 1,
  "studentId": 1,
  "courseId": 1
}
```

#### B. Verificar que ya no existe:
- **Método**: `GET`
- **URL**: `http://localhost:3000/enrollments/1`
- **Código de Respuesta esperado**: `404 Not Found`
- **Body de Respuesta**:
```json
{
  "message": "Matrícula con identificador 1 no encontrada.",
  "error": "Not Found",
  "statusCode": 404
}
```

---

## 5. 💡 TIPS RÁPIDOS PARA TU PRESENTACIÓN

1. **Si el profesor pide reiniciar los datos**: Solo presiona `Ctrl + C` en la terminal y vuelve a ejecutar `npm run start:dev` (como está en memoria, vuelve al estado inicial).
2. **Si el profesor te pide ver las pruebas automáticas**:
   - Corre `npm run test` (pruebas unitarias)
   - Corre `npm run test:e2e` (pruebas de integración de extremo a extremo)
3. **Menciona las claves arquitectónicas**:
   - Inyección de servicios (`StudentsService` y `CoursesService` dentro de `EnrollmentsService`).
   - Uso de DTOs con `class-validator` y `class-transformer`.
   - Manejo semántico de códigos de estado HTTP (`201`, `200`, `400`, `404`, `409`).

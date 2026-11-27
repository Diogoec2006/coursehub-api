# ==============================================================================
# Etapa 1: Build (Compilación limpia en entorno aislado)
# ==============================================================================
FROM node:22-alpine AS build

WORKDIR /app

# Instalar dependencias completas para compilar TypeScript
COPY package*.json ./
RUN npm ci

# Copiar el código fuente y compilar la distribución de producción
COPY . .
RUN npm run build

# ==============================================================================
# Etapa 2: Runtime (Entorno mínimo para ejecución en producción)
# ==============================================================================
FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

# Instalar únicamente dependencias necesarias para ejecución
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copiar artefactos compilados desde la etapa de build
COPY --from=build /app/dist ./dist

# Ejecutar con usuario sin privilegios root por seguridad
USER node

# Exponer el puerto de la aplicación
EXPOSE 3000

# Comando de inicio del servidor en producción
CMD ["node", "dist/main"]

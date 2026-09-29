# =============================================================================
# Containerfile — Grupo Empresarial Dinámica S.A.S. | Gestión de Activos TI
# Compatible con Podman y Docker (sintaxis OCI estándar).
# Uso: podman build -f Containerfile -t inventario-app:1.0 .
# =============================================================================

# ---- Etapa 1: construcción (frontend Vite + bundle del servidor) ----
FROM docker.io/library/node:24-bookworm-slim AS build

WORKDIR /app

# Instalar dependencias (incluye devDependencies necesarias para compilar)
COPY package.json package-lock.json ./
RUN npm ci

# Copiar el código y compilar: genera dist/ (frontend) + dist/server.cjs (backend)
COPY . .
RUN npm run build

# ---- Etapa 2: ejecución (solo lo necesario para correr) ----
FROM docker.io/library/node:24-bookworm-slim AS runtime

ENV NODE_ENV=production

WORKDIR /app

# Solo dependencias de producción (express, mysql2, bcryptjs, dotenv, ...)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Artefactos compilados: frontend estático + servidor empaquetado
COPY --from=build /app/dist ./dist

# Ejecutar como usuario sin privilegios (ya existe en la imagen oficial)
USER node

EXPOSE 3001

# Verificación de salud: la API expone /api/health (sin autenticación)
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||3001)+'/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]

CMD ["node", "dist/server.cjs"]

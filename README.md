# Gestión de Activos TI — Grupo Empresarial Dinámica S.A.S.

Sistema de Control y Auditoría de Equipos de la **Dirección de Tecnología e
Infraestructura**: inventario de equipos All-in-One y periféricos (mouse,
teclado, diadema), custodios por empleado, trazabilidad, reportes en
PDF/Excel/CSV y control de acceso basado en roles (RBAC).

## Características

- Inventario de equipos All-in-One con evidencia fotográfica y periféricos vinculados.
- Consulta con filtros (texto, departamento, estado) y tarjetas de estadísticas.
- Exportación: acta de auditoría en PDF, consolidado en Excel/CSV y script SQL relacional.
- Autenticación con JWT y contraseñas `bcrypt`; sesiones de 7 días.
- Roles: **ADMIN** (control total), **TECNICO** (registro y edición, sin borrado),
  **CALIDAD** (solo lectura y reportes).
- Gestión de usuarios y script de estado de BD restringidos al rol ADMIN.
- Doble motor de persistencia: **MariaDB/MySQL** (producción) o **SQLite local**
  (desarrollo sin BD externa).

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite + Tailwind CSS 4 + Lucide |
| Backend | Node.js 24 + Express 4 (API REST + estáticos) |
| Base de datos | MariaDB 11 / MySQL 8 (prod) · SQLite vía sql.js (fallback) |
| Contenedores | Podman (Containerfile + compose.yaml) |

## Estructura del repositorio

```
├── server.ts              # API Express + arranque (puerto 3001)
├── server/
│   ├── auth.ts            # JWT, bcrypt, middlewares (authenticateToken, requireRoles, requireEquipoAccess)
│   ├── db.ts              # Capa de datos (SQLite local / delega a MySQL)
│   └── mysql.ts           # Consultas MariaDB: equipos, usuarios, roles, stats
├── src/                   # Frontend React (App, componentes, estilos Dinámica)
├── migrations/
│   └── schemaV2.sql       # Esquema relacional V2 (se aplica solo al crear la BD)
├── Containerfile          # Imagen de producción (multi-stage)
├── compose.yaml           # Despliegue: app + MariaDB
├── .env.example           # Plantilla de variables (el .env real NO se versiona)
└── dist/                  # Artefactos de build (generado, ignorado por git)
```

## API principal

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/health` | Público |
| POST | `/api/auth/login` · `/api/auth/logout` | Público |
| GET | `/api/auth/me` | Cualquier rol |
| GET | `/api/equipos` · `/api/equipos/:id` · `/api/stats` | Cualquier rol (lectura) |
| POST · PUT | `/api/equipos` | ADMIN, TECNICO |
| DELETE | `/api/equipos/:id` | ADMIN |
| GET | `/api/roles` | Cualquier rol |
| GET/POST/PUT/DELETE | `/api/usuarios` | ADMIN |
| GET | `/api/db/status` · `/api/export/mariadb.sql` | ADMIN |

## Desarrollo local

Requisitos: Node.js 24+ y (opcional) MariaDB en Podman para modo producción local.

```bash
npm install
cp .env.example .env   # ajustar DB_* y JWT_SECRET
npm run dev            # http://localhost:3001 (tsx + Vite)
npm run lint           # tsc --noEmit
npm run build          # genera dist/ (frontend + server.cjs)
npm start              # ejecuta el bundle de producción
```

Sin `DB_HOST` configurado, la app usa SQLite local (`data/inventario.sqlite`).
Con MariaDB disponible, crea/verifica `roles` y `app_usuarios` y registra los
usuarios iniciales: `admin/admin123`, `tecnico/tecnico123`, `calidad/calidad123`.
**Cámbielos en producción** desde el módulo Usuarios (rol ADMIN).

Variables de entorno (ver `.env.example`):

| Variable | Uso |
|---|---|
| `PORT` / `APP_PORT` | Puerto interno / publicado (defecto 3001) |
| `DB_HOST` `DB_PORT` `DB_USER` `DB_PASSWORD` `DB_NAME` | Conexión MariaDB (`DB_HOST=db` en compose) |
| `DATABASE_URL` | Alternativa con URL única (prioritaria si existe) |
| `JWT_SECRET` | Firma de tokens — **obligatoria en producción** (`openssl rand -base64 48`) |

## Despliegue en VM con Podman

Requisitos en la VM (recomendado Ubuntu Server 24.04 LTS): Podman 4.8+ con
soporte `compose`, 2 vCPU / 4 GB RAM, IP estática.

```bash
git clone <repo> && cd <repo>
cp .env.example .env
# Editar .env: DB_PASSWORD robusta y JWT_SECRET generado
podman compose up -d --build
podman compose logs -f app
```

- La BD se inicializa sola con `migrations/schemaV2.sql` (solo con volumen vacío).
- Datos persistentes en el volumen `inventario-mariadb-data`.
- Actualizar versión: `git pull && podman compose up -d --build` (el volumen conserva los datos).
- Detener: `podman compose down` (conserva datos) · `down -v` (borra la BD).

### Migrar los datos existentes

```bash
# 1. Origen: volcado (ej. contenedor MariaDB local)
podman exec mariadb-test mysqldump -u root -p \
  --single-transaction --routines inventario_computo > backup.sql

# 2. Destino (VM, BD ya inicializada por compose): restaurar
podman cp backup.sql inventario-db:/tmp/backup.sql
podman exec inventario-db mariadb -u root -p inventario_computo < /tmp/backup.sql

# 3. Verificar conteos
podman exec inventario-db mariadb -u root -p inventario_computo \
  -e "SELECT (SELECT COUNT(*) FROM equipos) AS equipos, \
             (SELECT COUNT(*) FROM perifericos) AS perifericos, \
             (SELECT COUNT(*) FROM app_usuarios) AS usuarios;"
```

### Respaldo programado (VM)

```bash
# Cron diario: volcado + rotación de 7 días
0 2 * * * podman exec inventario-db mariadb-dump -u root -p"$DB_PASSWORD" \
  --single-transaction inventario_computo | gzip > /var/backups/inventario-$(date +\%F).sql.gz \
  && find /var/backups -name 'inventario-*.sql.gz' -mtime +7 -delete
```

## Solución de problemas

| Síntoma | Causa probable / acción |
|---|---|
| `503 Autenticación no disponible` | Sin `DB_HOST`: la app cayó a SQLite. Revisar `.env` y red `appnet`. |
| `inventario-db (unhealthy)` | Revisar `podman logs inventario-db`; la app espera (`depends_on`) y arranca sola al sanar. |
| Login `401` con credenciales correctas | Usuarios seed no creados: ver logs de `inventario-app` (`seedMySQLRolesAndUsers`). |
| Advertencia `JWT_SECRET` en logs | Definir `JWT_SECRET` en `.env` y recrear (`up -d`); las sesiones previas se invalidan. |
| Puerto 3001 ocupado | Cambiar `APP_PORT` en `.env`. |
| Permisos en bind-mounts (SELinux) | El compose ya usa `:z`; en Ubuntu/Debian no aplica. |

## Seguridad mínima antes de exponer el servicio

- `JWT_SECRET` único de 32+ bytes y contraseñas seed rotadas.
- Exponer solo el puerto necesario (idealmente tras proxy inverso con TLS).
- Respaldos verificados con restauración de prueba.

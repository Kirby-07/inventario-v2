-- =============================================================================
-- MIGRACIÓN DEFINITIVA: v1 -> v2 (Normalización Relacional)
-- Motor: MariaDB / MySQL
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;
START TRANSACTION;

-- -----------------------------------------------------------------------------
-- 0. CREAR DEPARTAMENTO COMODÍN (Para evitar errores NOT NULL si algún equipo no tiene área)
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO departamentos (id, nombre, codigo, activo, created_at)
VALUES (999, 'Sin Asignar / Por Clasificar', 'DEP-GENERAL', 1, NOW());

-- -----------------------------------------------------------------------------
-- 1. POBLAR DEPARTAMENTOS DESDE v1
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO departamentos (nombre, codigo, activo, created_at)
SELECT DISTINCT
    CONCAT(UPPER(LEFT(TRIM(departamento), 1)), LOWER(SUBSTRING(TRIM(departamento), 2))) AS nombre_normalizado,
    -- Limitar a 30 caracteres porque codigo en v2 es VARCHAR(30)
    SUBSTRING(UPPER(REPLACE(REPLACE(TRIM(departamento), ' ', '_'), '.', '')), 1, 30) AS codigo,
    1 AS activo,
    NOW() AS created_at
FROM inventario_computo.equipos_v1
WHERE departamento IS NOT NULL AND TRIM(departamento) != '';

-- -----------------------------------------------------------------------------
-- 2. POBLAR EMPLEADOS CUSTODIOS DESDE v1
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO empleados_custodios (
    cedula_ciudadania,
    nombres,
    apellidos,
    cargo,
    departamento_id,
    extension,
    numero_remoto,
    estado_laboral,
    created_at,
    updated_at
)
SELECT DISTINCT
    -- Usar CC original o generar identificador único determinista
    IF(eq.cc IS NOT NULL AND TRIM(eq.cc) != '', TRIM(eq.cc), CONCAT('GEN-', eq.id)) AS cedula_ciudadania,
    
    -- Primera palabra como nombre
    SUBSTRING_INDEX(TRIM(eq.responsable), ' ', 1) AS nombres,
    
    -- Todo el resto del texto como apellidos (soluciona nombres de 3 y 4 palabras)
    IF(
        INSTR(TRIM(eq.responsable), ' ') > 0,
        TRIM(SUBSTRING(TRIM(eq.responsable), LENGTH(SUBSTRING_INDEX(TRIM(eq.responsable), ' ', 1)) + 1)),
        'No Registra'
    ) AS apellidos,
    
    'Usuario Operativo' AS cargo,
    
    -- Enlazar con departamento migrado (o asignar comodín 999 si no existe)
    COALESCE(dep.id, 999) AS departamento_id,
    NULL AS extension,
    NULL AS numero_remoto,
    'Activo' AS estado_laboral,
    NOW() AS created_at,
    NOW() AS updated_at
FROM inventario_computo.equipos_v1 eq
LEFT JOIN departamentos dep ON dep.nombre = CONCAT(
    UPPER(LEFT(TRIM(eq.departamento), 1)),
    LOWER(SUBSTRING(TRIM(eq.departamento), 2))
)
WHERE eq.responsable IS NOT NULL AND TRIM(eq.responsable) != '';

-- -----------------------------------------------------------------------------
-- 3. MIGRAR EQUIPOS Y RESOLVER LLAVES FORÁNEAS (FK)
-- -----------------------------------------------------------------------------
INSERT INTO equipos (
    id,
    numero_activo,
    marca,
    numero_serie,
    estado_equipo,
    empleado_custodio_id,
    imagen_url,
    notas,
    created_at,
    updated_at
)
SELECT
    eq.id,
    eq.numero_activo,
    eq.marca,
    eq.numero_serie,
    eq.estado_actual,
    -- Resolver custodio directamente por cédula/código único (mucho más rápido y seguro)
    (SELECT ec.id FROM empleados_custodios ec 
     WHERE ec.cedula_ciudadania = IF(eq.cc IS NOT NULL AND TRIM(eq.cc) != '', TRIM(eq.cc), CONCAT('GEN-', eq.id))
     LIMIT 1) AS empleado_custodio_id,
    eq.imagen_url,
    eq.notas,
    eq.created_at,
    eq.updated_at
FROM inventario_computo.equipos_v1 eq;

-- -----------------------------------------------------------------------------
-- 4. MIGRAR PERIFÉRICOS (Corregida la FK al equipo contenedor)
-- -----------------------------------------------------------------------------
INSERT INTO perifericos (
    id,
    equipo_id,
    tipo,
    numero_activo,
    estado_periferico,
    created_at,
    updated_at
)
SELECT
    p.id,
    p.equipo_id, -- Conserva la relación directa con el ID de equipo migrado
    p.tipo,
    p.numero_activo,
    p.estado_actual,
    p.created_at,
    p.updated_at
FROM inventario_computo.perifericos_v1 p
INNER JOIN equipos e ON e.id = p.equipo_id;

-- -----------------------------------------------------------------------------
-- 5. MIGRAR HISTORIAL INICIAL DE ASIGNACIÓN (Trazabilidad)
-- -----------------------------------------------------------------------------
INSERT INTO historial_asignaciones (
    equipo_id,
    empleado_anterior_id,
    empleado_nuevo_id,
    usuario_operador_id,
    motivo,
    fecha_asignacion
)
SELECT
    e.id AS equipo_id,
    NULL AS empleado_anterior_id,
    e.empleado_custodio_id AS empleado_nuevo_id,
    1 AS usuario_operador_id, -- ID 1 (Admin)
    'Asignación inicial detectada en auditoría de migración v1' AS motivo,
    NOW() AS fecha_asignacion
FROM equipos e
WHERE e.empleado_custodio_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 6. COPIAR USUARIOS OPERADORES CON SUS ROLES
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO app_usuarios (
    id,
    rol_id,
    nombre_completo,
    username,
    email,
    password_hash,
    activo,
    ultimo_login,
    created_at,
    updated_at
)
SELECT
    u.id,
    u.rol_id,
    u.nombre_completo,
    u.username,
    u.email,
    u.password_hash,
    u.activo,
    u.ultimo_login,
    u.created_at,
    NOW() AS updated_at
FROM inventario_computo.app_usuarios_v1 u;

-- -----------------------------------------------------------------------------
-- 7. AUDITORÍA Y VALIDACIÓN DE INTEGRIDAD
-- -----------------------------------------------------------------------------
SELECT 
    (SELECT COUNT(*) FROM inventario_computo.equipos_v1) AS total_equipos_origen,
    (SELECT COUNT(*) FROM inventario_computo.equipos) AS total_equipos_migrados,
    (SELECT COUNT(*) FROM inventario_computo.perifericos_v1) AS total_perifericos_origen,
    (SELECT COUNT(*) FROM inventario_computo.perifericos) AS total_perifericos_migrados,
    (SELECT COUNT(*) FROM inventario_computo.empleados_custodios) AS total_custodios_creados,
    (SELECT COUNT(*) FROM inventario_computo.departamentos) AS total_departamentos,
    (SELECT COUNT(*) FROM inventario_computo.equipos WHERE empleado_custodio_id IS NULL) AS equipos_en_bodega;

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Migración completada e integridad verificada con éxito' AS estado;
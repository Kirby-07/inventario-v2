-- =============================================================================
-- ESQUEMA DE BASE DE DATOS: AUDITORÍA DE INVENTARIO Y GESTIÓN DE EQUIPOS TI
-- Motor recomendado: InnoDB | Juego de caracteres: utf8mb4 / utf8mb4_unicode_ci
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Tabla: ROLES (Perfiles de seguridad para la aplicación)
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `nombre` VARCHAR(50) NOT NULL UNIQUE COMMENT 'ADMIN, TECNICO, CALIDAD',
    `descripcion` VARCHAR(255) NULL COMMENT 'Alcance y permisos del rol',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabla: APP_USUARIOS (Usuarios que acceden al sistema)
DROP TABLE IF EXISTS `app_usuarios`;
CREATE TABLE `app_usuarios` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `rol_id` INT NOT NULL,
    `nombre_completo` VARCHAR(150) NOT NULL,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL COMMENT 'Hash de contraseña (bcrypt/argon2)',
    `activo` BOOLEAN NOT NULL DEFAULT TRUE COMMENT '1: Habilitado, 0: Suspendido',
    `ultimo_login` DATETIME NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_app_usuarios_rol`
        FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabla: DEPARTAMENTOS (Áreas organizacionales de la empresa)
DROP TABLE IF EXISTS `departamentos`;
CREATE TABLE `departamentos` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `nombre` VARCHAR(100) NOT NULL UNIQUE,
    `codigo` VARCHAR(30) NULL UNIQUE COMMENT 'Código contable o centro de costos',
    `activo` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabla: EMPLEADOS_CUSTODIOS (Colaboradores que reciben equipos)
DROP TABLE IF EXISTS `empleados_custodios`;
CREATE TABLE `empleados_custodios` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `cedula_ciudadania` VARCHAR(30) NOT NULL UNIQUE COMMENT 'C.C. Documento de identidad único',
    `nombres` VARCHAR(100) NOT NULL,
    `apellidos` VARCHAR(100) NOT NULL,
    `cargo` VARCHAR(100) NOT NULL,
    `departamento_id` INT NOT NULL,
    `extension` VARCHAR(20) NULL COMMENT 'Extensión del SoftPhone del empleado',
    `numero_remoto` VARCHAR(50) NULL COMMENT 'Número de acceso remoto (AnyDesk, TeamViewer, etc.)',
    `estado_laboral` ENUM('Activo', 'Inactivo / Retirado', 'Licencia') NOT NULL DEFAULT 'Activo',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_empleados_departamento`
        FOREIGN KEY (`departamento_id`) REFERENCES `departamentos` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabla: EQUIPOS (Equipos All-in-One principales)
DROP TABLE IF EXISTS `equipos`;
CREATE TABLE `equipos` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `numero_activo` VARCHAR(50) NOT NULL UNIQUE COMMENT 'N° placa de inventario corporativo',
    `marca` VARCHAR(60) NOT NULL COMMENT 'HP, Lenovo, Dell, ASUS, etc.',
    `numero_serie` VARCHAR(80) NOT NULL,
    `estado_equipo` ENUM('Operativo', 'En mantenimiento', 'Dañado', 'En bodega / Desuso') NOT NULL DEFAULT 'Operativo',
    `empleado_custodio_id` INT NULL COMMENT 'Custodio actual asignado (NULL si está en bodega)',
    `imagen_url` MEDIUMTEXT NULL COMMENT 'Foto física del equipo en base64 o URL',
    `notas` TEXT NULL COMMENT 'Observaciones y detalles de auditoría',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_equipos_empleado`
        FOREIGN KEY (`empleado_custodio_id`) REFERENCES `empleados_custodios` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Tabla: PERIFERICOS (Periféricos asociados al equipo)
DROP TABLE IF EXISTS `perifericos`;
CREATE TABLE `perifericos` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `equipo_id` INT NOT NULL,
    `tipo` ENUM('Mouse', 'Teclado', 'Diadema') NOT NULL,
    `numero_activo` VARCHAR(50) NOT NULL COMMENT 'N° placa de activo del periférico',
    `estado_periferico` ENUM('Operativo', 'En mantenimiento', 'Dañado', 'En bodega / Desuso') NOT NULL DEFAULT 'Operativo',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_perifericos_equipo`
        FOREIGN KEY (`equipo_id`) REFERENCES `equipos` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Tabla: HISTORIAL_ASIGNACIONES (Bitácora de movimientos y trazabilidad)
DROP TABLE IF EXISTS `historial_asignaciones`;
CREATE TABLE `historial_asignaciones` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `equipo_id` INT NOT NULL,
    `empleado_anterior_id` INT NULL COMMENT 'NULL si el equipo era nuevo o venía de bodega',
    `empleado_nuevo_id` INT NOT NULL COMMENT 'Empleado que recibe el equipo',
    `usuario_operador_id` INT NOT NULL COMMENT 'Técnico o Admin que ejecutó la acción en la app',
    `motivo` VARCHAR(255) NOT NULL COMMENT 'Ingreso, Retiro de personal, Reubicación, etc.',
    `fecha_asignacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `acta_url` TEXT NULL COMMENT 'Ruta o URL al acta firmada',
    CONSTRAINT `fk_historial_equipo`
        FOREIGN KEY (`equipo_id`) REFERENCES `equipos` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_historial_empleado_ant`
        FOREIGN KEY (`empleado_anterior_id`) REFERENCES `empleados_custodios` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_historial_empleado_nue`
        FOREIGN KEY (`empleado_nuevo_id`) REFERENCES `empleados_custodios` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_historial_operador`
        FOREIGN KEY (`usuario_operador_id`) REFERENCES `app_usuarios` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- ÍNDICES ESTRATÉGICOS PARA RENDIMIENTO EN BÚSQUEDAS Y REPORTES
-- =============================================================================
CREATE INDEX `idx_empleados_cedula` ON `empleados_custodios` (`cedula_ciudadania`);
CREATE INDEX `idx_empleados_estado` ON `empleados_custodios` (`estado_laboral`);
CREATE INDEX `idx_equipos_estado` ON `equipos` (`estado_equipo`);
CREATE INDEX `idx_equipos_custodio` ON `equipos` (`empleado_custodio_id`);
CREATE INDEX `idx_perifericos_tipo_activo` ON `perifericos` (`equipo_id`, `tipo`);
CREATE INDEX `idx_historial_equipo_fecha` ON `historial_asignaciones` (`equipo_id`, `fecha_asignacion` DESC);

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- DATOS INICIALES (SEEDS REQUERIDOS)
-- =============================================================================

-- 1. Roles del Sistema
INSERT INTO `roles` (`id`, `nombre`, `descripcion`) VALUES
(1, 'ADMIN', 'Control total: creación, edición, reasignación, eliminación y administración de usuarios'),
(2, 'TECNICO', 'Registro de equipos, periféricos y reasignación de custodios por retiro/ingreso'),
(3, 'CALIDAD', 'Solo lectura y generación de reportes (PDF, Excel, CSV), sin permisos de modificación')
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

-- 2. Departamentos base
INSERT INTO `departamentos` (`nombre`, `codigo`) VALUES
('Tecnología y Sistemas', 'DEP-TI-01'),
('Operaciones y Servicio', 'DEP-OPS-02'),
('Contabilidad y Finanzas', 'DEP-FIN-03'),
('Recursos Humanos', 'DEP-RH-04'),
('Administración General', 'DEP-ADM-05')
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);
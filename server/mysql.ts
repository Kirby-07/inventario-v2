import 'dotenv/config'; // 1. Cargar variables del archivo .env inmediatamente
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { EquipoAllInOne, Periferico, InventoryStats, AppUsuario, Rol } from '../src/types.ts';

let pool: mysql.Pool | null = null;

export function isMySQLConfigured(): boolean {
  return Boolean(
    process.env.DATABASE_URL ||
    (process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME)
  );
}

export function getMySQLPool(): mysql.Pool {
  if (pool) return pool;

  // 2. Priorizar los parámetros locales de Podman definidos en .env
  if (process.env.DB_HOST && process.env.DB_USER) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'inventario_computo',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  } else if (process.env.DATABASE_URL) {
    // Si se usa URL, en mysql2 se pasa la cadena directamente (no dentro de un objeto con { uri })
    pool = mysql.createPool(process.env.DATABASE_URL);
  } else {
    throw new Error('No hay configuración de base de datos MySQL/MariaDB disponible.');
  }

  return pool;
}

export async function testMySQLConnection(): Promise<{
  connected: boolean;
  version?: string;
  database?: string;
  current_user?: string;
  host?: string;
  error?: string;
}> {
  try {
    const p = getMySQLPool();
    const [rows]: any = await p.query('SELECT VERSION() as version, DATABASE() as db, CURRENT_USER() as user');
    return {
      connected: true,
      version: rows[0]?.version || 'Desconocida',
      database: rows[0]?.db || process.env.DB_NAME || 'defaultdb',
      current_user: rows[0]?.user || process.env.DB_USER,
      host: process.env.DB_HOST || (process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL.replace('mysql://', 'http://')).hostname : 'cloud-db'),
    };
  } catch (err: any) {
    return {
      connected: false,
      error: err.message || 'Error al conectar con la base de datos externa',
    };
  }
}

export async function initMySQLTables() {
  const p = getMySQLPool();

  await p.query(`
    CREATE TABLE IF NOT EXISTS equipos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      numero_activo VARCHAR(100) NOT NULL UNIQUE,
      marca VARCHAR(100) NOT NULL,
      numero_serie VARCHAR(150) NOT NULL,
      estado_actual ENUM('Operativo', 'En mantenimiento', 'Dañado', 'En bodega / Desuso') NOT NULL,
      responsable VARCHAR(150) NOT NULL,
      cc VARCHAR(50) NULL,
      departamento VARCHAR(150) NOT NULL,
      imagen_url LONGTEXT NULL,
      notas TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Migración segura si la tabla equipos ya existía sin la columna cc
  try {
    const [cols]: any = await p.query("SHOW COLUMNS FROM equipos LIKE 'cc'");
    if (cols.length === 0) {
      await p.query("ALTER TABLE equipos ADD COLUMN cc VARCHAR(50) NULL AFTER responsable");
    }
  } catch (err) {
    console.warn('Nota sobre migración de columna cc:', err);
  }

  await p.query(`
    CREATE TABLE IF NOT EXISTS perifericos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      equipo_id INT NOT NULL,
      tipo ENUM('Mouse', 'Teclado', 'Diadema') NOT NULL,
      numero_activo VARCHAR(100) NOT NULL,
      estado_actual ENUM('Operativo', 'En mantenimiento', 'Dañado', 'En bodega / Desuso') NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_perifericos_equipo FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Tablas de autenticación y roles (migrations/schemaV2.sql). No toca equipos/periféricos.
  await p.query(`
    CREATE TABLE IF NOT EXISTS roles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(50) NOT NULL UNIQUE,
      descripcion VARCHAR(255) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS app_usuarios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      rol_id INT NOT NULL,
      nombre_completo VARCHAR(150) NOT NULL,
      username VARCHAR(50) NOT NULL UNIQUE,
      email VARCHAR(150) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      activo BOOLEAN NOT NULL DEFAULT TRUE,
      ultimo_login DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_app_usuarios_rol FOREIGN KEY (rol_id) REFERENCES roles(id) ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await seedMySQLRolesAndUsers(p);

  // Sembrar datos de muestra si está vacía
  const [rows]: any = await p.query('SELECT COUNT(*) as count FROM equipos');
  if (rows[0].count === 0) {
    await seedMySQLSampleData(p);
  }
}

async function seedMySQLSampleData(p: mysql.Pool) {
  const sampleEquipos = [
    {
      equipo: {
        numero_activo: 'ACT-PC-1001',
        marca: 'HP',
        numero_serie: 'HP-AIO-8849201',
        estado_actual: 'Operativo',
        responsable: 'Carlos Andrés Mendoza',
        cc: '1098765432',
        departamento: 'Sistemas e Infraestructura',
        imagen_url: '',
        notas: 'Ubicado en el puesto A-12. Asignado en auditoría Q1.',
      },
      perifericos: [
        { tipo: 'Mouse', numero_activo: 'ACT-MOU-2001', estado_actual: 'Operativo' },
        { tipo: 'Teclado', numero_activo: 'ACT-TEC-3001', estado_actual: 'Operativo' },
        { tipo: 'Diadema', numero_activo: 'ACT-DIA-4001', estado_actual: 'Operativo' },
      ],
    },
    {
      equipo: {
        numero_activo: 'ACT-PC-1002',
        marca: 'Lenovo',
        numero_serie: 'LN-AIO-3319082',
        estado_actual: 'Operativo',
        responsable: 'Mariana Gómez Sánchez',
        cc: '1014234567',
        departamento: 'Contabilidad y Finanzas',
        imagen_url: '',
        notas: 'Equipo principal de tesorería y nómina.',
      },
      perifericos: [
        { tipo: 'Mouse', numero_activo: 'ACT-MOU-2002', estado_actual: 'Operativo' },
        { tipo: 'Teclado', numero_activo: 'ACT-TEC-3002', estado_actual: 'Operativo' },
        { tipo: 'Diadema', numero_activo: 'ACT-DIA-4002', estado_actual: 'Operativo' },
      ],
    },
    {
      equipo: {
        numero_activo: 'ACT-PC-1003',
        marca: 'Dell',
        numero_serie: 'DL-OPT-7740219',
        estado_actual: 'En mantenimiento',
        responsable: 'Laura Vanessa Rivas',
        departamento: 'Recursos Humanos',
        imagen_url: '',
        notas: 'En soporte por revisión de pantalla All-In-One.',
      },
      perifericos: [
        { tipo: 'Mouse', numero_activo: 'ACT-MOU-2003', estado_actual: 'Operativo' },
        { tipo: 'Teclado', numero_activo: 'ACT-TEC-3003', estado_actual: 'En mantenimiento' },
        { tipo: 'Diadema', numero_activo: 'ACT-DIA-4003', estado_actual: 'Operativo' },
      ],
    },
    {
      equipo: {
        numero_activo: 'ACT-PC-1004',
        marca: 'Dell',
        numero_serie: 'DL-OPT-9938122',
        estado_actual: 'Operativo',
        responsable: 'Javier Restrepo',
        departamento: 'Comercial y Ventas',
        imagen_url: '',
        notas: 'Piso 2 Sala de Ventas. Equipo All-in-One en óptimo estado.',
      },
      perifericos: [
        { tipo: 'Mouse', numero_activo: 'ACT-MOU-2004', estado_actual: 'Operativo' },
        { tipo: 'Teclado', numero_activo: 'ACT-TEC-3004', estado_actual: 'Operativo' },
        { tipo: 'Diadema', numero_activo: 'ACT-DIA-4004', estado_actual: 'Operativo' },
      ],
    },
  ];

  for (const item of sampleEquipos) {
    const [result]: any = await p.query(
      `INSERT INTO equipos (numero_activo, marca, numero_serie, estado_actual, responsable, cc, departamento, imagen_url, notas)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.equipo.numero_activo,
        item.equipo.marca,
        item.equipo.numero_serie,
        item.equipo.estado_actual,
        item.equipo.responsable,
        item.equipo.cc || '',
        item.equipo.departamento,
        item.equipo.imagen_url || '',
        item.equipo.notas || '',
      ]
    );

    const equipoId = result.insertId;
    for (const per of item.perifericos) {
      await p.query(
        `INSERT INTO perifericos (equipo_id, tipo, numero_activo, estado_actual)
         VALUES (?, ?, ?, ?)`,
        [equipoId, per.tipo, per.numero_activo, per.estado_actual]
      );
    }
  }
}
export async function getAllEquiposMySQL(filters?: {
  search?: string;
  departamento?: string;
  estado?: string;
}): Promise<EquipoAllInOne[]> {
  const p = getMySQLPool();
  
  // Consulta relacional v2 con JOINs a custodios y departamentos
  let query = `
    SELECT 
      e.id,
      e.numero_activo,
      e.marca,
      e.numero_serie,
      e.estado_equipo AS estado_actual,
      COALESCE(CONCAT(c.nombres, ' ', c.apellidos), 'Sin custodio asignado') AS responsable,
      COALESCE(c.cedula_ciudadania, '') AS cc,
      COALESCE(d.nombre, 'Sin departamento') AS departamento,
      e.imagen_url,
      e.notas,
      e.created_at,
      e.updated_at
    FROM equipos e
    LEFT JOIN empleados_custodios c ON e.empleado_custodio_id = c.id
    LEFT JOIN departamentos d ON c.departamento_id = d.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filters?.search) {
    query += ` AND (
      e.numero_activo LIKE ? OR
      e.marca LIKE ? OR
      e.numero_serie LIKE ? OR
      CONCAT(c.nombres, ' ', c.apellidos) LIKE ? OR
      c.cedula_ciudadania LIKE ? OR
      d.nombre LIKE ?
    )`;
    const s = `%${filters.search}%`;
    params.push(s, s, s, s, s, s);
  }

  if (filters?.departamento && filters.departamento !== 'Todos') {
    query += ' AND d.nombre = ?';
    params.push(filters.departamento);
  }

  if (filters?.estado && filters.estado !== 'Todos') {
    query += ' AND e.estado_equipo = ?';
    params.push(filters.estado);
  }

  query += ' ORDER BY e.id DESC';

  const [equipos]: any = await p.query(query, params);

  // Mapear periféricos con el alias de estado_periferico -> estado_actual
  for (const eq of equipos) {
    const [perifs]: any = await p.query(
      `SELECT 
        id, 
        equipo_id, 
        tipo, 
        numero_activo, 
        estado_periferico AS estado_actual, 
        created_at, 
        updated_at 
      FROM perifericos 
      WHERE equipo_id = ? 
      ORDER BY id ASC`,
      [eq.id]
    );
    eq.perifericos = perifs;
  }

  return equipos;
}

export async function getEquipoByIdMySQL(id: number): Promise<EquipoAllInOne | null> {
  const p = getMySQLPool();
  const [rows]: any = await p.query(
    `SELECT 
      e.id,
      e.numero_activo,
      e.marca,
      e.numero_serie,
      e.estado_equipo AS estado_actual,
      COALESCE(CONCAT(c.nombres, ' ', c.apellidos), 'Sin custodio asignado') AS responsable,
      COALESCE(c.cedula_ciudadania, '') AS cc,
      COALESCE(d.nombre, 'Sin departamento') AS departamento,
      e.imagen_url,
      e.notas,
      e.created_at,
      e.updated_at
    FROM equipos e
    LEFT JOIN empleados_custodios c ON e.empleado_custodio_id = c.id
    LEFT JOIN departamentos d ON c.departamento_id = d.id
    WHERE e.id = ?`,
    [id]
  );
  if (rows.length === 0) return null;

  const equipo = rows[0];
  const [perifs]: any = await p.query(
    `SELECT 
      id, 
      equipo_id, 
      tipo, 
      numero_activo, 
      estado_periferico AS estado_actual, 
      created_at, 
      updated_at 
    FROM perifericos 
    WHERE equipo_id = ? 
    ORDER BY id ASC`,
    [id]
  );
  equipo.perifericos = perifs;
  return equipo;
}
export async function createEquipoMySQL(data: {
  numero_activo: string;
  marca: string;
  numero_serie: string;
  estado_actual: string;
  responsable: string;
  cc?: string;
  departamento: string;
  imagen_url?: string;
  notas?: string;
  perifericos?: Array<{
    tipo: 'Mouse' | 'Teclado' | 'Diadema';
    numero_activo: string;
    estado_actual: string;
  }>;
}): Promise<EquipoAllInOne> {
  const p = getMySQLPool();

  const [check]: any = await p.query('SELECT id FROM equipos WHERE numero_activo = ?', [
    data.numero_activo.trim(),
  ]);
  if (check.length > 0) {
    throw new Error(`El número de activo '${data.numero_activo}' ya está registrado.`);
  }

  const [res]: any = await p.query(
    `INSERT INTO equipos (numero_activo, marca, numero_serie, estado_actual, responsable, cc, departamento, imagen_url, notas)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.numero_activo.trim(),
      data.marca.trim(),
      data.numero_serie.trim(),
      data.estado_actual,
      data.responsable.trim(),
      (data.cc || '').trim(),
      data.departamento.trim(),
      data.imagen_url || '',
      data.notas || '',
    ]
  );

  const newId = res.insertId;
  const tipos: Array<'Mouse' | 'Teclado' | 'Diadema'> = ['Mouse', 'Teclado', 'Diadema'];
  const perifsToSave = data.perifericos && data.perifericos.length > 0
    ? data.perifericos
    : tipos.map((t) => ({
        tipo: t,
        numero_activo: '',
        estado_actual: data.estado_actual as any,
      }));

  for (const item of perifsToSave) {
    await p.query(
      `INSERT INTO perifericos (equipo_id, tipo, numero_activo, estado_actual)
       VALUES (?, ?, ?, ?)`,
      [newId, item.tipo, (item.numero_activo || '').trim(), item.estado_actual || data.estado_actual]
    );
  }

  return (await getEquipoByIdMySQL(newId))!;
}

export async function updateEquipoMySQL(
  id: number,
  data: {
    numero_activo: string;
    marca: string;
    numero_serie: string;
    estado_actual: string;
    responsable: string;
    cc?: string;
    departamento: string;
    imagen_url?: string;
    notas?: string;
    perifericos?: Array<{
      id?: number;
      tipo: 'Mouse' | 'Teclado' | 'Diadema';
      numero_activo: string;
      estado_actual: string;
    }>;
  }
): Promise<EquipoAllInOne> {
  const p = getMySQLPool();

  const [check]: any = await p.query(
    'SELECT id FROM equipos WHERE numero_activo = ? AND id != ?',
    [data.numero_activo.trim(), id]
  );
  if (check.length > 0) {
    throw new Error(`El número de activo '${data.numero_activo}' ya pertenece a otro equipo.`);
  }

  await p.query(
    `UPDATE equipos 
     SET numero_activo = ?, marca = ?, numero_serie = ?, estado_actual = ?,
         responsable = ?, cc = ?, departamento = ?, imagen_url = ?, notas = ?
     WHERE id = ?`,
    [
      data.numero_activo.trim(),
      data.marca.trim(),
      data.numero_serie.trim(),
      data.estado_actual,
      data.responsable.trim(),
      (data.cc || '').trim(),
      data.departamento.trim(),
      data.imagen_url !== undefined ? data.imagen_url : '',
      data.notas !== undefined ? data.notas : '',
      id,
    ]
  );

  if (data.perifericos && data.perifericos.length > 0) {
    await p.query('DELETE FROM perifericos WHERE equipo_id = ?', [id]);
    for (const item of data.perifericos) {
      await p.query(
        `INSERT INTO perifericos (equipo_id, tipo, numero_activo, estado_actual)
         VALUES (?, ?, ?, ?)`,
        [id, item.tipo, (item.numero_activo || '').trim(), item.estado_actual]
      );
    }
  }

  const updated = await getEquipoByIdMySQL(id);
  if (!updated) throw new Error('Equipo no encontrado tras actualizar.');
  return updated;
}

export async function deleteEquipoMySQL(id: number): Promise<boolean> {
  const p = getMySQLPool();
  await p.query('DELETE FROM perifericos WHERE equipo_id = ?', [id]);
  await p.query('DELETE FROM equipos WHERE id = ?', [id]);
  return true;
}
export async function getInventoryStatsMySQL(): Promise<InventoryStats> {
  const p = getMySQLPool();

  const [tot]: any = await p.query('SELECT COUNT(*) as count FROM equipos');
  const totalEquipos = tot[0]?.count || 0;

  // Consulta por estado_equipo de v2
  const [estados]: any = await p.query(`
    SELECT estado_equipo, COUNT(*) as count 
    FROM equipos 
    GROUP BY estado_equipo
  `);

  let operativos = 0;
  let enMantenimiento = 0;
  let danados = 0;
  let enBodega = 0;

  for (const row of estados) {
    const est = String(row.estado_equipo);
    const count = Number(row.count);
    if (est === 'Operativo') operativos = count;
    else if (est === 'En mantenimiento') enMantenimiento = count;
    else if (est === 'Dañado') danados = count;
    else if (est.includes('bodega') || est.includes('Desuso')) enBodega = count;
  }

  const [perTot]: any = await p.query('SELECT COUNT(*) as count FROM perifericos');
  const totalPerifericos = perTot[0]?.count || 0;

  // Conteo de departamentos a través de las relaciones de v2
  const [depts]: any = await p.query(`
    SELECT COALESCE(d.nombre, 'Sin departamento') as departamento, COUNT(e.id) as count 
    FROM equipos e
    LEFT JOIN empleados_custodios c ON e.empleado_custodio_id = c.id
    LEFT JOIN departamentos d ON c.departamento_id = d.id
    GROUP BY d.nombre
  `);
  const departamentosCount: Record<string, number> = {};
  for (const row of depts) {
    departamentosCount[String(row.departamento)] = Number(row.count);
  }

  const [marcas]: any = await p.query(`
    SELECT marca, COUNT(*) as count 
    FROM equipos 
    GROUP BY marca
  `);
  const marcasCount: Record<string, number> = {};
  for (const row of marcas) {
    marcasCount[String(row.marca)] = Number(row.count);
  }

  return {
    totalEquipos,
    operativos,
    enMantenimiento,
    danados,
    enBodega,
    totalPerifericos,
    departamentosCount,
    marcasCount,
  };
}

// ==========================================
// AUTENTICACIÓN Y ROLES (tablas app_usuarios y roles de migrations/schemaV2.sql)
// ==========================================

async function seedMySQLRolesAndUsers(p: mysql.Pool) {
  const [roleRows]: any = await p.query('SELECT COUNT(*) as count FROM roles');
  if (Number(roleRows[0]?.count || 0) === 0) {
    await p.query(`
      INSERT INTO roles (id, nombre, descripcion) VALUES
      (1, 'ADMIN', 'Control total: creación, edición, reasignación, eliminación y administración de usuarios'),
      (2, 'TECNICO', 'Registro de equipos, periféricos y reasignación de custodios por retiro/ingreso'),
      (3, 'CALIDAD', 'Solo lectura y generación de reportes (PDF, Excel, CSV), sin permisos de modificación')
      ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), descripcion = VALUES(descripcion);
    `);
  }

  const [userRows]: any = await p.query('SELECT COUNT(*) as count FROM app_usuarios');
  if (Number(userRows[0]?.count || 0) === 0) {
    await p.query(
      `INSERT INTO app_usuarios (rol_id, nombre_completo, username, email, password_hash, activo) VALUES
       (1, 'Administrador de Infraestructura TI', 'admin', 'admin@empresa.com', ?, 1),
       (2, 'Carlos Méndez (Técnico de Soporte)', 'tecnico', 'tecnico@empresa.com', ?, 1),
       (3, 'Beatriz Lozano (Auditora de Calidad)', 'calidad', 'calidad@empresa.com', ?, 1)`,
      [await bcrypt.hash('admin123', 10), await bcrypt.hash('tecnico123', 10), await bcrypt.hash('calidad123', 10)]
    );
  }
}

export async function getAllRolesMySQL(): Promise<Rol[]> {
  const p = getMySQLPool();
  const [rows]: any = await p.query('SELECT id, nombre, descripcion FROM roles ORDER BY id ASC');
  return rows;
}

export async function getAllUsuariosMySQL(): Promise<AppUsuario[]> {
  const p = getMySQLPool();
  const [rows]: any = await p.query(`
    SELECT u.id, u.rol_id, u.nombre_completo, u.username, u.email, u.activo, u.ultimo_login, u.created_at,
           r.nombre as rol_nombre, r.descripcion as rol_descripcion
    FROM app_usuarios u
    JOIN roles r ON u.rol_id = r.id
    ORDER BY u.id ASC
  `);
  return rows.map((r: any) => ({
    ...r,
    activo: Boolean(r.activo),
  }));
}

export async function getUsuarioByIdMySQL(id: number): Promise<AppUsuario | null> {
  const p = getMySQLPool();
  const [rows]: any = await p.query(`
    SELECT u.id, u.rol_id, u.nombre_completo, u.username, u.email, u.activo, u.ultimo_login, u.created_at,
           r.nombre as rol_nombre, r.descripcion as rol_descripcion
    FROM app_usuarios u
    JOIN roles r ON u.rol_id = r.id
    WHERE u.id = ?
  `, [id]);
  if (rows.length === 0) return null;
  return {
    ...rows[0],
    activo: Boolean(rows[0].activo),
  };
}

export async function getUsuarioByUsernameOrEmailMySQL(identifier: string): Promise<any | null> {
  const p = getMySQLPool();
  const [rows]: any = await p.query(`
    SELECT u.id, u.rol_id, u.nombre_completo, u.username, u.email, u.password_hash, u.activo, u.ultimo_login, u.created_at,
           r.nombre as rol_nombre, r.descripcion as rol_descripcion
    FROM app_usuarios u
    JOIN roles r ON u.rol_id = r.id
    WHERE u.username = ? OR u.email = ?
  `, [identifier.trim(), identifier.trim()]);
  if (rows.length === 0) return null;
  return rows[0];
}

export async function createUsuarioMySQL(data: {
  rol_id: number;
  nombre_completo: string;
  username: string;
  email: string;
  password: string;
  activo?: boolean;
}): Promise<AppUsuario> {
  const p = getMySQLPool();
  const pwdHash = await bcrypt.hash(data.password, 10);
  const [result]: any = await p.query(`
    INSERT INTO app_usuarios (rol_id, nombre_completo, username, email, password_hash, activo)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    data.rol_id,
    data.nombre_completo.trim(),
    data.username.trim(),
    data.email.trim().toLowerCase(),
    pwdHash,
    data.activo !== false ? 1 : 0,
  ]);
  const newId = result.insertId;
  const user = await getUsuarioByIdMySQL(newId);
  if (!user) throw new Error('Usuario no encontrado tras creación');
  return user;
}

export async function updateUsuarioMySQL(
  id: number,
  data: {
    rol_id?: number;
    nombre_completo?: string;
    username?: string;
    email?: string;
    password?: string;
    activo?: boolean;
  }
): Promise<AppUsuario> {
  const p = getMySQLPool();
  const fields: string[] = [];
  const params: any[] = [];

  if (data.rol_id !== undefined) {
    fields.push('rol_id = ?');
    params.push(data.rol_id);
  }
  if (data.nombre_completo !== undefined) {
    fields.push('nombre_completo = ?');
    params.push(data.nombre_completo.trim());
  }
  if (data.username !== undefined) {
    fields.push('username = ?');
    params.push(data.username.trim());
  }
  if (data.email !== undefined) {
    fields.push('email = ?');
    params.push(data.email.trim().toLowerCase());
  }
  if (data.password) {
    fields.push('password_hash = ?');
    params.push(await bcrypt.hash(data.password, 10));
  }
  if (data.activo !== undefined) {
    fields.push('activo = ?');
    params.push(data.activo ? 1 : 0);
  }

  if (fields.length > 0) {
    params.push(id);
    await p.query(`UPDATE app_usuarios SET ${fields.join(', ')} WHERE id = ?`, params);
  }

  const updated = await getUsuarioByIdMySQL(id);
  if (!updated) throw new Error('Usuario no encontrado');
  return updated;
}

export async function deleteUsuarioMySQL(id: number): Promise<boolean> {
  const p = getMySQLPool();
  await p.query('DELETE FROM app_usuarios WHERE id = ?', [id]);
  return true;
}

export async function updateUltimoLoginMySQL(id: number): Promise<void> {
  const p = getMySQLPool();
  await p.query('UPDATE app_usuarios SET ultimo_login = NOW() WHERE id = ?', [id]);
}

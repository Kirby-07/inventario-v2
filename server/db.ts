import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { EquipoAllInOne, Periferico, InventoryStats } from '../src/types.ts';
import {
  isMySQLConfigured,
  initMySQLTables,
  getAllEquiposMySQL,
  getEquipoByIdMySQL,
  createEquipoMySQL,
  updateEquipoMySQL,
  deleteEquipoMySQL,
  getInventoryStatsMySQL,
} from './mysql.ts';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'inventario.sqlite');

let dbInstance: Database | null = null;

function saveDb() {
  if (!dbInstance) return;
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  const data = dbInstance.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

export async function getDatabase(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_PATH);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (e) {
      console.error('Error cargando base de datos existente, creando nueva:', e);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  // Activar Foreign Keys en SQLite
  dbInstance.run('PRAGMA foreign_keys = ON;');

  // Crear tablas relacionales si no existen
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS equipos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero_activo TEXT UNIQUE NOT NULL,
      marca TEXT NOT NULL,
      numero_serie TEXT NOT NULL,
      estado_actual TEXT NOT NULL,
      responsable TEXT NOT NULL,
      departamento TEXT NOT NULL,
      imagen_url TEXT,
      notas TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS perifericos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      equipo_id INTEGER NOT NULL,
      tipo TEXT NOT NULL,
      numero_activo TEXT NOT NULL,
      estado_actual TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE CASCADE
    );
  `);

  // Comprobar si hay equipos iniciales; si está vacía, sembramos datos representativos de muestra
  const checkStmt = dbInstance.prepare('SELECT COUNT(*) as count FROM equipos');
  let count = 0;
  if (checkStmt.step()) {
    const row = checkStmt.getAsObject();
    count = Number(row.count) || 0;
  }
  checkStmt.free();

  if (count === 0) {
    seedInitialData();
  }

  saveDb();
  return dbInstance;
}

function seedInitialData() {
  if (!dbInstance) return;

  const sampleEquipos: Array<{
    equipo: Omit<EquipoAllInOne, 'id' | 'perifericos'>;
    perifericos: Omit<Periferico, 'id' | 'equipo_id'>[];
  }> = [
    {
      equipo: {
        numero_activo: 'ACT-PC-1001',
        marca: 'HP',
        numero_serie: 'HP-AIO-8849201',
        estado_actual: 'Operativo',
        responsable: 'Carlos Andrés Mendoza',
        departamento: 'Sistemas e Infraestructura',
        imagen_url: '',
        notas: 'Ubicado en el puesto A-12. Asignado en auditoría Q1.',
      },
      perifericos: [
        {
          tipo: 'Mouse',
          numero_activo: 'ACT-MOU-2001',
          estado_actual: 'Operativo',
        },
        {
          tipo: 'Teclado',
          numero_activo: 'ACT-TEC-3001',
          estado_actual: 'Operativo',
        },
        {
          tipo: 'Diadema',
          numero_activo: 'ACT-DIA-4001',
          estado_actual: 'Operativo',
        },
      ],
    },
    {
      equipo: {
        numero_activo: 'ACT-PC-1002',
        marca: 'Lenovo',
        numero_serie: 'LN-AIO-3319082',
        estado_actual: 'Operativo',
        responsable: 'Mariana Gómez Sánchez',
        departamento: 'Contabilidad y Finanzas',
        imagen_url: '',
        notas: 'Equipo principal de tesorería y nómina.',
      },
      perifericos: [
        {
          tipo: 'Mouse',
          numero_activo: 'ACT-MOU-2002',
          estado_actual: 'Operativo',
        },
        {
          tipo: 'Teclado',
          numero_activo: 'ACT-TEC-3002',
          estado_actual: 'Operativo',
        },
        {
          tipo: 'Diadema',
          numero_activo: 'ACT-DIA-4002',
          estado_actual: 'Operativo',
        },
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
        {
          tipo: 'Mouse',
          numero_activo: 'ACT-MOU-2003',
          estado_actual: 'Operativo',
        },
        {
          tipo: 'Teclado',
          numero_activo: 'ACT-TEC-3003',
          estado_actual: 'En mantenimiento',
        },
        {
          tipo: 'Diadema',
          numero_activo: 'ACT-DIA-4003',
          estado_actual: 'Operativo',
        },
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
        {
          tipo: 'Mouse',
          numero_activo: 'ACT-MOU-2004',
          estado_actual: 'Operativo',
        },
        {
          tipo: 'Teclado',
          numero_activo: 'ACT-TEC-3004',
          estado_actual: 'Operativo',
        },
        {
          tipo: 'Diadema',
          numero_activo: 'ACT-DIA-4004',
          estado_actual: 'Operativo',
        },
      ],
    },
  ];

  for (const item of sampleEquipos) {
    dbInstance.run(
      `INSERT INTO equipos (numero_activo, marca, numero_serie, estado_actual, responsable, departamento, imagen_url, notas)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.equipo.numero_activo,
        item.equipo.marca,
        item.equipo.numero_serie,
        item.equipo.estado_actual,
        item.equipo.responsable,
        item.equipo.departamento,
        item.equipo.imagen_url || '',
        item.equipo.notas || '',
      ]
    );

    const idStmt = dbInstance.prepare('SELECT last_insert_rowid() as id');
    let equipoId = 1;
    if (idStmt.step()) {
      equipoId = Number(idStmt.getAsObject().id);
    }
    idStmt.free();

    for (const per of item.perifericos) {
      dbInstance.run(
        `INSERT INTO perifericos (equipo_id, tipo, numero_activo, estado_actual)
         VALUES (?, ?, ?, ?)`,
        [
          equipoId,
          per.tipo,
          per.numero_activo,
          per.estado_actual,
        ]
      );
    }
  }
}

// Operaciones CRUD para Equipos
export async function getAllEquipos(filters?: {
  search?: string;
  departamento?: string;
  estado?: string;
}): Promise<EquipoAllInOne[]> {
  if (isMySQLConfigured()) {
    return getAllEquiposMySQL(filters);
  }
  const db = await getDatabase();
  let query = 'SELECT * FROM equipos WHERE 1=1';
  const params: any[] = [];

  if (filters?.search) {
    query += ` AND (
      numero_activo LIKE ? OR
      marca LIKE ? OR
      numero_serie LIKE ? OR
      responsable LIKE ? OR
      departamento LIKE ?
    )`;
    const s = `%${filters.search}%`;
    params.push(s, s, s, s, s);
  }

  if (filters?.departamento && filters.departamento !== 'Todos') {
    query += ' AND departamento = ?';
    params.push(filters.departamento);
  }

  if (filters?.estado && filters.estado !== 'Todos') {
    query += ' AND estado_actual = ?';
    params.push(filters.estado);
  }

  query += ' ORDER BY id DESC';

  const stmt = db.prepare(query);
  if (params.length > 0) {
    stmt.bind(params);
  }

  const equipos: EquipoAllInOne[] = [];
  while (stmt.step()) {
    equipos.push(stmt.getAsObject() as unknown as EquipoAllInOne);
  }
  stmt.free();

  // Cargar periféricos de cada equipo
  for (const eq of equipos) {
    eq.perifericos = await getPerifericosByEquipoId(eq.id!);
  }

  return equipos;
}

export async function getPerifericosByEquipoId(equipoId: number): Promise<Periferico[]> {
  const db = await getDatabase();
  const stmt = db.prepare('SELECT * FROM perifericos WHERE equipo_id = ? ORDER BY id ASC');
  stmt.bind([equipoId]);
  const perifericos: Periferico[] = [];
  while (stmt.step()) {
    perifericos.push(stmt.getAsObject() as unknown as Periferico);
  }
  stmt.free();
  return perifericos;
}

export async function getEquipoById(id: number): Promise<EquipoAllInOne | null> {
  if (isMySQLConfigured()) {
    return getEquipoByIdMySQL(id);
  }
  const db = await getDatabase();
  const stmt = db.prepare('SELECT * FROM equipos WHERE id = ?');
  stmt.bind([id]);
  if (!stmt.step()) {
    stmt.free();
    return null;
  }
  const equipo = stmt.getAsObject() as unknown as EquipoAllInOne;
  stmt.free();

  equipo.perifericos = await getPerifericosByEquipoId(id);
  return equipo;
}

export async function createEquipo(data: {
  numero_activo: string;
  marca: string;
  numero_serie: string;
  estado_actual: string;
  responsable: string;
  departamento: string;
  imagen_url?: string;
  notas?: string;
  perifericos?: Array<{
    tipo: 'Mouse' | 'Teclado' | 'Diadema';
    numero_activo: string;
    estado_actual: string;
  }>;
}): Promise<EquipoAllInOne> {
  if (isMySQLConfigured()) {
    return createEquipoMySQL(data);
  }
  const db = await getDatabase();

  // Validar número de activo único
  const checkStmt = db.prepare('SELECT id FROM equipos WHERE numero_activo = ?');
  checkStmt.bind([data.numero_activo.trim()]);
  if (checkStmt.step()) {
    checkStmt.free();
    throw new Error(`El número de activo '${data.numero_activo}' ya está registrado.`);
  }
  checkStmt.free();

  db.run(
    `INSERT INTO equipos (numero_activo, marca, numero_serie, estado_actual, responsable, departamento, imagen_url, notas)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.numero_activo.trim(),
      data.marca.trim(),
      data.numero_serie.trim(),
      data.estado_actual,
      data.responsable.trim(),
      data.departamento.trim(),
      data.imagen_url || '',
      data.notas || '',
    ]
  );

  const idStmt = db.prepare('SELECT last_insert_rowid() as id');
  let newId = 1;
  if (idStmt.step()) {
    newId = Number(idStmt.getAsObject().id);
  }
  idStmt.free();

  // Guardar periféricos
  const tipos: Array<'Mouse' | 'Teclado' | 'Diadema'> = ['Mouse', 'Teclado', 'Diadema'];
  const perifsToSave = data.perifericos && data.perifericos.length > 0
    ? data.perifericos
    : tipos.map((t) => ({
        tipo: t,
        numero_activo: '',
        estado_actual: data.estado_actual as any,
      }));

  for (const p of perifsToSave) {
    db.run(
      `INSERT INTO perifericos (equipo_id, tipo, numero_activo, estado_actual)
       VALUES (?, ?, ?, ?)`,
      [
        newId,
        p.tipo,
        (p.numero_activo || '').trim(),
        p.estado_actual || data.estado_actual,
      ]
    );
  }

  saveDb();
  return (await getEquipoById(newId))!;
}

export async function updateEquipo(
  id: number,
  data: {
    numero_activo: string;
    marca: string;
    numero_serie: string;
    estado_actual: string;
    responsable: string;
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
  if (isMySQLConfigured()) {
    return updateEquipoMySQL(id, data);
  }
  const db = await getDatabase();

  // Verificar si el nuevo número de activo colisiona con otro equipo
  const checkStmt = db.prepare('SELECT id FROM equipos WHERE numero_activo = ? AND id != ?');
  checkStmt.bind([data.numero_activo.trim(), id]);
  if (checkStmt.step()) {
    checkStmt.free();
    throw new Error(`El número de activo '${data.numero_activo}' ya pertenece a otro equipo.`);
  }
  checkStmt.free();

  db.run(
    `UPDATE equipos 
     SET numero_activo = ?, marca = ?, numero_serie = ?, estado_actual = ?,
         responsable = ?, departamento = ?, imagen_url = ?, notas = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      data.numero_activo.trim(),
      data.marca.trim(),
      data.numero_serie.trim(),
      data.estado_actual,
      data.responsable.trim(),
      data.departamento.trim(),
      data.imagen_url !== undefined ? data.imagen_url : '',
      data.notas !== undefined ? data.notas : '',
      id,
    ]
  );

  // Actualizar periféricos (reemplazar o actualizar)
  if (data.perifericos && data.perifericos.length > 0) {
    db.run('DELETE FROM perifericos WHERE equipo_id = ?', [id]);
    for (const p of data.perifericos) {
      db.run(
        `INSERT INTO perifericos (equipo_id, tipo, numero_activo, estado_actual)
         VALUES (?, ?, ?, ?)`,
        [
          id,
          p.tipo,
          (p.numero_activo || '').trim(),
          p.estado_actual,
        ]
      );
    }
  }

  saveDb();
  const updated = await getEquipoById(id);
  if (!updated) throw new Error('Equipo no encontrado tras actualizar.');
  return updated;
}

export async function deleteEquipo(id: number): Promise<boolean> {
  if (isMySQLConfigured()) {
    return deleteEquipoMySQL(id);
  }
  const db = await getDatabase();
  db.run('DELETE FROM perifericos WHERE equipo_id = ?', [id]);
  db.run('DELETE FROM equipos WHERE id = ?', [id]);
  saveDb();
  return true;
}

export async function getInventoryStats(): Promise<InventoryStats> {
  if (isMySQLConfigured()) {
    return getInventoryStatsMySQL();
  }
  const db = await getDatabase();

  const totalEquiposStmt = db.prepare('SELECT COUNT(*) as count FROM equipos');
  let totalEquipos = 0;
  if (totalEquiposStmt.step()) totalEquipos = Number(totalEquiposStmt.getAsObject().count);
  totalEquiposStmt.free();

  const estadoStmt = db.prepare(`
    SELECT estado_actual, COUNT(*) as count 
    FROM equipos 
    GROUP BY estado_actual
  `);
  let operativos = 0;
  let enMantenimiento = 0;
  let danados = 0;
  let enBodega = 0;

  while (estadoStmt.step()) {
    const row = estadoStmt.getAsObject();
    const est = String(row.estado_actual);
    const count = Number(row.count);
    if (est === 'Operativo') operativos = count;
    else if (est === 'En mantenimiento') enMantenimiento = count;
    else if (est === 'Dañado') danados = count;
    else if (est.includes('bodega') || est.includes('Desuso')) enBodega = count;
  }
  estadoStmt.free();

  const totalPerifericosStmt = db.prepare('SELECT COUNT(*) as count FROM perifericos');
  let totalPerifericos = 0;
  if (totalPerifericosStmt.step()) totalPerifericos = Number(totalPerifericosStmt.getAsObject().count);
  totalPerifericosStmt.free();

  const deptStmt = db.prepare(`
    SELECT departamento, COUNT(*) as count 
    FROM equipos 
    GROUP BY departamento
  `);
  const departamentosCount: Record<string, number> = {};
  while (deptStmt.step()) {
    const row = deptStmt.getAsObject();
    departamentosCount[String(row.departamento)] = Number(row.count);
  }
  deptStmt.free();

  const marcaStmt = db.prepare(`
    SELECT marca, COUNT(*) as count 
    FROM equipos 
    GROUP BY marca
  `);
  const marcasCount: Record<string, number> = {};
  while (marcaStmt.step()) {
    const row = marcaStmt.getAsObject();
    marcasCount[String(row.marca)] = Number(row.count);
  }
  marcaStmt.free();

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

/**
 * Genera el script DDL y DML para MariaDB / MySQL relacional
 */
export async function generateMariaDbScript(): Promise<string> {
  const equipos = await getAllEquipos();
  let sql = `-- Script Relacional para MariaDB / MySQL
-- Base de Datos: inventario_computo
-- Generado automáticamente desde el sistema de Auditoría

CREATE DATABASE IF NOT EXISTS inventario_computo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE inventario_computo;

-- Tabla de Equipos All in One
CREATE TABLE IF NOT EXISTS equipos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero_activo VARCHAR(100) NOT NULL UNIQUE,
  marca VARCHAR(100) NOT NULL,
  numero_serie VARCHAR(150) NOT NULL,
  estado_actual ENUM('Operativo', 'En mantenimiento', 'Dañado', 'En bodega / Desuso') NOT NULL,
  responsable VARCHAR(150) NOT NULL,
  departamento VARCHAR(150) NOT NULL,
  imagen_url LONGTEXT NULL,
  notas TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla Relacional de Periféricos (Mouse, Teclado, Diadema)
CREATE TABLE IF NOT EXISTS perifericos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  equipo_id INT NOT NULL,
  tipo ENUM('Mouse', 'Teclado', 'Diadema') NOT NULL,
  numero_activo VARCHAR(100) NOT NULL,
  estado_actual ENUM('Operativo', 'En mantenimiento', 'Dañado', 'En bodega / Desuso') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_perifericos_equipo FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Inserciones de datos actuales
`;

  for (const eq of equipos) {
    const safeImg = eq.imagen_url ? `'${eq.imagen_url.replace(/'/g, "\\'")}'` : 'NULL';
    const safeNotas = eq.notas ? `'${eq.notas.replace(/'/g, "\\'")}'` : 'NULL';
    sql += `\nINSERT INTO equipos (id, numero_activo, marca, numero_serie, estado_actual, responsable, departamento, imagen_url, notas) VALUES (${eq.id}, '${eq.numero_activo}', '${eq.marca}', '${eq.numero_serie}', '${eq.estado_actual}', '${eq.responsable}', '${eq.departamento}', ${safeImg}, ${safeNotas});\n`;

    if (eq.perifericos) {
      for (const p of eq.perifericos) {
        sql += `INSERT INTO perifericos (equipo_id, tipo, numero_activo, estado_actual) VALUES (${eq.id}, '${p.tipo}', '${p.numero_activo}', '${p.estado_actual}');\n`;
      }
    }
  }

  return sql;
}

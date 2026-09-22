import mysql from 'mysql2/promise';
import { EquipoAllInOne, Periferico, InventoryStats } from '../src/types.ts';

let pool: mysql.Pool | null = null;

export function isMySQLConfigured(): boolean {
  return Boolean(
    process.env.DATABASE_URL ||
    (process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME)
  );
}

export function getMySQLPool(): mysql.Pool {
  if (pool) return pool;

  if (process.env.DATABASE_URL) {
    // Para Aiven, Railway, PlanetScale u otros que requieren SSL con certificados autorizados
    pool = mysql.createPool({
      uri: process.env.DATABASE_URL,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: {
        rejectUnauthorized: false,
      },
    });
  } else {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'inventario_computo',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: {
        rejectUnauthorized: false,
      },
    });
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
      departamento VARCHAR(150) NOT NULL,
      imagen_url LONGTEXT NULL,
      notas TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

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

  const [equipos]: any = await p.query(query, params);

  for (const eq of equipos) {
    const [perifs]: any = await p.query(
      'SELECT * FROM perifericos WHERE equipo_id = ? ORDER BY id ASC',
      [eq.id]
    );
    eq.perifericos = perifs;
  }

  return equipos;
}

export async function getEquipoByIdMySQL(id: number): Promise<EquipoAllInOne | null> {
  const p = getMySQLPool();
  const [rows]: any = await p.query('SELECT * FROM equipos WHERE id = ?', [id]);
  if (rows.length === 0) return null;

  const equipo = rows[0];
  const [perifs]: any = await p.query(
    'SELECT * FROM perifericos WHERE equipo_id = ? ORDER BY id ASC',
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
         responsable = ?, departamento = ?, imagen_url = ?, notas = ?
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

  const [estados]: any = await p.query(`
    SELECT estado_actual, COUNT(*) as count 
    FROM equipos 
    GROUP BY estado_actual
  `);

  let operativos = 0;
  let enMantenimiento = 0;
  let danados = 0;
  let enBodega = 0;

  for (const row of estados) {
    const est = String(row.estado_actual);
    const count = Number(row.count);
    if (est === 'Operativo') operativos = count;
    else if (est === 'En mantenimiento') enMantenimiento = count;
    else if (est === 'Dañado') danados = count;
    else if (est.includes('bodega') || est.includes('Desuso')) enBodega = count;
  }

  const [perTot]: any = await p.query('SELECT COUNT(*) as count FROM perifericos');
  const totalPerifericos = perTot[0]?.count || 0;

  const [depts]: any = await p.query(`
    SELECT departamento, COUNT(*) as count 
    FROM equipos 
    GROUP BY departamento
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

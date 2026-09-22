import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  getAllEquipos,
  getEquipoById,
  createEquipo,
  updateEquipo,
  deleteEquipo,
  getInventoryStats,
  generateMariaDbScript,
  getDatabase,
} from './server/db.ts';
import { isMySQLConfigured, initMySQLTables, testMySQLConnection } from './server/mysql.ts';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware para procesar JSON con capacidad para imágenes en base64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Endpoint de diagnóstico para validar el estado de la base de datos (SQLite o MySQL)
app.get('/api/db/status', async (req, res) => {
  const isCloudConfigured = isMySQLConfigured();
  if (!isCloudConfigured) {
    return res.json({
      engine: 'sqlite',
      status: 'active',
      isCloud: false,
      message: 'Operando con base de datos SQLite local integrada (ideal para pruebas y desarrollo).',
    });
  }

  const testResult = await testMySQLConnection();
  if (testResult.connected) {
    return res.json({
      engine: 'mysql',
      status: 'connected',
      isCloud: true,
      message: 'Conexión exitosa a la base de datos externa en la nube.',
      details: testResult,
    });
  } else {
    return res.status(500).json({
      engine: 'mysql',
      status: 'error',
      isCloud: true,
      message: 'Error al conectar con la base de datos MariaDB / MySQL externa.',
      error: testResult.error,
    });
  }
});

// Rutas del CRUD de Equipos
// 1. Listar equipos con filtros
app.get('/api/equipos', async (req, res) => {
  try {
    const { search, departamento, estado } = req.query;
    const equipos = await getAllEquipos({
      search: search ? String(search) : undefined,
      departamento: departamento ? String(departamento) : undefined,
      estado: estado ? String(estado) : undefined,
    });
    res.json(equipos);
  } catch (error: any) {
    console.error('Error al obtener equipos:', error);
    res.status(500).json({ error: error.message || 'Error al obtener equipos' });
  }
});

// 2. Obtener un equipo por ID con sus periféricos
app.get('/api/equipos/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID de equipo inválido' });
    }
    const equipo = await getEquipoById(id);
    if (!equipo) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    res.json(equipo);
  } catch (error: any) {
    console.error('Error al obtener equipo:', error);
    res.status(500).json({ error: error.message || 'Error al obtener equipo' });
  }
});

// 3. Crear nuevo equipo All in One y periféricos
app.post('/api/equipos', async (req, res) => {
  try {
    const {
      numero_activo,
      marca,
      numero_serie,
      estado_actual,
      responsable,
      cc,
      departamento,
      imagen_url,
      notas,
      perifericos,
    } = req.body;

    // Validar campos requeridos
    if (!numero_activo || !marca || !numero_serie || !estado_actual || !responsable || !departamento) {
      return res.status(400).json({
        error: 'Todos los campos de identificación del equipo son obligatorios (Número de activo, marca, número de serie, estado, responsable, departamento)',
      });
    }

    const nuevoEquipo = await createEquipo({
      numero_activo,
      marca,
      numero_serie,
      estado_actual,
      responsable,
      cc,
      departamento,
      imagen_url,
      notas,
      perifericos,
    });

    res.status(201).json(nuevoEquipo);
  } catch (error: any) {
    console.error('Error al crear equipo:', error);
    res.status(400).json({ error: error.message || 'Error al crear equipo' });
  }
});

// 4. Actualizar equipo y periféricos
app.put('/api/equipos/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID de equipo inválido' });
    }

    const {
      numero_activo,
      marca,
      numero_serie,
      estado_actual,
      responsable,
      cc,
      departamento,
      imagen_url,
      notas,
      perifericos,
    } = req.body;

    if (!numero_activo || !marca || !numero_serie || !estado_actual || !responsable || !departamento) {
      return res.status(400).json({
        error: 'Todos los campos de identificación del equipo son obligatorios',
      });
    }

    const actualizado = await updateEquipo(id, {
      numero_activo,
      marca,
      numero_serie,
      estado_actual,
      responsable,
      cc,
      departamento,
      imagen_url,
      notas,
      perifericos,
    });

    res.json(actualizado);
  } catch (error: any) {
    console.error('Error al actualizar equipo:', error);
    res.status(400).json({ error: error.message || 'Error al actualizar equipo' });
  }
});

// 5. Eliminar equipo
app.delete('/api/equipos/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID de equipo inválido' });
    }
    await deleteEquipo(id);
    res.json({ success: true, message: 'Equipo y periféricos eliminados exitosamente' });
  } catch (error: any) {
    console.error('Error al eliminar equipo:', error);
    res.status(500).json({ error: error.message || 'Error al eliminar equipo' });
  }
});

// 6. Estadísticas para panel de auditoría
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await getInventoryStats();
    res.json(stats);
  } catch (error: any) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: error.message || 'Error al obtener estadísticas' });
  }
});

// 7. Descargar script SQL relacional (compatible con MariaDB / MySQL)
app.get('/api/export/mariadb.sql', async (req, res) => {
  try {
    const sql = await generateMariaDbScript();
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', 'attachment; filename="inventario_mariadb.sql"');
    res.send(sql);
  } catch (error: any) {
    console.error('Error al exportar SQL:', error);
    res.status(500).json({ error: 'Error al exportar script SQL' });
  }
});

async function startServer() {
  // Inicializar base de datos según configuración de entorno
  if (isMySQLConfigured()) {
    console.log('Conectando a base de datos MariaDB / MySQL externa...');
    try {
      await initMySQLTables();
      console.log('Tablas de MariaDB / MySQL listas.');
    } catch (err) {
      console.error('Error al inicializar MariaDB / MySQL, recurriendo a base de datos local:', err);
      await getDatabase();
    }
  } else {
    console.log('Usando base de datos SQLite relacional local.');
    await getDatabase();
  }

  // Middleware de Vite o estáticos
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor de inventario corriendo en http://0.0.0.0:${PORT}`);
  });
}

startServer();

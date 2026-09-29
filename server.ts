import 'dotenv/config';
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
import {
  getAllRolesMySQL,
  getAllUsuariosMySQL,
  getUsuarioByIdMySQL,
  getUsuarioByUsernameOrEmailMySQL,
  createUsuarioMySQL,
  updateUsuarioMySQL,
  deleteUsuarioMySQL,
  updateUltimoLoginMySQL,
} from './server/mysql.ts';
import {
  verifyPassword,
  createToken,
  authenticateToken,
  requireRoles,
  AuthenticatedRequest,
} from './server/auth.ts';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

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

// ==========================================
// RUTAS DE AUTENTICACIÓN Y ROLES (MariaDB: app_usuarios + roles de schemaV2.sql)
// ==========================================

function requireMySQL(res: any): boolean {
  if (!isMySQLConfigured()) {
    res.status(503).json({ error: 'Autenticación no disponible: configure la base de datos MariaDB / MySQL.' });
    return false;
  }
  return true;
}

// 1. Iniciar sesión (Login)
app.post('/api/auth/login', async (req, res) => {
  try {
    if (!requireMySQL(res)) return;
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Debe ingresar el usuario o correo y la contraseña.' });
    }

    const user = await getUsuarioByUsernameOrEmailMySQL(String(username));
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas. Verifique el usuario y la contraseña.' });
    }

    const isMatch = await verifyPassword(String(password), user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas. Verifique el usuario y la contraseña.' });
    }

    if (!user.activo) {
      return res.status(403).json({
        error: 'Esta cuenta se encuentra suspendida o inactiva. Contacte al Administrador del sistema.',
      });
    }

    await updateUltimoLoginMySQL(user.id);

    const token = createToken({
      userId: user.id,
      username: user.username,
      rol: user.rol_nombre,
    });

    const safeUser = {
      id: user.id,
      rol_id: user.rol_id,
      rol_nombre: user.rol_nombre,
      rol_descripcion: user.rol_descripcion,
      nombre_completo: user.nombre_completo,
      username: user.username,
      email: user.email,
      activo: Boolean(user.activo),
      ultimo_login: user.ultimo_login,
      created_at: user.created_at,
    };

    res.json({
      token,
      user: safeUser,
      message: `Bienvenido, ${safeUser.nombre_completo} (${safeUser.rol_nombre})`,
    });
  } catch (error: any) {
    console.error('Error en login:', error);
    res.status(500).json({ error: error.message || 'Error durante el inicio de sesión' });
  }
});

// 2. Obtener datos del usuario autenticado actual
app.get('/api/auth/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!requireMySQL(res)) return;
    const user = await getUsuarioByIdMySQL(req.user!.userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    if (!user.activo) {
      return res.status(403).json({ error: 'Su cuenta está inactiva' });
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al obtener sesión' });
  }
});

// 3. Cerrar sesión (token stateless: el cliente lo descarta)
app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Sesión finalizada exitosamente.' });
});

// 4. Listar todos los roles disponibles
app.get('/api/roles', async (req, res) => {
  try {
    if (!requireMySQL(res)) return;
    const roles = await getAllRolesMySQL();
    res.json(roles);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al obtener roles' });
  }
});

// ==========================================
// GESTIÓN DE USUARIOS (RBAC - Solo Administrador)
// ==========================================

app.get('/api/usuarios', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!requireMySQL(res)) return;
    const usuarios = await getAllUsuariosMySQL();
    res.json(usuarios);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al consultar usuarios' });
  }
});

app.post('/api/usuarios', authenticateToken, requireRoles('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    if (!requireMySQL(res)) return;
    const { rol_id, nombre_completo, username, email, password, activo } = req.body;
    if (!rol_id || !nombre_completo || !username || !email || !password) {
      return res.status(400).json({
        error: 'Todos los campos son obligatorios: rol, nombre completo, username, email y contraseña inicial.',
      });
    }

    if (password.length < 5) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 5 caracteres.' });
    }

    const nuevoUsuario = await createUsuarioMySQL({
      rol_id: Number(rol_id),
      nombre_completo,
      username,
      email,
      password,
      activo: activo !== false,
    });

    res.status(201).json(nuevoUsuario);
  } catch (error: any) {
    console.error('Error al crear usuario:', error);
    res.status(400).json({ error: error.message || 'Error al registrar usuario' });
  }
});

app.put('/api/usuarios/:id', authenticateToken, requireRoles('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    if (!requireMySQL(res)) return;
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'ID de usuario inválido' });

    const { rol_id, nombre_completo, username, email, password, activo } = req.body;

    const actualizado = await updateUsuarioMySQL(id, {
      rol_id: rol_id !== undefined ? Number(rol_id) : undefined,
      nombre_completo,
      username,
      email,
      password: password && password.trim() ? password : undefined,
      activo,
    });

    res.json(actualizado);
  } catch (error: any) {
    console.error('Error al actualizar usuario:', error);
    res.status(400).json({ error: error.message || 'Error al actualizar usuario' });
  }
});

app.post('/api/usuarios/:id/toggle-status', authenticateToken, requireRoles('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    if (!requireMySQL(res)) return;
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'ID de usuario inválido' });

    if (req.user!.userId === id) {
      return res.status(400).json({ error: 'No puede suspender su propia cuenta de administrador en uso.' });
    }

    const user = await getUsuarioByIdMySQL(id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const updated = await updateUsuarioMySQL(id, { activo: !user.activo });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al cambiar estado' });
  }
});

app.delete('/api/usuarios/:id', authenticateToken, requireRoles('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    if (!requireMySQL(res)) return;
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'ID de usuario inválido' });

    if (req.user!.userId === id) {
      return res.status(400).json({ error: 'No puede eliminar su propia cuenta de administrador en sesión.' });
    }

    await deleteUsuarioMySQL(id);
    res.json({ success: true, message: 'Usuario eliminado exitosamente del sistema' });
  } catch (error: any) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: error.message || 'Error al eliminar usuario' });
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

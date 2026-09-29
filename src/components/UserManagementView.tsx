import React, { useState, useEffect, useCallback } from 'react';
import { AppUsuario, Rol } from '../types.ts';
import { UserFormModal } from './UserFormModal.tsx';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Wrench,
  Eye,
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  RefreshCw,
  Shield,
  KeyRound,
  AlertTriangle,
  Lock,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface UserManagementViewProps {
  currentUser: AppUsuario;
  token: string;
  onToast: (msg: string) => void;
}

export function UserManagementView({
  currentUser,
  token,
  onToast,
}: UserManagementViewProps) {
  const [usuarios, setUsuarios] = useState<AppUsuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroRol, setFiltroRol] = useState<string>('TODOS');

  // Modales
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUsuario | null>(null);

  const [userToDelete, setUserToDelete] = useState<AppUsuario | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Cargar lista de usuarios y roles
  const fetchUsersAndRoles = useCallback(async () => {
    setIsLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        fetch('/api/usuarios', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/roles', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!usersRes.ok) {
        throw new Error('Error al consultar lista de usuarios del sistema.');
      }
      if (!rolesRes.ok) {
        throw new Error('Error al consultar roles.');
      }

      const usersData = await usersRes.json();
      const rolesData = await rolesRes.json();

      setUsuarios(usersData);
      setRoles(rolesData);
    } catch (err: any) {
      onToast(err.message || 'Error al cargar usuarios');
    } finally {
      setIsLoading(false);
    }
  }, [token, onToast]);

  useEffect(() => {
    fetchUsersAndRoles();
  }, [fetchUsersAndRoles]);

  // Guardar usuario (Crear o Actualizar)
  const handleSaveUser = async (userData: Partial<AppUsuario> & { password?: string }) => {
    if (editingUser) {
      const res = await fetch(`/api/usuarios/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al actualizar usuario');
      }

      onToast(`Usuario @${userData.username} actualizado con éxito.`);
    } else {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al crear usuario');
      }

      onToast(`Nuevo usuario @${userData.username} registrado con éxito.`);
    }

    await fetchUsersAndRoles();
  };

  // Alternar estado activo / suspendido
  const handleToggleStatus = async (user: AppUsuario) => {
    if (user.id === currentUser.id) {
      onToast('No puede suspender su propia cuenta de administrador en sesión.');
      return;
    }

    try {
      const res = await fetch(`/api/usuarios/${user.id}/toggle-status`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al cambiar estado');
      }

      const updated = await res.json();
      onToast(`Cuenta de @${user.username} ${updated.activo ? 'activada' : 'suspendida'}.`);
      await fetchUsersAndRoles();
    } catch (err: any) {
      onToast(err.message || 'Error al cambiar estado del usuario');
    }
  };

  // Eliminar usuario
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    if (userToDelete.id === currentUser.id) {
      onToast('No puede eliminar su propia cuenta en sesión.');
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/usuarios/${userToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al eliminar usuario');
      }

      onToast(`Usuario @${userToDelete.username} eliminado del sistema.`);
      setUserToDelete(null);
      await fetchUsersAndRoles();
    } catch (err: any) {
      onToast(err.message || 'Error al eliminar usuario');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtrado de usuarios
  const filteredUsers = usuarios.filter((u) => {
    const matchesSearch =
      u.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRol = filtroRol === 'TODOS' || u.rol_nombre === filtroRol;

    return matchesSearch && matchesRol;
  });

  // Estadísticas de usuarios
  const totalUsers = usuarios.length;
  const adminCount = usuarios.filter((u) => u.rol_nombre === 'ADMIN').length;
  const tecnicoCount = usuarios.filter((u) => u.rol_nombre === 'TECNICO').length;
  const calidadCount = usuarios.filter((u) => u.rol_nombre === 'CALIDAD').length;
  const activeCount = usuarios.filter((u) => Boolean(u.activo)).length;

  return (
    <div className="space-y-6">
      {/* Header del Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-dinamica-red/10 text-dinamica-darkred rounded-xl">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Gestión de Usuarios y Asignación de Roles (RBAC)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Administre las cuentas de operadores del sistema de inventario, asigne roles de acceso con permisos específicos y controle el estado de activación.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingUser(null);
            setIsFormModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-dinamica-red hover:bg-dinamica-darkred active:bg-dinamica-darkred text-white text-xs font-semibold rounded-xl shadow-md shadow-dinamica-red/20 transition cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      {/* Tarjetas de Métricas de Usuarios */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Total Usuarios
          </span>
          <span className="text-2xl font-bold text-slate-800 mt-1 block">{totalUsers}</span>
          <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3 h-3" /> {activeCount} activos
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-xs">
          <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider block flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Administradores
          </span>
          <span className="text-2xl font-bold text-slate-800 mt-1 block">{adminCount}</span>
          <span className="text-[10px] text-slate-500 mt-1 block">Control total</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-dinamica-charcoal/15 shadow-xs">
          <span className="text-[11px] font-semibold text-dinamica-charcoal uppercase tracking-wider block flex items-center gap-1">
            <Wrench className="w-3.5 h-3.5" /> Técnicos Soporte
          </span>
          <span className="text-2xl font-bold text-slate-800 mt-1 block">{tecnicoCount}</span>
          <span className="text-[10px] text-slate-500 mt-1 block">Alta y reasignación</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" /> Calidad
          </span>
          <span className="text-2xl font-bold text-slate-800 mt-1 block">{calidadCount}</span>
          <span className="text-[10px] text-slate-500 mt-1 block">Solo lectura</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Estado Cuentas
          </span>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-xs font-bold">
              {activeCount} Activas
            </span>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-bold">
              {totalUsers - activeCount} Inactivas
            </span>
          </div>
        </div>
      </div>

      {/* Matriz Explicativa de Permisos por Rol */}
      <div className="bg-gradient-to-r from-dinamica-charcoal to-black rounded-2xl p-5 text-white shadow-lg border border-dinamica-charcoal">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-dinamica-red" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Matriz de Control de Acceso por Roles (RBAC)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Admin */}
          <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-rose-500/30">
            <div className="flex items-center gap-2 font-bold text-rose-300 mb-1.5">
              <ShieldCheck className="w-4 h-4 text-rose-400" />
              <span>ADMINISTRADOR (ADMIN)</span>
            </div>
            <p className="text-slate-300 text-[11px] mb-2 leading-relaxed">
              Máximo nivel de privilegio dentro de la plataforma.
            </p>
            <ul className="space-y-1 text-[11px] text-slate-300">
              <li className="flex items-center gap-1.5 text-emerald-300">
                <CheckCircle2 className="w-3 h-3" /> Crear, editar y eliminar equipos
              </li>
              <li className="flex items-center gap-1.5 text-emerald-300">
                <CheckCircle2 className="w-3 h-3" /> Crear y administrar usuarios y roles
              </li>
              <li className="flex items-center gap-1.5 text-emerald-300">
                <CheckCircle2 className="w-3 h-3" /> Exportar reportes completos (PDF/XLSX/SQL)
              </li>
            </ul>
          </div>

          {/* Tecnico */}
          <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-dinamica-gray/25">
            <div className="flex items-center gap-2 font-bold text-gray-100 mb-1.5">
              <Wrench className="w-4 h-4 text-dinamica-gray" />
              <span>TÉCNICO DE SOPORTE (TECNICO)</span>
            </div>
            <p className="text-slate-300 text-[11px] mb-2 leading-relaxed">
              Operador de campo responsable de inventariar y reasignar máquinas.
            </p>
            <ul className="space-y-1 text-[11px] text-slate-300">
              <li className="flex items-center gap-1.5 text-emerald-300">
                <CheckCircle2 className="w-3 h-3" /> Registrar nuevos equipos All in One
              </li>
              <li className="flex items-center gap-1.5 text-emerald-300">
                <CheckCircle2 className="w-3 h-3" /> Modificar datos y reasignar custodios
              </li>
              <li className="flex items-center gap-1.5 text-rose-300">
                <XCircle className="w-3 h-3" /> Sin permiso para eliminar equipos
              </li>
              <li className="flex items-center gap-1.5 text-rose-300">
                <XCircle className="w-3 h-3" /> Sin acceso a gestión de usuarios
              </li>
            </ul>
          </div>

          {/* Calidad */}
          <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-emerald-500/30">
            <div className="flex items-center gap-2 font-bold text-emerald-300 mb-1.5">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>AUDITOR DE CALIDAD (CALIDAD)</span>
            </div>
            <p className="text-slate-300 text-[11px] mb-2 leading-relaxed">
              Supervisión de inventario para fines de auditoría y cumplimiento.
            </p>
            <ul className="space-y-1 text-[11px] text-slate-300">
              <li className="flex items-center gap-1.5 text-emerald-300">
                <CheckCircle2 className="w-3 h-3" /> Visualizar todos los equipos y fichas
              </li>
              <li className="flex items-center gap-1.5 text-emerald-300">
                <CheckCircle2 className="w-3 h-3" /> Descargar reportes PDF, Excel y CSV
              </li>
              <li className="flex items-center gap-1.5 text-rose-300">
                <XCircle className="w-3 h-3" /> Modo solo lectura (sin modificar ni borrar)
              </li>
              <li className="flex items-center gap-1.5 text-rose-300">
                <XCircle className="w-3 h-3" /> Sin acceso a gestión de usuarios
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, usuario o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-dinamica-red focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">Filtrar Rol:</span>
          <select
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-dinamica-red cursor-pointer"
          >
            <option value="TODOS">Todos los Roles</option>
            <option value="ADMIN">ADMINISTRADOR</option>
            <option value="TECNICO">TÉCNICO</option>
            <option value="CALIDAD">CALIDAD</option>
          </select>

          <button
            onClick={fetchUsersAndRoles}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            title="Actualizar listado"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Usuario / Operador</th>
                <th className="px-5 py-3.5">Correo Electrónico</th>
                <th className="px-5 py-3.5">Rol Asignado</th>
                <th className="px-5 py-3.5">Estado</th>
                <th className="px-5 py-3.5">Último Acceso</th>
                <th className="px-5 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-dinamica-darkred border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Cargando usuarios del sistema...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No se encontraron usuarios con los criterios de búsqueda.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = u.id === currentUser.id;
                  const isActivo = Boolean(u.activo);

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-50/70 transition ${
                        isCurrent ? 'bg-dinamica-red/[0.04]' : ''
                      }`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-dinamica-darkred to-dinamica-charcoal text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs shrink-0">
                            {u.nombre_completo.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 flex items-center gap-2">
                              <span>{u.nombre_completo}</span>
                              {isCurrent && (
                                <span className="text-[10px] bg-dinamica-charcoal/10 text-dinamica-charcoal px-1.5 py-0.5 rounded font-semibold">
                                  Tú
                                </span>
                              )}
                            </div>
                            <span className="text-slate-400 font-mono text-[11px]">
                              @{u.username}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-600">
                        {u.email}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                            u.rol_nombre === 'ADMIN'
                              ? 'bg-dinamica-darkred/10 text-dinamica-darkred border-dinamica-darkred/25'
                              : u.rol_nombre === 'TECNICO'
                              ? 'bg-dinamica-charcoal/10 text-dinamica-charcoal border-dinamica-charcoal/25'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {u.rol_nombre === 'ADMIN' && <ShieldCheck className="w-3.5 h-3.5" />}
                          {u.rol_nombre === 'TECNICO' && <Wrench className="w-3.5 h-3.5" />}
                          {u.rol_nombre === 'CALIDAD' && <Eye className="w-3.5 h-3.5" />}
                          <span>{u.rol_nombre}</span>
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            isActivo
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActivo ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          {isActivo ? 'Activo' : 'Suspendido'}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-500 text-[11px]">
                        {u.ultimo_login
                          ? new Date(u.ultimo_login).toLocaleString('es-CO', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          : 'Nunca'}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingUser(u);
                              setIsFormModalOpen(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-dinamica-darkred hover:bg-dinamica-red/10 rounded-lg transition cursor-pointer"
                            title="Editar usuario y asignar rol"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={isCurrent}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              isCurrent
                                ? 'opacity-30 cursor-not-allowed text-slate-400'
                                : isActivo
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={isActivo ? 'Suspender acceso' : 'Activar cuenta'}
                          >
                            {isActivo ? (
                              <XCircle className="w-4 h-4" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                          </button>

                          <button
                            onClick={() => setUserToDelete(u)}
                            disabled={isCurrent}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              isCurrent
                                ? 'opacity-30 cursor-not-allowed text-slate-400'
                                : 'text-rose-600 hover:bg-rose-50'
                            }`}
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Crear / Editar Usuario y Asignar Rol */}
      <UserFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveUser}
        editingUser={editingUser}
        roles={roles}
      />

      {/* Modal Confirmación de Eliminación de Usuario */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full my-auto max-h-[92vh] overflow-y-auto p-5 sm:p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900">
              ¿Eliminar usuario @{userToDelete.username}?
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Esta acción eliminará permanentemente la cuenta de{' '}
              <strong className="text-slate-700">{userToDelete.nombre_completo}</strong> con rol{' '}
              <strong className="text-slate-700">{userToDelete.rol_nombre}</strong>. El usuario ya no podrá iniciar sesión en la plataforma.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 rounded-xl hover:bg-rose-700 shadow-md shadow-rose-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Confirmar Eliminación</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { AppUsuario, Rol, UserRoleName } from '../types.ts';
import {
  X,
  User,
  Mail,
  Lock,
  Shield,
  ShieldCheck,
  Wrench,
  Eye,
  Check,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Info,
} from 'lucide-react';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: Partial<AppUsuario> & { password?: string }) => Promise<void>;
  editingUser: AppUsuario | null;
  roles: Rol[];
}

export function UserFormModal({
  isOpen,
  onClose,
  onSave,
  editingUser,
  roles,
}: UserFormModalProps) {
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rolId, setRolId] = useState<number>(2); // Default to TECNICO
  const [activo, setActivo] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingUser) {
      setNombreCompleto(editingUser.nombre_completo || '');
      setUsername(editingUser.username || '');
      setEmail(editingUser.email || '');
      setRolId(editingUser.rol_id || 2);
      setActivo(Boolean(editingUser.activo));
      setPassword(''); // Contraseña opcional al editar
    } else {
      setNombreCompleto('');
      setUsername('');
      setEmail('');
      setPassword('');
      setRolId(2); // Técnico por defecto
      setActivo(true);
    }
    setError(null);
  }, [editingUser, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nombreCompleto.trim()) {
      setError('El nombre completo es obligatorio.');
      return;
    }
    if (!username.trim()) {
      setError('El nombre de usuario es obligatorio.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Ingrese un correo electrónico corporativo válido.');
      return;
    }
    if (!editingUser && (!password || password.length < 5)) {
      setError('La contraseña inicial es requerida y debe tener al menos 5 caracteres.');
      return;
    }
    if (editingUser && password && password.length < 5) {
      setError('Si desea cambiar la contraseña, esta debe tener al menos 5 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        nombre_completo: nombreCompleto.trim(),
        username: username.trim(),
        email: email.trim().toLowerCase(),
        rol_id: Number(rolId),
        activo,
        password: password ? password : undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el usuario.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleCardDetails = (roleName: UserRoleName) => {
    switch (roleName) {
      case 'ADMIN':
        return {
          icon: ShieldCheck,
          badgeColor: 'bg-dinamica-darkred/10 text-dinamica-darkred border-dinamica-darkred/25',
          selectedBorder: 'border-dinamica-darkred bg-dinamica-red/[0.04] ring-2 ring-dinamica-darkred/20',
          hoverBorder: 'hover:border-dinamica-red/50',
          tag: 'Control Total',
          permissions: 'Usuarios, roles, borrado y modificación total',
        };
      case 'TECNICO':
        return {
          icon: Wrench,
          badgeColor: 'bg-dinamica-charcoal/10 text-dinamica-charcoal border-dinamica-charcoal/25',
          selectedBorder: 'border-dinamica-charcoal bg-dinamica-charcoal/[0.04] ring-2 ring-dinamica-charcoal/20',
          hoverBorder: 'hover:border-dinamica-charcoal/40',
          tag: 'Gestión Operativa',
          permissions: 'Alta, edición y reasignación de equipos (sin borrado)',
        };
      case 'CALIDAD':
        return {
          icon: Eye,
          badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          selectedBorder: 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20',
          hoverBorder: 'hover:border-emerald-300',
          tag: 'Auditoría / Solo Lectura',
          permissions: 'Consulta de inventario y descarga de reportes',
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-dinamica-charcoal text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-dinamica-red rounded-xl text-white">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {editingUser ? 'Editar Usuario y Asignar Rol' : 'Registrar Nuevo Usuario del Sistema'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {editingUser
                  ? `Modificando permisos y cuenta de @${editingUser.username}`
                  : 'Cree una cuenta de operador con sus credenciales y permisos correspondientes'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Error al procesar:</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Datos Personales & Cuenta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nombre Completo <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="ej. Juan Andrés Rivera"
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-dinamica-red focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nombre de Usuario (@username) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="text-slate-400 font-bold text-xs absolute left-3 top-1/2 -translate-y-1/2">
                  @
                </span>
                <input
                  type="text"
                  required
                  placeholder="ej. jrivera"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-dinamica-red focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Correo Electrónico Corporativo <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="ej. jrivera@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-dinamica-red focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {editingUser ? 'Nueva Contraseña (Opcional)' : 'Contraseña Inicial'} {!editingUser && <span className="text-rose-500">*</span>}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder={editingUser ? 'Dejar en blanco para no cambiar' : 'Mínimo 5 caracteres'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-dinamica-red focus:bg-white transition"
                />
              </div>
            </div>
          </div>

          {/* Asignación de Roles */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Asignación de Rol & Nivel de Permisos <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {roles.map((r) => {
                const isSelected = Number(rolId) === r.id;
                const cardDetails = getRoleCardDetails(r.nombre);
                const IconComponent = cardDetails.icon;

                return (
                  <div
                    key={r.id}
                    onClick={() => setRolId(r.id)}
                    className={`relative p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                      isSelected
                        ? cardDetails.selectedBorder
                        : `border-slate-200 bg-white ${cardDetails.hoverBorder}`
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <IconComponent
                            className={`w-4 h-4 ${
                              r.nombre === 'ADMIN'
                                ? 'text-dinamica-red'
                                : r.nombre === 'TECNICO'
                                ? 'text-dinamica-charcoal'
                                : 'text-emerald-600'
                            }`}
                          />
                          <span className="font-bold text-xs text-slate-900">{r.nombre}</span>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-dinamica-darkred bg-dinamica-red text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>

                      <span
                        className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md border mb-2 ${cardDetails.badgeColor}`}
                      >
                        {cardDetails.tag}
                      </span>

                      <p className="text-[11px] text-slate-600 line-clamp-3 leading-snug">
                        {r.descripcion}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400 block leading-tight">
                        {cardDetails.permissions}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Estado de la Cuenta */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  activo ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
              />
              <div>
                <span className="text-xs font-semibold text-slate-800 block">
                  Estado de Acceso: {activo ? 'Cuenta Activa' : 'Cuenta Suspendida / Inactiva'}
                </span>
                <span className="text-[11px] text-slate-500">
                  {activo
                    ? 'El usuario puede iniciar sesión y operar según su rol asignado'
                    : 'El acceso al sistema está bloqueado temporalmente'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActivo(!activo)}
              className="text-slate-600 hover:text-dinamica-darkred transition cursor-pointer"
            >
              {activo ? (
                <ToggleRight className="w-7 h-7 text-dinamica-darkred" />
              ) : (
                <ToggleLeft className="w-7 h-7 text-slate-400" />
              )}
            </button>
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-dinamica-red rounded-xl hover:bg-dinamica-darkred shadow-md shadow-dinamica-red/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{editingUser ? 'Guardar Cambios' : 'Registrar Usuario'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

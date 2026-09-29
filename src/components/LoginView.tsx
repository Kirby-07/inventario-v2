import React, { useState } from 'react';
import { AppUsuario, AuthSession } from '../types.ts';
import {
  ShieldCheck,
  Wrench,
  Eye,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (session: AuthSession) => void;
}

export function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('Por favor ingrese su usuario o correo y contraseña.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Credenciales incorrectas o error en el servidor.');
      }

      onLoginSuccess({
        token: data.token,
        user: data.user,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  // Acceso rápido de demostración
  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMessage(null);
  };

  const handleInstantQuickLogin = async (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error en inicio de sesión');
      }

      onLoginSuccess({
        token: data.token,
        user: data.user,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      {/* Decorative background lights */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl shadow-xl shadow-indigo-500/25 mb-4 text-white">
            <Layers className="w-9 h-9" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Sistema de Inventario & Gestión TI
          </h1>
          <p className="text-slate-400 text-sm mt-1.5 max-w-lg mx-auto">
            Control de activos All in One, periféricos, auditoría y control de acceso basado en roles (RBAC)
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Formulario de Login */}
          <div className="lg:col-span-7 bg-white/95 backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-2xl border border-white/20">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-600" />
                Iniciar Sesión en el Sistema
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Ingrese sus credenciales corporativas para acceder a sus funciones asignadas
              </p>
            </div>

            {errorMessage && (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">Error de Autenticación:</span>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Usuario o Correo Electrónico
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ej. admin o admin@empresa.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 placeholder-slate-400 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 placeholder-slate-400 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Entrar al Sistema</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-400">
                Acceso corporativo protegido • Registro de auditoría activo
              </p>
            </div>
          </div>

          {/* Panel Lateral: Cuentas Demo y Roles del Sistema */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/70 rounded-2xl p-5 text-white shadow-xl">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Acceso Rápido por Perfil (Demo)
                </h3>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Haga clic en cualquiera de los 3 perfiles para iniciar sesión instantáneamente y probar sus permisos:
              </p>

              <div className="space-y-3">
                {/* 1. Admin */}
                <div
                  onClick={() => handleInstantQuickLogin('admin', 'admin123')}
                  className="group bg-slate-900/60 hover:bg-slate-900 border border-rose-500/30 hover:border-rose-500/80 rounded-xl p-3.5 transition cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg group-hover:scale-105 transition">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-rose-300">ADMINISTRADOR</span>
                        <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-mono">
                          admin
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                        Control total: gestión de usuarios, roles, creación, edición y borrado de equipos
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 group-hover:translate-x-1 transition shrink-0 ml-2" />
                </div>

                {/* 2. Tecnico */}
                <div
                  onClick={() => handleInstantQuickLogin('tecnico', 'tecnico123')}
                  className="group bg-slate-900/60 hover:bg-slate-900 border border-blue-500/30 hover:border-blue-500/80 rounded-xl p-3.5 transition cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg group-hover:scale-105 transition">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-blue-300">TÉCNICO DE SOPORTE</span>
                        <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono">
                          tecnico
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                        Operación: registro de equipos, edición y reasignación a nuevos empleados
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition shrink-0 ml-2" />
                </div>

                {/* 3. Calidad */}
                <div
                  onClick={() => handleInstantQuickLogin('calidad', 'calidad123')}
                  className="group bg-slate-900/60 hover:bg-slate-900 border border-emerald-500/30 hover:border-emerald-500/80 rounded-xl p-3.5 transition cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg group-hover:scale-105 transition">
                      <Eye className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-emerald-300">AUDITOR DE CALIDAD</span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                          calidad
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                        Solo lectura: consulta de inventario, visualización y exportación de reportes
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition shrink-0 ml-2" />
                </div>
              </div>
            </div>

            {/* Matriz de Seguridad y Políticas */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 text-xs text-slate-300 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span>Políticas de Seguridad & RBAC</span>
              </div>
              <ul className="space-y-1.5 text-slate-400 text-[11px]">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>Las contraseñas se almacenan mediante hashing seguro con salting.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-indigo-400 font-bold">•</span>
                  <span>Sesiones firmadas con tokens JWT y verificación en endpoints API.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>Solo Administradores pueden gestionar usuarios y eliminar activos.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

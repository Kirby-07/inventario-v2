import React, { useState } from 'react';
import { AppUsuario, AuthSession } from '../types.ts';
import {
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  KeyRound,
  Shield,
} from 'lucide-react';
import { DinamicaLogo } from './DinamicaLogo.tsx';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-dinamica-charcoal via-slate-900 to-black flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      {/* Decorative background lights */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-dinamica-red/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-dinamica-red/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-white rounded-2xl shadow-xl p-1.5 mb-4">
            <DinamicaLogo className="w-14 h-14" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Grupo Empresarial Dinámica S.A.S.
          </h1>
          <p className="text-dinamica-gray text-xs sm:text-sm mt-1.5 font-medium">
            Dirección de Tecnología e Infraestructura | Sistema de Control y Auditoría de Equipos
          </p>
          <p className="text-slate-400 text-xs mt-1 max-w-lg mx-auto">
            Control de activos All in One, periféricos y control de acceso basado en roles (RBAC)
          </p>
        </div>

        {/* Formulario de Login */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-2xl border border-white/20">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-dinamica-darkred" />
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-dinamica-red focus:bg-white text-slate-800 placeholder-slate-400 transition"
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
                    className="text-[11px] text-dinamica-darkred hover:text-dinamica-red font-medium"
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
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-dinamica-red focus:bg-white text-slate-800 placeholder-slate-400 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 bg-dinamica-red hover:bg-dinamica-darkred active:bg-dinamica-darkred text-white font-semibold text-sm rounded-xl shadow-lg shadow-dinamica-red/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
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

          {/* Políticas de Seguridad */}
          <div className="mt-6">
            {/* Matriz de Seguridad y Políticas */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 text-xs text-slate-300 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                <Shield className="w-3.5 h-3.5 text-dinamica-red" />
                <span>Políticas de Seguridad & RBAC</span>
              </div>
              <ul className="space-y-1.5 text-slate-400 text-[11px]">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>Las contraseñas se almacenan mediante hashing seguro con salting.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-dinamica-red font-bold">•</span>
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
  );
}

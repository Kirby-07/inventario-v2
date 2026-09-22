import React, { useState } from 'react';
import { Database, CheckCircle2, AlertCircle, RefreshCw, X, Server, ShieldCheck, ExternalLink } from 'lucide-react';
import { DatabaseStatus } from '../types.ts';

interface DatabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: DatabaseStatus | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export const DatabaseStatusModal: React.FC<DatabaseStatusModalProps> = ({
  isOpen,
  onClose,
  status,
  isLoading,
  onRefresh,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Encabezado */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              status?.status === 'connected' 
                ? 'bg-emerald-100 text-emerald-700' 
                : status?.status === 'error' 
                ? 'bg-rose-100 text-rose-700' 
                : 'bg-indigo-100 text-indigo-700'
            }`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Estado de Conexión a Base de Datos
              </h2>
              <p className="text-xs text-slate-500">
                Verificación de persistencia para Render / Aiven
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido principal */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Tarjeta de Estado Principal */}
          {isLoading ? (
            <div className="p-6 text-center border border-slate-200 rounded-xl bg-slate-50">
              <RefreshCw className="w-6 h-6 animate-spin text-slate-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">Comprobando conexión...</p>
              <p className="text-xs text-slate-400">Consultando motor y permisos de la base de datos</p>
            </div>
          ) : status?.status === 'connected' ? (
            <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-emerald-950">
                  ¡Conexión Exitosa con la Base de Datos Externa!
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  El sistema está conectado a tu instancia MySQL / MariaDB en la nube. Todos los registros y modificaciones se guardan de forma permanente y no se perderán al reiniciar el servidor en Render.
                </p>
              </div>
            </div>
          ) : status?.status === 'error' ? (
            <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200 text-rose-900 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-rose-950">
                  No se pudo conectar a la Base de Datos Externa
                </p>
                <p className="text-xs text-rose-700 mt-0.5">
                  {status.error || 'Revisa que las credenciales de Aiven/Render y el host estén activos.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-200 text-indigo-900 flex items-start gap-3">
              <Server className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-indigo-950">
                  Modo Local SQLite Activo
                </p>
                <p className="text-xs text-indigo-700 mt-0.5">
                  Actualmente no hay variables de base de datos externa configuradas en este contenedor. El sistema está funcionando con SQLite en memoria/disco local. Al desplegar en Render con tus variables de Aiven, pasará automáticamente a MySQL persistente.
                </p>
              </div>
            </div>
          )}

          {/* Detalles Técnicos */}
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <div className="bg-slate-50 px-3.5 py-2 font-semibold text-slate-700 border-b border-slate-200 flex items-center justify-between">
              <span>Parámetros de Auditoría</span>
              <span className="text-2xs font-normal text-slate-400">Endpoint: /api/db/status</span>
            </div>
            <div className="divide-y divide-slate-100 bg-white">
              <div className="px-3.5 py-2.5 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Motor de BD:</span>
                <span className="font-semibold text-slate-900 uppercase">
                  {status?.engine === 'mysql' ? 'MySQL / MariaDB (Nube)' : 'SQLite (Local)'}
                </span>
              </div>
              <div className="px-3.5 py-2.5 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Persistencia en Render:</span>
                <span className={`font-semibold flex items-center gap-1 ${
                  status?.isCloud ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {status?.isCloud ? 'Garantizada (Persistente)' : 'Temporal (Requiere DATABASE_URL en Render)'}
                </span>
              </div>
              {status?.details && (
                <>
                  <div className="px-3.5 py-2.5 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Host / Servidor:</span>
                    <span className="font-mono text-2xs text-slate-700 truncate max-w-[220px]">
                      {status.details.host || 'Aiven Cloud'}
                    </span>
                  </div>
                  <div className="px-3.5 py-2.5 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Base de Datos:</span>
                    <span className="font-mono text-slate-900 font-semibold">
                      {status.details.database}
                    </span>
                  </div>
                  <div className="px-3.5 py-2.5 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Versión del Servidor:</span>
                    <span className="font-mono text-slate-700">
                      {status.details.version}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Guía Rápida para Render */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1.5">
            <p className="font-semibold text-slate-800 flex items-center gap-1.5">
              <span>💡 ¿Cómo verificarlo una vez desplegado en Render?</span>
            </p>
            <ol className="list-decimal pl-4 space-y-1 text-slate-600 text-2xs sm:text-xs">
              <li>
                En tu servicio de Render, ve a la pestaña <strong>Environment</strong> y agrega <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">DATABASE_URL</code> con tu URL de Aiven.
              </li>
              <li>
                Haz clic en este mismo botón de <strong>"Estado BD"</strong> en la cabecera para ver la luz verde de conexión.
              </li>
              <li>
                O abre directamente en tu navegador: <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">https://tu-app.onrender.com/api/db/status</code>
              </li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Probar Conexión Ahora
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

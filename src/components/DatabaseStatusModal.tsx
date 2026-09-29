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
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg my-auto max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Encabezado */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              status?.status === 'connected' 
                ? 'bg-emerald-100 text-emerald-700' 
                : status?.status === 'error' 
                ? 'bg-dinamica-red/10 text-dinamica-darkred' 
                : 'bg-dinamica-charcoal/10 text-dinamica-charcoal'
            }`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Estado de Conexión a Base de Datos
              </h2>
              <p className="text-xs text-slate-500">
                Motor de persistencia del sistema
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
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">
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
                  El sistema está conectado a la base de datos externa (MariaDB / MySQL). Todos los registros y modificaciones se guardan de forma permanente.
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
                  {status.error || 'Revisa que las credenciales y el host de la base de datos externa estén activos.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-dinamica-charcoal/[0.04] border border-dinamica-charcoal/15 text-dinamica-charcoal flex items-start gap-3">
              <Server className="w-5 h-5 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold">
                  Modo Local SQLite Activo
                </p>
                <p className="text-xs opacity-80 mt-0.5">
                  No hay una base de datos externa configurada. El sistema está funcionando con la base de datos local (SQLite).
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
                <span className="text-slate-500 font-medium">Persistencia de datos:</span>
                <span className={`font-semibold flex items-center gap-1 ${
                  status?.isCloud ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {status?.isCloud ? 'Garantizada (base de datos externa)' : 'Temporal (solo base de datos local)'}
                </span>
              </div>
              {status?.details && (
                <>
                  <div className="px-3.5 py-2.5 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Host / Servidor:</span>
                    <span className="font-mono text-2xs text-slate-700 truncate max-w-[220px]">
                      {status.details.host || 'No disponible'}
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

          {/* Nota administrativa */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1.5">
            <p className="font-semibold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-dinamica-darkred" />
              <span>Información restringida al rol Administrador</span>
            </p>
            <p className="text-slate-600 text-2xs sm:text-xs">
              El respaldo de la estructura y los datos puede descargarse desde el botón <strong>Script SQL</strong> de la cabecera. Comunique cualquier novedad de conectividad a la Dirección de Tecnología e Infraestructura.
            </p>
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

import React from 'react';
import { EquipoAllInOne } from '../types.ts';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  equipo: EquipoAllInOne | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  equipo,
  onClose,
  onConfirm,
  isDeleting,
}) => {
  if (!isOpen || !equipo) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 text-rose-600 mb-3">
          <div className="p-2.5 bg-rose-50 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">¿Eliminar equipo del inventario?</h3>
            <p className="text-xs text-slate-500">Esta acción no se puede deshacer</p>
          </div>
        </div>

        <div className="my-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
          <div>
            <span className="text-slate-400">N° de Activo: </span>
            <span className="font-semibold text-slate-800">{equipo.numero_activo}</span>
          </div>
          <div>
            <span className="text-slate-400">Equipo: </span>
            <span className="text-slate-700">All-in-One {equipo.marca} (S/N: {equipo.numero_serie})</span>
          </div>
          <div>
            <span className="text-slate-400">Responsable: </span>
            <span className="text-slate-700">{equipo.responsable} - {equipo.departamento}</span>
          </div>
          <div className="pt-1.5 border-t border-slate-200/60 text-2xs text-amber-700">
            * Nota: Por integridad relacional (CASCADE), se eliminarán automáticamente todos los periféricos asociados (mouse, teclado y diadema).
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {isDeleting ? 'Eliminando...' : 'Sí, eliminar equipo'}
          </button>
        </div>
      </div>
    </div>
  );
};

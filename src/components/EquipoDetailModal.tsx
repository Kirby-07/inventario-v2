import React from 'react';
import { EquipoAllInOne } from '../types.ts';
import { generateIndividualAuditPdf } from '../utils/pdfGenerator.ts';
import {
  X,
  FileDown,
  Edit,
  Trash2,
  Monitor,
  Mouse,
  Keyboard,
  Headphones,
  User,
  Building,
  Hash,
  Tag,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Image as ImageIcon,
} from 'lucide-react';

interface EquipoDetailModalProps {
  equipo: EquipoAllInOne | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (equipo: EquipoAllInOne) => void;
  onDelete: (equipo: EquipoAllInOne) => void;
}

export const EquipoDetailModal: React.FC<EquipoDetailModalProps> = ({
  equipo,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  if (!isOpen || !equipo) return null;

  const handleDownloadPdf = () => {
    generateIndividualAuditPdf(equipo);
  };

  const getStatusBadge = (estado: string) => {
    if (estado === 'Operativo') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Operativo
        </span>
      );
    }
    if (estado === 'En mantenimiento') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5" />
          En mantenimiento
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        <Clock className="w-3.5 h-3.5" />
        {estado}
      </span>
    );
  };

  const mouse = equipo.perifericos?.find((p) => p.tipo === 'Mouse');
  const teclado = equipo.perifericos?.find((p) => p.tipo === 'Teclado');
  const diadema = equipo.perifericos?.find((p) => p.tipo === 'Diadema');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[92vh] flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-xs">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{equipo.numero_activo}</h2>
                {getStatusBadge(equipo.estado_actual)}
              </div>
              <p className="text-xs text-slate-500">
                All-in-One {equipo.marca} • S/N: {equipo.numero_serie}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Ficha superior con imagen y datos principales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Imagen adjunta */}
            <div className="md:col-span-1">
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-4/3 flex items-center justify-center relative">
                {equipo.imagen_url ? (
                  <img
                    src={equipo.imagen_url}
                    alt={equipo.numero_activo}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4 text-slate-400">
                    <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                    <span className="text-2xs font-medium">Sin imagen adjunta</span>
                  </div>
                )}
              </div>
            </div>

            {/* Datos de asignación e identificación */}
            <div className="md:col-span-2 space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200/60 pb-1.5">
                Identificación del Equipo PC All-in-One
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-2xs uppercase font-medium">N° de Activo</span>
                  <span className="font-semibold text-slate-800">{equipo.numero_activo}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-2xs uppercase font-medium">Marca</span>
                  <span className="font-semibold text-slate-800">{equipo.marca}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-2xs uppercase font-medium">N° de Serie</span>
                  <span className="font-mono text-slate-800">{equipo.numero_serie}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-2xs uppercase font-medium">Estado Físico</span>
                  <span className="font-medium text-slate-800">{equipo.estado_actual}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-2xs uppercase font-medium">Responsable / Custodio</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    {equipo.responsable}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-2xs uppercase font-medium">Departamento</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    <Building className="w-3 h-3 text-slate-400" />
                    {equipo.departamento}
                  </span>
                </div>
              </div>

              {equipo.notas && (
                <div className="pt-2 border-t border-slate-200/60 text-xs">
                  <span className="text-slate-500 block text-2xs uppercase font-medium mb-0.5">Observaciones de Auditoría</span>
                  <p className="text-slate-700 bg-white p-2 rounded-md border border-slate-200 text-xs">
                    {equipo.notas}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Tabla de Periféricos asociados */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span>Periféricos Vinculados</span>
              <span className="text-2xs font-normal text-slate-400 lowercase">Mouse, teclado y diadema</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Card Mouse */}
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Mouse className="w-3.5 h-3.5 text-slate-600" />
                    Mouse
                  </span>
                  <span className="text-2xs font-medium px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full">
                    {mouse?.estado_actual || 'N/R'}
                  </span>
                </div>
                <div className="text-xs space-y-1.5 pt-1">
                  <div>
                    <span className="text-2xs text-slate-400 block font-medium">N° de Activo:</span>
                    <span className="font-semibold text-slate-800 text-xs">{mouse?.numero_activo || 'Sin registrar'}</span>
                  </div>
                  <div>
                    <span className="text-2xs text-slate-400 block font-medium">Estado:</span>
                    <span className="text-slate-700">{mouse?.estado_actual || 'N/R'}</span>
                  </div>
                </div>
              </div>

              {/* Card Teclado */}
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Keyboard className="w-3.5 h-3.5 text-slate-600" />
                    Teclado
                  </span>
                  <span className="text-2xs font-medium px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full">
                    {teclado?.estado_actual || 'N/R'}
                  </span>
                </div>
                <div className="text-xs space-y-1.5 pt-1">
                  <div>
                    <span className="text-2xs text-slate-400 block font-medium">N° de Activo:</span>
                    <span className="font-semibold text-slate-800 text-xs">{teclado?.numero_activo || 'Sin registrar'}</span>
                  </div>
                  <div>
                    <span className="text-2xs text-slate-400 block font-medium">Estado:</span>
                    <span className="text-slate-700">{teclado?.estado_actual || 'N/R'}</span>
                  </div>
                </div>
              </div>

              {/* Card Diadema */}
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Headphones className="w-3.5 h-3.5 text-slate-600" />
                    Diadema
                  </span>
                  <span className="text-2xs font-medium px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full">
                    {diadema?.estado_actual || 'N/R'}
                  </span>
                </div>
                <div className="text-xs space-y-1.5 pt-1">
                  <div>
                    <span className="text-2xs text-slate-400 block font-medium">N° de Activo:</span>
                    <span className="font-semibold text-slate-800 text-xs">{diadema?.numero_activo || 'Sin registrar'}</span>
                  </div>
                  <div>
                    <span className="text-2xs text-slate-400 block font-medium">Estado:</span>
                    <span className="text-slate-700">{diadema?.estado_actual || 'N/R'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pie con acciones */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onDelete(equipo)}
              className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Eliminar
            </button>
            <button
              type="button"
              onClick={() => onEdit(equipo)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              Editar
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <FileDown className="w-3.5 h-3.5" />
              Exportar Acta PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

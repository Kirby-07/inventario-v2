import React, { useState, useEffect } from 'react';
import { EquipoAllInOne, EstadoEquipo, Periferico } from '../types.ts';
import { ImageUploader } from './ImageUploader.tsx';
import { X, Save, Mouse, Keyboard, Headphones, Monitor, AlertCircle } from 'lucide-react';

interface EquipoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (equipoData: Partial<EquipoAllInOne>) => Promise<void>;
  equipoToEdit?: EquipoAllInOne | null;
}

const ESTADOS_DISPONIBLES: EstadoEquipo[] = [
  'Operativo',
  'En mantenimiento',
  'Dañado',
  'En bodega / Desuso',
];

const DEPARTAMENTOS_COMUNES = [
  'Sistemas e Infraestructura',
  'Contabilidad y Finanzas',
  'Recursos Humanos',
  'Comercial y Ventas',
  'Operaciones y Logística',
  'Dirección General',
  'Auditoría y Control',
  'Atención al Cliente',
];

export const EquipoFormModal: React.FC<EquipoFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  equipoToEdit,
}) => {
  const isEditing = Boolean(equipoToEdit && equipoToEdit.id);

  // Campos principales del PC All in One
  const [numeroActivo, setNumeroActivo] = useState('');
  const [marca, setMarca] = useState('');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [estadoActual, setEstadoActual] = useState<EstadoEquipo>('Operativo');
  const [responsable, setResponsable] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');
  const [notas, setNotas] = useState('');

  // Periféricos (únicamente Número de Activo y Estado según requerimientos)
  const [mouseData, setMouseData] = useState<Periferico>({
    tipo: 'Mouse',
    numero_activo: '',
    estado_actual: 'Operativo',
  });

  const [tecladoData, setTecladoData] = useState<Periferico>({
    tipo: 'Teclado',
    numero_activo: '',
    estado_actual: 'Operativo',
  });

  const [diademaData, setDiademaData] = useState<Periferico>({
    tipo: 'Diadema',
    numero_activo: '',
    estado_actual: 'Operativo',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (equipoToEdit) {
      setNumeroActivo(equipoToEdit.numero_activo || '');
      setMarca(equipoToEdit.marca || '');
      setNumeroSerie(equipoToEdit.numero_serie || '');
      setEstadoActual(equipoToEdit.estado_actual || 'Operativo');
      setResponsable(equipoToEdit.responsable || '');
      setDepartamento(equipoToEdit.departamento || '');
      setImagenUrl(equipoToEdit.imagen_url || '');
      setNotas(equipoToEdit.notas || '');

      const m = equipoToEdit.perifericos?.find((p) => p.tipo === 'Mouse');
      if (m) setMouseData({ ...m });
      else {
        setMouseData({
          tipo: 'Mouse',
          numero_activo: '',
          estado_actual: equipoToEdit.estado_actual || 'Operativo',
        });
      }

      const t = equipoToEdit.perifericos?.find((p) => p.tipo === 'Teclado');
      if (t) setTecladoData({ ...t });
      else {
        setTecladoData({
          tipo: 'Teclado',
          numero_activo: '',
          estado_actual: equipoToEdit.estado_actual || 'Operativo',
        });
      }

      const d = equipoToEdit.perifericos?.find((p) => p.tipo === 'Diadema');
      if (d) setDiademaData({ ...d });
      else {
        setDiademaData({
          tipo: 'Diadema',
          numero_activo: '',
          estado_actual: equipoToEdit.estado_actual || 'Operativo',
        });
      }
    } else {
      // Limpiar formulario para nuevo equipo
      setNumeroActivo('');
      setMarca('');
      setNumeroSerie('');
      setEstadoActual('Operativo');
      setResponsable('');
      setDepartamento('');
      setImagenUrl('');
      setNotas('');
      setMouseData({
        tipo: 'Mouse',
        numero_activo: '',
        estado_actual: 'Operativo',
      });
      setTecladoData({
        tipo: 'Teclado',
        numero_activo: '',
        estado_actual: 'Operativo',
      });
      setDiademaData({
        tipo: 'Diadema',
        numero_activo: '',
        estado_actual: 'Operativo',
      });
    }
    setErrorMsg(null);
  }, [equipoToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validar requeridos
    if (!numeroActivo.trim()) {
      setErrorMsg('El número de activo del PC All in One es obligatorio.');
      return;
    }
    if (!marca.trim()) {
      setErrorMsg('La marca del PC All in One es obligatoria.');
      return;
    }
    if (!numeroSerie.trim()) {
      setErrorMsg('El número de serie del PC All in One es obligatorio.');
      return;
    }
    if (!responsable.trim()) {
      setErrorMsg('El responsable o custodio del equipo es obligatorio.');
      return;
    }
    if (!departamento.trim()) {
      setErrorMsg('El departamento o área de asignación es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<EquipoAllInOne> = {
        numero_activo: numeroActivo.trim(),
        marca: marca.trim(),
        numero_serie: numeroSerie.trim(),
        estado_actual: estadoActual,
        responsable: responsable.trim(),
        departamento: departamento.trim(),
        imagen_url: imagenUrl,
        notas: notas.trim(),
        perifericos: [mouseData, tecladoData, diademaData],
      };

      await onSave(payload);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar los datos del equipo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[92vh] flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-800 text-white rounded-lg">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEditing ? 'Editar Equipo All-in-One' : 'Registrar Nuevo Equipo All-in-One'}
              </h2>
              <p className="text-xs text-slate-500">
                Inventario de equipo de cómputo y periféricos para auditoría interna
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

        {/* Cuerpo del formulario scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Sección 1: Datos de identificación del All-in-One */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-slate-600" />
                1. Datos de Identificación del PC All-in-One
              </h3>
              <span className="text-2xs text-slate-400 font-medium">Campos obligatorios *</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Número de Activo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: ACT-PC-1045"
                  value={numeroActivo}
                  onChange={(e) => setNumeroActivo(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-800 focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Marca *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: HP, Lenovo, Dell, ASUS"
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-800 focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Número de Serie *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: AIO-SN-9988123"
                  value={numeroSerie}
                  onChange={(e) => setNumeroSerie(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-800 focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Estado Actual *
                </label>
                <select
                  value={estadoActual}
                  onChange={(e) => setEstadoActual(e.target.value as EstadoEquipo)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-800 focus:border-slate-800 cursor-pointer"
                >
                  {ESTADOS_DISPONIBLES.map((est) => (
                    <option key={est} value={est}>
                      {est}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Responsable / Custodio *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nombre completo del empleado"
                  value={responsable}
                  onChange={(e) => setResponsable(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-800 focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Departamento / Área *
                </label>
                <input
                  type="text"
                  required
                  list="deptos-list"
                  placeholder="Ej: Contabilidad, Sistemas"
                  value={departamento}
                  onChange={(e) => setDepartamento(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-800 focus:border-slate-800"
                />
                <datalist id="deptos-list">
                  {DEPARTAMENTOS_COMUNES.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Notas y Observaciones de Auditoría (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ubicación física, piso, puesto de trabajo o condición específica"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-800 focus:border-slate-800"
              />
            </div>
          </div>

          {/* Sección 2: Periféricos vinculados (Mouse, Teclado, Diadema) */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-4">
            <div className="border-b border-slate-200/60 pb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Mouse className="w-3.5 h-3.5 text-slate-600" />
                2. Periféricos Asociados (Mouse, Teclado y Diadema)
              </h3>
              <p className="text-2xs text-slate-500 mt-0.5">
                Captura del número de activo y estado actual de cada periférico
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Mouse */}
              <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 border-b border-slate-100 pb-1.5">
                  <Mouse className="w-3.5 h-3.5 text-slate-600" />
                  Mouse
                </div>
                <div>
                  <label className="block text-2xs font-medium text-slate-600 mb-1">N° de Activo</label>
                  <input
                    type="text"
                    placeholder="Ej: ACT-MOU-2010"
                    value={mouseData.numero_activo}
                    onChange={(e) => setMouseData({ ...mouseData, numero_activo: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-medium text-slate-600 mb-1">Estado</label>
                  <select
                    value={mouseData.estado_actual}
                    onChange={(e) =>
                      setMouseData({ ...mouseData, estado_actual: e.target.value as EstadoEquipo })
                    }
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                  >
                    {ESTADOS_DISPONIBLES.map((est) => (
                      <option key={est} value={est}>
                        {est}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Teclado */}
              <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 border-b border-slate-100 pb-1.5">
                  <Keyboard className="w-3.5 h-3.5 text-slate-600" />
                  Teclado
                </div>
                <div>
                  <label className="block text-2xs font-medium text-slate-600 mb-1">N° de Activo</label>
                  <input
                    type="text"
                    placeholder="Ej: ACT-TEC-3010"
                    value={tecladoData.numero_activo}
                    onChange={(e) => setTecladoData({ ...tecladoData, numero_activo: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-medium text-slate-600 mb-1">Estado</label>
                  <select
                    value={tecladoData.estado_actual}
                    onChange={(e) =>
                      setTecladoData({ ...tecladoData, estado_actual: e.target.value as EstadoEquipo })
                    }
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                  >
                    {ESTADOS_DISPONIBLES.map((est) => (
                      <option key={est} value={est}>
                        {est}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Diadema */}
              <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 border-b border-slate-100 pb-1.5">
                  <Headphones className="w-3.5 h-3.5 text-slate-600" />
                  Diadema / Auricular
                </div>
                <div>
                  <label className="block text-2xs font-medium text-slate-600 mb-1">N° de Activo</label>
                  <input
                    type="text"
                    placeholder="Ej: ACT-DIA-4010"
                    value={diademaData.numero_activo}
                    onChange={(e) => setDiademaData({ ...diademaData, numero_activo: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-medium text-slate-600 mb-1">Estado</label>
                  <select
                    value={diademaData.estado_actual}
                    onChange={(e) =>
                      setDiademaData({ ...diademaData, estado_actual: e.target.value as EstadoEquipo })
                    }
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                  >
                    {ESTADOS_DISPONIBLES.map((est) => (
                      <option key={est} value={est}>
                        {est}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Sección 3: Evidencia Fotográfica */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
            <ImageUploader currentImage={imagenUrl} onImageChange={setImagenUrl} />
          </div>
        </form>

        {/* Pie del modal */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {isSubmitting ? 'Guardando en BD...' : isEditing ? 'Actualizar Equipo' : 'Guardar en Inventario'}
          </button>
        </div>
      </div>
    </div>
  );
};

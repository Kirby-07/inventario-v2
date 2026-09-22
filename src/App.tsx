/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { EquipoAllInOne, InventoryStats, DatabaseStatus } from './types.ts';
import { StatsOverview } from './components/StatsOverview.tsx';
import { EquipoFormModal } from './components/EquipoFormModal.tsx';
import { EquipoDetailModal } from './components/EquipoDetailModal.tsx';
import { DeleteConfirmModal } from './components/DeleteConfirmModal.tsx';
import { SqlExportModal } from './components/SqlExportModal.tsx';
import { DatabaseStatusModal } from './components/DatabaseStatusModal.tsx';
import { generateConsolidatedInventoryPdf, generateIndividualAuditPdf } from './utils/pdfGenerator.ts';
import {
  Monitor,
  Plus,
  FileDown,
  Database,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Mouse,
  Keyboard,
  Headphones,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building,
  User,
  Image as ImageIcon,
  Check,
} from 'lucide-react';

export default function App() {
  const [equipos, setEquipos] = useState<EquipoAllInOne[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros de búsqueda
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filtroDepartamento, setFiltroDepartamento] = useState<string>('Todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('Todos');

  // Modales
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingEquipo, setEditingEquipo] = useState<EquipoAllInOne | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedEquipo, setSelectedEquipo] = useState<EquipoAllInOne | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [equipoToDelete, setEquipoToDelete] = useState<EquipoAllInOne | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [isDbStatusModalOpen, setIsDbStatusModalOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [isCheckingDb, setIsCheckingDb] = useState(false);

  // Notificación tipo toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const fetchDbStatus = useCallback(async () => {
    setIsCheckingDb(true);
    try {
      const res = await fetch('/api/db/status');
      const data = await res.json();
      setDbStatus(data);
    } catch (err: any) {
      setDbStatus({
        engine: 'sqlite',
        status: 'error',
        isCloud: false,
        message: 'No se pudo consultar el estado del motor de base de datos.',
        error: err.message,
      });
    } finally {
      setIsCheckingDb(false);
    }
  }, []);

  // Carga de datos desde la API Express
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filtroDepartamento !== 'Todos') params.append('departamento', filtroDepartamento);
      if (filtroEstado !== 'Todos') params.append('estado', filtroEstado);

      const [equiposRes, statsRes] = await Promise.all([
        fetch(`/api/equipos?${params.toString()}`),
        fetch('/api/stats'),
      ]);

      if (!equiposRes.ok) throw new Error('Error al consultar lista de equipos.');
      if (!statsRes.ok) throw new Error('Error al consultar estadísticas de inventario.');

      const equiposData = await equiposRes.json();
      const statsData = await statsRes.json();

      setEquipos(equiposData);
      setStats(statsData);
    } catch (err: any) {
      console.error('Error cargando inventario:', err);
      setError(err.message || 'Error de conexión con el servidor Node.js');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, filtroDepartamento, filtroEstado]);

  useEffect(() => {
    fetchData();
    fetchDbStatus();
  }, [fetchData, fetchDbStatus]);

  // Manejador para guardar equipo (crear o actualizar)
  const handleSaveEquipo = async (equipoData: Partial<EquipoAllInOne>) => {
    if (editingEquipo && editingEquipo.id) {
      // Actualizar
      const res = await fetch(`/api/equipos/${editingEquipo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(equipoData),
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Error al actualizar equipo');
      }
      showToast(`Equipo ${equipoData.numero_activo} actualizado exitosamente.`);
    } else {
      // Crear
      const res = await fetch('/api/equipos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(equipoData),
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Error al registrar equipo');
      }
      showToast(`Equipo All-in-One ${equipoData.numero_activo} registrado en el inventario.`);
    }

    await fetchData();
  };

  // Manejador para eliminar equipo
  const handleConfirmDelete = async () => {
    if (!equipoToDelete || !equipoToDelete.id) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/equipos/${equipoToDelete.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Error al eliminar equipo');
      }
      showToast(`Equipo ${equipoToDelete.numero_activo} y sus periféricos fueron eliminados.`);
      setIsDeleteModalOpen(false);
      setEquipoToDelete(null);
      if (selectedEquipo?.id === equipoToDelete.id) {
        setIsDetailModalOpen(false);
      }
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar');
    } finally {
      setIsDeleting(false);
    }
  };

  // Acciones rápidas de modales
  const openCreateModal = () => {
    setEditingEquipo(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (eq: EquipoAllInOne) => {
    setEditingEquipo(eq);
    setIsDetailModalOpen(false);
    setIsFormModalOpen(true);
  };

  const openDetailModal = (eq: EquipoAllInOne) => {
    setSelectedEquipo(eq);
    setIsDetailModalOpen(true);
  };

  const openDeleteModal = (eq: EquipoAllInOne) => {
    setEquipoToDelete(eq);
    setIsDeleteModalOpen(true);
  };

  // Exportar reporte consolidado en PDF
  const handleExportConsolidatedPdf = () => {
    generateConsolidatedInventoryPdf(equipos, stats || undefined, filtroDepartamento, filtroEstado);
    showToast('Reporte consolidado de auditoría generado en PDF.');
  };

  // Departamentos únicos para el filtro
  const departamentosDisponibles = Array.from(
    new Set([
      'Sistemas e Infraestructura',
      'Contabilidad y Finanzas',
      'Recursos Humanos',
      'Comercial y Ventas',
      'Operaciones y Logística',
      'Dirección General',
      ...(stats ? Object.keys(stats.departamentosCount) : []),
    ])
  ).sort();

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-800 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 text-xs font-medium border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header de la Aplicación */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-xs">
                <Monitor className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  Inventario de Equipos All in One
                </h1>
                <p className="text-2xs sm:text-xs text-slate-500">
                  Control de cómputo y periféricos (mouse, teclado y diadema) para auditoría interna
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Botón de Validación de Base de Datos */}
              <button
                type="button"
                onClick={() => {
                  fetchDbStatus();
                  setIsDbStatusModalOpen(true);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border shadow-2xs ${
                  dbStatus?.status === 'connected'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    : dbStatus?.status === 'error'
                    ? 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                    : 'bg-indigo-50 text-indigo-800 border-indigo-300 hover:bg-indigo-100'
                }`}
                title="Comprobar estado de conexión con la base de datos (Aiven / SQLite)"
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  dbStatus?.status === 'connected'
                    ? 'bg-emerald-500 animate-pulse'
                    : dbStatus?.status === 'error'
                    ? 'bg-rose-500'
                    : 'bg-indigo-500'
                }`} />
                <span>
                  {dbStatus?.status === 'connected'
                    ? 'BD: MySQL Conectada'
                    : dbStatus?.status === 'error'
                    ? 'BD: Error de Conexión'
                    : 'BD: SQLite Local'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsSqlModalOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title="Ver o descargar script relacional MariaDB / MySQL"
              >
                <Database className="w-3.5 h-3.5 text-slate-600" />
                Script MariaDB
              </button>

              <button
                type="button"
                onClick={handleExportConsolidatedPdf}
                disabled={equipos.length === 0}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                title="Generar reporte completo de auditoría en formato PDF"
              >
                <FileDown className="w-3.5 h-3.5 text-slate-700" />
                Reporte PDF
              </button>

              <button
                type="button"
                onClick={openCreateModal}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Nuevo Equipo All-in-One
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Resumen de Métricas */}
        <StatsOverview
          stats={stats}
          onFilterStatus={(st) => setFiltroEstado(st)}
          selectedStatus={filtroEstado}
        />

        {/* Barra de Búsqueda y Filtros */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs mb-5">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            {/* Buscador */}
            <div className="sm:col-span-6 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por activo, marca, número de serie, responsable o departamento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-800"
              />
            </div>

            {/* Filtro por Departamento */}
            <div className="sm:col-span-3">
              <select
                value={filtroDepartamento}
                onChange={(e) => setFiltroDepartamento(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-800 cursor-pointer"
              >
                <option value="Todos">Todos los Departamentos</option>
                {departamentosDisponibles.map((dep) => (
                  <option key={dep} value={dep}>
                    {dep}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Estado */}
            <div className="sm:col-span-2">
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-800 cursor-pointer"
              >
                <option value="Todos">Todos los Estados</option>
                <option value="Operativo">Operativo</option>
                <option value="En mantenimiento">En mantenimiento</option>
                <option value="Dañado">Dañado</option>
                <option value="En bodega / Desuso">En bodega / Desuso</option>
              </select>
            </div>

            {/* Botón Refrescar / Limpiar */}
            <div className="sm:col-span-1 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setFiltroDepartamento('Todos');
                  setFiltroEstado('Todos');
                  fetchData();
                }}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                title="Limpiar filtros y recargar"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-2xs text-slate-500">
            <span>
              Mostrando <strong className="text-slate-800">{equipos.length}</strong> equipos de cómputo All-in-One registrados
            </span>
            {(searchTerm || filtroDepartamento !== 'Todos' || filtroEstado !== 'Todos') && (
              <span className="text-amber-700 font-medium">
                Filtros activos: {searchTerm && `"${searchTerm}" `}
                {filtroDepartamento !== 'Todos' && `• Depto: ${filtroDepartamento} `}
                {filtroEstado !== 'Todos' && `• Estado: ${filtroEstado}`}
              </span>
            )}
          </div>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div className="flex-1">
              <strong className="block font-semibold">Error al cargar datos</strong>
              <span>{error}</span>
            </div>
            <button
              onClick={fetchData}
              className="px-3 py-1 bg-white border border-rose-300 rounded-md text-rose-800 font-semibold text-2xs hover:bg-rose-100"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Tabla Principal de Equipos All in One */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          {isLoading && equipos.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-slate-400" />
              <p className="text-xs">Cargando base de datos de inventario...</p>
            </div>
          ) : equipos.length === 0 ? (
            <div className="py-16 text-center">
              <Monitor className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <h3 className="text-sm font-bold text-slate-800 mb-1">No se encontraron equipos</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                No hay equipos All-in-One que coincidan con los criterios de búsqueda o el inventario está vacío.
              </p>
              <button
                type="button"
                onClick={openCreateModal}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer shadow-xs inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Registrar Primer Equipo
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-2xs uppercase tracking-wider font-bold text-slate-600">
                    <th className="py-3 px-4">Evidencia</th>
                    <th className="py-3 px-4">N° de Activo</th>
                    <th className="py-3 px-4">Equipo All-in-One</th>
                    <th className="py-3 px-4">Responsable y Depto</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4">Periféricos Vinculados</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {equipos.map((equipo) => {
                    const mouse = equipo.perifericos?.find((p) => p.tipo === 'Mouse');
                    const teclado = equipo.perifericos?.find((p) => p.tipo === 'Teclado');
                    const diadema = equipo.perifericos?.find((p) => p.tipo === 'Diadema');

                    return (
                      <tr
                        key={equipo.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* Miniatura de imagen */}
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => openDetailModal(equipo)}
                            className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 cursor-pointer hover:ring-2 hover:ring-slate-800 transition-all"
                            title="Ver fotografía y ficha completa"
                          >
                            {equipo.imagen_url ? (
                              <img
                                src={equipo.imagen_url}
                                alt={equipo.numero_activo}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-slate-300" />
                            )}
                          </button>
                        </td>

                        {/* N° de Activo */}
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block font-mono">
                            {equipo.numero_activo}
                          </span>
                          <span className="text-2xs text-slate-400">
                            ID: #{equipo.id}
                          </span>
                        </td>

                        {/* Marca y Serie */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">
                            {equipo.marca} All-in-One
                          </div>
                          <div className="text-2xs text-slate-500 font-mono">
                            S/N: {equipo.numero_serie}
                          </div>
                        </td>

                        {/* Responsable y Departamento */}
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800 flex items-center gap-1.5 flex-wrap">
                            <span className="flex items-center gap-1.5">
                              <User className="w-3 h-3 text-slate-400" />
                              {equipo.responsable}
                            </span>
                            {equipo.cc && (
                              <span className="inline-flex items-center text-3xs font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                                CC: {equipo.cc}
                              </span>
                            )}
                          </div>
                          <div className="text-2xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <Building className="w-3 h-3 text-slate-400" />
                            {equipo.departamento}
                          </div>
                        </td>

                        {/* Estado */}
                        <td className="py-3 px-4">
                          {equipo.estado_actual === 'Operativo' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Operativo
                            </span>
                          ) : equipo.estado_actual === 'En mantenimiento' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              En mantenimiento
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              {equipo.estado_actual}
                            </span>
                          )}
                        </td>

                        {/* Periféricos */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Mouse badge */}
                            <div
                              className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded-md text-2xs text-slate-700"
                              title={`Mouse | Activo: ${mouse?.numero_activo || 'Sin registrar'} | Estado: ${mouse?.estado_actual || 'N/R'}`}
                            >
                              <Mouse className="w-3 h-3 text-slate-600" />
                              <span className="font-medium">{mouse?.numero_activo || 'S/A'}</span>
                              <span className="text-3xs text-slate-400">({mouse?.estado_actual ? mouse.estado_actual.slice(0, 3) : 'N/R'})</span>
                            </div>

                            {/* Teclado badge */}
                            <div
                              className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded-md text-2xs text-slate-700"
                              title={`Teclado | Activo: ${teclado?.numero_activo || 'Sin registrar'} | Estado: ${teclado?.estado_actual || 'N/R'}`}
                            >
                              <Keyboard className="w-3 h-3 text-slate-600" />
                              <span className="font-medium">{teclado?.numero_activo || 'S/A'}</span>
                              <span className="text-3xs text-slate-400">({teclado?.estado_actual ? teclado.estado_actual.slice(0, 3) : 'N/R'})</span>
                            </div>

                            {/* Diadema badge */}
                            <div
                              className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded-md text-2xs text-slate-700"
                              title={`Diadema | Activo: ${diadema?.numero_activo || 'Sin registrar'} | Estado: ${diadema?.estado_actual || 'N/R'}`}
                            >
                              <Headphones className="w-3 h-3 text-slate-600" />
                              <span className="font-medium">{diadema?.numero_activo || 'S/A'}</span>
                              <span className="text-3xs text-slate-400">({diadema?.estado_actual ? diadema.estado_actual.slice(0, 3) : 'N/R'})</span>
                            </div>
                          </div>
                        </td>

                        {/* Acciones */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openDetailModal(equipo)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                              title="Ver ficha completa de auditoría"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => generateIndividualAuditPdf(equipo)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                              title="Exportar Acta de Auditoría en PDF"
                            >
                              <FileDown className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => openEditModal(equipo)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                              title="Editar equipo y periféricos"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => openDeleteModal(equipo)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                              title="Eliminar equipo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Footer informativo */}
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-2xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Sistema de Inventario de Cómputo All-in-One • Base de Datos Relacional SQLite / MariaDB
          </span>
          <span className="text-slate-400">
            Node.js Express REST API • Exportación oficial para Auditoría Interna TI
          </span>
        </div>
      </footer>

      {/* Modales */}
      <EquipoFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveEquipo}
        equipoToEdit={editingEquipo}
      />

      <EquipoDetailModal
        isOpen={isDetailModalOpen}
        equipo={selectedEquipo}
        onClose={() => setIsDetailModalOpen(false)}
        onEdit={(eq) => openEditModal(eq)}
        onDelete={(eq) => openDeleteModal(eq)}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        equipo={equipoToDelete}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      <SqlExportModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
      />

      <DatabaseStatusModal
        isOpen={isDbStatusModalOpen}
        onClose={() => setIsDbStatusModalOpen(false)}
        status={dbStatus}
        isLoading={isCheckingDb}
        onRefresh={fetchDbStatus}
      />
    </div>
  );
}

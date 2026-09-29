import * as XLSX from 'xlsx';
import { EquipoAllInOne, InventoryStats } from '../types.ts';

/**
 * Prepara las filas de datos estandarizadas para exportar a Excel y CSV
 */
function prepareExportRows(equipos: EquipoAllInOne[]) {
  return equipos.map((eq, index) => {
    const mouse = eq.perifericos?.find((p) => p.tipo === 'Mouse');
    const teclado = eq.perifericos?.find((p) => p.tipo === 'Teclado');
    const diadema = eq.perifericos?.find((p) => p.tipo === 'Diadema');

    return {
      'Ítem': index + 1,
      'N° Activo PC (All-in-One)': eq.numero_activo,
      'Marca': eq.marca,
      'Número de Serie': eq.numero_serie,
      'Estado del Equipo': eq.estado_actual,
      'Responsable / Custodio': eq.responsable,
      'Cédula de Ciudadanía (CC)': eq.cc || 'No registrada',
      'Departamento / Área': eq.departamento,
      'Mouse - N° Activo': mouse?.numero_activo || 'Sin asignar',
      'Mouse - Estado': mouse?.estado_actual || 'N/R',
      'Teclado - N° Activo': teclado?.numero_activo || 'Sin asignar',
      'Teclado - Estado': teclado?.estado_actual || 'N/R',
      'Diadema - N° Activo': diadema?.numero_activo || 'Sin asignar',
      'Diadema - Estado': diadema?.estado_actual || 'N/R',
      'Notas / Ubicación': eq.notas || 'Sin observaciones',
      'Fecha Registro': eq.created_at || '',
    };
  });
}

/**
 * Exporta el reporte de inventario general a formato XLSX (Excel)
 */
export function exportInventoryToXLSX(
  equipos: EquipoAllInOne[],
  stats?: InventoryStats,
  filtroDepto?: string,
  filtroEstado?: string
) {
  const wb = XLSX.utils.book_new();

  // Hoja 1: Inventario Detallado de Equipos y Periféricos
  const dataRows = prepareExportRows(equipos);
  const wsInventario = XLSX.utils.json_to_sheet(dataRows);

  // Configurar anchos de columna óptimos
  wsInventario['!cols'] = [
    { wch: 6 },  // Ítem
    { wch: 24 }, // N° Activo PC
    { wch: 14 }, // Marca
    { wch: 22 }, // Número de Serie
    { wch: 20 }, // Estado del Equipo
    { wch: 28 }, // Responsable
    { wch: 22 }, // CC
    { wch: 26 }, // Departamento
    { wch: 20 }, // Mouse Activo
    { wch: 15 }, // Mouse Estado
    { wch: 20 }, // Teclado Activo
    { wch: 15 }, // Teclado Estado
    { wch: 20 }, // Diadema Activo
    { wch: 15 }, // Diadema Estado
    { wch: 35 }, // Notas
    { wch: 20 }, // Fecha Registro
  ];

  XLSX.utils.book_append_sheet(wb, wsInventario, 'Inventario All-in-One');

  // Hoja 2: Resumen Ejecutivo y Métricas
  const totalOp = stats ? stats.operativos : equipos.filter((e) => e.estado_actual === 'Operativo').length;
  const totalMant = stats ? stats.enMantenimiento : equipos.filter((e) => e.estado_actual === 'En mantenimiento').length;
  const totalDan = stats ? stats.danados : equipos.filter((e) => e.estado_actual === 'Dañado').length;
  const totalBod = stats ? stats.enBodega : equipos.filter((e) => e.estado_actual.includes('bodega') || e.estado_actual.includes('Desuso')).length;

  const summaryData = [
    { 'Métrica / Parámetro': 'Sistema', 'Valor': 'Auditoría TI - Equipos All-in-One' },
    { 'Métrica / Parámetro': 'Fecha de Generación', 'Valor': new Date().toLocaleString('es-CO') },
    { 'Métrica / Parámetro': 'Filtro Departamento', 'Valor': filtroDepto || 'Todos' },
    { 'Métrica / Parámetro': 'Filtro Estado', 'Valor': filtroEstado || 'Todos' },
    { 'Métrica / Parámetro': '', 'Valor': '' },
    { 'Métrica / Parámetro': 'TOTAL EQUIPOS AUDITADOS', 'Valor': equipos.length },
    { 'Métrica / Parámetro': 'Equipos Operativos', 'Valor': totalOp },
    { 'Métrica / Parámetro': 'Equipos En Mantenimiento', 'Valor': totalMant },
    { 'Métrica / Parámetro': 'Equipos Dañados', 'Valor': totalDan },
    { 'Métrica / Parámetro': 'Equipos En Bodega / Desuso', 'Valor': totalBod },
  ];

  const wsResumen = XLSX.utils.json_to_sheet(summaryData);
  wsResumen['!cols'] = [{ wch: 30 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen Auditoría');

  // Guardar archivo
  const fechaStr = new Date().toISOString().slice(0, 10);
  const filename = `Reporte_Inventario_AllInOne_${fechaStr}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Exporta el reporte de inventario general a formato CSV con codificación UTF-8 con BOM
 */
export function exportInventoryToCSV(
  equipos: EquipoAllInOne[],
  filtroDepto?: string,
  filtroEstado?: string
) {
  const dataRows = prepareExportRows(equipos);
  const ws = XLSX.utils.json_to_sheet(dataRows);
  
  // Generar cadena CSV
  const csvContent = XLSX.utils.sheet_to_csv(ws, { FS: ';' }); // Usar ';' compatible con Excel hispanohablante
  
  // Agregar BOM (Byte Order Mark) \uFEFF para que Excel abra caracteres especiales (ñ, tildes) en UTF-8 sin dañarlos
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const fechaStr = new Date().toISOString().slice(0, 10);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Reporte_Inventario_AllInOne_${fechaStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

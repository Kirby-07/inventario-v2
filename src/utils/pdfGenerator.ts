import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { EquipoAllInOne, InventoryStats } from '../types.ts';

// Extensión para typescript con jspdf-autotable
type jsPDFWithAutoTable = jsPDF & {
  lastAutoTable?: {
    finalY: number;
  };
};

/**
 * Genera la Ficha Técnica Individual de Auditoría Interna para un All-in-One
 */
export function generateIndividualAuditPdf(equipo: EquipoAllInOne) {
  const doc = new jsPDF() as jsPDFWithAutoTable;
  const pageWidth = doc.internal.pageSize.getWidth();

  // Encabezado institucional
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('ACTA DE AUDITORÍA Y CONTROL DE INVENTARIO TI', 14, 13);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Equipos de Cómputo All-in-One y Periféricos | Folio: ${equipo.numero_activo}`, 14, 21);

  const fechaHoy = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  doc.text(`Fecha de emisión: ${fechaHoy}`, pageWidth - 14, 21, { align: 'right' });

  // Cuadro resumen de identificación del All-in-One
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Identificación del Equipo Principal (All-in-One)', 14, 38);

  const startY = 43;
  const colWidth = (pageWidth - 28) / 2;

  // Fondo sutil para tarjeta de datos
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, startY, pageWidth - 28, 52, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('N° de Activo Fijo:', 18, startY + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(equipo.numero_activo, 55, startY + 8);

  doc.setFont('helvetica', 'bold');
  doc.text('Marca All-in-One:', 18, startY + 16);
  doc.setFont('helvetica', 'normal');
  doc.text(equipo.marca, 55, startY + 16);

  doc.setFont('helvetica', 'bold');
  doc.text('Número de Serie:', 18, startY + 24);
  doc.setFont('helvetica', 'normal');
  doc.text(equipo.numero_serie, 55, startY + 24);

  doc.setFont('helvetica', 'bold');
  doc.text('Estado Actual:', 18, startY + 32);
  doc.setFont('helvetica', 'normal');
  doc.text(equipo.estado_actual, 55, startY + 32);

  // Columna 2: Asignación
  doc.setFont('helvetica', 'bold');
  doc.text('Responsable / Custodio:', 18 + colWidth, startY + 8);
  doc.setFont('helvetica', 'normal');
  const responsableTexto = equipo.cc ? `${equipo.responsable} (CC: ${equipo.cc})` : equipo.responsable;
  doc.text(responsableTexto, 18 + colWidth + 42, startY + 8);

  doc.setFont('helvetica', 'bold');
  doc.text('Departamento / Área:', 18 + colWidth, startY + 16);
  doc.setFont('helvetica', 'normal');
  doc.text(equipo.departamento, 18 + colWidth + 42, startY + 16);

  doc.setFont('helvetica', 'bold');
  doc.text('Fecha Registro:', 18 + colWidth, startY + 24);
  doc.setFont('helvetica', 'normal');
  doc.text(equipo.created_at || fechaHoy, 18 + colWidth + 42, startY + 24);

  doc.setFont('helvetica', 'bold');
  doc.text('Observaciones:', 18 + colWidth, startY + 32);
  doc.setFont('helvetica', 'normal');
  const notasTexto = equipo.notas ? equipo.notas.substring(0, 50) : 'Sin observaciones adicionales';
  doc.text(notasTexto, 18 + colWidth + 42, startY + 32);

  // Sección 2: Tabla de Periféricos vinculados
  let currentY = startY + 60;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('2. Periféricos Asignados al Equipo', 14, currentY);

  const perifericosRows = (equipo.perifericos || []).map((p) => [
    p.tipo,
    p.numero_activo || 'Sin registrar',
    p.estado_actual || 'N/A',
  ]);

  autoTable(doc, {
    startY: currentY + 4,
    head: [['Periférico', 'N° Activo', 'Estado Actual']],
    body: perifericosRows.length > 0 ? perifericosRows : [
      ['Mouse', 'No registrado', 'N/A'],
      ['Teclado', 'No registrado', 'N/A'],
      ['Diadema', 'No registrado', 'N/A'],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [51, 65, 85],
    },
    styles: {
      cellPadding: 3,
    },
    margin: { left: 14, right: 14 },
  });

  currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : currentY + 35;

  // Sección 3: Fotografía e Inspección Visual
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('3. Registro Fotográfico de Evidencia', 14, currentY);
  currentY += 4;

  if (equipo.imagen_url && equipo.imagen_url.startsWith('data:image')) {
    try {
      // Dibujar imagen centrada o acotada
      const imgWidth = 70;
      const imgHeight = 50;
      doc.setDrawColor(203, 213, 225);
      doc.rect(14, currentY, imgWidth + 4, imgHeight + 4, 'S');
      doc.addImage(equipo.imagen_url, 'JPEG', 16, currentY + 2, imgWidth, imgHeight);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 116, 139);
      doc.text('Fotografía capturada durante el levantamiento de inventario.', 92, currentY + 12);
      doc.text(`Identificador de equipo All-in-One: ${equipo.numero_activo}`, 92, currentY + 18);
      doc.text(`Estado físico reportado: ${equipo.estado_actual}`, 92, currentY + 24);
      currentY += imgHeight + 10;
    } catch (e) {
      console.warn('No se pudo incrustar imagen en PDF:', e);
      renderNoImagePlaceholder(doc, currentY);
      currentY += 28;
    }
  } else {
    renderNoImagePlaceholder(doc, currentY);
    currentY += 28;
  }

  // Sección 4: Firmas de Conformidad y Auditoría
  if (currentY > 230) {
    doc.addPage();
    currentY = 25;
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('4. Firmas de Conformidad y Recepción', 14, currentY);

  const sigBoxY = currentY + 18;
  const sigBoxWidth = (pageWidth - 40) / 2;

  // Firma 1: Auditor
  doc.setDrawColor(148, 163, 184);
  doc.line(20, sigBoxY, 20 + sigBoxWidth, sigBoxY);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Auditor Interno de Inventario TI', 20 + sigBoxWidth / 2, sigBoxY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Firma y Cédula Profesional', 20 + sigBoxWidth / 2, sigBoxY + 10, { align: 'center' });

  // Firma 2: Responsable
  const sig2X = 20 + sigBoxWidth + 14;
  doc.line(sig2X, sigBoxY, sig2X + sigBoxWidth, sigBoxY);
  doc.setFont('helvetica', 'bold');
  doc.text(`Custodio: ${equipo.responsable}`, sig2X + sigBoxWidth / 2, sigBoxY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  const dptoCc = equipo.cc ? `C.C. ${equipo.cc} | Dpto: ${equipo.departamento}` : `Dpto: ${equipo.departamento}`;
  doc.text(dptoCc, sig2X + sigBoxWidth / 2, sigBoxY + 10, { align: 'center' });

  // Guardar archivo
  const safeFilename = `Acta_Auditoria_${equipo.numero_activo.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
  doc.save(safeFilename);
}

function renderNoImagePlaceholder(doc: jsPDF, y: number) {
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, 180, 20, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(148, 163, 184);
  doc.text('Sin imagen adjunta registrada en el sistema.', 20, y + 11);
}

/**
 * Genera el Reporte Consolidado de Inventario en PDF para Auditoría General
 */
export function generateConsolidatedInventoryPdf(
  equipos: EquipoAllInOne[],
  stats?: InventoryStats,
  filtroDepto?: string,
  filtroEstado?: string
) {
  const doc = new jsPDF({ orientation: 'landscape' }) as jsPDFWithAutoTable;
  const pageWidth = doc.internal.pageSize.getWidth();

  // Encabezado
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE CONSOLIDADO DE INVENTARIO - AUDITORÍA INTERNA TI', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const fechaHoy = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Generado: ${fechaHoy} | Total Equipos All-in-One: ${equipos.length}`, 14, 20);

  let filtroTxt = 'Filtros aplicados: Ninguno (Inventario Completo)';
  if (filtroDepto && filtroDepto !== 'Todos') filtroTxt = `Departamento: ${filtroDepto}`;
  if (filtroEstado && filtroEstado !== 'Todos') filtroTxt += ` | Estado: ${filtroEstado}`;
  doc.text(filtroTxt, pageWidth - 14, 20, { align: 'right' });

  // Resumen métrico
  const totalOp = stats ? stats.operativos : equipos.filter((e) => e.estado_actual === 'Operativo').length;
  const totalMant = stats ? stats.enMantenimiento : equipos.filter((e) => e.estado_actual === 'En mantenimiento').length;
  const totalDan = stats ? stats.danados : equipos.filter((e) => e.estado_actual === 'Dañado').length;
  const totalBod = stats ? stats.enBodega : equipos.filter((e) => e.estado_actual.includes('bodega') || e.estado_actual.includes('Desuso')).length;

  doc.setFillColor(241, 245, 249);
  doc.rect(14, 30, pageWidth - 28, 12, 'F');

  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.text(`Resumen:`, 18, 38);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total: ${equipos.length}`, 40, 38);
  doc.text(`Operativos: ${totalOp}`, 70, 38);
  doc.text(`En Mantenimiento: ${totalMant}`, 110, 38);
  doc.text(`Dañados: ${totalDan}`, 160, 38);
  doc.text(`En Bodega/Desuso: ${totalBod}`, 195, 38);

  // Tabla consolidada
  const tableRows = equipos.map((eq) => {
    const mouse = eq.perifericos?.find((p) => p.tipo === 'Mouse');
    const teclado = eq.perifericos?.find((p) => p.tipo === 'Teclado');
    const diadema = eq.perifericos?.find((p) => p.tipo === 'Diadema');

    const formatoPer = (p?: typeof mouse) => {
      if (!p || !p.numero_activo) return 'Sin registrar';
      return `Activo: ${p.numero_activo} (${p.estado_actual || 'N/R'})`;
    };

    return [
      eq.numero_activo,
      eq.marca,
      eq.numero_serie,
      eq.estado_actual,
      eq.cc ? `${eq.responsable}\n(CC: ${eq.cc})` : eq.responsable,
      eq.departamento,
      formatoPer(mouse),
      formatoPer(teclado),
      formatoPer(diadema),
    ];
  });

  autoTable(doc, {
    startY: 46,
    head: [
      [
        'N° Activo PC',
        'Marca',
        'N° Serie PC',
        'Estado',
        'Responsable',
        'Departamento',
        'Mouse Asignado',
        'Teclado Asignado',
        'Diadema Asignada',
      ],
    ],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    styles: {
      cellPadding: 2.5,
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 18 },
      2: { cellWidth: 28 },
      3: { cellWidth: 24 },
      4: { cellWidth: 32 },
      5: { cellWidth: 32 },
      6: { cellWidth: 36 },
      7: { cellWidth: 36 },
      8: { cellWidth: 36 },
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Pie de página con numeración
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Página ${doc.internal.pages.length - 1} | Documento Oficial de Auditoría TI - Confidencial`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      );
    },
  });

  doc.save(`Inventario_Auditoria_Consolidado_${new Date().toISOString().slice(0, 10)}.pdf`);
}

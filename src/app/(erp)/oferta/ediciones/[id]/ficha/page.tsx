import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/permissions';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import PrintButton from '@/app/(erp)/matriculas/[id]/ficha/PrintButton';
import { BrusbenPdfHeader, BrusbenPdfFooter } from '@/components/ui/BrusbenPdfLayout';
import { format } from 'date-fns';

export const metadata = {
  title: 'Horario Académico en Cuadrícula Horizontal - ERP Brusben'
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const COLUMNAS_DIAS = [
  { key: 'LUNES', label: 'LUNES', short: 'LUN' },
  { key: 'MARTES', label: 'MARTES', short: 'MAR' },
  { key: 'MIERCOLES', label: 'MIÉRCOLES', short: 'MIÉ' },
  { key: 'JUEVES', label: 'JUEVES', short: 'JUE' },
  { key: 'VIERNES', label: 'VIERNES', short: 'VIE' },
  { key: 'SABADO', label: 'SÁBADO', short: 'SÁB' },
] as const;

const ORDEN_DIAS: Record<string, number> = {
  LUNES: 1,
  MARTES: 2,
  MIERCOLES: 3,
  JUEVES: 4,
  VIERNES: 5,
  SABADO: 6,
};

// 15 Bloques Horarios de 1 hora: desde 07:00 hasta 22:00
const BLOQUES_HORARIOS = [
  { start: 7, label: '07:00 - 08:00', inicio: '07:00', fin: '08:00' },
  { start: 8, label: '08:00 - 09:00', inicio: '08:00', fin: '09:00' },
  { start: 9, label: '09:00 - 10:00', inicio: '09:00', fin: '10:00' },
  { start: 10, label: '10:00 - 11:00', inicio: '10:00', fin: '11:00' },
  { start: 11, label: '11:00 - 12:00', inicio: '11:00', fin: '12:00' },
  { start: 12, label: '12:00 - 13:00', inicio: '12:00', fin: '13:00' },
  { start: 13, label: '13:00 - 14:00', inicio: '13:00', fin: '14:00' },
  { start: 14, label: '14:00 - 15:00', inicio: '14:00', fin: '15:00' },
  { start: 15, label: '15:00 - 16:00', inicio: '15:00', fin: '16:00' },
  { start: 16, label: '16:00 - 17:00', inicio: '16:00', fin: '17:00' },
  { start: 17, label: '17:00 - 18:00', inicio: '17:00', fin: '18:00' },
  { start: 18, label: '18:00 - 19:00', inicio: '18:00', fin: '19:00' },
  { start: 19, label: '19:00 - 20:00', inicio: '19:00', fin: '20:00' },
  { start: 20, label: '20:00 - 21:00', inicio: '20:00', fin: '21:00' },
  { start: 21, label: '21:00 - 22:00', inicio: '21:00', fin: '22:00' },
];

const parseHour = (timeStr?: string | null): number => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  return parseInt(parts[0], 10) || 0;
};

export default async function FichaEdicionPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  await requirePermission(['PROGRAMAS.VER', 'PROGRAMAS.EDITAR', 'MATRICULAS.VER', 'SISTEMA.ADMINISTRAR']);
  const supabase = await createClient();
  const resolvedParams = await params;
  const rawId = decodeURIComponent(resolvedParams.id || '').trim();

  if (!rawId) {
    notFound();
  }

  const isUuid = UUID_REGEX.test(rawId);

  // 1. Obtener datos de la edición y sus relaciones académicas
  const edicionQuery = supabase
    .from('ediciones')
    .select(`
      *,
      programas (codigo, nombre, tipo_programa),
      planes_estudio (codigo, nombre, version),
      periodos (codigo, nombre, fecha_inicio, fecha_fin),
      ciclos (id, nombre, numero_orden)
    `);

  const { data: edicion, error: edicionError } = await (
    isUuid
      ? edicionQuery.eq('id', rawId)
      : edicionQuery.eq('codigo', rawId.toUpperCase())
  ).maybeSingle();

  if (edicionError) {
    console.error('[FichaEdicion] Error al obtener edición:', edicionError);
    throw new Error(`Error al consultar la edición académica: ${edicionError.message}`);
  }

  if (!edicion) {
    notFound();
  }

  const warnings: string[] = [];

  const programa = Array.isArray(edicion.programas) ? edicion.programas[0] : edicion.programas;
  const plan = Array.isArray(edicion.planes_estudio) ? edicion.planes_estudio[0] : edicion.planes_estudio;
  const periodo = Array.isArray(edicion.periodos) ? edicion.periodos[0] : edicion.periodos;
  const ciclo = Array.isArray(edicion.ciclos) ? edicion.ciclos[0] : edicion.ciclos;

  // 2. Obtener horarios asignados a la edición
  const { data: horariosRaw, error: horariosError } = await supabase
    .from('horarios')
    .select(`
      id,
      dia_semana,
      hora_inicio,
      hora_fin,
      ubicacion,
      docente,
      observaciones,
      status,
      cursos (codigo, nombre, creditos, horas_semanales)
    `)
    .eq('edicion_id', edicion.id)
    .order('hora_inicio', { ascending: true });

  if (horariosError) {
    console.error('[FichaEdicion] Error al obtener horarios:', horariosError);
    warnings.push(`No se pudieron cargar los horarios de la edición (${horariosError.message}).`);
  }

  const horarios = (horariosRaw || []).sort((a, b) => {
    const diaA = ORDEN_DIAS[a.dia_semana || ''] || 99;
    const diaB = ORDEN_DIAS[b.dia_semana || ''] || 99;
    if (diaA !== diaB) return diaA - diaB;
    return (a.hora_inicio || '').localeCompare(b.hora_inicio || '');
  });

  // 3. Mapear sesiones a la matriz horaria completa (07:00 a 22:00)
  const cellMap: Record<string, { sesion: typeof horarios[0]; duration: number } | null> = {};
  const coveredMap: Record<string, boolean> = {};

  for (const h of horarios) {
    const dia = (h.dia_semana || '').toUpperCase().trim();
    const startHour = parseHour(h.hora_inicio);
    const endHour = parseHour(h.hora_fin);

    if (startHour >= 7 && startHour < 22) {
      const duration = Math.max(1, endHour - startHour);
      const startKey = `${dia}_${startHour}`;
      cellMap[startKey] = { sesion: h, duration };

      // Marcar las horas cubiertas subsecuentes para no renderizar td duplicado
      for (let nextHour = startHour + 1; nextHour < Math.min(22, startHour + duration); nextHour++) {
        coveredMap[`${dia}_${nextHour}`] = true;
      }
    }
  }

  return (
    <div
      className="max-w-7xl mx-auto p-6 bg-white text-slate-900 print:p-0 print:m-0 print:max-w-none print:min-h-0"
      style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
    >
      {/* Configuración de página horizontal (Landscape) al imprimir */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* Barra superior de acciones (no imprimible) */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6 print:hidden no-print border-b border-slate-200 pb-4">
        <Link
          href={`/oferta/ediciones/${edicion.id}`}
          className="text-slate-600 hover:text-[#AD0000] font-semibold text-sm flex items-center gap-2 transition"
        >
          ← Volver a la Gestión de Horarios del Grupo ({edicion.codigo})
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-md">
            Formato: A4 Horizontal (Cuadrícula Semanal)
          </span>
          <PrintButton label="Descargar / Imprimir Horario PDF" />
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="mb-6 p-4 rounded-md bg-amber-50 border-l-4 border-amber-600 text-amber-950 print:hidden no-print">
          <div className="font-bold text-sm mb-1">Aviso de diagnóstico de datos</div>
          <ul className="list-disc list-inside text-xs space-y-1">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Hoja Imprimible A4 Horizontal */}
      <div className="print:block border-2 border-slate-200 p-6 sm:p-8 rounded-xl print:border-none print:p-0 print:shadow-none">
        <BrusbenPdfHeader
          documentType="HORARIO ACADÉMICO OFICIAL"
          documentTitle={`Horario de Clases en Cuadrícula Semanal — ${programa?.nombre || edicion.codigo}`}
          code={edicion.codigo}
          statusBadge={edicion.status || 'ACTIVO'}
          statusColor={(edicion.status || 'ACTIVO') === 'ACTIVO' ? 'green' : 'slate'}
          issuedAt={format(new Date(), 'dd/MM/yyyy HH:mm')}
          sede="Sede Central - Tumbes • RUC 20409499849"
        />

        {/* Franja Resumen de Datos Académicos y Operativos del Grupo */}
        <div className="grid grid-cols-2 md:grid-cols-4 print:grid-cols-4 gap-3 mb-5 break-inside-avoid">
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/70">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#AD0000] block">
              Programa y Plan Curricular
            </span>
            <p className="text-xs font-extrabold text-slate-900 mt-0.5 line-clamp-1">
              {programa ? `${programa.nombre} (${programa.codigo})` : '-'}
            </p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Plan: {plan ? `${plan.nombre} (${plan.codigo})` : '-'}
            </p>
          </div>

          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/70">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#AD0000] block">
              Grupo, Periodo y Ciclo
            </span>
            <p className="text-xs font-extrabold text-slate-900 mt-0.5">
              {edicion.nombre || `Grupo ${edicion.codigo}`} ({edicion.codigo})
            </p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              {periodo ? periodo.nombre : 'Periodo Vigente'} •{' '}
              {ciclo ? `Ciclo ${ciclo.numero_orden}${ciclo.nombre ? ` (${ciclo.nombre})` : ''}` : 'Ciclo I'}
            </p>
          </div>

          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/70">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#AD0000] block">
              Modalidad, Turno y Vigencia
            </span>
            <p className="text-xs font-extrabold text-slate-900 mt-0.5">
              {edicion.modalidad || 'PRESENCIAL'} / {edicion.turno || 'REGULAR'}
            </p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              {edicion.fecha_inicio ? format(new Date(edicion.fecha_inicio + 'T00:00:00'), 'dd/MM/yyyy') : '-'} al{' '}
              {edicion.fecha_fin ? format(new Date(edicion.fecha_fin + 'T00:00:00'), 'dd/MM/yyyy') : '-'}
            </p>
          </div>

          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/70">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#AD0000] block">
              Capacidad y Régimen
            </span>
            <p className="text-xs font-extrabold text-slate-900 mt-0.5">
              Vacantes Ofertadas: {edicion.vacantes ?? '-'} cupos
            </p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              {edicion.precio_matricula !== null && edicion.precio_matricula !== undefined
                ? `Matrícula: S/ ${Number(edicion.precio_matricula).toFixed(2)}`
                : 'Matrícula: Seg. tarifario'}{' '}
              •{' '}
              {edicion.precio_pension !== null && edicion.precio_pension !== undefined
                ? `Pensión: S/ ${Number(edicion.precio_pension).toFixed(2)}`
                : 'Pensión: Seg. tarifario'}
            </p>
          </div>
        </div>

        {/* CUADRÍCULA HORIZONTAL DE HORARIO SEMANAL (DÍAS EN COLUMNAS, BLOQUES EN FILAS) */}
        <div className="mb-6 break-inside-avoid">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#AD0000] inline-block" />
              Cuadrícula Horizontal de Horario Semanal ({horarios.length} sesión/es programadas)
            </h3>
            <span className="text-[10px] font-bold text-slate-500 uppercase">
              Columnas: Días de la Semana • Filas: Bloques Horarios
            </span>
          </div>

          <div className="overflow-x-auto border-2 border-slate-800 rounded-lg">
            <table className="w-full border-collapse table-fixed text-xs">
              <thead>
                <tr className="bg-[#181A1F] text-white">
                  <th className="w-[125px] py-2.5 px-2 text-center font-extrabold uppercase tracking-wider border-r border-slate-700 text-[10px] bg-[#AD0000]">
                    Bloque Horario
                  </th>
                  {COLUMNAS_DIAS.map(dia => (
                    <th
                      key={dia.key}
                      className="py-2.5 px-2 text-center font-extrabold uppercase tracking-wider border-r last:border-r-0 border-slate-700 text-[10px]"
                    >
                      {dia.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {BLOQUES_HORARIOS.map((bloque, idx) => (
                  <tr
                    key={bloque.label}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}
                  >
                    {/* Columna 1: Bloque Horario */}
                    <td className="py-2.5 px-2 text-center font-mono font-extrabold text-slate-900 bg-slate-100 border-r border-slate-300 align-middle w-[110px]">
                      <div className="text-[11px] text-[#AD0000] font-black">{bloque.inicio}</div>
                      <div className="text-[9px] text-slate-400 font-sans">a</div>
                      <div className="text-[11px] text-slate-800 font-black">{bloque.fin}</div>
                    </td>

                    {/* Columnas de Lunes a Sábado */}
                    {COLUMNAS_DIAS.map(dia => {
                      const cellKey = `${dia.key}_${bloque.start}`;

                      // Si está cubierto por un bloque que inició antes, omitimos renderizado de td
                      if (coveredMap[cellKey]) {
                        return null;
                      }

                      const cellData = cellMap[cellKey];

                      if (cellData) {
                        const ses = cellData.sesion;
                        const cursoObj = Array.isArray(ses.cursos)
                          ? ses.cursos[0]
                          : ses.cursos;

                        return (
                          <td
                            key={dia.key}
                            rowSpan={cellData.duration}
                            className="p-2 border-r last:border-r-0 border-slate-300 align-top bg-red-50/90 border-l-4 border-l-[#AD0000] shadow-2xs"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-1 flex-wrap">
                                {cursoObj?.codigo && (
                                  <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#AD0000] text-white">
                                    {cursoObj.codigo}
                                  </span>
                                )}
                                <span className="text-[9px] font-bold text-[#AD0000] font-mono">
                                  {(ses.hora_inicio || '').slice(0, 5)} - {(ses.hora_fin || '').slice(0, 5)}
                                </span>
                              </div>
                              <p className="font-extrabold text-slate-900 text-xs leading-snug">
                                {cursoObj?.nombre || 'Asignatura'}
                              </p>
                              <div className="text-[10px] text-slate-700 font-semibold leading-tight">
                                Docente: <span className="font-normal">{ses.docente || 'Por asignar'}</span>
                              </div>
                              <div className="text-[10px] text-slate-600 font-semibold leading-tight">
                                Aula / Sede: <span className="font-normal">{ses.ubicacion || 'Sede Central - Tumbes'}</span>
                              </div>
                            </div>
                          </td>
                        );
                      }

                      return (
                        <td
                          key={dia.key}
                          className="p-1 border-r last:border-r-0 border-slate-200 align-middle text-center h-10"
                        >
                          <span className="text-[10px] text-slate-300 select-none font-medium">—</span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <BrusbenPdfFooter
          leftSignatureLabel="Coordinación Académica Brusben"
          rightSignatureLabel="Dirección Institucional — Visto Bueno Oficial"
          verificationCode={`HOR-${edicion.codigo}`}
          showSignatures={true}
        />
      </div>
    </div>
  );
}

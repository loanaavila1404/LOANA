import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/permissions';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import PrintButton from '@/app/(erp)/matriculas/[id]/ficha/PrintButton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const metadata = {
  title: 'Ficha de Edición y Horario Académico - ERP Brusben'
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ORDEN_DIAS: Record<string, number> = {
  LUNES: 1,
  MARTES: 2,
  MIERCOLES: 3,
  JUEVES: 4,
  VIERNES: 5,
  SABADO: 6,
  DOMINGO: 7,
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
      ciclos (codigo, nombre, numero_orden)
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

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          .md\\:w-64, header, nav, .print\\:hidden { display: none !important; }
          .flex.h-screen, main { height: auto !important; overflow: visible !important; display: block !important; }
          main { padding: 0 !important; }
          body { background: white !important; }
        }
      `}} />

      <div className="max-w-4xl mx-auto p-8 bg-white min-h-screen text-slate-900 print:p-0 print:max-w-none">
        {/* Barra superior de acciones (no imprimible) */}
        <div className="flex justify-between items-center mb-6 print:hidden border-b pb-4">
          <Link
            href={`/oferta/ediciones/${edicion.id}`}
            className="text-slate-600 hover:text-slate-900 font-medium text-sm flex items-center gap-2"
          >
            ← Volver a la edición
          </Link>
          <PrintButton label="Descargar / Imprimir Horario PDF" />
        </div>

        {warnings.length > 0 && (
          <div className="mb-6 p-4 rounded-md bg-amber-50 border-l-4 border-amber-600 text-amber-950 print:hidden">
            <div className="font-bold text-sm mb-1">Aviso de diagnóstico de datos</div>
            <ul className="list-disc list-inside text-xs space-y-1">
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Hoja Imprimible A4 */}
        <div className="print:block border-2 border-slate-200 p-8 rounded-lg print:border-none print:p-0">
          {/* Encabezado Institucional */}
          <div className="flex justify-between items-start mb-8 border-b-2 border-red-700 pb-6">
            <div>
              <h1 className="text-3xl font-bold text-red-700 tracking-tight">Centro de Capacitaciones Brusben</h1>
              <p className="text-sm text-slate-500 mt-1">Coordinación Académica • Ficha Técnica de Edición y Horarios</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-black text-blue-900 uppercase">Horario Académico Oficial</h2>
              <div className="text-base font-bold text-slate-700 mt-1">Edición: {edicion.codigo}</div>
              <div className="inline-block mt-2 px-3 py-0.5 bg-slate-100 border border-slate-300 rounded font-semibold text-xs text-slate-800">
                Estado: {edicion.status || 'ACTIVO'}
              </div>
            </div>
          </div>

          {/* Ficha Técnica de la Edición */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="border border-slate-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-blue-900 border-b border-slate-200 pb-2 mb-3 uppercase tracking-wide">
                Datos Académicos del Grupo / Edición
              </h3>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 text-slate-500 w-2/5">Programa</td>
                    <td className="py-1.5 font-semibold text-slate-900">
                      {programa ? `${programa.nombre} (${programa.codigo})` : '-'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 text-slate-500">Plan de Estudio</td>
                    <td className="py-1.5 font-medium text-slate-800">
                      {plan ? `${plan.nombre} (${plan.codigo})` : '-'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 text-slate-500">Periodo Académico</td>
                    <td className="py-1.5 font-medium text-slate-800">
                      {periodo ? `${periodo.nombre} (${periodo.codigo})` : '-'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5 text-slate-500">Ciclo</td>
                    <td className="py-1.5 font-medium text-slate-800">
                      {ciclo ? `Ciclo ${ciclo.numero_orden}${ciclo.nombre ? ` - ${ciclo.nombre}` : ''}` : '-'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="border border-slate-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-blue-900 border-b border-slate-200 pb-2 mb-3 uppercase tracking-wide">
                Programación Operativa y Vacantes
              </h3>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 text-slate-500 w-2/5">Modalidad / Turno</td>
                    <td className="py-1.5 font-semibold text-slate-900">
                      {edicion.modalidad || '-'} / {edicion.turno || '-'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 text-slate-500">Fecha de Inicio - Fin</td>
                    <td className="py-1.5 font-medium text-slate-800">
                      {edicion.fecha_inicio ? format(new Date(edicion.fecha_inicio + 'T00:00:00'), 'dd/MM/yyyy') : '-'} al{' '}
                      {edicion.fecha_fin ? format(new Date(edicion.fecha_fin + 'T00:00:00'), 'dd/MM/yyyy') : '-'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 text-slate-500">Vacantes Totales</td>
                    <td className="py-1.5 font-medium text-slate-800">{edicion.vacantes ?? '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 text-slate-500">Inversión Referencial</td>
                    <td className="py-1.5 font-medium text-slate-800">
                      Matrícula: S/ {Number(edicion.precio_matricula || 0).toFixed(2)} • Pensión ({edicion.numero_pensiones || 0}): S/ {Number(edicion.precio_pension || 0).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabla de Horarios de Clases */}
          <div className="mb-12">
            <h3 className="text-lg font-bold text-blue-900 border-b border-slate-200 pb-2 mb-4">
              Programación de Horarios de Clases ({horarios.length} sesión/es)
            </h3>

            {horarios.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-300 rounded-md text-sm text-slate-500">
                No se han registrado sesiones de horario para esta edición académica.
              </div>
            ) : (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-y border-slate-300 text-slate-700">
                    <th className="py-3 px-3 text-left font-semibold">Día</th>
                    <th className="py-3 px-3 text-left font-semibold">Hora Inicio - Fin</th>
                    <th className="py-3 px-3 text-left font-semibold">Curso / Asignatura</th>
                    <th className="py-3 px-3 text-left font-semibold">Docente</th>
                    <th className="py-3 px-3 text-left font-semibold">Aula / Ambiente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {horarios.map(h => {
                    const curso = Array.isArray(h.cursos) ? h.cursos[0] : h.cursos;
                    return (
                      <tr key={h.id}>
                        <td className="py-3 px-3 font-bold text-slate-900">{h.dia_semana || '-'}</td>
                        <td className="py-3 px-3 font-mono text-slate-700">
                          {h.hora_inicio?.slice(0, 5) || '-'} - {h.hora_fin?.slice(0, 5) || '-'}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-900">
                          {curso ? `${curso.codigo ? `${curso.codigo} - ` : ''}${curso.nombre}` : '-'}
                        </td>
                        <td className="py-3 px-3 text-slate-700">{h.docente || 'Por asignar'}</td>
                        <td className="py-3 px-3 text-slate-700">{h.ubicacion || 'Por definir'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Firmas de Conformidad Académica */}
          <div className="grid grid-cols-2 gap-16 mt-16 pt-8">
            <div className="text-center">
              <div className="border-t border-slate-400 pt-3">
                <div className="font-bold text-sm">Coordinación Académica</div>
                <div className="text-xs text-slate-500">Centro de Capacitaciones Brusben</div>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-slate-400 pt-3">
                <div className="font-bold text-sm">Dirección Institucional</div>
                <div className="text-xs text-slate-500">Visto Bueno Oficial</div>
              </div>
            </div>
          </div>

          {/* Pie de página */}
          <div className="mt-12 pt-4 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400">
            <span>Centro de Capacitaciones Brusben — Horario de Edición {edicion.codigo}</span>
            <span>Emitido el {format(new Date(), "dd/MM/yyyy 'a las' HH:mm", { locale: es })} hrs.</span>
          </div>
        </div>
      </div>
    </>
  );
}

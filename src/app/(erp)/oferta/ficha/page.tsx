import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/permissions';
import Link from 'next/link';
import PrintButton from '@/app/(erp)/matriculas/[id]/ficha/PrintButton';
import { BrusbenPdfHeader, BrusbenPdfFooter } from '@/components/ui/BrusbenPdfLayout';
import { format } from 'date-fns';

export const metadata = {
  title: 'Catálogo General de Oferta Académica - ERP Brusben'
};

export default async function FichaCatalogoOfertaPage() {
  await requirePermission(['PROGRAMAS.VER', 'PROGRAMAS.EDITAR', 'SISTEMA.ADMINISTRAR']);
  const supabase = await createClient();

  const [
    { data: programasRaw, error: progError },
    { data: planesRaw, error: planesError },
    { data: cursosRaw, error: cursosError },
    { data: edicionesRaw, error: edicionesError },
  ] = await Promise.all([
    supabase
      .from('programas')
      .select('id, codigo, nombre, tipo_programa, duracion_cantidad, duracion_unidad, total_ciclos, status')
      .eq('status', 'ACTIVO')
      .order('nombre', { ascending: true }),
    supabase
      .from('planes_estudio')
      .select('id, programa_id, codigo, nombre, status')
      .eq('status', 'ACTIVO'),
    supabase
      .from('cursos')
      .select('id, plan_id, ciclo_id, codigo, nombre, creditos, horas_semanales, status')
      .eq('status', 'ACTIVO'),
    supabase
      .from('ediciones')
      .select('id, programa_id, codigo, nombre, modalidad, turno, fecha_inicio, fecha_fin, vacantes, precio_matricula, precio_pension, numero_pensiones, status, periodos(nombre, codigo), programas(nombre, codigo)')
      .eq('status', 'ACTIVO')
      .order('fecha_inicio', { ascending: false }),
  ]);

  const warnings: string[] = [];
  if (progError) warnings.push(`Error al consultar programas: ${progError.message}`);
  if (planesError) warnings.push(`Error al consultar planes de estudio: ${planesError.message}`);
  if (cursosError) warnings.push(`Error al consultar cursos: ${cursosError.message}`);
  if (edicionesError) warnings.push(`Error al consultar ediciones: ${edicionesError.message}`);

  const programas = programasRaw || [];
  const planes = planesRaw || [];
  const cursos = cursosRaw || [];
  const ediciones = edicionesRaw || [];

  return (
      <div className="max-w-5xl mx-auto p-6 bg-white text-slate-900 print:p-0 print:m-0 print:max-w-none print:min-h-0">
        {/* Barra de acciones superior (no imprimible) */}
        <div className="flex justify-between items-center mb-6 print:hidden no-print border-b pb-4">
          <Link
            href="/oferta/programas"
            className="text-slate-600 hover:text-slate-900 font-medium text-sm flex items-center gap-2"
          >
            ← Volver a Oferta Académica
          </Link>
          <PrintButton label="Descargar / Imprimir Catálogo PDF" />
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

        {/* Hoja Imprimible A4 */}
        <div className="print:block border-2 border-slate-200 p-8 rounded-lg print:border-none print:p-0 print:shadow-none">
          <BrusbenPdfHeader
            documentType="CATÁLOGO INSTITUCIONAL DE OFERTA ACADÉMICA"
            documentTitle="Resumen Ejecutivo de Programas, Planes de Estudio y Ediciones Vigentes"
            code={`CAT-${format(new Date(), 'yyyyMMdd')}`}
            statusBadge="OFERTA VIGENTE"
            statusColor="green"
            issuedAt={format(new Date(), 'dd/MM/yyyy HH:mm')}
          />

          {/* KPIs del Catálogo */}
          <div className="grid grid-cols-4 gap-4 mb-6 break-inside-avoid">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-center">
              <div className="text-xs text-slate-500 uppercase font-semibold">Programas Activos</div>
              <div className="text-2xl font-black text-blue-900 mt-1">{programas.length}</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-center">
              <div className="text-xs text-slate-500 uppercase font-semibold">Planes Vigentes</div>
              <div className="text-2xl font-black text-blue-900 mt-1">{planes.length}</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-center">
              <div className="text-xs text-slate-500 uppercase font-semibold">Cursos Activos</div>
              <div className="text-2xl font-black text-blue-900 mt-1">{cursos.length}</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-center">
              <div className="text-xs text-slate-500 uppercase font-semibold">Ediciones Abiertas</div>
              <div className="text-2xl font-black text-red-700 mt-1">{ediciones.length}</div>
            </div>
          </div>

          {/* Tabla 1: Programas Académicos Vigentes */}
          <div className="mb-10">
            <h3 className="text-lg font-bold text-blue-900 border-b border-slate-200 pb-2 mb-4">
              1. Catálogo de Programas Académicos Activos
            </h3>

            {programas.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No hay programas activos registrados.</p>
            ) : (
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-y border-slate-300 text-slate-700">
                    <th className="py-2.5 px-3 text-left font-semibold">Código</th>
                    <th className="py-2.5 px-3 text-left font-semibold">Programa Académico</th>
                    <th className="py-2.5 px-3 text-left font-semibold">Tipo</th>
                    <th className="py-2.5 px-3 text-left font-semibold">Duración</th>
                    <th className="py-2.5 px-3 text-center font-semibold">Planes</th>
                    <th className="py-2.5 px-3 text-center font-semibold">Cursos</th>
                    <th className="py-2.5 px-3 text-center font-semibold">Ediciones Activas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {programas.map(prog => {
                    const planesProg = planes.filter(pl => pl.programa_id === prog.id);
                    const planIdsProg = new Set(planesProg.map(pl => pl.id));
                    const cursosProg = cursos.filter(c => c.plan_id && planIdsProg.has(c.plan_id));
                    const edicionesProg = ediciones.filter(ed => ed.programa_id === prog.id);

                    return (
                      <tr key={prog.id}>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{prog.codigo}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{prog.nombre}</td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {prog.tipo_programa ? prog.tipo_programa.replace(/_/g, ' ') : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {prog.duracion_cantidad && prog.duracion_unidad
                            ? `${prog.duracion_cantidad} ${prog.duracion_unidad}`
                            : prog.total_ciclos
                              ? `${prog.total_ciclos} ciclo(s)`
                              : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-700">{planesProg.length}</td>
                        <td className="py-2.5 px-3 text-center text-slate-700">{cursosProg.length}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-blue-900">{edicionesProg.length}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Tabla 2: Ediciones Abiertas / En Curso */}
          <div className="mb-10">
            <h3 className="text-lg font-bold text-blue-900 border-b border-slate-200 pb-2 mb-4">
              2. Ediciones y Grupos Activos en Convocatoria / Curso
            </h3>

            {ediciones.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No hay ediciones activas registradas actualmente.</p>
            ) : (
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-y border-slate-300 text-slate-700">
                    <th className="py-2.5 px-3 text-left font-semibold">Código</th>
                    <th className="py-2.5 px-3 text-left font-semibold">Programa</th>
                    <th className="py-2.5 px-3 text-left font-semibold">Periodo</th>
                    <th className="py-2.5 px-3 text-left font-semibold">Modalidad / Turno</th>
                    <th className="py-2.5 px-3 text-left font-semibold">Inicio - Fin</th>
                    <th className="py-2.5 px-3 text-center font-semibold">Vacantes</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Matrícula / Pensión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {ediciones.map(ed => {
                    const prog = Array.isArray(ed.programas) ? ed.programas[0] : ed.programas;
                    const per = Array.isArray(ed.periodos) ? ed.periodos[0] : ed.periodos;
                    return (
                      <tr key={ed.id}>
                        <td className="py-2 px-3 font-mono font-semibold text-slate-900">{ed.codigo}</td>
                        <td className="py-2 px-3 font-medium text-slate-900">{prog?.nombre || '-'}</td>
                        <td className="py-2 px-3 text-slate-700">{per?.nombre || '-'}</td>
                        <td className="py-2 px-3 text-slate-700">{ed.modalidad || '-'} / {ed.turno || '-'}</td>
                        <td className="py-2 px-3 text-slate-700">
                          {ed.fecha_inicio ? format(new Date(ed.fecha_inicio + 'T00:00:00'), 'dd/MM/yyyy') : '-'} al{' '}
                          {ed.fecha_fin ? format(new Date(ed.fecha_fin + 'T00:00:00'), 'dd/MM/yyyy') : '-'}
                        </td>
                        <td className="py-2 px-3 text-center text-slate-700">{ed.vacantes ?? '-'}</td>
                        <td className="py-2 px-3 text-right font-medium text-slate-800">
                          S/ {Number(ed.precio_matricula || 0).toFixed(2)} / S/ {Number(ed.precio_pension || 0).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <BrusbenPdfFooter
            leftSignatureLabel="Coordinación de Oferta Académica"
            rightSignatureLabel="Dirección Académica — Centro de Capacitaciones Brusben"
            verificationCode={`CAT-${format(new Date(), 'yyyyMMdd')}`}
            showSignatures={true}
          />
        </div>
      </div>
  );
}


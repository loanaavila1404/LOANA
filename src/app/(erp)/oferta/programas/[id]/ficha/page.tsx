import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/permissions';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import PrintButton from '@/app/(erp)/matriculas/[id]/ficha/PrintButton';
import { BrusbenPdfHeader, BrusbenPdfFooter } from '@/components/ui/BrusbenPdfLayout';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const metadata = {
  title: 'Malla Curricular y Ficha de Programa - ERP Brusben'
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function FichaProgramaPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  await requirePermission(['PROGRAMAS.VER', 'PROGRAMAS.EDITAR', 'SISTEMA.ADMINISTRAR']);
  const supabase = await createClient();
  const resolvedParams = await params;
  const rawId = decodeURIComponent(resolvedParams.id || '').trim();

  if (!rawId) {
    notFound();
  }

  const isUuid = UUID_REGEX.test(rawId);

  // 1. Obtener datos del programa (por UUID o por código)
  const programaQuery = supabase
    .from('programas')
    .select('id, codigo, nombre, tipo_programa, descripcion, duracion_cantidad, duracion_unidad, total_ciclos, status, created_at, updated_at');

  const { data: programa, error: programaError } = await (
    isUuid
      ? programaQuery.eq('id', rawId)
      : programaQuery.eq('codigo', rawId.toUpperCase())
  ).maybeSingle();

  if (programaError) {
    console.error('[FichaPrograma] Error al obtener programa:', programaError);
    throw new Error(`Error al consultar el programa académico: ${programaError.message}`);
  }

  if (!programa) {
    notFound();
  }

  const warnings: string[] = [];

  // 2. Planes de estudio del programa
  const { data: planesRaw, error: planesError } = await supabase
    .from('planes_estudio')
    .select('id, programa_id, codigo, nombre, version, fecha_vigencia_desde, fecha_vigencia_hasta, total_ciclos, status, created_at')
    .eq('programa_id', programa.id)
    .order('created_at', { ascending: false });

  if (planesError) {
    console.error('[FichaPrograma] Error al obtener planes de estudio:', planesError);
    warnings.push(`No se pudieron cargar los planes de estudio (${planesError.message}).`);
  }

  const planes = planesRaw || [];
  const planIds = planes.map(p => p.id);

  // 3. Ciclos asociados a esos planes
  let ciclos: {
    id: string;
    plan_id: string | null;
    numero_orden: number | null;
    codigo: string | null;
    nombre: string | null;
    status: string | null;
  }[] = [];

  if (planIds.length > 0) {
    const { data: ciclosData, error: ciclosError } = await supabase
      .from('ciclos')
      .select('id, plan_id, numero_orden, codigo, nombre, status')
      .in('plan_id', planIds)
      .order('numero_orden', { ascending: true });

    if (ciclosError) {
      console.error('[FichaPrograma] Error al obtener ciclos:', ciclosError);
      warnings.push(`No se pudieron cargar los ciclos del plan de estudio (${ciclosError.message}).`);
    } else {
      ciclos = ciclosData || [];
    }
  }

  // 4. Cursos asociados a esos planes
  let cursos: {
    id: string;
    plan_id: string | null;
    ciclo_id: string | null;
    codigo: string | null;
    nombre: string | null;
    creditos: number | null;
    horas_semanales: number | null;
    status: string | null;
  }[] = [];

  if (planIds.length > 0) {
    const { data: cursosData, error: cursosError } = await supabase
      .from('cursos')
      .select('id, plan_id, ciclo_id, codigo, nombre, creditos, horas_semanales, status')
      .in('plan_id', planIds)
      .order('codigo', { ascending: true });

    if (cursosError) {
      console.error('[FichaPrograma] Error al obtener cursos:', cursosError);
      warnings.push(`No se pudieron cargar los cursos de la malla curricular (${cursosError.message}).`);
    } else {
      cursos = cursosData || [];
    }
  }

  // 5. Ediciones activas/programadas del programa
  const { data: edicionesRaw, error: edicionesError } = await supabase
    .from('ediciones')
    .select('id, codigo, nombre, modalidad, turno, fecha_inicio, fecha_fin, vacantes, precio_matricula, precio_pension, numero_pensiones, status, periodos(nombre, codigo), ciclos(nombre, numero_orden)')
    .eq('programa_id', programa.id)
    .order('fecha_inicio', { ascending: false });

  if (edicionesError) {
    console.error('[FichaPrograma] Error al obtener ediciones:', edicionesError);
    warnings.push(`No se pudieron cargar las ediciones del programa (${edicionesError.message}).`);
  }

  const ediciones = edicionesRaw || [];

  const totalCreditosPrograma = cursos.reduce((acc, c) => acc + (c.creditos || 0), 0);
  const totalHorasPrograma = cursos.reduce((acc, c) => acc + (c.horas_semanales || 0), 0);

  return (
      <div className="max-w-4xl mx-auto p-6 bg-white text-slate-900 print:p-0 print:m-0 print:max-w-none print:min-h-0">
        {/* Barra superior de acciones (no imprimible) */}
        <div className="flex justify-between items-center mb-6 print:hidden no-print border-b pb-4">
          <Link
            href={`/oferta/programas/${programa.id}`}
            className="text-slate-600 hover:text-slate-900 font-medium text-sm flex items-center gap-2"
          >
            ← Volver al programa
          </Link>
          <PrintButton label="Descargar / Imprimir PDF" />
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
            documentType="FICHA DE PROGRAMA ACADÉMICO"
            documentTitle={`Catálogo y Malla Curricular Oficial — ${programa.nombre}`}
            code={programa.codigo}
            statusBadge={programa.status || 'ACTIVO'}
            statusColor={(programa.status || 'ACTIVO') === 'ACTIVO' ? 'green' : 'slate'}
            issuedAt={format(new Date(), 'dd/MM/yyyy HH:mm')}
          />

          {/* Resumen General del Programa */}
          <div className="mb-6 bg-slate-50 border border-slate-200 rounded-lg p-5 break-inside-avoid">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="md:col-span-2">
                <p className="text-xs uppercase tracking-wider font-semibold text-slate-500">Denominación del Programa</p>
                <p className="text-lg font-bold text-slate-900 mt-0.5">{programa.nombre}</p>
                {programa.descripcion && (
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{programa.descripcion}</p>
                )}
              </div>
              <div className="space-y-2 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-4">
                <div>
                  <span className="text-slate-500 text-xs block">Tipo de Programa</span>
                  <span className="font-semibold text-slate-800">{programa.tipo_programa ? programa.tipo_programa.replace(/_/g, ' ') : '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Duración Referencial</span>
                  <span className="font-semibold text-slate-800">
                    {programa.duracion_cantidad && programa.duracion_unidad
                      ? `${programa.duracion_cantidad} ${programa.duracion_unidad}`
                      : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Total Ciclos / Cursos</span>
                  <span className="font-semibold text-slate-800">
                    {programa.total_ciclos || ciclos.length || 0} ciclo(s) • {cursos.length} curso(s)
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-200 text-center">
              <div>
                <span className="text-xs text-slate-500 uppercase font-semibold block">Planes Registrados</span>
                <span className="text-base font-bold text-blue-900">{planes.length}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase font-semibold block">Total Créditos Acumulados</span>
                <span className="text-base font-bold text-blue-900">{totalCreditosPrograma}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase font-semibold block">Total Horas Semanales</span>
                <span className="text-base font-bold text-blue-900">{totalHorasPrograma} hrs</span>
              </div>
            </div>
          </div>

          {/* Malla Curricular por Plan de Estudio y Ciclo */}
          <div className="mb-10 space-y-6">
            <h3 className="text-lg font-bold text-blue-900 border-b border-slate-200 pb-2">
              Estructura de Planes de Estudio y Malla Curricular
            </h3>

            {planes.length === 0 ? (
              <p className="text-sm text-slate-500 italic py-4">
                Este programa aún no cuenta con un plan de estudios ni malla curricular registrada.
              </p>
            ) : (
              planes.map(plan => {
                const ciclosDelPlan = ciclos
                  .filter(c => c.plan_id === plan.id)
                  .sort((a, b) => (a.numero_orden || 0) - (b.numero_orden || 0));

                return (
                  <div key={plan.id} className="border border-slate-300 rounded-lg overflow-hidden">
                    <div className="bg-slate-100 px-4 py-3 border-b border-slate-300 flex flex-wrap justify-between items-center gap-2">
                      <div>
                        <span className="font-bold text-slate-900 text-sm">{plan.nombre}</span>
                        <span className="text-xs text-slate-600 ml-2">
                          (Código: {plan.codigo} {plan.version ? `• Versión ${plan.version}` : ''})
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-700">
                        Estado: {plan.status || 'ACTIVO'}
                        {plan.fecha_vigencia_desde && ` • Vigencia desde: ${format(new Date(plan.fecha_vigencia_desde + 'T00:00:00'), 'dd/MM/yyyy')}`}
                      </div>
                    </div>

                    <div className="p-4 space-y-5">
                      {ciclosDelPlan.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">No hay ciclos configurados en este plan.</p>
                      ) : (
                        ciclosDelPlan.map(ciclo => {
                          const cursosDelCiclo = cursos.filter(cr => cr.ciclo_id === ciclo.id);
                          const sumCred = cursosDelCiclo.reduce((acc, cr) => acc + (cr.creditos || 0), 0);
                          const sumHoras = cursosDelCiclo.reduce((acc, cr) => acc + (cr.horas_semanales || 0), 0);

                          return (
                            <div key={ciclo.id} className="space-y-2">
                              <div className="flex justify-between items-center bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
                                <h4 className="font-bold text-xs uppercase tracking-wide text-blue-950">
                                  Ciclo {ciclo.numero_orden} {ciclo.nombre ? `— ${ciclo.nombre}` : ''}
                                </h4>
                                <span className="text-xs text-slate-600 font-medium">
                                  {cursosDelCiclo.length} curso(s) • {sumCred} créditos • {sumHoras} hrs/sem
                                </span>
                              </div>

                              {cursosDelCiclo.length === 0 ? (
                                <p className="text-xs text-slate-400 pl-3 py-1">Sin cursos asignados en este ciclo.</p>
                              ) : (
                                <table className="w-full text-xs border-collapse">
                                  <thead>
                                    <tr className="bg-slate-100 border-y border-slate-200 text-slate-700">
                                      <th className="py-2 px-3 text-left font-semibold w-28">Código</th>
                                      <th className="py-2 px-3 text-left font-semibold">Asignatura / Curso</th>
                                      <th className="py-2 px-3 text-center font-semibold w-24">Créditos</th>
                                      <th className="py-2 px-3 text-center font-semibold w-28">Horas / Sem.</th>
                                      <th className="py-2 px-3 text-center font-semibold w-24">Estado</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-200">
                                    {cursosDelCiclo.map(curso => (
                                      <tr key={curso.id}>
                                        <td className="py-2 px-3 font-mono font-medium text-slate-700">{curso.codigo || '-'}</td>
                                        <td className="py-2 px-3 font-medium text-slate-900">{curso.nombre || '-'}</td>
                                        <td className="py-2 px-3 text-center text-slate-700">{curso.creditos ?? 0}</td>
                                        <td className="py-2 px-3 text-center text-slate-700">{curso.horas_semanales ?? 0}</td>
                                        <td className="py-2 px-3 text-center font-medium text-slate-700">{curso.status || 'ACTIVO'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Resumen de Ediciones Vigentes / Programadas */}
          <div className="mb-10">
            <h3 className="text-lg font-bold text-blue-900 border-b border-slate-200 pb-2 mb-4">
              Ediciones Programadas / Vigentes ({ediciones.length})
            </h3>

            {ediciones.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No existen ediciones registradas para este programa.</p>
            ) : (
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-y border-slate-300 text-slate-700">
                    <th className="py-2.5 px-3 text-left font-semibold">Código Edición</th>
                    <th className="py-2.5 px-3 text-left font-semibold">Periodo / Ciclo</th>
                    <th className="py-2.5 px-3 text-left font-semibold">Modalidad / Turno</th>
                    <th className="py-2.5 px-3 text-left font-semibold">Inicio - Fin</th>
                    <th className="py-2.5 px-3 text-center font-semibold">Vacantes</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Matrícula / Pensión</th>
                    <th className="py-2.5 px-3 text-center font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {ediciones.map(ed => {
                    const per = Array.isArray(ed.periodos) ? ed.periodos[0] : ed.periodos;
                    const cic = Array.isArray(ed.ciclos) ? ed.ciclos[0] : ed.ciclos;
                    return (
                      <tr key={ed.id}>
                        <td className="py-2 px-3 font-mono font-semibold text-slate-900">{ed.codigo}</td>
                        <td className="py-2 px-3 text-slate-700">
                          {per?.nombre || '-'} {cic ? `• ${cic.nombre || `Ciclo ${cic.numero_orden}`}` : ''}
                        </td>
                        <td className="py-2 px-3 text-slate-700">{ed.modalidad || '-'} / {ed.turno || '-'}</td>
                        <td className="py-2 px-3 text-slate-700">
                          {ed.fecha_inicio ? format(new Date(ed.fecha_inicio + 'T00:00:00'), 'dd/MM/yyyy') : '-'} al{' '}
                          {ed.fecha_fin ? format(new Date(ed.fecha_fin + 'T00:00:00'), 'dd/MM/yyyy') : '-'}
                        </td>
                        <td className="py-2 px-3 text-center text-slate-700">{ed.vacantes ?? '-'}</td>
                        <td className="py-2 px-3 text-right text-slate-700">
                          S/ {Number(ed.precio_matricula || 0).toFixed(2)} / S/ {Number(ed.precio_pension || 0).toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-center font-semibold text-slate-800">{ed.status || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <BrusbenPdfFooter
            leftSignatureLabel="Coordinación Académica Brusben"
            rightSignatureLabel="Dirección General — Centro de Capacitaciones Brusben"
            verificationCode={`PROG-${programa.codigo}`}
            showSignatures={true}
          />
        </div>
      </div>
  );
}


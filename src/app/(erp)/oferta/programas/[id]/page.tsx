import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/permissions';
import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { ConfigurarProgramaButtonClient } from './ConfigurarProgramaButtonClient';
import { CicloFormModalClient, CursoFormModalClient } from './PlanesForms';

export const metadata = {
  title: 'Detalle de Programa - ERP Brusben'
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ProgramaDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  await requirePermission(['PROGRAMAS.VER', 'SISTEMA.ADMINISTRAR']);
  const supabase = await createClient();
  const resolvedParams = await params;
  const rawId = decodeURIComponent(resolvedParams.id || '').trim();

  if (!rawId) {
    notFound();
  }

  const isUuid = UUID_REGEX.test(rawId);
  const programaQuery = supabase.from('programas').select('*');
  const { data: programa } = await (
    isUuid
      ? programaQuery.eq('id', rawId)
      : programaQuery.eq('codigo', rawId.toUpperCase())
  ).maybeSingle();

  if (!programa) {
    notFound();
  }

  const { data: planes } = await supabase
    .from('planes_estudio')
    .select(`
      *,
      ciclos (
        *,
        cursos (*)
      )
    `)
    .eq('programa_id', programa.id)
    .order('created_at', { ascending: false });

  // Render
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/oferta/programas" className="text-slate-500 hover:text-slate-800">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{programa.nombre}</h1>
              <Badge variant={programa.status === 'ACTIVO' ? 'success' : 'default'}>{programa.status}</Badge>
            </div>
            <p className="text-sm text-slate-500">{programa.codigo} • {programa.tipo_programa?.replace(/_/g, ' ')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/oferta/programas/${programa.id}/ficha`}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 shadow-2xs text-sm font-semibold transition-colors"
          >
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Descargar Malla PDF</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* COLUMNA IZQUIERDA: Info General */}
        <div className="md:col-span-1 space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Información del Programa</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-500 font-medium">Descripción</p>
                <p className="text-slate-800">{programa.descripcion || '-'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500 font-medium">Duración</p>
                  <p className="text-slate-800">
                    {programa.duracion_cantidad && programa.duracion_unidad 
                      ? `${programa.duracion_cantidad} ${programa.duracion_unidad}` 
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Total Ciclos</p>
                  <p className="text-slate-800">{programa.total_ciclos || '-'}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* COLUMNA DERECHA: Ciclos y Cursos */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">Ciclos y cursos</h2>
          </div>

          {(!planes || planes.length === 0 || planes.filter(p => p.status === 'ACTIVO').length === 0) ? (
            <ConfigurarProgramaButtonClient programaId={programa.id} />
          ) : (
            <div className="space-y-4">
              {(() => {
                const planActivo = planes.find(p => p.status === 'ACTIVO') || planes[0];
                return (
                  <Card className="p-0 overflow-hidden border border-slate-200">
                    <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-slate-800">Estructura Académica</h3>
                        <p className="text-xs text-slate-500">Plan interno: {planActivo.codigo}</p>
                      </div>
                      <CicloFormModalClient 
                        planId={planActivo.id} 
                        trigger={<button className="text-sm text-red-600 font-medium hover:underline border border-red-200 px-3 py-1 rounded bg-white">+ Agregar Ciclo</button>} 
                      />
                    </div>

                    <div className="p-4 space-y-4">
                      {(!planActivo.ciclos || planActivo.ciclos.length === 0) ? (
                        <p className="text-sm text-slate-500 italic">No hay ciclos configurados.</p>
                      ) : (
                        <div className="space-y-3">
                          {planActivo.ciclos.sort((a: {numero_orden: number | null}, b: {numero_orden: number | null}) => (a.numero_orden || 0) - (b.numero_orden || 0)).map((ciclo: {id: string, numero_orden: number | null, nombre: string | null, cursos: {id: string, codigo: string | null, nombre: string | null, creditos: number | null, horas_semanales: number | null, status: string | null}[]}) => (
                            <div key={ciclo.id} className="border border-slate-200 rounded-md p-0 overflow-hidden">
                              <div className="flex justify-between items-center bg-slate-50 px-4 py-3 border-b border-slate-100">
                                <h5 className="font-medium text-sm text-slate-800">
                                  Ciclo {ciclo.numero_orden} {ciclo.nombre ? `- ${ciclo.nombre}` : ''}
                                </h5>
                                <div className="flex gap-2">
                                  <CicloFormModalClient 
                                    planId={planActivo.id} 
                                    // @ts-expect-error type mismatch with exact Row
                                    ciclo={ciclo} 
                                    trigger={<button className="text-xs text-slate-500 hover:text-slate-800 border px-2 py-1 rounded bg-white">Editar ciclo</button>} 
                                  />
                                  <CursoFormModalClient 
                                    planId={planActivo.id} 
                                    cicloId={ciclo.id} 
                                    trigger={<button className="text-xs text-white bg-red-600 font-medium hover:bg-red-700 px-2 py-1 rounded">+ Agregar curso</button>} 
                                  />
                                </div>
                              </div>
                              
                              {(!ciclo.cursos || ciclo.cursos.length === 0) ? (
                                <p className="text-xs text-slate-400 p-4 text-center">No hay cursos registrados en este ciclo.</p>
                              ) : (
                                <div className="bg-white divide-y divide-slate-100">
                                  {ciclo.cursos.map((curso: {id: string, codigo: string | null, nombre: string | null, creditos: number | null, horas_semanales: number | null, status: string | null}) => (
                                    <div key={curso.id} className="flex justify-between items-center p-3 text-sm hover:bg-slate-50">
                                      <div>
                                        <span className="font-medium text-slate-700">{curso.codigo ? `${curso.codigo} - ` : ''}{curso.nombre}</span>
                                        <div className="text-xs text-slate-500 mt-0.5">
                                          {curso.creditos ? `${curso.creditos} créditos` : 'Sin créditos'} • {curso.horas_semanales ? `${curso.horas_semanales} horas semanales` : 'Horas no definidas'}
                                        </div>
                                      </div>
                                      <div className="flex items-center">
                                        <Badge variant={curso.status === 'ACTIVO' ? 'success' : 'default'} className="ml-2">{curso.status}</Badge>
                                        <CursoFormModalClient 
                                          planId={planActivo.id} 
                                          cicloId={ciclo.id} 
                                          // @ts-expect-error type mismatch with exact Row
                                          curso={curso} 
                                          trigger={<button className="text-xs text-slate-500 hover:text-slate-700 border px-2 py-1 rounded ml-4 bg-white">Editar</button>} 
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

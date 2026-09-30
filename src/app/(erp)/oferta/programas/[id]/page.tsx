import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/permissions';
import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';

export const metadata = {
  title: 'Detalle de Programa - ERP Brusben'
};

export default async function ProgramaDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  await requirePermission(['PROGRAMAS.VER', 'SISTEMA.ADMINISTRAR']);
  const supabase = await createClient();
  const resolvedParams = await params;

  const { data: programa } = await supabase
    .from('programas')
    .select('*')
    .eq('id', resolvedParams.id)
    .single();

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

        {/* COLUMNA DERECHA: Planes de Estudio, Ciclos, Cursos */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">Planes de Estudio</h2>
            <button className="bg-red-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-red-700">
              Nuevo Plan
            </button>
          </div>

          {(!planes || planes.length === 0) ? (
            <Card className="p-8 text-center text-slate-500">
              No hay planes de estudio registrados para este programa.
            </Card>
          ) : (
            <div className="space-y-4">
              {planes.map(plan => (
                <Card key={plan.id} className="p-0 overflow-hidden border border-slate-200">
                  <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-800">{plan.nombre}</h3>
                        <Badge variant={plan.status === 'ACTIVO' ? 'success' : 'default'}>{plan.status}</Badge>
                      </div>
                      <p className="text-xs text-slate-500">Código: {plan.codigo} • Versión: {plan.version || '-'} • Ciclos: {plan.total_ciclos || '-'}</p>
                    </div>
                    <button className="text-sm text-red-600 font-medium hover:underline">
                      Editar Plan
                    </button>
                  </div>

                  <div className="p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-slate-700">Ciclos y Cursos</h4>
                      <button className="text-xs text-slate-600 border border-slate-300 px-2 py-1 rounded hover:bg-slate-50">
                        + Agregar Ciclo
                      </button>
                    </div>

                    {(!plan.ciclos || plan.ciclos.length === 0) ? (
                      <p className="text-sm text-slate-500 italic">No hay ciclos configurados.</p>
                    ) : (
                      <div className="space-y-3">
                        {plan.ciclos.sort((a, b) => (a.numero_orden || 0) - (b.numero_orden || 0)).map((ciclo) => (
                          <div key={ciclo.id} className="border border-slate-100 rounded-md p-3">
                            <div className="flex justify-between items-center mb-2">
                              <h5 className="font-medium text-sm text-slate-800">
                                Ciclo {ciclo.numero_orden} {ciclo.nombre ? `- ${ciclo.nombre}` : ''}
                              </h5>
                              <div className="flex gap-2">
                                <button className="text-xs text-slate-500 hover:text-slate-800">Editar</button>
                                <button className="text-xs text-red-600 font-medium hover:underline">+ Curso</button>
                              </div>
                            </div>
                            
                            {(!ciclo.cursos || ciclo.cursos.length === 0) ? (
                              <p className="text-xs text-slate-400">Sin cursos.</p>
                            ) : (
                              <div className="bg-slate-50 rounded border border-slate-100 divide-y divide-slate-100">
                                {ciclo.cursos.map((curso) => (
                                  <div key={curso.id} className="flex justify-between items-center p-2 text-sm">
                                    <div>
                                      <span className="font-medium text-slate-700">{curso.codigo ? `${curso.codigo} - ` : ''}{curso.nombre}</span>
                                      <span className="text-xs text-slate-500 ml-2">({curso.creditos || 0} cred, {curso.horas_semanales || 0} hs)</span>
                                    </div>
                                    <button className="text-xs text-slate-400 hover:text-slate-700">Editar</button>
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

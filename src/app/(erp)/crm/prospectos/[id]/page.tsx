import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/permissions';
import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { SeguimientoFormModalClient } from './SeguimientoFormModalClient';
import { TareaFormModalClient, CompleteTareaButtonClient } from './TareaFormModalClient';
import { TransferenciaModalClient } from './TransferenciaModalClient';
import { MarcarPerdidoButtonClient } from './MarcarPerdidoButtonClient';
import { ConvertirButtonClient } from './ConvertirButtonClient';

export const metadata = {
  title: 'Ficha Comercial - ERP Brusben'
};

export default async function ProspectoDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  await requirePermission(['CRM.VER', 'SISTEMA.ADMINISTRAR']);
  const supabase = await createClient();
  const resolvedParams = await params;

  const { data: prospecto } = await supabase
    .from('prospectos')
    .select(`
      *,
      programas (nombre, codigo),
      planes_estudio (nombre, codigo),
      ediciones (codigo),
      profiles!prospectos_asesor_id_fkey (id, nombre, apellido)
    `)
    .eq('id', resolvedParams.id)
    .single();

  if (!prospecto) {
    notFound();
  }

  const { data: seguimientos } = await supabase
    .from('seguimientos')
    .select(`*, profiles!seguimientos_asesor_id_fkey (nombre, apellido)`)
    .eq('prospecto_id', prospecto.id)
    .order('fecha_hora', { ascending: false });

  const { data: tareas } = await supabase
    .from('tareas_comerciales')
    .select(`*, profiles!tareas_comerciales_asesor_id_fkey (nombre, apellido)`)
    .eq('prospecto_id', prospecto.id)
    .order('fecha_programada', { ascending: true });

  const { data: asesores } = await supabase.from('profiles').select('id, nombre, apellido, role_id').order('nombre');

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/crm" className="text-slate-500 hover:text-slate-800">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{prospecto.nombres} {prospecto.apellidos}</h1>
              <Badge variant={
                prospecto.status === 'NUEVO' ? 'default' : 
                prospecto.status === 'MATRICULADO' ? 'success' : 
                prospecto.status === 'PERDIDO' ? 'destructive' : 'outline'
              }>
                {prospecto.status}
              </Badge>
            </div>
            <p className="text-sm text-slate-500">{prospecto.codigo} • {prospecto.telefono} • {prospecto.email || 'Sin email'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {prospecto.status !== 'MATRICULADO' && prospecto.status !== 'PERDIDO' && (
            <>
              <MarcarPerdidoButtonClient prospectoId={prospecto.id} />
              <ConvertirButtonClient prospectoId={prospecto.id} />
            </>
          )}
          <TransferenciaModalClient prospectoId={prospecto.id} asesores={asesores || []} asesorActualId={prospecto.asesor_id} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA IZQUIERDA - INFO GENERAL */}
        <div className="space-y-6">
          <Card className="p-4 space-y-4">
            <h2 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Información del Prospecto</h2>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500 font-medium">Documento</p>
                  <p className="text-slate-800">{prospecto.tipo_documento || 'DNI'}: {prospecto.numero_documento || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Asesor Asignado</p>
                  <p className="text-slate-800">
                    {(prospecto as unknown as { profiles: { nombre: string, apellido: string } })?.profiles 
                      ? `${(prospecto as unknown as { profiles: { nombre: string, apellido: string } }).profiles.nombre} ${(prospecto as unknown as { profiles: { nombre: string, apellido: string } }).profiles.apellido}`
                      : 'Sin asignar'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500 font-medium">Programa de Interés</p>
                  <p className="text-slate-800">{(prospecto as unknown as { programas: { nombre: string } })?.programas?.nombre || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Edición</p>
                  <p className="text-slate-800">{(prospecto as unknown as { ediciones: { codigo: string } })?.ediciones?.codigo || '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500 font-medium">Canal de Captación</p>
                  <p className="text-slate-800">{prospecto.canal_captacion || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Nivel de Interés</p>
                  <p className="text-slate-800">{prospecto.nivel_interes || '-'}</p>
                </div>
              </div>
              {prospecto.observaciones && (
                <div>
                  <p className="text-slate-500 font-medium">Observaciones</p>
                  <p className="text-slate-800">{prospecto.observaciones}</p>
                </div>
              )}
            </div>
            <button className="w-full mt-2 text-sm text-red-600 font-medium border border-red-200 rounded py-1.5 hover:bg-red-50">
              Editar Datos
            </button>
          </Card>

          <Card className="p-4 space-y-4">
            <h2 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Embudo Comercial</h2>
            <div className="relative">
              <div className="absolute top-0 bottom-0 left-4 w-px bg-slate-200"></div>
              <ul className="space-y-4 relative">
                <li className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full z-10 ${prospecto.status === 'NUEVO' || prospecto.status === 'SEGUIMIENTO' || prospecto.status === 'ENTREVISTA' || prospecto.status === 'MATRICULADO' ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                  <span className={`text-sm ${prospecto.status === 'NUEVO' ? 'font-bold text-slate-800' : 'text-slate-500'}`}>Nuevo</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full z-10 ${prospecto.status === 'SEGUIMIENTO' || prospecto.status === 'ENTREVISTA' || prospecto.status === 'MATRICULADO' ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                  <span className={`text-sm ${prospecto.status === 'SEGUIMIENTO' ? 'font-bold text-slate-800' : 'text-slate-500'}`}>En Seguimiento</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full z-10 ${prospecto.status === 'ENTREVISTA' || prospecto.status === 'MATRICULADO' ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                  <span className={`text-sm ${prospecto.status === 'ENTREVISTA' ? 'font-bold text-slate-800' : 'text-slate-500'}`}>Entrevista Programada</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full z-10 ${prospecto.status === 'MATRICULADO' ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                  <span className={`text-sm ${prospecto.status === 'MATRICULADO' ? 'font-bold text-slate-800' : 'text-slate-500'}`}>Cerrado / Matriculado</span>
                </li>
              </ul>
            </div>
          </Card>
        </div>

        {/* COLUMNA DERECHA - TAREAS Y SEGUIMIENTOS */}
        <div className="lg:col-span-2 space-y-6">
          {/* TAREAS PENDIENTES */}
          <Card className="p-4 space-y-4 border-orange-200 bg-orange-50/30">
            <div className="flex items-center justify-between border-b border-orange-100 pb-2">
              <h2 className="font-bold text-slate-800">Tareas Pendientes</h2>
              <TareaFormModalClient prospectoId={prospecto.id} triggerText="+ Programar Tarea" variant="outline" />
            </div>
            {(!tareas || tareas.filter(t => t.status === 'PENDIENTE').length === 0) ? (
              <p className="text-sm text-slate-500 italic">No hay tareas pendientes.</p>
            ) : (
              <ul className="space-y-2">
                {tareas.filter(t => t.status === 'PENDIENTE').map(t => (
                  <li key={t.id} className="bg-white border border-orange-100 rounded p-3 flex justify-between items-center shadow-sm">
                    <div>
                      <h4 className="font-medium text-sm text-slate-800">{t.titulo}</h4>
                      <p className="text-xs text-slate-500">
                        Programada para: {new Date(t.fecha_programada || '').toLocaleString('es-PE')} 
                        • Tipo: {t.tipo_tarea}
                      </p>
                    </div>
                    <CompleteTareaButtonClient tareaId={t.id} prospectoId={prospecto.id} />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* SEGUIMIENTOS (HISTORIAL) */}
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="font-bold text-slate-800">Historial de Seguimientos</h2>
              <SeguimientoFormModalClient prospectoId={prospecto.id} currentStatus={prospecto.status || 'NUEVO'} triggerText="+ Registrar Actividad" />
            </div>
            
            {(!seguimientos || seguimientos.length === 0) ? (
              <p className="text-sm text-center text-slate-500 py-8">No hay actividades registradas.</p>
            ) : (
              <div className="relative pl-4 space-y-6">
                <div className="absolute top-2 bottom-0 left-[11px] w-px bg-slate-200"></div>
                {seguimientos.map((seg) => (
                  <div key={seg.id} className="relative">
                    <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-red-100 border-2 border-red-500"></div>
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-sm">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-slate-700">{seg.tipo_actividad}</span>
                        <span className="text-xs text-slate-500">{new Date(seg.fecha_hora || '').toLocaleString('es-PE')}</span>
                      </div>
                      <p className="text-slate-800 mb-2">{seg.nota}</p>
                      
                      <div className="flex flex-wrap gap-2 text-xs">
                        {seg.resultado && <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded">Result: {seg.resultado}</span>}
                        {seg.estado_nuevo && seg.estado_nuevo !== seg.estado_anterior && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Estado → {seg.estado_nuevo}</span>
                        )}
                        <span className="text-slate-500 ml-auto">
                          Por: {(seg as unknown as { profiles: { nombre: string, apellido: string } })?.profiles 
                          ? `${(seg as unknown as { profiles: { nombre: string, apellido: string } }).profiles.nombre} ${(seg as unknown as { profiles: { nombre: string, apellido: string } }).profiles.apellido}`
                          : 'Sistema'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

        </div>
      </div>
    </div>
  );
}

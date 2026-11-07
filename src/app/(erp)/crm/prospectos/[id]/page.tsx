import { createClient, getSafeDbClient } from '@/lib/supabase/server';
import { requirePermission, getUserAuthContext } from '@/lib/auth/permissions';
import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { buildWhatsAppUrl, CRMConversationItem, CRMTaskItem } from '@/lib/utils/crm';
import { ProspectoBitacoraTimeline } from '@/components/features/crm/ProspectoBitacoraTimeline';
import { TransferenciaModalClient } from './TransferenciaModalClient';
import { MarcarPerdidoButtonClient } from './MarcarPerdidoButtonClient';
import { ConvertirButtonClient } from './ConvertirButtonClient';
import { EliminarProspectoButtonClient } from './EliminarProspectoButtonClient';

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
  const db = await getSafeDbClient();
  const authCtx = await getUserAuthContext();
  const isAdvisor = Boolean(authCtx?.isAsesor);
  const currentUserId = authCtx?.userId;
  const resolvedParams = await params;

  const { data: prospecto } = await db
    .from('prospectos')
    .select(`
      *,
      programas (nombre, codigo),
      planes_estudio (nombre, codigo),
      ediciones (codigo),
      profiles!prospectos_asesor_id_fkey (id, display_name)
    `)
    .eq('id', resolvedParams.id)
    .single();

  if (!prospecto) {
    notFound();
  }

  // REGLA DE SEGURIDAD POR ROL:
  // Si el usuario es Asesor Comercial, solo puede ver la ficha de sus propios prospectos asignados
  if (isAdvisor && currentUserId && prospecto.asesor_id !== currentUserId) {
    notFound();
  }

  const { data: seguimientos } = await db
    .from('seguimientos')
    .select(`*, profiles!seguimientos_asesor_id_fkey (display_name)`)
    .eq('prospecto_id', prospecto.id)
    .order('fecha_hora', { ascending: false });

  const { data: tareas } = await db
    .from('tareas_comerciales')
    .select(`*, profiles!tareas_comerciales_asesor_id_fkey (display_name)`)
    .eq('prospecto_id', prospecto.id)
    .order('fecha_programada', { ascending: true });

  const { data: asesores } = await db.from('profiles').select('id, display_name, role_id').order('display_name');

  const progName = (prospecto as unknown as { programas: { nombre: string } })?.programas?.nombre;
  const fullName = `${prospecto.nombres || ''} ${prospecto.apellidos || ''}`.trim() || prospecto.codigo;
  const whatsAppUrl = buildWhatsAppUrl({
    phone: prospecto.telefono,
    prospectoName: fullName,
    programaName: progName,
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                prospecto.status === 'PERDIDO' ? 'danger' : 'default'
              }>
                {prospecto.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mt-1 flex-wrap">
              <span className="font-mono text-slate-600 font-semibold">{prospecto.codigo}</span>
              <span>•</span>
              <span className="font-medium text-slate-700">{prospecto.telefono || 'Sin teléfono'}</span>
              {whatsAppUrl && (
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Abrir chat en WhatsApp con mensaje precargado"
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition shadow-2xs"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600/20" />
                  <span>WhatsApp</span>
                </a>
              )}
              <span>•</span>
              <span>{prospecto.email || 'Sin email'}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {whatsAppUrl && (
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition shadow-2xs"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600/20" />
              <span>Contactar WhatsApp</span>
            </a>
          )}
          {prospecto.status !== 'PERDIDO' && (
            <>
              {prospecto.status !== 'MATRICULADO' && (
                <MarcarPerdidoButtonClient prospectoId={prospecto.id} />
              )}
              <ConvertirButtonClient
                prospectoId={prospecto.id}
                status={prospecto.status || 'NUEVO'}
                matriculaId={prospecto.matricula_id}
                prospectoName={fullName}
              />
            </>
          )}
          {!isAdvisor && (
            <TransferenciaModalClient prospectoId={prospecto.id} asesores={asesores || []} asesorActualId={prospecto.asesor_id} />
          )}
          <EliminarProspectoButtonClient
            prospectoId={prospecto.id}
            prospectoCodigo={prospecto.codigo}
            prospectoNombre={fullName}
          />
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
                    {(prospecto as unknown as { profiles: { display_name: string } })?.profiles 
                      ? (prospecto as unknown as { profiles: { display_name: string } }).profiles.display_name
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
            <Link
              href="/crm"
              className="w-full mt-2 text-center block text-xs text-slate-600 font-semibold border border-slate-200 rounded py-1.5 hover:bg-slate-50"
            >
              Volver al Listado CRM
            </Link>
          </Card>

          <Card className="p-4 space-y-4">
            <h2 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Etapa en el Embudo Comercial</h2>
            <div className="relative">
              <div className="absolute top-0 bottom-0 left-4 w-px bg-slate-200"></div>
              <ul className="space-y-3.5 relative">
                {[
                  { key: 'NUEVO', label: 'Nuevo Registro' },
                  { key: 'CONTACTADO', label: 'Contactado' },
                  { key: 'EN SEGUIMIENTO', label: 'En Seguimiento' },
                  { key: 'INTERESADO', label: 'Interesado' },
                  { key: 'PREMATRICULA', label: 'Prematrícula (Derivado a Caja)' },
                  { key: 'MATRICULADO', label: 'Matriculado Oficial (Pago Validado)' },
                ].map((step) => {
                  const currentNorm = (prospecto.status || 'NUEVO').toUpperCase();
                  const isCurrent = currentNorm === step.key || (currentNorm === 'SEGUIMIENTO' && step.key === 'EN SEGUIMIENTO');
                  return (
                    <li key={step.key} className="flex items-center gap-3">
                      <div className={`w-3.5 h-3.5 rounded-full z-10 border-2 transition ${
                        isCurrent
                          ? 'bg-[#C4121A] border-red-300 ring-4 ring-red-100'
                          : 'bg-white border-slate-300'
                      }`} />
                      <span className={`text-xs ${isCurrent ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
                        {step.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </Card>
        </div>

        {/* COLUMNA DERECHA - BITÁCORA UNIFICADA (TAREAS Y NOTAS CON HISTORIAL PERMANENTE) */}
        <div className="lg:col-span-2 space-y-6">
          <ProspectoBitacoraTimeline
            prospectoId={prospecto.id}
            currentStatus={prospecto.status || 'NUEVO'}
            seguimientos={(seguimientos || []) as unknown as CRMConversationItem[]}
            tareas={(tareas || []) as unknown as CRMTaskItem[]}
            isAdvisor={isAdvisor}
          />
        </div>
      </div>
    </div>
  );
}

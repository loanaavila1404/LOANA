import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/permissions';
import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { PagoFormModalClient } from './PagoFormModalClient';

export const metadata = {
  title: 'Detalle de Matrícula - ERP Brusben'
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function MatriculaDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  await requirePermission(['MATRICULAS.VER', 'COBRANZA.VER', 'SISTEMA.ADMINISTRAR']);
  const supabase = await createClient();
  const resolvedParams = await params;
  const rawId = decodeURIComponent(resolvedParams.id || '').trim();

  if (!rawId) {
    notFound();
  }

  const isUuid = UUID_REGEX.test(rawId);

  const matriculaQuery = supabase
    .from('matriculas')
    .select(`
      *,
      estudiantes (id, codigo_estudiante, personas (nombres, apellido_paterno, apellido_materno, numero_documento)),
      ediciones (codigo, nombre, programas (nombre, codigo), planes_estudio (nombre, codigo))
    `);

  const { data: matricula, error: matriculaError } = await (
    isUuid
      ? matriculaQuery.eq('id', rawId)
      : matriculaQuery.eq('codigo_matricula', rawId.toUpperCase())
  ).maybeSingle();

  if (matriculaError) {
    console.error('[MatriculaDetail] Error al obtener matrícula:', matriculaError);
    throw new Error(`Error al consultar la matrícula: ${matriculaError.message}`);
  }

  if (!matricula) notFound();

  const warnings: string[] = [];

  type EstudianteRel = {
    id: string;
    codigo_estudiante: string | null;
    personas: {
      nombres: string | null;
      apellido_paterno: string | null;
      apellido_materno: string | null;
      numero_documento: string | null;
    } | {
      nombres: string | null;
      apellido_paterno: string | null;
      apellido_materno: string | null;
      numero_documento: string | null;
    }[] | null;
  };

  type EdicionRel = {
    codigo: string;
    nombre: string | null;
    programas: { nombre: string; codigo: string } | { nombre: string; codigo: string }[] | null;
    planes_estudio: { nombre: string; codigo: string } | { nombre: string; codigo: string }[] | null;
  };

  const estRaw = matricula.estudiantes as unknown as EstudianteRel | EstudianteRel[] | null;
  const est = Array.isArray(estRaw) ? estRaw[0] : estRaw;
  const persona = Array.isArray(est?.personas) ? est?.personas[0] : est?.personas;

  const edRaw = matricula.ediciones as unknown as EdicionRel | EdicionRel[] | null;
  const ed = Array.isArray(edRaw) ? edRaw[0] : edRaw;
  const prog = Array.isArray(ed?.programas) ? ed?.programas[0] : ed?.programas;
  const plan = Array.isArray(ed?.planes_estudio) ? ed?.planes_estudio[0] : ed?.planes_estudio;

  if (!est && matricula.estudiante_id) {
    warnings.push('No se pudieron cargar los datos del estudiante vinculado. Verifique que su rol cuente con el permiso ESTUDIANTES.VER (RLS).');
  }
  if (!ed && matricula.edicion_id) {
    warnings.push('No se pudo cargar la edición ni el programa académico. Verifique que su rol cuente con el permiso PROGRAMAS.VER (RLS).');
  }

  // Cargar Cuotas
  const { data: cuotas, error: cuotasError } = await supabase
    .from('cuotas')
    .select('*')
    .eq('matricula_id', matricula.id)
    .order('numero_cuota', { ascending: true });

  if (cuotasError) {
    warnings.push(`Error al consultar cuotas: ${cuotasError.message}`);
  }

  // Cargar Pagos del estudiante
  const { data: pagos } = await supabase
    .from('pagos')
    .select(`
      *,
      pago_aplicaciones (id, cuota_id, importe_aplicado)
    `)
    .eq('estudiante_id', est?.id || matricula.estudiante_id)
    .order('fecha_pago', { ascending: false });

  // Cuotas pendientes para el modal de pago
  const cuotasPendientes = cuotas?.filter(c => c.status === 'PENDIENTE' || c.status === 'PARCIAL') || [];

  return (
    <div className="space-y-6">
      {warnings.length > 0 && (
        <div className="p-4 rounded-md bg-amber-50 border-l-4 border-amber-600 text-amber-950">
          <p className="font-bold text-sm mb-1">Aviso de diagnóstico de datos / permisos (RLS)</p>
          <ul className="list-disc list-inside text-xs space-y-1">
            {warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/matriculas" className="text-slate-500 hover:text-slate-800">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">
                Matrícula {matricula.codigo_matricula}
              </h1>
              <Badge variant={
                matricula.status === 'ACTIVA' ? 'success' : 
                matricula.status === 'PREMATRICULA' ? 'default' : 
                matricula.status === 'RESERVADA' ? 'warning' : 'danger'
              }>
                {matricula.status}
              </Badge>
            </div>
            <p className="text-sm text-slate-500">
              {persona ? `${persona.nombres || ''} ${persona.apellido_paterno || ''} ${persona.apellido_materno || ''}`.trim() : 'Estudiante sin lectura'} • {persona?.numero_documento || '-'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/matriculas/${matricula.id}/ficha`}
            className="inline-flex items-center gap-2 bg-white border border-slate-300 text-slate-800 px-3.5 py-2 rounded-md text-sm font-semibold hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Ver / Imprimir Ficha PDF</span>
          </Link>
          {(matricula.status === 'ACTIVA' || matricula.status === 'FINALIZADA') && cuotasPendientes.length > 0 && (
            <PagoFormModalClient 
              estudianteId={est?.id || matricula.estudiante_id} 
              cuotasPendientes={cuotasPendientes} 
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA IZQUIERDA - INFO GENERAL */}
        <div className="space-y-6">
          <Card className="p-4 space-y-4">
            <h2 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Información Académica</h2>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500 font-medium">Programa</p>
                  <p className="text-slate-800">{prog?.nombre || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Edición</p>
                  <p className="text-slate-800">{ed?.codigo || '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500 font-medium">Plan de Estudio</p>
                  <p className="text-slate-800">{plan?.nombre || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Código de Estudiante</p>
                  <p className="text-slate-800">{est?.codigo_estudiante || '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500 font-medium">Fecha de Matrícula</p>
                  <p className="text-slate-800">{matricula.fecha_matricula ? new Date(matricula.fecha_matricula).toLocaleDateString('es-PE') : '-'}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* COLUMNA DERECHA - FINANZAS */}
        <div className="lg:col-span-2 space-y-6">
          
          <Card className="p-4 space-y-4">
            <h2 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Cronograma de Pagos (Cuotas)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2">Concepto</th>
                    <th className="px-3 py-2">Vencimiento</th>
                    <th className="px-3 py-2">Importe</th>
                    <th className="px-3 py-2">Saldo</th>
                    <th className="px-3 py-2">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(!cuotas || cuotas.length === 0) ? (
                    <tr><td colSpan={5} className="px-3 py-4 text-center text-slate-500">No hay cuotas generadas.</td></tr>
                  ) : cuotas.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-medium">{c.concepto}</td>
                      <td className="px-3 py-2">{c.fecha_vencimiento ? new Date(c.fecha_vencimiento!).toLocaleDateString('es-PE') : '-'}</td>
                      <td className="px-3 py-2">S/ {Number(c.importe_neto).toFixed(2)}</td>
                      <td className="px-3 py-2 font-bold text-red-600">S/ {Number(c.saldo === null ? c.importe_neto : c.saldo).toFixed(2)}</td>
                      <td className="px-3 py-2">
                        <Badge variant={c.status === 'PAGADA' ? 'success' : c.status === 'VENCIDA' ? 'danger' : c.status === 'PARCIAL' ? 'warning' : 'default'}>
                          {c.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-4 space-y-4">
            <h2 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Historial de Pagos</h2>
            <div className="space-y-4">
              {(!pagos || pagos.length === 0) ? (
                <p className="text-sm text-slate-500 text-center py-4">No se han registrado pagos.</p>
              ) : pagos.map(p => (
                <div key={p.id} className="border border-slate-200 rounded-md p-3 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-800">S/ {Number(p.importe).toFixed(2)}</span>
                      <Badge variant={p.status === 'ANULADO' ? 'danger' : 'success'}>{p.status}</Badge>
                      <span className="text-xs text-slate-500">{new Date(p.fecha_pago!).toLocaleDateString('es-PE')}</span>
                    </div>
                    <p className="text-slate-600 text-xs">
                      {p.medio_pago} {p.numero_operacion ? `• Op: ${p.numero_operacion}` : ''} 
                      {p.comprobante_numero ? ` • Comp: ${p.comprobante_tipo} ${p.comprobante_numero}` : ''}
                    </p>
                    {p.status === 'ANULADO' && p.motivo_anulacion && (
                      <p className="text-red-600 text-xs mt-1">Motivo: {p.motivo_anulacion}</p>
                    )}
                  </div>
                  {p.status !== 'ANULADO' && (
                    <button className="text-red-600 hover:underline text-xs font-medium">Anular Pago</button>
                  )}
                </div>
              ))}
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}

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

export default async function MatriculaDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  await requirePermission(['MATRICULAS.VER', 'COBRANZA.VER', 'SISTEMA.ADMINISTRAR']);
  const supabase = await createClient();
  const resolvedParams = await params;

  const { data: matricula } = await supabase
    .from('matriculas')
    .select(`
      *,
      estudiantes (id, codigo_estudiante, personas (nombres, apellido_paterno, apellido_materno, numero_documento)),
      ediciones (codigo, nombre, programas (nombre))
    `)
    .eq('id', resolvedParams.id)
    .single();

  if (!matricula) notFound();

  const est = matricula.estudiantes as any;
  const persona = est?.personas;
  const ed = matricula.ediciones as any;

  // Cargar Cuotas
  const { data: cuotas } = await supabase
    .from('cuotas')
    .select('*')
    .eq('matricula_id', matricula.id)
    .order('numero_cuota', { ascending: true });

  // Cargar Pagos del estudiante
  const { data: pagos } = await supabase
    .from('pagos')
    .select(`
      *,
      pago_aplicaciones (id, cuota_id, importe_aplicado)
    `)
    .eq('estudiante_id', est.id)
    .order('fecha_pago', { ascending: false });

  // Cuotas pendientes para el modal de pago
  const cuotasPendientes = cuotas?.filter(c => c.status === 'PENDIENTE' || c.status === 'PARCIAL') || [];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
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
              {persona?.nombres} {persona?.apellido_paterno} {persona?.apellido_materno} • {persona?.numero_documento}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {matricula.status === 'ACTIVA' && (
            <button className="bg-slate-100 border border-slate-300 text-slate-700 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-slate-200">
              Generar Ficha PDF
            </button>
          )}
          {(matricula.status === 'ACTIVA' || matricula.status === 'FINALIZADA') && cuotasPendientes.length > 0 && (
            <PagoFormModalClient 
              estudianteId={est.id} 
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
                  <p className="text-slate-800">{ed?.programas?.nombre}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Edición</p>
                  <p className="text-slate-800">{ed?.codigo}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500 font-medium">Código de Estudiante</p>
                  <p className="text-slate-800">{est.codigo_estudiante || '-'}</p>
                </div>
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
                      <td className="px-3 py-2">{c.fecha_vencimiento ? new Date(c.fecha_vencimiento).toLocaleDateString('es-PE') : '-'}</td>
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
                      <span className="text-xs text-slate-500">{new Date(p.fecha_pago).toLocaleDateString('es-PE')}</span>
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

import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/permissions';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import PrintButton from './PrintButton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const metadata = {
  title: 'Ficha de Matrícula - ERP Brusben'
};

export default async function FichaMatriculaPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  
  const supabase = await createClient();
  
  // Validate basic access right to MATRICULAS module
  await requirePermission('MATRICULAS.VER');

  // Fetch using the standard authenticated client to respect RLS
  const { data: matricula, error } = await supabase
    .from('matriculas')
    .select(`
      *,
      estudiante:estudiantes(
        codigo_estudiante,
        persona:personas(
          nombres,
          apellidos,
          tipo_documento,
          numero_documento,
          email,
          telefono
        )
      ),
      edicion:ediciones(
        codigo,
        modalidad,
        turno,
        fecha_inicio,
        fecha_fin,
        programa:programas(
          nombre,
          tipo_programa
        ),
        ciclo:ciclos(
          nombre,
          numero_orden
        ),
        periodo:periodos_academicos(
          nombre
        )
      ),
      cuotas(
        id,
        tipo_cuota,
        numero_cuota,
        concepto,
        importe_original,
        descuento,
        importe_neto,
        fecha_vencimiento,
        status
      )
    `)
    .eq('id', params.id)
    .single();

  if (error || !matricula) {
    notFound();
  }

  // Sort cuotas
  // @ts-expect-error type safety for sort
  const cuotas = matricula.cuotas?.sort((a: { tipo_cuota: string, numero_cuota: number }, b: { tipo_cuota: string, numero_cuota: number }) => {
    if (a.tipo_cuota !== b.tipo_cuota) {
      return a.tipo_cuota === 'MATRICULA' ? -1 : 1;
    }
    return (a.numero_cuota || 0) - (b.numero_cuota || 0);
  });

  const persona = Array.isArray(matricula.estudiante?.persona) 
    ? matricula.estudiante.persona[0] 
    : matricula.estudiante?.persona;

  const programa = Array.isArray(matricula.edicion?.programa)
    ? matricula.edicion.programa[0]
    : matricula.edicion?.programa;

  const ciclo = Array.isArray(matricula.edicion?.ciclo)
    ? matricula.edicion.ciclo[0]
    : matricula.edicion?.ciclo;

  const periodo = Array.isArray(matricula.edicion?.periodo)
    ? matricula.edicion.periodo[0]
    : matricula.edicion?.periodo;

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white min-h-screen text-slate-900 print:p-0 print:max-w-none">
      
      {/* Non-printable action bar */}
      <div className="flex justify-between items-center mb-8 print:hidden border-b pb-4">
        <Link 
          href={`/matriculas/${matricula.id}`}
          className="text-slate-500 hover:text-slate-800 font-medium text-sm flex items-center gap-2"
        >
          ← Volver a la matrícula
        </Link>
        <PrintButton />
      </div>

      {/* Printable Sheet */}
      <div className="print:block border-2 border-slate-200 p-8 rounded-lg print:border-none print:p-0">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-10 border-b-2 border-red-700 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-red-700 tracking-tight">Centro de Capacitaciones Brusben</h1>
            <p className="text-sm text-slate-500 mt-1">Excelencia académica a tu alcance</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-black text-blue-900 uppercase">Ficha de Matrícula</h2>
            <div className="text-lg font-bold text-slate-700 mt-1">{matricula.codigo_matricula}</div>
            <div className="inline-block mt-2 px-3 py-1 bg-slate-100 border border-slate-300 rounded font-semibold text-sm">
              Estado: {matricula.status}
            </div>
          </div>
        </div>

        {/* Estudiante & General Info */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-bold text-blue-900 border-b border-slate-200 pb-2 mb-4">Datos del Estudiante</h3>
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-2 text-slate-500 w-1/3">Nombre completo</td>
                  <td className="py-2 font-medium">{persona?.nombres} {persona?.apellidos}</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 text-slate-500">Documento</td>
                  <td className="py-2 font-medium">{persona?.tipo_documento} {persona?.numero_documento}</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 text-slate-500">Código de estudiante</td>
                  <td className="py-2 font-medium">{matricula.estudiante?.codigo_estudiante || '-'}</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 text-slate-500">Contacto</td>
                  <td className="py-2 font-medium">
                    {persona?.email && <div>{persona.email}</div>}
                    {persona?.telefono && <div>{persona.telefono}</div>}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="text-lg font-bold text-blue-900 border-b border-slate-200 pb-2 mb-4">Información Académica</h3>
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-2 text-slate-500 w-1/3">Programa</td>
                  <td className="py-2 font-medium">{programa?.nombre}</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 text-slate-500">Edición / Ciclo</td>
                  <td className="py-2 font-medium">{matricula.edicion?.codigo} - {ciclo?.nombre || `Ciclo ${ciclo?.numero_orden}`}</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 text-slate-500">Periodo</td>
                  <td className="py-2 font-medium">{periodo?.nombre}</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 text-slate-500">Modalidad / Turno</td>
                  <td className="py-2 font-medium">{matricula.edicion?.modalidad} / {matricula.edicion?.turno}</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 text-slate-500">Fecha de Matrícula</td>
                  <td className="py-2 font-medium">{matricula.created_at ? format(new Date(matricula.created_at), "dd 'de' MMMM 'de' yyyy", { locale: es }) : '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Economic Info */}
        <div className="mb-12">
          <h3 className="text-lg font-bold text-blue-900 border-b border-slate-200 pb-2 mb-4">Información Económica y Cronograma</h3>
          
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-center">
              <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Importe Bruto</div>
              <div className="text-lg font-bold">S/ {Number((matricula.importe_matricula || 0) + ((matricula.importe_pension || 0) * (matricula.numero_pensiones || 0))).toFixed(2)}</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-center">
              <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Descuento Total</div>
              <div className="text-lg font-bold text-red-600">-S/ {Number(matricula.descuento_total || 0).toFixed(2)}</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center col-span-2">
              <div className="text-xs text-blue-700 uppercase tracking-wide font-semibold mb-1">Total a Pagar (Neto)</div>
              <div className="text-2xl font-black text-blue-900">S/ {Number(((matricula.importe_matricula || 0) + ((matricula.importe_pension || 0) * (matricula.numero_pensiones || 0))) - (matricula.descuento_total || 0)).toFixed(2)}</div>
            </div>
          </div>

          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 border-y border-slate-300">
                <th className="py-3 px-4 text-left font-semibold text-slate-700">Concepto</th>
                <th className="py-3 px-4 text-left font-semibold text-slate-700">Vencimiento</th>
                <th className="py-3 px-4 text-right font-semibold text-slate-700">Bruto</th>
                <th className="py-3 px-4 text-right font-semibold text-slate-700">Descuento</th>
                <th className="py-3 px-4 text-right font-semibold text-slate-700">Neto (S/)</th>
              </tr>
            </thead>
            <tbody>
              {cuotas?.map((cuota: { id: string, concepto: string | null, fecha_vencimiento: string | null, importe_original: number | null, descuento: number | null, importe_neto: number | null }) => (
                <tr key={cuota.id} className="border-b border-slate-200">
                  <td className="py-3 px-4 font-medium">{cuota.concepto}</td>
                  <td className="py-3 px-4 text-slate-600">
                    {cuota.fecha_vencimiento ? format(new Date(cuota.fecha_vencimiento + 'T00:00:00'), "dd/MM/yyyy") : '-'}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-500">{Number(cuota.importe_original).toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-red-500">{Number(cuota.descuento) > 0 ? `-${Number(cuota.descuento).toFixed(2)}` : '0.00'}</td>
                  <td className="py-3 px-4 text-right font-bold">{Number(cuota.importe_neto).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-16 mt-20 pt-10">
          <div className="text-center">
            <div className="border-t border-slate-400 pt-3">
              <div className="font-bold">{persona?.nombres} {persona?.apellidos}</div>
              <div className="text-sm text-slate-500">Firma del Estudiante</div>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t border-slate-400 pt-3">
              <div className="font-bold">Centro de Capacitaciones Brusben</div>
              <div className="text-sm text-slate-500">Sello y Firma Institucional</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-xs text-slate-400 print:mt-12">
          Emitido el {format(new Date(), "dd/MM/yyyy 'a las' HH:mm")} hrs. Documento generado por ERP Brusben.
        </div>
      </div>
    </div>
  );
}

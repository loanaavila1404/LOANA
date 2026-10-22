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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function FichaMatriculaPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const rawId = decodeURIComponent(params.id || '').trim();

  if (!rawId) {
    notFound();
  }

  const supabase = await createClient();

  // Validate basic access right to MATRICULAS module
  await requirePermission(['MATRICULAS.VER', 'MATRICULAS.GESTIONAR', 'COBRANZA.VER', 'SISTEMA.ADMINISTRAR']);

  const isUuid = UUID_REGEX.test(rawId);

  // 1. Obtener matrícula por UUID o por codigo_matricula (evita error PostgreSQL 22P02)
  const matriculaQuery = supabase.from('matriculas').select('*');
  const { data: matricula, error: matriculaError } = await (
    isUuid
      ? matriculaQuery.eq('id', rawId)
      : matriculaQuery.eq('codigo_matricula', rawId.toUpperCase())
  ).maybeSingle();

  if (matriculaError) {
    console.error('[Ficha] Error al obtener matrícula:', matriculaError);
    // Lanza error para no capturarlo ciegamente en notFound()
    throw new Error(`Error de base de datos al obtener matrícula: ${matriculaError.message}`);
  }

  if (!matricula) {
    notFound();
  }

  const warnings: string[] = [];

  // 2. Obtener estudiante y persona
  const { data: estudiante, error: estError } = await supabase
    .from('estudiantes')
    .select('codigo_estudiante, personas(nombres, apellido_paterno, apellido_materno, tipo_documento, numero_documento, email, telefono)')
    .eq('id', matricula.estudiante_id)
    .maybeSingle();

  if (estError) {
    console.error('[Ficha] Error al obtener estudiante:', estError);
    warnings.push(`No se pudieron cargar los datos del estudiante (${estError.message}). Verifique el permiso ESTUDIANTES.VER (RLS).`);
  } else if (!estudiante && matricula.estudiante_id) {
    warnings.push('No se encontraron los datos del estudiante asociado. Es posible que su rol no cuente con el permiso ESTUDIANTES.VER (restricción RLS).');
  }

  const persona = Array.isArray(estudiante?.personas) ? estudiante?.personas[0] : estudiante?.personas;
  if (estudiante && !persona) {
    warnings.push('No se pudieron leer los datos personales del estudiante. Verifique el permiso ESTUDIANTES.VER sobre la tabla personas (RLS).');
  }

  // 3. Obtener edición y relacionadas (incluyendo planes_estudio)
  const { data: edicion, error: edError } = await supabase
    .from('ediciones')
    .select('codigo, nombre, modalidad, turno, fecha_inicio, fecha_fin, programas(nombre, codigo, tipo_programa), planes_estudio(nombre, codigo), ciclos(nombre, numero_orden), periodos(nombre, codigo)')
    .eq('id', matricula.edicion_id)
    .maybeSingle();

  if (edError) {
    console.error('[Ficha] Error al obtener edición:', edError);
    warnings.push(`No se pudo cargar la información de la edición académica (${edError.message}). Verifique el permiso PROGRAMAS.VER (RLS).`);
  } else if (!edicion && matricula.edicion_id) {
    warnings.push('No se pudo acceder a la edición y programa académico. Es posible que su rol no cuente con el permiso PROGRAMAS.VER (restricción RLS).');
  }

  const programa = Array.isArray(edicion?.programas) ? edicion?.programas[0] : edicion?.programas;
  const planEstudio = Array.isArray(edicion?.planes_estudio) ? edicion?.planes_estudio[0] : edicion?.planes_estudio;
  const ciclo = Array.isArray(edicion?.ciclos) ? edicion?.ciclos[0] : edicion?.ciclos;
  const periodo = Array.isArray(edicion?.periodos) ? edicion?.periodos[0] : edicion?.periodos;

  // 4. Obtener cuotas
  const { data: cuotasRaw, error: cuotasError } = await supabase
    .from('cuotas')
    .select('id, tipo_cuota, numero_cuota, concepto, importe_original, descuento, importe_neto, fecha_vencimiento, status')
    .eq('matricula_id', matricula.id)
    .order('numero_cuota', { ascending: true });

  if (cuotasError) {
    console.error('[Ficha] Error al obtener cuotas:', cuotasError);
    warnings.push(`No se pudo cargar el cronograma de cuotas (${cuotasError.message}). Verifique el permiso COBRANZA.VER (RLS).`);
  } else if ((!cuotasRaw || cuotasRaw.length === 0) && matricula.status === 'ACTIVA') {
    warnings.push('No se encontraron cuotas visibles para esta matrícula activa. Verifique si su rol cuenta con el permiso COBRANZA.VER (restricción RLS).');
  }

  const cuotas = cuotasRaw?.sort((a, b) => {
    if (a.tipo_cuota !== b.tipo_cuota) {
      return a.tipo_cuota === 'MATRICULA' ? -1 : 1;
    }
    return (a.numero_cuota || 0) - (b.numero_cuota || 0);
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
      
      {/* Non-printable action bar */}
      <div className="flex justify-between items-center mb-6 print:hidden border-b pb-4">
        <Link 
          href={`/matriculas/${matricula.id}`}
          className="text-slate-600 hover:text-slate-900 font-medium text-sm flex items-center gap-2"
        >
          ← Volver a la matrícula
        </Link>
        <PrintButton />
      </div>

      {/* Bloque de diagnóstico de integridad / RLS (solo en pantalla) */}
      {warnings.length > 0 && (
        <div className="mb-6 p-4 rounded-md bg-amber-50 border-l-4 border-amber-600 text-amber-950 print:hidden">
          <div className="font-bold text-sm mb-1">Aviso de diagnóstico de datos / permisos (RLS)</div>
          <ul className="list-disc list-inside text-xs space-y-1">
            {warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

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
            <div className="inline-block mt-2 px-3 py-1 bg-slate-100 border border-slate-300 rounded font-semibold text-sm text-slate-800">
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
                  <td className="py-2 font-medium">
                    {persona ? `${persona.nombres || ''} ${persona.apellido_paterno || ''} ${persona.apellido_materno || ''}`.trim() : '-'}
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 text-slate-500">Documento</td>
                  <td className="py-2 font-medium">
                    {persona ? `${persona.tipo_documento || ''} ${persona.numero_documento || ''}`.trim() || '-' : '-'}
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 text-slate-500">Código de estudiante</td>
                  <td className="py-2 font-medium">{estudiante?.codigo_estudiante || '-'}</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 text-slate-500">Contacto</td>
                  <td className="py-2 font-medium">
                    {persona?.email && <div>{persona.email}</div>}
                    {persona?.telefono && <div>{persona.telefono}</div>}
                    {!persona?.email && !persona?.telefono && '-'}
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
                  <td className="py-2 font-medium">{programa?.nombre || '-'}</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 text-slate-500">Plan de Estudio</td>
                  <td className="py-2 font-medium">
                    {planEstudio ? `${planEstudio.nombre}${planEstudio.codigo ? ` (${planEstudio.codigo})` : ''}` : '-'}
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 text-slate-500">Edición / Ciclo</td>
                  <td className="py-2 font-medium">
                    {edicion?.codigo || '-'}
                    {ciclo ? ` - ${ciclo.nombre || `Ciclo ${ciclo.numero_orden}`}` : ''}
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 text-slate-500">Periodo</td>
                  <td className="py-2 font-medium">{periodo?.nombre || '-'}</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 text-slate-500">Modalidad / Turno</td>
                  <td className="py-2 font-medium">{edicion?.modalidad || '-'} / {edicion?.turno || '-'}</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 text-slate-500">Fecha de Matrícula</td>
                  <td className="py-2 font-medium">
                    {matricula.fecha_matricula
                      ? format(new Date(matricula.fecha_matricula + 'T00:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: es })
                      : matricula.created_at
                        ? format(new Date(matricula.created_at), "dd 'de' MMMM 'de' yyyy", { locale: es })
                        : '-'}
                  </td>
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
              <div className="font-bold">{persona?.nombres} {persona?.apellido_paterno} {persona?.apellido_materno}</div>
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
    </>
  );
}

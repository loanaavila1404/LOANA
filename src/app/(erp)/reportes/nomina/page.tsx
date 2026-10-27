import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/permissions';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PrintButton from '@/app/(erp)/matriculas/[id]/ficha/PrintButton';
import { BrusbenPdfHeader, BrusbenPdfFooter } from '@/components/ui/BrusbenPdfLayout';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, Users, GraduationCap, Calendar, Clock, MapPin } from 'lucide-react';

export const metadata = {
  title: 'Nómina Oficial de Estudiantes por Ciclo y Aula - ERP Brusben',
  description: 'Reporte oficial de estudiantes matriculados por programa, ciclo académico y aula.',
};

export default async function NominaEstudiantesPage({
  searchParams,
}: {
  searchParams: Promise<{ edicionId?: string; programaId?: string; cicloId?: string; print?: string }>;
}) {
  await requirePermission(['REPORTES.VER', 'ESTUDIANTES.VER', 'SISTEMA.ADMINISTRAR']);
  const resolvedSearch = await searchParams;
  const autoPrint = resolvedSearch?.print === '1';
  const supabase = await createClient();

  // 1. Obtener todas las ediciones para el selector rápido superior
  const { data: edicionesRaw } = await supabase
    .from('ediciones')
    .select(`
      id,
      codigo,
      nombre,
      modalidad,
      turno,
      vacantes,
      status,
      programa_id,
      ciclo_id,
      programas (id, codigo, nombre, tipo_programa),
      ciclos (id, nombre, numero_orden),
      periodos (id, codigo, nombre)
    `)
    .order('created_at', { ascending: false });

  const ediciones = edicionesRaw || [];

  // 2. Determinar la edición activa a mostrar
  let edicionSeleccionada = ediciones.find(e => e.id === resolvedSearch?.edicionId);
  if (!edicionSeleccionada && resolvedSearch?.programaId) {
    edicionSeleccionada = ediciones.find(e => e.programa_id === resolvedSearch.programaId);
  }
  if (!edicionSeleccionada && ediciones.length > 0) {
    edicionSeleccionada = ediciones[0];
  }

  // Si no hay ediciones en el sistema
  if (!edicionSeleccionada) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white">
        <div className="border border-slate-200 rounded-xl p-8 text-center space-y-3">
          <GraduationCap className="w-10 h-10 text-slate-400 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800">No hay ediciones o grupos registrados</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Para generar una nómina de aula, primero debe existir al menos una edición académica con matrículas registradas.
          </p>
          <Link
            href="/reportes"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
          >
            &larr; Volver a Reportes
          </Link>
        </div>
      </div>
    );
  }

  const prog = Array.isArray(edicionSeleccionada.programas)
    ? edicionSeleccionada.programas[0]
    : edicionSeleccionada.programas;
  const cic = Array.isArray(edicionSeleccionada.ciclos)
    ? edicionSeleccionada.ciclos[0]
    : edicionSeleccionada.ciclos;
  const per = Array.isArray(edicionSeleccionada.periodos)
    ? edicionSeleccionada.periodos[0]
    : edicionSeleccionada.periodos;

  const programaNombre = prog?.nombre || edicionSeleccionada.nombre || 'Programa de Formación';
  const programaCodigo = prog?.codigo || '-';
  const cicloNombre = cic?.nombre || (cic?.numero_orden ? `Ciclo ${cic.numero_orden}` : 'Ciclo Regular');
  const periodoNombre = per?.nombre || per?.codigo || 'Periodo Activo';
  const modalidadTurno = `${edicionSeleccionada.modalidad || 'Presencial'} · Turno ${edicionSeleccionada.turno || 'Regular'}`;

  // 3. Consultar matrículas de esta edición
  const { data: matriculasRaw } = await supabase
    .from('matriculas')
    .select(`
      id,
      codigo_matricula,
      status,
      fecha_matricula,
      estudiantes (
        id,
        codigo_estudiante,
        status,
        personas (
          id,
          tipo_documento,
          numero_documento,
          nombres,
          apellido_paterno,
          apellido_materno,
          telefono,
          email
        )
      )
    `)
    .eq('edicion_id', edicionSeleccionada.id)
    .neq('status', 'ANULADA')
    .order('created_at', { ascending: true });

  const matriculas = matriculasRaw || [];

  // Mapear y ordenar alfabéticamente por apellido
  const estudiantesList = matriculas
    .map((m: any, idx: number) => {
      const est = Array.isArray(m.estudiantes) ? m.estudiantes[0] : m.estudiantes;
      const per = Array.isArray(est?.personas) ? est?.personas[0] : est?.personas;
      const apellidos = `${per?.apellido_paterno || ''} ${per?.apellido_materno || ''}`.trim();
      const nombres = per?.nombres || '';
      const nombreCompleto = apellidos ? `${apellidos}, ${nombres}` : (nombres || 'Sin nombre');

      return {
        id: m.id,
        codigoMatricula: m.codigo_matricula,
        codigoEstudiante: est?.codigo_estudiante || 'Pendiente',
        documento: `${per?.tipo_documento || 'DNI'} ${per?.numero_documento || '-'}`,
        apellidos,
        nombres,
        nombreCompleto,
        telefono: per?.telefono || '-',
        email: per?.email || '',
        estadoMatricula: m.status || 'ACTIVA',
      };
    })
    .sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto, 'es', { sensitivity: 'base' }));

  const activosCount = estudiantesList.filter(e => e.estadoMatricula === 'ACTIVA').length;

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white text-slate-900 print:p-0 print:m-0 print:max-w-none print:min-h-0">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @page {
          size: A4 portrait;
          margin: 8mm 8mm 8mm 8mm;
        }
        @media print {
          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print, .print\\:hidden {
            display: none !important;
          }
          .nomina-pdf-card {
            border: none !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          thead {
            display: table-header-group !important;
          }
          tr {
            page-break-inside: avoid !important;
          }
        }
      `,
        }}
      />

      {/* Barra superior interactiva (no imprimible) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 print:hidden no-print border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/reportes"
            className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-md border border-slate-300 bg-slate-50 hover:bg-slate-100 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a Reportes</span>
          </Link>
          <span className="text-xs text-slate-500 hidden sm:inline">
            Nómina de aula oficial lista para impresión A4
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Selector interactivo de grupo/edición */}
          <form method="GET" action="/reportes/nomina" className="flex items-center gap-1.5">
            <label htmlFor="edicionId" className="text-[11px] font-bold text-slate-500 uppercase">
              Grupo:
            </label>
            <select
              id="edicionId"
              name="edicionId"
              defaultValue={edicionSeleccionada.id}
              className="text-xs font-semibold px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#C4121A]"
            >
              {ediciones.map(e => {
                const ep = Array.isArray(e.programas) ? e.programas[0] : e.programas;
                return (
                  <option key={e.id} value={e.id}>
                    {e.codigo} — {ep?.nombre || e.nombre || 'Programa'} ({e.turno || 'Regular'})
                  </option>
                );
              })}
            </select>
            <button
              type="submit"
              className="text-xs font-bold px-2.5 py-1.5 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-800 transition"
            >
              Cargar
            </button>
          </form>

          <PrintButton label="Imprimir Nómina (PDF)" autoPrint={autoPrint} />
        </div>
      </div>

      {/* Documento Imprimible A4 de Nómina Oficial */}
      <div className="nomina-pdf-card border border-slate-300 rounded-sm p-8 print:border-none print:p-0 bg-white space-y-5">
        <BrusbenPdfHeader
          documentType="NÓMINA OFICIAL DE ESTUDIANTES POR AULA"
          documentTitle={`${programaNombre} — ${cicloNombre}`}
          code={`NOM-${edicionSeleccionada.codigo}`}
          statusBadge="PADRÓN VIGENTE"
          statusColor="green"
        />

        {/* Ficha Técnica del Aula / Grupo */}
        <div className="grid grid-cols-2 md:grid-cols-4 print:grid-cols-4 gap-3 text-xs bg-slate-50/70 p-3.5 rounded-lg border border-slate-200">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500 block">
              Programa Académico
            </span>
            <span className="text-xs font-bold text-slate-900 block truncate" title={programaNombre}>
              {programaNombre}
            </span>
            <span className="text-[10px] font-mono text-slate-500 block">
              Cód: {programaCodigo}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500 block">
              Ciclo y Periodo
            </span>
            <span className="text-xs font-bold text-slate-900 block">
              {cicloNombre}
            </span>
            <span className="text-[10px] text-slate-600 block">
              {periodoNombre}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500 block">
              Modalidad / Turno
            </span>
            <span className="text-xs font-bold text-slate-900 block">
              {modalidadTurno}
            </span>
            <span className="text-[10px] text-slate-500 block">
              Grupo: {edicionSeleccionada.codigo}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500 block">
              Alumnos en Nómina
            </span>
            <span className="text-sm font-black text-slate-900 block">
              {estudiantesList.length}{' '}
              <span className="text-[10px] font-normal text-slate-500">
                ({activosCount} activos)
              </span>
            </span>
            <span className="text-[10px] text-slate-500 block">
              Aforo vacantes: {edicionSeleccionada.vacantes || '-'}
            </span>
          </div>
        </div>

        {/* Tabla Oficial de la Nómina */}
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white uppercase text-[9px] tracking-wider">
                <th className="border border-slate-300 py-2 px-2 text-center w-8">#</th>
                <th className="border border-slate-300 py-2 px-2.5 text-left">
                  Apellidos y Nombres del Estudiante
                </th>
                <th className="border border-slate-300 py-2 px-2 text-left w-24">
                  Documento
                </th>
                <th className="border border-slate-300 py-2 px-2 text-left w-24">
                  Cód. Alumno
                </th>
                <th className="border border-slate-300 py-2 px-2 text-left w-28">
                  Cód. Matrícula
                </th>
                <th className="border border-slate-300 py-2 px-2 text-center w-20">
                  Estado
                </th>
                <th className="border border-slate-300 py-2 px-3 text-center w-36">
                  Firma / Asistencia
                </th>
              </tr>
            </thead>
            <tbody>
              {estudiantesList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="border border-slate-300 py-8 text-center text-slate-500 italic">
                    No existen estudiantes matriculados en esta edición / grupo.
                  </td>
                </tr>
              ) : (
                estudiantesList.map((e, idx) => (
                  <tr key={e.id} className="even:bg-slate-50/60 break-inside-avoid">
                    <td className="border border-slate-300 py-2 px-2 text-center font-mono text-slate-600">
                      {idx + 1}
                    </td>
                    <td className="border border-slate-300 py-2 px-2.5 font-bold text-slate-900">
                      <div>{e.nombreCompleto}</div>
                      {e.telefono && e.telefono !== '-' && (
                        <div className="text-[9px] font-normal text-slate-500">
                          Telf: {e.telefono}
                        </div>
                      )}
                    </td>
                    <td className="border border-slate-300 py-2 px-2 font-mono text-slate-800">
                      {e.documento}
                    </td>
                    <td className="border border-slate-300 py-2 px-2 font-mono font-bold text-slate-800">
                      {e.codigoEstudiante}
                    </td>
                    <td className="border border-slate-300 py-2 px-2 font-mono text-slate-700">
                      {e.codigoMatricula}
                    </td>
                    <td className="border border-slate-300 py-2 px-2 text-center font-bold">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[9.5px] uppercase ${
                          e.estadoMatricula === 'ACTIVA'
                            ? 'bg-emerald-50 text-emerald-800 font-extrabold'
                            : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {e.estadoMatricula}
                      </span>
                    </td>
                    <td className="border border-slate-300 py-2 px-3 text-center">
                      <div className="h-6 border-b border-dashed border-slate-300" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pie de página oficial con solo firma institucional (sin firma de alumno) */}
        <BrusbenPdfFooter
          singleSignature={true}
          rightSignatureLabel="Sello y Firma Autorizada — Dirección Académica / Control Escolar Brusben"
          verificationCode={`NOM-${edicionSeleccionada.codigo}`}
        />
      </div>
    </div>
  );
}

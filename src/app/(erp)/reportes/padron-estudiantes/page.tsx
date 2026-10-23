import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/permissions";
import Link from "next/link";
import PrintButton from "@/app/(erp)/matriculas/[id]/ficha/PrintButton";
import { BrusbenPdfHeader, BrusbenPdfFooter } from "@/components/ui/BrusbenPdfLayout";
import { checkPersonaIntegrity } from "@/lib/utils/personaUtils";

export const metadata = {
  title: "Padrón Institucional de Estudiantes (PDF) - ERP Brusben",
};

export default async function PadronEstudiantesPdfPage({
  searchParams,
}: {
  searchParams: Promise<{ print?: string }>;
}) {
  await requirePermission([
    "ESTUDIANTES.VER",
    "ESTUDIANTES.EDITAR",
    "REPORTES.VER",
    "SISTEMA.ADMINISTRAR",
  ]);

  const resolvedSearch = await searchParams;
  const autoPrint = resolvedSearch?.print === "1";
  const supabase = await createClient();

  const { data: personasRaw } = await supabase
    .from("personas")
    .select(
      `
      *,
      estudiantes (
        id,
        codigo_estudiante,
        status,
        fecha_ingreso,
        observaciones,
        matriculas (
          id,
          codigo_matricula,
          status,
          fecha_matricula,
          ediciones (
            id,
            codigo,
            nombre,
            modalidad,
            turno,
            programas (
              id,
              nombre,
              codigo
            )
          )
        )
      )
    `
    )
    .order("apellido_paterno", { ascending: true });

  const personas = personasRaw || [];

  let totalEstudiantes = 0;
  let totalMatriculadosActivos = 0;
  let totalExpedientesCompletos = 0;

  const filas = personas.map((p: any, idx: number) => {
    const estArr = Array.isArray(p.estudiantes)
      ? p.estudiantes
      : p.estudiantes
        ? [p.estudiantes]
        : [];
    const est = estArr[0] || null;
    if (est) totalEstudiantes++;

    const matArr = Array.isArray(est?.matriculas)
      ? est.matriculas
      : est?.matriculas
        ? [est.matriculas]
        : [];
    const matPrincipal =
      matArr.find((m: any) => (m.status || "").toUpperCase() === "ACTIVA") ||
      matArr.find((m: any) => (m.status || "").toUpperCase() === "FINALIZADA") ||
      matArr[0] ||
      null;

    if ((matPrincipal?.status || "").toUpperCase() === "ACTIVA") {
      totalMatriculadosActivos++;
    }

    const edicion = Array.isArray(matPrincipal?.ediciones)
      ? matPrincipal.ediciones[0]
      : matPrincipal?.ediciones || null;
    const programa = Array.isArray(edicion?.programas)
      ? edicion.programas[0]
      : edicion?.programas || null;

    const integridad = checkPersonaIntegrity(p, est, Boolean(matPrincipal));
    if (integridad.completo) totalExpedientesCompletos++;

    return {
      nro: idx + 1,
      nombreCompleto: `${p.apellido_paterno || ""} ${p.apellido_materno || ""}, ${
        p.nombres || ""
      }`.trim(),
      documento: `${p.tipo_documento || "DNI"} ${p.numero_documento || "-"}`,
      codigo:
        matPrincipal?.codigo_matricula ||
        est?.codigo_estudiante ||
        "SIN CÓDIGO",
      programa: programa?.nombre || "Por asignar",
      modalidadTurno: edicion
        ? `${edicion.modalidad || "PRESENCIAL"} / ${edicion.turno || "Regular"}`
        : "PRESENCIAL / Regular",
      contacto: [p.telefono, p.email].filter(Boolean).join(" · ") || "Sin contacto",
      estado: matPrincipal?.status || p.status || "ACTIVO",
      expediente: `${integridad.porcentaje}%`,
    };
  });

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white text-slate-900 print:p-0 print:m-0 print:max-w-none print:min-h-0">
      {/* Barra superior no imprimible */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6 print:hidden no-print border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/personas"
            className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-md border border-slate-300 bg-slate-50 hover:bg-slate-100"
          >
            &larr; Volver al Padrón de Estudiantes
          </Link>
          <span className="text-xs text-slate-500">
            Vista oficial A4 lista para impresión o exportación a PDF
          </span>
        </div>
        <PrintButton autoPrint={autoPrint} label="Imprimir / Guardar Padrón PDF" />
      </div>

      {/* Documento Imprimible A4 */}
      <div className="border border-slate-300 rounded-sm p-8 print:border-none print:p-0 bg-white space-y-6">
        <BrusbenPdfHeader
          documentType="PADRÓN INSTITUCIONAL DE PERSONAS Y ESTUDIANTES"
          documentTitle="Registro Oficial de Identidad, Asignación Académica y Estado Documental"
          code="PAD-EST-2026"
          statusBadge="OFICIAL"
          statusColor="green"
        />

        {/* Resumen Ejecutivo */}
        <div className="grid grid-cols-4 gap-3 text-xs">
          <div className="border border-slate-300 rounded p-3 bg-slate-50/70">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">
              Total en Padrón
            </span>
            <span className="text-lg font-extrabold text-slate-900">
              {personas.length}
            </span>
          </div>
          <div className="border border-slate-300 rounded p-3 bg-slate-50/70">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">
              Estudiantes Habilitados
            </span>
            <span className="text-lg font-extrabold text-slate-900">
              {totalEstudiantes}
            </span>
          </div>
          <div className="border border-slate-300 rounded p-3 bg-slate-50/70">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">
              Matrículas Activas
            </span>
            <span className="text-lg font-extrabold text-emerald-700">
              {totalMatriculadosActivos}
            </span>
          </div>
          <div className="border border-slate-300 rounded p-3 bg-slate-50/70">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">
              Expedientes al 100%
            </span>
            <span className="text-lg font-extrabold text-[#C4121A]">
              {totalExpedientesCompletos}
            </span>
          </div>
        </div>

        {/* Tabla del Padrón */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="bg-slate-900 text-white uppercase text-[9.5px] tracking-wider">
                <th className="border border-slate-300 py-2 px-2 text-center w-8">#</th>
                <th className="border border-slate-300 py-2 px-2.5 text-left">
                  Apellidos y Nombres
                </th>
                <th className="border border-slate-300 py-2 px-2 text-left">
                  Documento
                </th>
                <th className="border border-slate-300 py-2 px-2 text-left">
                  Cód. Matrícula / Est.
                </th>
                <th className="border border-slate-300 py-2 px-2.5 text-left">
                  Programa Académico
                </th>
                <th className="border border-slate-300 py-2 px-2 text-left">
                  Modalidad / Turno
                </th>
                <th className="border border-slate-300 py-2 px-2 text-center">
                  Expediente
                </th>
                <th className="border border-slate-300 py-2 px-2 text-center">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {filas.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="border border-slate-300 py-6 text-center text-slate-500"
                  >
                    No hay registros en el padrón institucional.
                  </td>
                </tr>
              ) : (
                filas.map(f => (
                  <tr key={f.nro} className="even:bg-slate-50/60 break-inside-avoid">
                    <td className="border border-slate-300 py-1.5 px-2 text-center font-mono text-slate-500">
                      {f.nro}
                    </td>
                    <td className="border border-slate-300 py-1.5 px-2.5 font-bold text-slate-900">
                      <div>{f.nombreCompleto}</div>
                      <div className="text-[9.5px] font-normal text-slate-500">
                        {f.contacto}
                      </div>
                    </td>
                    <td className="border border-slate-300 py-1.5 px-2 font-mono text-slate-800">
                      {f.documento}
                    </td>
                    <td className="border border-slate-300 py-1.5 px-2 font-mono font-semibold text-slate-800">
                      {f.codigo}
                    </td>
                    <td className="border border-slate-300 py-1.5 px-2.5 text-slate-800">
                      {f.programa}
                    </td>
                    <td className="border border-slate-300 py-1.5 px-2 text-slate-700">
                      {f.modalidadTurno}
                    </td>
                    <td className="border border-slate-300 py-1.5 px-2 text-center font-bold text-slate-800">
                      {f.expediente}
                    </td>
                    <td className="border border-slate-300 py-1.5 px-2 text-center font-bold text-slate-800">
                      {f.estado}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <BrusbenPdfFooter />
      </div>
    </div>
  );
}

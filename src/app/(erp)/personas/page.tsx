import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Users,
  GraduationCap,
  Clock,
  FileWarning,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Eye,
  FileText,
} from "lucide-react";
import { getPersonas, getPersonasMetrics, PersonaSearchParams } from "@/app/actions/personas";
import { hasPermission } from "@/lib/auth/permissions";
import { PersonaFormModal } from "@/components/features/personas/PersonaFormModal";
import { checkPersonaIntegrity } from "@/lib/utils/personaUtils";
import Link from "next/link";
import { getInitials } from "@/lib/utils";

export const metadata = {
  title: "Padrón de Personas y Estudiantes - ERP Brusben",
};

export default async function PersonasPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;

  const canEdit = await hasPermission(["ESTUDIANTES.EDITAR", "SISTEMA.ADMINISTRAR"]);

  const q = typeof resolvedParams.q === "string" ? resolvedParams.q : undefined;
  const status = typeof resolvedParams.status === "string" ? resolvedParams.status : "TODOS";
  const tab = typeof resolvedParams.tab === "string" ? resolvedParams.tab.toUpperCase() : "TODOS";
  const es_estudiante =
    typeof resolvedParams.es_estudiante === "string" ? resolvedParams.es_estudiante : "TODOS";
  const page = typeof resolvedParams.page === "string" ? parseInt(resolvedParams.page, 10) : 1;

  const params: PersonaSearchParams = {
    q,
    status,
    tab,
    es_estudiante,
    page,
    limit: 12,
  };

  const [{ data: personas, count, totalPages }, metrics] = await Promise.all([
    getPersonas(params),
    getPersonasMetrics(),
  ]);

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const urlParams = new URLSearchParams();
    const merged: Record<string, string | undefined> = {
      q,
      status: status !== "TODOS" ? status : undefined,
      tab: tab !== "TODOS" ? tab : undefined,
      es_estudiante: es_estudiante !== "TODOS" ? es_estudiante : undefined,
      page: page > 1 ? String(page) : undefined,
      ...overrides,
    };

    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== "TODOS") {
        urlParams.set(k, v);
      }
    }
    const qs = urlParams.toString();
    return qs ? `/personas?${qs}` : "/personas";
  };

  const academicTabs = [
    {
      key: "TODOS",
      label: "Todos los estudiantes",
      count: metrics.countTodos,
    },
    {
      key: "ACTIVOS",
      label: "Activos",
      count: metrics.countActivos,
    },
    {
      key: "EGRESADOS",
      label: "Egresados / Graduados",
      count: metrics.countEgresados,
    },
    {
      key: "INACTIVOS",
      label: "Inactivos / Retirados",
      count: metrics.countInactivos,
    },
  ];

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-10">
      {/* Encabezado Institucional */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-50 border border-red-100 text-[#C4121A] text-[11px] font-bold uppercase tracking-wider mb-2">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Registro Académico e Identidad</span>
          </div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight">
            Padrón Institucional de Personas y Estudiantes
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Control centralizado de expedientes estudiantiles, estado académico, validación documental y matrículas vinculadas.
          </p>
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Link
            href="/reportes/padron_estudiantes"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition"
          >
            <FileText className="w-3.5 h-3.5 text-[#C4121A]" />
            <span>Exportar Padrón PDF</span>
          </Link>
          <div className="flex-1 sm:flex-none">{canEdit && <PersonaFormModal />}</div>
        </div>
      </div>

      {/* 1. Tarjetas de Indicadores Superiores (Stitch) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Inscritos en Padrón */}
        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Inscritos en Padrón
              </span>
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2.5">
              <span className="text-3xl font-extrabold text-slate-900">
                {metrics.totalPersonas}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                registros verificados
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              +{metrics.estudiantesNuevos} incorporaciones en los últimos 30 días
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Estudiantes Activos / Matriculados (con porcentaje) */}
        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Estudiantes Activos
              </span>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <GraduationCap className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2.5">
              <span className="text-3xl font-extrabold text-slate-900">
                {metrics.estudiantesActivos}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {metrics.porcentajeActivos}% del padrón
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Con matrícula vigente o habilitación académica activa
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: En Reserva / Inactivos */}
        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                En Reserva / Inactivos
              </span>
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2.5">
              <span className="text-3xl font-extrabold text-slate-900">
                {metrics.enReservaOInactivos}
              </span>
              <span className="text-xs font-semibold text-amber-700">
                {metrics.personasInactivas} baja / {Math.max(0, metrics.enReservaOInactivos - metrics.personasInactivas)} reserva
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Vacantes reservadas, prematrículas o retiros temporales
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Expedientes con Observaciones / Incompletos */}
        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Expedientes Observados
              </span>
              <div className="w-9 h-9 rounded-lg bg-red-50 text-[#C4121A] flex items-center justify-center">
                <FileWarning className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2.5">
              <span className="text-3xl font-extrabold text-slate-900">
                {metrics.expedientesObservados}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-[#C4121A] border border-red-200">
                Requieren validación
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Certificados, datos de contacto o código estudiantil pendientes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 2. Barra de Pestañas de Estado Académico + Filtros */}
      <Card className="bg-white border-slate-200 shadow-2xs">
        <CardContent className="p-4 space-y-4">
          {/* Pestañas de Estado Académico */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="inline-flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200/80">
              {academicTabs.map(item => {
                const isActiveTab = tab === item.key;
                return (
                  <Link
                    key={item.key}
                    href={buildUrl({ tab: item.key, page: "1" })}
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition ${
                      isActiveTab
                        ? "bg-white text-[#C4121A] shadow-2xs border border-slate-200/60"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        isActiveTab
                          ? "bg-red-50 text-[#C4121A]"
                          : "bg-slate-200/70 text-slate-600"
                      }`}
                    >
                      {item.count}
                    </span>
                  </Link>
                );
              })}
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Mostrando <strong className="text-slate-800">{personas.length}</strong> de{" "}
              <strong className="text-slate-800">{count}</strong> registros filtrados
            </div>
          </div>

          {/* Buscador y Filtros Secundarios */}
          <form action="/personas" method="GET" className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            {tab !== "TODOS" && <input type="hidden" name="tab" value={tab} />}
            <div className="sm:col-span-5 space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Buscar por estudiante, DNI o correo
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  name="q"
                  defaultValue={q}
                  placeholder="Ej. García, 74859632, correo@..."
                  className="pl-9 bg-slate-50 border-slate-200 text-slate-900 text-xs h-9"
                />
              </div>
            </div>

            <div className="sm:col-span-3 space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Estado de Registro
              </label>
              <Select
                name="status"
                defaultValue={status}
                className="bg-slate-50 border-slate-200 text-slate-800 text-xs h-9"
              >
                <option value="TODOS">Todos los estados</option>
                <option value="ACTIVO">Registros Activos</option>
                <option value="INACTIVO">Registros Inactivos</option>
              </Select>
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Vínculo Académico
              </label>
              <Select
                name="es_estudiante"
                defaultValue={es_estudiante}
                className="bg-slate-50 border-slate-200 text-slate-800 text-xs h-9"
              >
                <option value="TODOS">Todo el padrón</option>
                <option value="true">Solo Estudiantes</option>
                <option value="false">Solo Personas sin ficha</option>
              </Select>
            </div>

            <div className="sm:col-span-2 flex items-center gap-2">
              <Button
                type="submit"
                className="w-full bg-[#C4121A] hover:bg-[#a00e15] text-white text-xs font-bold h-9"
              >
                Aplicar filtro
              </Button>
              {(q || status !== "TODOS" || es_estudiante !== "TODOS" || tab !== "TODOS") && (
                <Link
                  href="/personas"
                  className="inline-flex items-center justify-center px-3 h-9 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-600"
                >
                  Limpiar
                </Link>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 3. Tabla Institucional Moderna */}
      <Card className="bg-white border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Estudiante / Identidad</th>
                <th className="py-3.5 px-3">Código de Matrícula</th>
                <th className="py-3.5 px-3">Programa &amp; Sede</th>
                <th className="py-3.5 px-3">Modalidad / Turno</th>
                <th className="py-3.5 px-3">Estado Académico</th>
                <th className="py-3.5 px-3">Expediente Documentario</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {personas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No se encontraron estudiantes o personas con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                personas.map((persona: any) => {
                  const estArr = Array.isArray(persona.estudiantes)
                    ? persona.estudiantes
                    : persona.estudiantes
                      ? [persona.estudiantes]
                      : [];
                  const estudiante = estArr[0];
                  const isEstudiante = Boolean(estudiante);

                  const matArr = Array.isArray(estudiante?.matriculas)
                    ? estudiante.matriculas
                    : estudiante?.matriculas
                      ? [estudiante.matriculas]
                      : [];

                  // Priorizar matrícula ACTIVA, luego FINALIZADA, luego la más reciente
                  const matriculaPrincipal =
                    matArr.find((m: any) => (m.status || "").toUpperCase() === "ACTIVA") ||
                    matArr.find((m: any) => (m.status || "").toUpperCase() === "FINALIZADA") ||
                    matArr[0] ||
                    null;

                  const edicion = Array.isArray(matriculaPrincipal?.ediciones)
                    ? matriculaPrincipal.ediciones[0]
                    : matriculaPrincipal?.ediciones;
                  const programa = Array.isArray(edicion?.programas)
                    ? edicion.programas[0]
                    : edicion?.programas;

                  const hasActiveMat = Boolean(
                    matriculaPrincipal &&
                      ["ACTIVA", "FINALIZADA", "RESERVADA"].includes(
                        (matriculaPrincipal.status || "").toUpperCase()
                      )
                  );
                  const integridad = checkPersonaIntegrity(persona, estudiante, hasActiveMat);

                  // Determinar Estado Académico para badge
                  const pStatus = (persona.status || "ACTIVO").toUpperCase();
                  const mStatus = (matriculaPrincipal?.status || "").toUpperCase();

                  let estadoAcademicoLabel = "Inscrito en Padrón";
                  let estadoAcademicoClass =
                    "bg-slate-100 text-slate-700 border-slate-200";

                  if (pStatus === "INACTIVO" || mStatus === "RETIRADA" || mStatus === "ANULADA") {
                    estadoAcademicoLabel = mStatus === "RETIRADA" ? "Retirado" : "Inactivo";
                    estadoAcademicoClass = "bg-rose-50 text-rose-700 border-rose-200";
                  } else if (mStatus === "FINALIZADA") {
                    estadoAcademicoLabel = "Egresado / Graduado";
                    estadoAcademicoClass = "bg-indigo-50 text-indigo-700 border-indigo-200";
                  } else if (mStatus === "ACTIVA") {
                    estadoAcademicoLabel = "Matriculado Activo";
                    estadoAcademicoClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
                  } else if (mStatus === "RESERVADA" || mStatus === "PREMATRICULA") {
                    estadoAcademicoLabel =
                      mStatus === "RESERVADA" ? "En Reserva" : "Prematrícula";
                    estadoAcademicoClass = "bg-amber-50 text-amber-700 border-amber-200";
                  } else if (isEstudiante) {
                    estadoAcademicoLabel = "Estudiante Habilitado";
                    estadoAcademicoClass = "bg-sky-50 text-sky-700 border-sky-200";
                  }

                  const sedeNombre = persona.distrito
                    ? `Sede Central · ${persona.distrito}`
                    : "Sede Central Brusben";

                  return (
                    <tr
                      key={persona.id}
                      className="hover:bg-slate-50/90 transition-colors group"
                    >
                      {/* Col 1: Avatar, Nombres y DNI */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-red-50 border border-red-200 text-[#C4121A] font-extrabold text-xs flex items-center justify-center shrink-0">
                            {getInitials(persona.nombres || "", persona.apellido_paterno || "")}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/personas/${persona.id}`}
                              className="font-bold text-slate-900 hover:text-[#C4121A] transition-colors block truncate"
                            >
                              {persona.apellido_paterno} {persona.apellido_materno || ""},{" "}
                              {persona.nombres}
                            </Link>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <span className="font-mono font-semibold text-slate-700">
                                {persona.tipo_documento || "DNI"}: {persona.numero_documento}
                              </span>
                              {persona.telefono && (
                                <>
                                  <span>·</span>
                                  <span>{persona.telefono}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Col 2: Código de Matrícula / Estudiante */}
                      <td className="py-3.5 px-3">
                        {matriculaPrincipal ? (
                          <div>
                            <span className="font-mono font-bold text-slate-800 block">
                              {matriculaPrincipal.codigo_matricula}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              Est: {estudiante?.codigo_estudiante || "Asignado"}
                            </span>
                          </div>
                        ) : isEstudiante ? (
                          <div>
                            <span className="font-mono font-bold text-slate-700 block">
                              {estudiante?.codigo_estudiante || "EST-PENDIENTE"}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Sin matrícula activa
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Sin código estudiantil
                          </span>
                        )}
                      </td>

                      {/* Col 3: Programa y Sede */}
                      <td className="py-3.5 px-3">
                        {programa ? (
                          <div>
                            <p className="font-semibold text-slate-800 truncate max-w-[230px]">
                              {programa.nombre}
                            </p>
                            <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{sedeNombre}</span>
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-slate-500 font-medium">
                              Por asignar programa
                            </p>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{sedeNombre}</span>
                            </p>
                          </div>
                        )}
                      </td>

                      {/* Col 4: Modalidad / Turno */}
                      <td className="py-3.5 px-3">
                        {edicion ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {edicion.modalidad || "PRESENCIAL"}
                            </span>
                            <p className="text-[11px] text-slate-500 pl-0.5">
                              Turno: {edicion.turno || "Regular"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            Presencial / Regular
                          </span>
                        )}
                      </td>

                      {/* Col 5: Estado Académico */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${estadoAcademicoClass}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {estadoAcademicoLabel}
                        </span>
                      </td>

                      {/* Col 6: Estado del Expediente Documentario */}
                      <td className="py-3.5 px-3">
                        {integridad.completo ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Expediente 100%</span>
                          </div>
                        ) : (
                          <div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
                              <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                              <span>Expediente {integridad.porcentaje}%</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[170px]">
                              {integridad.mensaje}
                            </p>
                          </div>
                        )}
                      </td>

                      {/* Col 7: Acciones directas hacia el perfil */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {matriculaPrincipal && (
                            <Link
                              href={`/matriculas/${matriculaPrincipal.id}/ficha`}
                              title="Ver Ficha de Matrícula A4"
                              className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-[#C4121A] hover:border-red-200 hover:bg-red-50/50 transition"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </Link>
                          )}
                          <Link
                            href={`/personas/${persona.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-[#C4121A] text-white text-xs font-bold transition shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ficha 360°</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-600">
            <p>
              Página <strong className="text-slate-900">{page}</strong> de{" "}
              <strong className="text-slate-900">{totalPages}</strong> ({count} registros)
            </p>
            <div className="flex gap-2">
              <Link
                href={page > 1 ? buildUrl({ page: String(page - 1) }) : "#"}
                className={page <= 1 ? "pointer-events-none opacity-50" : ""}
              >
                <Button
                  variant="outline"
                  className="h-8 text-xs border-slate-200 bg-white"
                  disabled={page <= 1}
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Anterior
                </Button>
              </Link>
              <Link
                href={page < totalPages ? buildUrl({ page: String(page + 1) }) : "#"}
                className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
              >
                <Button
                  variant="outline"
                  className="h-8 text-xs border-slate-200 bg-white"
                  disabled={page >= totalPages}
                >
                  Siguiente <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

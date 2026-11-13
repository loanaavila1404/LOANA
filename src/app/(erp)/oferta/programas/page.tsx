import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/permissions";
import { Card, CardContent } from "@/components/ui/Card";
import {
  GraduationCap,
  BookOpen,
  Users,
  BarChart3,
  Building2,
  Monitor,
  Layers,
  Award,
  Clock,
} from "lucide-react";
import { OfertaProgramasClient } from "@/components/features/oferta/OfertaProgramasClient";

export const metadata = {
  title: "Oferta Académica y Catálogo de Programas - ERP Brusben",
};

export default async function ProgramasPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requirePermission(["PROGRAMAS.VER", "SISTEMA.ADMINISTRAR"]);
  const supabase = await createClient();
  const sp = await searchParams;
  const initialTab = sp?.tab || "programas";

  const [
    { data: programasRaw },
    { data: edicionesRaw },
    { data: cursosRaw },
    { data: planesRaw },
    { data: periodosRaw },
    { data: ciclosRaw },
    { data: matriculasRaw },
  ] = await Promise.all([
    supabase.from("programas").select("*").order("created_at", { ascending: false }),
    supabase
      .from("ediciones")
      .select("*, programas(id, nombre, codigo), periodos(id, nombre, codigo), planes_estudio(id, nombre, codigo)")
      .order("created_at", { ascending: false }),
    supabase.from("cursos").select("*").order("codigo", { ascending: true }),
    supabase.from("planes_estudio").select("*").order("created_at", { ascending: false }),
    supabase.from("periodos").select("id, nombre, codigo").eq("status", "ACTIVO"),
    supabase.from("ciclos").select("id, nombre, plan_id, numero_orden").order("numero_orden"),
    supabase
      .from("matriculas")
      .select("edicion_id")
      .in("status", ["ACTIVA", "RESERVADA", "PREMATRICULA", "FINALIZADA"]),
  ]);

  const programas = programasRaw || [];
  const ediciones = edicionesRaw || [];
  const cursos = cursosRaw || [];
  const planes = planesRaw || [];
  const periodos = periodosRaw || [];
  const ciclos = ciclosRaw || [];
  const matriculas = matriculasRaw || [];

  // Mapa de ocupación por edición
  const matriculasCountByEdicion: Record<string, number> = {};
  for (const m of matriculas) {
    if (m.edicion_id) {
      matriculasCountByEdicion[m.edicion_id] =
        (matriculasCountByEdicion[m.edicion_id] || 0) + 1;
    }
  }

  // Cálculo de los 4 KPIs Superiores Reales
  const programasActivos = programas.filter(
    p => (p.status || "").toUpperCase() === "ACTIVO"
  );
  const carrerasTecnicasCount = programasActivos.filter(
    p => p.tipo_programa === "CARRERA_TECNICA"
  ).length;
  const certificacionesCount = Math.max(
    0,
    programasActivos.length - carrerasTecnicasCount
  );

  const cursosActivos = cursos.filter(
    c => (c.status || "ACTIVO").toUpperCase() === "ACTIVO"
  );
  const totalCreditosDictados = cursosActivos.reduce(
    (acc, c) => acc + Number(c.creditos || 0),
    0
  );

  const edicionesActivas = ediciones.filter(
    e => (e.status || "").toUpperCase() === "ACTIVO"
  );

  let totalVacantesOfertadas = 0;
  let totalVacantesOcupadas = 0;
  for (const ed of edicionesActivas) {
    totalVacantesOfertadas += Number(ed.vacantes || 30);
    totalVacantesOcupadas += matriculasCountByEdicion[ed.id] || 0;
  }
  const porcentajeOcupacionGlobal =
    totalVacantesOfertadas > 0
      ? Math.min(100, Math.round((totalVacantesOcupadas / totalVacantesOfertadas) * 100))
      : 0;

  // Desglose por Modalidad y Horas Pedagógicas Totales
  const countPresencial = edicionesActivas.filter(
    e => (e.modalidad || "PRESENCIAL").toUpperCase() === "PRESENCIAL"
  ).length;
  const countSemipresencial = edicionesActivas.filter(e =>
    (e.modalidad || "").toUpperCase().includes("SEMI")
  ).length;
  const countVirtual = edicionesActivas.filter(e =>
    (e.modalidad || "").toUpperCase().includes("VIRTUAL")
  ).length;

  const totalHorasSemanales = cursosActivos.reduce(
    (acc, c) => acc + Number(c.horas_semanales || 4),
    0
  );
  const horasPedagogicasTotales =
    totalHorasSemanales > 0 ? totalHorasSemanales * 16 : programasActivos.length * 240;

  return (
    <div className="space-y-6">
      {/* 1. TARJETAS DE INDICADORES SUPERIORES (4 KPIs STITCH) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total de Programas Activos (Carreras vs Certificaciones) */}
        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Programas Activos
              </span>
              <div className="w-9 h-9 rounded-lg bg-red-50 text-[#C4121A] flex items-center justify-center">
                <GraduationCap className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2.5">
              <span className="text-3xl font-extrabold text-slate-900">
                {programasActivos.length}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                de {programas.length} registrados
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1.5 font-medium">
              <strong className="text-slate-900">{carrerasTecnicasCount}</strong> Carreras Técnicas ·{" "}
              <strong className="text-slate-900">{certificacionesCount}</strong> Certificaciones
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Cursos y Módulos Dictados en Mallas Curriculares */}
        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Cursos y Módulos
              </span>
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2.5">
              <span className="text-3xl font-extrabold text-slate-900">
                {cursosActivos.length}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {periodos.length} periodos oficiales
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1.5">
              {ciclos.length} ciclos formativos · {totalCreditosDictados} créditos acumulados
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Ediciones / Grupos Activos (con indicador de sedes y aulas) */}
        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Ediciones / Grupos Activos
              </span>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2.5">
              <span className="text-3xl font-extrabold text-slate-900">
                {edicionesActivas.length}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Sede Central · Aulas
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1.5">
              Grupos abiertos en turnos Mañana, Tarde, Noche y Dominical
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Ocupación Global de Vacantes (Barra de progreso porcentual) */}
        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Ocupación de Vacantes
              </span>
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-slate-900">
                {porcentajeOcupacionGlobal}%
              </span>
              <span className="text-xs font-bold text-slate-600">
                {totalVacantesOcupadas} / {totalVacantesOfertadas} cupos
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-[#C4121A] rounded-full transition-all duration-300"
                style={{ width: `${porcentajeOcupacionGlobal}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              {Math.max(0, totalVacantesOfertadas - totalVacantesOcupadas)} vacantes disponibles para admisión
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 2. BARRA DE RESUMEN DE MODALIDADES, HORAS PEDAGÓGICAS Y AVAL INSTITUCIONAL */}
      <div className="bg-gradient-to-r from-[#181A1F] to-slate-800 rounded-2xl p-4 sm:p-5 text-white shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-red-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                Modalidad Presencial
              </span>
              <span className="text-sm font-extrabold">
                {countPresencial} grupos activos
              </span>
            </div>
          </div>

          <div className="h-7 w-px bg-white/10 hidden sm:block" />

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-amber-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                Semipresencial
              </span>
              <span className="text-sm font-extrabold">
                {countSemipresencial} grupos híbridos
              </span>
            </div>
          </div>

          <div className="h-7 w-px bg-white/10 hidden sm:block" />

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-sky-400">
              <Monitor className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                Campus Virtual
              </span>
              <span className="text-sm font-extrabold">
                {countVirtual} grupos sincrónicos
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/10 text-xs">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 font-semibold text-slate-200">
            <Clock className="w-3.5 h-3.5 text-red-400" />
            <span>{horasPedagogicasTotales.toLocaleString("es-PE")} hrs pedagógicas totales</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C4121A] font-bold text-white shadow-2xs">
            <Award className="w-3.5 h-3.5" />
            <span>Aval Institucional Brusben Vigente</span>
          </span>
        </div>
      </div>

      {/* 3. PESTAÑAS Y CATÁLOGO VISUAL DE PROGRAMAS */}
      <OfertaProgramasClient
        programas={programas}
        ediciones={ediciones}
        cursos={cursos}
        planes={planes}
        periodos={periodos}
        ciclos={ciclos}
        matriculasCountByEdicion={matriculasCountByEdicion}
        initialTab={initialTab}
      />
    </div>
  );
}

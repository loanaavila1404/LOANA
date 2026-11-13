import { Button } from "@/components/ui/Button";
import { getPersonaById } from "@/app/actions/personas";
import { hasPermission, requirePermission } from "@/lib/auth/permissions";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { notFound } from "next/navigation";
import { checkPersonaIntegrity } from "@/lib/utils/personaUtils";
import { Persona360Client } from "@/components/features/personas/Persona360Client";

export const metadata = {
  title: "Ficha 360° del Estudiante - ERP Brusben",
};

export default async function PersonaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(["ESTUDIANTES.VER", "SISTEMA.ADMINISTRAR"]);
  const { id } = await params;

  const canEdit = await hasPermission(["ESTUDIANTES.EDITAR", "SISTEMA.ADMINISTRAR"]);

  let persona: any;
  try {
    persona = await getPersonaById(id);
  } catch {
    notFound();
  }

  const estudianteArray = Array.isArray(persona.estudiantes)
    ? persona.estudiantes
    : persona.estudiantes
      ? [persona.estudiantes]
      : [];
  const estudiante = estudianteArray[0] || null;
  const isEstudiante = Boolean(estudiante);

  const matriculas = Array.isArray(persona.matriculas_detalle)
    ? persona.matriculas_detalle
    : [];

  const matriculaPrincipal =
    matriculas.find((m: any) => (m.status || "").toUpperCase() === "ACTIVA") ||
    matriculas.find((m: any) => (m.status || "").toUpperCase() === "FINALIZADA") ||
    matriculas[0] ||
    null;

  const edicionPrincipal = Array.isArray(matriculaPrincipal?.ediciones)
    ? matriculaPrincipal.ediciones[0]
    : matriculaPrincipal?.ediciones || null;

  const programaPrincipal = Array.isArray(edicionPrincipal?.programas)
    ? edicionPrincipal.programas[0]
    : edicionPrincipal?.programas || null;

  const planPrincipal = Array.isArray(edicionPrincipal?.planes_estudio)
    ? edicionPrincipal.planes_estudio[0]
    : edicionPrincipal?.planes_estudio || null;

  const cicloPrincipal = Array.isArray(edicionPrincipal?.ciclos)
    ? edicionPrincipal.ciclos[0]
    : edicionPrincipal?.ciclos || null;

  const periodoPrincipal = Array.isArray(edicionPrincipal?.periodos)
    ? edicionPrincipal.periodos[0]
    : edicionPrincipal?.periodos || null;

  const cuotas = Array.isArray(persona.cuotas_detalle) ? persona.cuotas_detalle : [];
  const pagos = Array.isArray(persona.pagos_detalle) ? persona.pagos_detalle : [];

  const hasActiveMatricula = Boolean(
    matriculaPrincipal &&
      ["ACTIVA", "FINALIZADA", "RESERVADA"].includes(
        (matriculaPrincipal.status || "").toUpperCase()
      )
  );

  const integridad = checkPersonaIntegrity(persona, estudiante, hasActiveMatricula);
  const initials = getInitials(persona.nombres || "", persona.apellido_paterno || "");

  // Cargar ciclos y cursos reales de la base de datos para la malla del programa
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  let ciclosDb: any[] = [];
  let cursosDb: any[] = [];

  let targetPlanId = planPrincipal?.id;
  if (!targetPlanId && programaPrincipal?.id) {
    const { data: p } = await supabase
      .from("planes_estudio")
      .select("id")
      .eq("programa_id", programaPrincipal.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    targetPlanId = p?.id;
  }

  if (targetPlanId) {
    const [{ data: cData }, { data: kData }] = await Promise.all([
      supabase
        .from("ciclos")
        .select("id, nombre, numero_orden, plan_id")
        .eq("plan_id", targetPlanId)
        .order("numero_orden", { ascending: true }),
      supabase
        .from("cursos")
        .select("id, nombre, codigo, creditos, horas_semanales, ciclo_id, plan_id")
        .eq("plan_id", targetPlanId)
        .order("codigo", { ascending: true }),
    ]);
    ciclosDb = cData || [];
    cursosDb = kData || [];
  }

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto pb-12">
      <div className="flex items-center justify-between print:hidden no-print">
        <Link href="/personas">
          <Button
            variant="ghost"
            className="text-slate-600 hover:text-slate-900 -ml-2 text-xs font-bold"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Volver al Padrón Institucional
          </Button>
        </Link>
      </div>

      <Persona360Client
        persona={persona}
        estudiante={estudiante}
        isEstudiante={isEstudiante}
        canEdit={canEdit}
        matriculas={matriculas}
        matriculaPrincipal={matriculaPrincipal}
        edicionPrincipal={edicionPrincipal}
        programaPrincipal={programaPrincipal}
        planPrincipal={planPrincipal}
        cicloPrincipal={cicloPrincipal}
        periodoPrincipal={periodoPrincipal}
        cuotas={cuotas}
        pagos={pagos}
        integridad={integridad}
        initials={initials}
        ciclosDb={ciclosDb}
        cursosDb={cursosDb}
      />
    </div>
  );
}

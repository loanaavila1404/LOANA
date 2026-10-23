import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/permissions";
import { notFound } from "next/navigation";
import { ProgramaDetailClient } from "@/components/features/oferta/ProgramaDetailClient";

export const metadata = {
  title: "Detalle de Programa y Malla Curricular - ERP Brusben",
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ProgramaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(["PROGRAMAS.VER", "SISTEMA.ADMINISTRAR"]);
  const supabase = await createClient();
  const resolvedParams = await params;
  const rawId = decodeURIComponent(resolvedParams.id || "").trim();

  if (!rawId) {
    notFound();
  }

  const isUuid = UUID_REGEX.test(rawId);
  const programaQuery = supabase.from("programas").select("*");
  const { data: programa } = await (
    isUuid
      ? programaQuery.eq("id", rawId)
      : programaQuery.eq("codigo", rawId.toUpperCase())
  ).maybeSingle();

  if (!programa) {
    notFound();
  }

  const [
    { data: planesRaw },
    { data: edicionesRaw },
    { data: periodosRaw },
    { data: auditRaw },
  ] = await Promise.all([
    supabase
      .from("planes_estudio")
      .select(
        `
        *,
        ciclos (
          *,
          cursos (*)
        )
      `
      )
      .eq("programa_id", programa.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("ediciones")
      .select("*")
      .eq("programa_id", programa.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("periodos")
      .select("id, codigo, nombre, status")
      .eq("status", "ACTIVO")
      .order("fecha_inicio", { ascending: false }),
    supabase
      .from("audit_logs")
      .select("id, action, entity_type, created_at")
      .eq("entity_id", programa.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const planes = planesRaw || [];
  const ediciones = edicionesRaw || [];
  const periodos = periodosRaw || [];
  const auditLogs = auditRaw || [];

  // Obtener conteo de matrículas por edición de este programa y horarios de sus ediciones
  const edicionIds = ediciones.map(e => e.id);
  const matriculasCountByEdicion: Record<string, number> = {};
  let horarios: any[] = [];

  if (edicionIds.length > 0) {
    const [{ data: matData }, { data: horData }] = await Promise.all([
      supabase
        .from("matriculas")
        .select("id, edicion_id")
        .in("edicion_id", edicionIds)
        .in("status", ["ACTIVA", "RESERVADA", "PREMATRICULA", "FINALIZADA"]),
      supabase
        .from("horarios")
        .select("*, cursos(id, nombre, codigo, creditos, horas_semanales)")
        .in("edicion_id", edicionIds),
    ]);

    for (const m of matData || []) {
      if (m.edicion_id) {
        matriculasCountByEdicion[m.edicion_id] =
          (matriculasCountByEdicion[m.edicion_id] || 0) + 1;
      }
    }
    horarios = horData || [];
  }

  const periodoActivoNombre =
    periodos[0]?.codigo || periodos[0]?.nombre || "2026-I";

  return (
    <ProgramaDetailClient
      programa={programa}
      planes={planes}
      ediciones={ediciones}
      horarios={horarios}
      auditLogs={auditLogs}
      matriculasCountByEdicion={matriculasCountByEdicion}
      periodoActivoNombre={periodoActivoNombre}
    />
  );
}

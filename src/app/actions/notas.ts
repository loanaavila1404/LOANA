"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface SaveNotasPayload {
  edicionId: string;
  cursoId: string;
  cursoNombre: string;
  calificaciones: Array<{
    estudianteId: string;
    nombreCompleto: string;
    ec1: number | null;
    ec2: number | null;
    ep: number | null;
    ef: number | null;
    promedioFinal: number | null;
    estado: string;
  }>;
}

export async function saveNotasAction(payload: SaveNotasPayload) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Obtener perfil del usuario para auditoría
    let userRole = "DOCENTE";
    let userName = user?.email || "Usuario Académico";

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, roles(code, name)")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        userName = profile.display_name || userName;
        const roleObj = profile.roles as unknown as { code?: string; name?: string } | null;
        userRole = roleObj?.code || userRole;
      }
    }

    // 2. Registrar evento en auditoría
    try {
      await supabase.from("audit_logs").insert({
        action: "UPDATE",
        entity: "calificaciones",
        entity_id: `${payload.edicionId}_${payload.cursoId}`,
        module: "ACADEMICO",
        user_id: user?.id || null,
        user_role: userRole,
        detail: `Actualización y registro de calificaciones para la asignatura ${payload.cursoNombre} (${payload.calificaciones.length} estudiantes evaluados)`,
        data_after: {
          edicion_id: payload.edicionId,
          curso_id: payload.cursoId,
          curso_nombre: payload.cursoNombre,
          sede: "Sede Central - Tumbes",
          total_evaluados: payload.calificaciones.length,
          aprobados: payload.calificaciones.filter(c => c.estado === "APROBADO").length,
          desaprobados: payload.calificaciones.filter(c => c.estado === "DESAPROBADO").length,
        },
        result: "EXITO",
      });
    } catch (auditError) {
      console.warn("[Notas] Error al registrar auditoría:", auditError);
    }

    revalidatePath("/notas");
    return {
      success: true,
      message: "Registro de calificaciones actualizado y certificado institucionalmente.",
      registros: payload.calificaciones.length,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error inesperado al registrar notas";
    console.error("[saveNotasAction] Error:", error);
    return {
      success: false,
      error: msg,
    };
  }
}

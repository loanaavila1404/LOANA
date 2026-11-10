"use server";

import { createClient, getSafeDbClient } from "@/lib/supabase/server";
import { personaSchema, PersonaFormData } from "@/lib/validators/personas";
import { ActionState, success, error } from "@/lib/utils/actions";
import { revalidatePath } from "next/cache";
import { requirePermission, getUserAuthContext } from "@/lib/auth/permissions";

export type PersonaSearchParams = {
  q?: string;
  status?: string;
  tab?: string;
  tipo_documento?: string;
  es_estudiante?: string;
  page?: number;
  limit?: number;
};

export async function getPersonas(params: PersonaSearchParams) {
  await requirePermission(["ESTUDIANTES.VER", "ESTUDIANTES.EDITAR", "SISTEMA.ADMINISTRAR"]);

  const supabase = await createClient();
  const page = params.page || 1;
  const limit = params.limit || 12;

  let query = supabase
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
          ciclo_ingreso,
          importe_matricula,
          importe_pension,
          numero_pensiones,
          ediciones (
            id,
            codigo,
            nombre,
            modalidad,
            turno,
            programas (
              id,
              nombre,
              codigo,
              tipo_programa
            )
          )
        )
      )
    `
    )
    .order("created_at", { ascending: false });

  if (params.q) {
    query = query.or(
      `nombres.ilike.%${params.q}%,apellido_paterno.ilike.%${params.q}%,apellido_materno.ilike.%${params.q}%,numero_documento.ilike.%${params.q}%,email.ilike.%${params.q}%`
    );
  }

  if (params.status && params.status !== "TODOS") {
    query = query.ilike("status", params.status);
  }

  if (params.tipo_documento && params.tipo_documento !== "TODOS") {
    query = query.eq("tipo_documento", params.tipo_documento);
  }

  const { data: allRows, error: dbError } = await query;

  if (dbError) {
    console.error("Error fetching personas:", dbError);
    throw new Error("No se pudo cargar el padrón de personas y estudiantes.");
  }

  const rows = allRows || [];
  const activeTab = (params.tab || "TODOS").toUpperCase();

  const filtered = rows.filter(persona => {
    const estArr = Array.isArray(persona.estudiantes)
      ? persona.estudiantes
      : persona.estudiantes
        ? [persona.estudiantes]
        : [];
    const estudiante = estArr[0];
    const isEst = Boolean(estudiante);
    const matArr = Array.isArray(estudiante?.matriculas)
      ? estudiante.matriculas
      : estudiante?.matriculas
        ? [estudiante.matriculas]
        : [];

    if (params.es_estudiante === "true" && !isEst) return false;
    if (params.es_estudiante === "false" && isEst) return false;

    const pStatus = (persona.status || "ACTIVO").toUpperCase();
    const eStatus = (estudiante?.status || "").toUpperCase();
    const hasFinalizada = matArr.some(
      (m: { status?: string | null }) => (m.status || "").toUpperCase() === "FINALIZADA"
    );
    const hasActiva = matArr.some(
      (m: { status?: string | null }) => (m.status || "").toUpperCase() === "ACTIVA"
    );
    const hasRetiradaOrReserva = matArr.some((m: { status?: string | null }) =>
      ["RETIRADA", "ANULADA", "RESERVADA", "PREMATRICULA"].includes(
        (m.status || "").toUpperCase()
      )
    );

    if (activeTab === "ACTIVOS") {
      return pStatus === "ACTIVO" && (hasActiva || (isEst && eStatus === "ACTIVO" && !hasFinalizada));
    }
    if (activeTab === "EGRESADOS") {
      return hasFinalizada || eStatus === "EGRESADO" || eStatus === "GRADUADO";
    }
    if (activeTab === "INACTIVOS") {
      return (
        pStatus === "INACTIVO" ||
        eStatus === "INACTIVO" ||
        eStatus === "RETIRADO" ||
        (hasRetiradaOrReserva && !hasActiva)
      );
    }

    return true;
  });

  const count = filtered.length;
  const offset = (page - 1) * limit;
  const paginated = filtered.slice(offset, offset + limit);

  return {
    data: paginated,
    count,
    page,
    limit,
    totalPages: count ? Math.ceil(count / limit) : 0,
  };
}

export async function getPersonaById(id: string) {
  await requirePermission(["ESTUDIANTES.VER", "ESTUDIANTES.EDITAR", "SISTEMA.ADMINISTRAR"]);

  const supabase = await createClient();
  let { data: persona } = await supabase
    .from("personas")
    .select(
      `
      *,
      estudiantes ( * )
    `
    )
    .eq("id", id)
    .maybeSingle();

  // Si no se encuentra por persona.id, buscar si el id corresponde a un estudiante_id
  if (!persona) {
    const { data: estRecord } = await supabase
      .from("estudiantes")
      .select("persona_id")
      .eq("id", id)
      .maybeSingle();

    if (estRecord?.persona_id) {
      const { data: personaByEst } = await supabase
        .from("personas")
        .select(
          `
          *,
          estudiantes ( * )
        `
        )
        .eq("id", estRecord.persona_id)
        .maybeSingle();
      persona = personaByEst;
    }
  }

  // Si aún no se encuentra, buscar por documento de identidad
  if (!persona) {
    const { data: personaByDoc } = await supabase
      .from("personas")
      .select(
        `
        *,
        estudiantes ( * )
      `
      )
      .eq("numero_documento", id)
      .maybeSingle();
    persona = personaByDoc;
  }

  if (!persona) {
    throw new Error("No se pudo cargar la persona.");
  }

  const estArr = Array.isArray(persona.estudiantes)
    ? persona.estudiantes
    : persona.estudiantes
      ? [persona.estudiantes]
      : [];
  const estudiante = estArr[0];

  let matriculas: any[] = [];
  let cuotas: any[] = [];
  let pagos: any[] = [];
  let prospectoVinculado: any = null;

  if (estudiante?.id) {
    const { data: matData } = await supabase
      .from("matriculas")
      .select(
        `
        *,
        ediciones (
          id,
          codigo,
          nombre,
          modalidad,
          turno,
          fecha_inicio,
          fecha_fin,
          precio_matricula,
          precio_pension,
          numero_pensiones,
          programas ( id, nombre, codigo, tipo_programa ),
          planes_estudio ( id, nombre, codigo ),
          ciclos ( id, nombre, numero_orden ),
          periodos ( id, nombre, codigo )
        )
      `
      )
      .eq("estudiante_id", estudiante.id)
      .order("created_at", { ascending: false });

    matriculas = matData || [];

    if (matriculas.length > 0) {
      const matIds = matriculas.map(m => m.id);
      const { data: cuotasData } = await supabase
        .from("cuotas")
        .select("*")
        .in("matricula_id", matIds)
        .order("numero_cuota", { ascending: true });

      cuotas = cuotasData || [];
    }

    const { data: pagosData } = await supabase
      .from("pagos")
      .select(
        `
        *,
        pago_aplicaciones ( id, cuota_id, importe_aplicado )
      `
      )
      .eq("estudiante_id", estudiante.id)
      .order("fecha_pago", { ascending: false });

    pagos = pagosData || [];
  }

  if (persona.numero_documento) {
    const { data: prospData } = await supabase
      .from("prospectos")
      .select(
        `
        id,
        codigo,
        status,
        canal_captacion,
        nivel_interes,
        programas ( id, nombre, codigo )
      `
      )
      .eq("numero_documento", persona.numero_documento)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    prospectoVinculado = prospData || null;
  }

  return {
    ...persona,
    matriculas_detalle: matriculas,
    cuotas_detalle: cuotas,
    pagos_detalle: pagos,
    prospecto_vinculado: prospectoVinculado,
  };
}

export async function savePersona(data: PersonaFormData): Promise<ActionState> {
  await requirePermission(["ESTUDIANTES.EDITAR", "SISTEMA.ADMINISTRAR"]);

  try {
    const validated = personaSchema.safeParse(data);
    if (!validated.success) {
      return error("Error de validación", validated.error.flatten().fieldErrors);
    }

    const supabase = await createClient();
    const payload = validated.data;

    // Check for duplicate document
    if (payload.numero_documento) {
      const query = supabase
        .from("personas")
        .select("id")
        .eq("tipo_documento", payload.tipo_documento)
        .eq("numero_documento", payload.numero_documento);

      if (payload.id) {
        query.neq("id", payload.id);
      }

      const { data: existingDoc } = await query.limit(1).maybeSingle();
      if (existingDoc) {
        return error("El número de documento ya está registrado para ese tipo de documento.");
      }
    }

    // Check for duplicate email
    if (payload.email) {
      const query = supabase.from("personas").select("id").eq("email", payload.email);

      if (payload.id) {
        query.neq("id", payload.id);
      }

      const { data: existingEmail } = await query.limit(1).maybeSingle();
      if (existingEmail) {
        return error("El correo electrónico ya está registrado en otra persona.");
      }
    }

    let personaId = payload.id;

    const personaData = {
      nombres: payload.nombres,
      apellido_paterno: payload.apellido_paterno,
      apellido_materno: payload.apellido_materno || null,
      tipo_documento: payload.tipo_documento,
      numero_documento: payload.numero_documento,
      email: payload.email || null,
      telefono: payload.telefono || null,
      fecha_nacimiento: payload.fecha_nacimiento || null,
      direccion: payload.direccion || null,
      departamento: payload.departamento || null,
      provincia: payload.provincia || null,
      distrito: payload.distrito || null,
      status: payload.status.toUpperCase(),
    };

    if (personaId) {
      const { error: updateError } = await supabase
        .from("personas")
        .update(personaData)
        .eq("id", personaId);

      if (updateError) throw updateError;
    } else {
      const { data: newPersona, error: insertError } = await supabase
        .from("personas")
        .insert(personaData)
        .select("id")
        .single();

      if (insertError) throw insertError;
      personaId = newPersona.id;

      if (payload.es_estudiante && personaId) {
        await supabase.from("estudiantes").insert({
          persona_id: personaId,
          codigo_estudiante: null,
          observaciones: payload.observaciones || null,
          status: "ACTIVO",
        });
      }
    }

    revalidatePath("/personas");
    if (personaId) {
      revalidatePath(`/personas/${personaId}`);
    }

    return success(payload.id ? "Persona actualizada exitosamente" : "Persona creada exitosamente");
  } catch (err: unknown) {
    console.error("savePersona error:", err);
    return error((err as Error).message || "Ocurrió un error al guardar la persona");
  }
}

export async function convertirAEstudiante(
  personaId: string,
  payload: { observaciones?: string }
): Promise<ActionState> {
  await requirePermission(["ESTUDIANTES.EDITAR", "SISTEMA.ADMINISTRAR"]);

  try {
    const supabase = await createClient();

    const { data: persona } = await supabase
      .from("personas")
      .select("id, status")
      .eq("id", personaId)
      .single();
    if (!persona) return error("La persona no existe.");

    const { data: existingEstudiante } = await supabase
      .from("estudiantes")
      .select("id")
      .eq("persona_id", personaId)
      .maybeSingle();
    if (existingEstudiante) {
      return error("La persona ya es un estudiante.");
    }

    const { error: insertError } = await supabase.from("estudiantes").insert({
      persona_id: personaId,
      codigo_estudiante: null,
      observaciones: payload.observaciones || null,
      status: "ACTIVO",
    });

    if (insertError) throw insertError;

    revalidatePath("/personas");
    revalidatePath(`/personas/${personaId}`);

    return success("Convertido a estudiante exitosamente.");
  } catch (err: unknown) {
    console.error("convertirAEstudiante error:", err);
    return error((err as Error).message || "Ocurrió un error al convertir a estudiante.");
  }
}

export async function togglePersonaStatus(personaId: string): Promise<ActionState> {
  await requirePermission(["ESTUDIANTES.EDITAR", "SISTEMA.ADMINISTRAR"]);

  try {
    const supabase = await createClient();
    const { data: personaInfo, error: fetchError } = await supabase
      .from("personas")
      .select("status")
      .eq("id", personaId)
      .single();

    if (fetchError || !personaInfo) {
      return error("La persona no existe o no se pudo acceder al registro.");
    }

    const currentStatus = (personaInfo.status || "").trim().toUpperCase();
    if (currentStatus !== "ACTIVO" && currentStatus !== "INACTIVO") {
      return error("El estado actual del registro no es válido para esta operación.");
    }

    const newStatus = currentStatus === "ACTIVO" ? "INACTIVO" : "ACTIVO";

    const { error: updateError } = await supabase
      .from("personas")
      .update({ status: newStatus })
      .eq("id", personaId);
    if (updateError) throw updateError;

    revalidatePath("/personas");
    revalidatePath(`/personas/${personaId}`);

    return success(`Persona ${newStatus === "ACTIVO" ? "activada" : "inactivada"} exitosamente.`);
  } catch (err: unknown) {
    console.error("togglePersonaStatus error:", err);
    return error((err as Error).message || "Ocurrió un error al cambiar el estado.");
  }
}

export async function getPersonasMetrics() {
  await requirePermission(["ESTUDIANTES.VER", "ESTUDIANTES.EDITAR", "SISTEMA.ADMINISTRAR"]);
  const supabase = await createClient();

  const { data: allPersonas } = await supabase.from("personas").select(`
    id,
    nombres,
    apellido_paterno,
    tipo_documento,
    numero_documento,
    email,
    telefono,
    status,
    created_at,
    estudiantes (
      id,
      codigo_estudiante,
      status,
      observaciones,
      created_at,
      matriculas (
        id,
        status
      )
    )
  `);

  const rows = allPersonas || [];
  const totalPersonas = rows.length;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  let estudiantesActivos = 0;
  let estudiantesNuevos = 0;
  let personasInactivas = 0;
  let enReservaOInactivos = 0;
  let expedientesObservados = 0;
  let countEgresados = 0;

  for (const p of rows) {
    const pStatus = (p.status || "ACTIVO").toUpperCase();
    const estArr = Array.isArray(p.estudiantes)
      ? p.estudiantes
      : p.estudiantes
        ? [p.estudiantes]
        : [];
    const est = estArr[0];
    const isEst = Boolean(est);
    const eStatus = (est?.status || "").toUpperCase();
    const matArr = Array.isArray(est?.matriculas)
      ? est.matriculas
      : est?.matriculas
        ? [est.matriculas]
        : [];

    const hasActiva = matArr.some(
      (m: { status?: string | null }) => (m.status || "").toUpperCase() === "ACTIVA"
    );
    const hasFinalizada = matArr.some(
      (m: { status?: string | null }) => (m.status || "").toUpperCase() === "FINALIZADA"
    );
    const hasReservaORetiro = matArr.some((m: { status?: string | null }) =>
      ["RESERVADA", "PREMATRICULA", "RETIRADA", "ANULADA"].includes(
        (m.status || "").toUpperCase()
      )
    );

    if (pStatus === "INACTIVO") {
      personasInactivas++;
    }

    if (pStatus === "ACTIVO" && (hasActiva || (isEst && eStatus === "ACTIVO" && !hasFinalizada))) {
      estudiantesActivos++;
    }

    if (hasFinalizada || eStatus === "EGRESADO" || eStatus === "GRADUADO") {
      countEgresados++;
    }

    if (
      pStatus === "INACTIVO" ||
      eStatus === "INACTIVO" ||
      eStatus === "RETIRADO" ||
      (hasReservaORetiro && !hasActiva)
    ) {
      enReservaOInactivos++;
    }

    if (est?.created_at && est.created_at >= thirtyDaysAgo) {
      estudiantesNuevos++;
    }

    const faltaContacto = !p.email?.trim() || !p.telefono?.trim() || !p.numero_documento?.trim();
    const faltaCodigo = isEst && !est?.codigo_estudiante?.trim();
    if (faltaContacto || faltaCodigo) {
      expedientesObservados++;
    }
  }

  const porcentajeActivos =
    totalPersonas > 0 ? Math.round((estudiantesActivos / totalPersonas) * 100) : 0;

  return {
    totalPersonas,
    estudiantesActivos,
    porcentajeActivos,
    estudiantesNuevos,
    personasInactivas,
    enReservaOInactivos,
    expedientesObservados,
    countTodos: totalPersonas,
    countActivos: estudiantesActivos,
    countEgresados,
    countInactivos: enReservaOInactivos,
  };
}

export async function eliminarPersonaEstudianteAction(
  personaId: string,
  confirmacionTexto: string
): Promise<ActionState> {
  await requirePermission(["ESTUDIANTES.EDITAR", "SISTEMA.ADMINISTRAR"]);

  if (confirmacionTexto.trim().toUpperCase() !== "ELIMINAR") {
    return error('Debe escribir exactamente la palabra "ELIMINAR" para confirmar la operación.');
  }

  try {
    const db = await getSafeDbClient();
    const supabase = await createClient();
    const authCtx = await getUserAuthContext();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Obtener snapshot completo de la persona antes de eliminar
    const { data: persona, error: pErr } = await db
      .from("personas")
      .select("*")
      .eq("id", personaId)
      .maybeSingle();

    if (pErr || !persona) {
      return error("No se encontró el registro de la persona a eliminar.");
    }

    // 2. Obtener todos los registros de estudiantes asociados a esta persona
    const { data: estudiantesList } = await db
      .from("estudiantes")
      .select("*")
      .eq("persona_id", personaId);

    const estRows = estudiantesList || [];
    const estudianteIds = estRows.map((e) => e.id);

    // 3. Obtener todos los prospectos vinculados a la persona O a cualquiera de sus IDs de estudiante
    let prospRows: any[] = [];
    if (estudianteIds.length > 0) {
      const [{ data: pByPersona }, { data: pByEstudiante }] = await Promise.all([
        db.from("prospectos").select("*").eq("persona_id", personaId),
        db.from("prospectos").select("*").in("estudiante_id", estudianteIds),
      ]);
      const combined = [...(pByPersona || []), ...(pByEstudiante || [])];
      const seen = new Set<string>();
      for (const p of combined) {
        if (!seen.has(p.id)) {
          seen.add(p.id);
          prospRows.push(p);
        }
      }
    } else {
      const { data: pByPersona } = await db.from("prospectos").select("*").eq("persona_id", personaId);
      prospRows = pByPersona || [];
    }
    const prospectoIds = prospRows.map((p) => p.id);

    // 4. Obtener todas las matrículas vinculadas a los estudiantes
    let matRows: any[] = [];
    if (estudianteIds.length > 0) {
      const { data: mats } = await db
        .from("matriculas")
        .select("*")
        .in("estudiante_id", estudianteIds);
      matRows = mats || [];
    }
    const matriculaIds = matRows.map((m) => m.id);

    // 5. Obtener todas las cuotas de esas matrículas
    let cuotasRows: any[] = [];
    if (matriculaIds.length > 0) {
      const { data: cuots } = await db
        .from("cuotas")
        .select("*")
        .in("matricula_id", matriculaIds);
      cuotasRows = cuots || [];
    }
    const cuotaIds = cuotasRows.map((c) => c.id);

    // 6. Obtener todos los pagos vinculados a los estudiantes
    let pagosRows: any[] = [];
    if (estudianteIds.length > 0) {
      const { data: pags } = await db
        .from("pagos")
        .select("*")
        .in("estudiante_id", estudianteIds);
      pagosRows = pags || [];
    }
    const pagoIds = pagosRows.map((p) => p.id);

    const now = new Date();
    const fechaHora = now.toLocaleString("es-PE", { dateStyle: "short", timeStyle: "medium" });
    const nombreCompleto = `${persona.nombres || ""} ${persona.apellido_paterno || ""} ${persona.apellido_materno || ""}`.trim();
    const dni = persona.numero_documento || "Sin DNI";

    // 7. REGISTRO PREVIO OBLIGATORIO EN LA BITÁCORA INSTITUCIONAL (audit_logs) ANTES DEL BORRADO FÍSICO
    try {
      await db.from("audit_logs").insert({
        action: "DELETE",
        entity: "personas",
        entity_id: personaId,
        module: "ESTUDIANTES",
        user_id: user?.id || null,
        user_role: authCtx?.roleName || authCtx?.roleCode || "SUPER_ADMINISTRADOR",
        detail: `Eliminación física definitiva (Hard Delete en Cascada) de expediente: ${nombreCompleto} (DNI ${dni}) - ${fechaHora} por ${user?.email || "Usuario"}`,
        data_before: {
          persona,
          estudiantes: estRows,
          prospectos: prospRows,
          matriculas: matRows,
          cuotas: cuotasRows,
          pagos: pagosRows,
          fecha_eliminacion: now.toISOString(),
          eliminado_por: user?.email || "Administrador",
        },
        data_after: {
          status: "ELIMINADO_FISICO",
          deleted_at: now.toISOString(),
          hard_delete: true,
        },
        result: "EXITO",
      });
    } catch (auditErr) {
      console.warn("[eliminarPersonaEstudianteAction] Error audit:", auditErr);
    }

    // ========================================================
    // 8. EJECUCIÓN EN CASCADA FÍSICA ESTRICTA (CHILDREN FIRST)
    // ========================================================

    // A. Eliminar aplicaciones de pagos vinculadas a las cuotas o a los pagos
    if (cuotaIds.length > 0) {
      await db.from("pago_aplicaciones").delete().in("cuota_id", cuotaIds);
    }
    if (pagoIds.length > 0) {
      await db.from("pago_aplicaciones").delete().in("pago_id", pagoIds);
    }

    // B. Romper referencias circulares mutuas entre prospectos y matrículas
    if (matriculaIds.length > 0) {
      await db.from("prospectos").update({ matricula_id: null }).in("matricula_id", matriculaIds);
    }
    if (prospectoIds.length > 0) {
      await db.from("matriculas").update({ prospecto_id: null }).in("prospecto_id", prospectoIds);
    }

    // C. Eliminar cuotas
    if (matriculaIds.length > 0) {
      await db.from("cuotas").delete().in("matricula_id", matriculaIds);
    }

    // D. Eliminar pagos
    if (estudianteIds.length > 0) {
      await db.from("pagos").delete().in("estudiante_id", estudianteIds);
    }

    // E. Eliminar matrículas
    if (estudianteIds.length > 0) {
      await db.from("matriculas").delete().in("estudiante_id", estudianteIds);
    }

    // F. Eliminar actividades de CRM vinculadas a los prospectos
    if (prospectoIds.length > 0) {
      await db.from("tareas_comerciales").delete().in("prospecto_id", prospectoIds);
      await db.from("transferencias_prospectos").delete().in("prospecto_id", prospectoIds);
      await db.from("seguimientos").delete().in("prospecto_id", prospectoIds);
      await db.from("prospectos").delete().in("id", prospectoIds);
    }

    // G. Desvincular cualquier otro prospecto residual que apunte a estos estudiantes o persona
    if (estudianteIds.length > 0) {
      await db.from("prospectos").update({ estudiante_id: null }).in("estudiante_id", estudianteIds);
    }
    await db.from("prospectos").update({ persona_id: null }).eq("persona_id", personaId);

    // H. Desvincular cuentas de usuario (profiles)
    await db.from("profiles").update({ persona_id: null }).eq("persona_id", personaId);

    // I. Eliminar registros de la tabla estudiantes
    if (estudianteIds.length > 0) {
      const { error: delEstErr } = await db
        .from("estudiantes")
        .delete()
        .in("id", estudianteIds);

      if (delEstErr) {
        throw new Error(`Error al eliminar registro de estudiante: ${delEstErr.message}`);
      }
    }

    // J. Borrado físico definitivo (Hard Delete) de la tabla personas
    const { error: delPersonaErr } = await db
      .from("personas")
      .delete()
      .eq("id", personaId);

    if (delPersonaErr) {
      throw new Error(`Error en borrado definitivo de persona: ${delPersonaErr.message}`);
    }

    // 9. Revalidación de rutas
    revalidatePath("/personas");
    revalidatePath(`/personas/${personaId}`);
    revalidatePath("/estudiantes");
    revalidatePath("/matriculas");
    revalidatePath("/crm");
    revalidatePath("/auditoria");
    revalidatePath("/dashboard");

    return success("Expediente y todos sus registros vinculados eliminados físicamente de la base de datos de manera definitiva.");
  } catch (err: unknown) {
    console.error("eliminarPersonaEstudianteAction error:", err);
    return error(
      (err as Error).message || "Ocurrió un error al eliminar físicamente el registro."
    );
  }
}


"use server";

import { createClient } from "@/lib/supabase/server";
import { personaSchema, PersonaFormData } from "@/lib/validators/personas";
import { ActionState, success, error } from "@/lib/utils/actions";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/permissions";

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
  const { data: persona, error: personaError } = await supabase
    .from("personas")
    .select(
      `
      *,
      estudiantes ( * )
    `
    )
    .eq("id", id)
    .single();

  if (personaError || !persona) {
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

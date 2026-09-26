"use server";

import { createClient } from "@/lib/supabase/server";
import { personaSchema, PersonaFormData } from "@/lib/validators/personas";
import { ActionState, success, error } from "@/lib/utils/actions";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/permissions";





export type PersonaSearchParams = {
  q?: string;
  status?: string;
  tipo_documento?: string;
  es_estudiante?: string;
  page?: number;
  limit?: number;
};

export async function getPersonas(params: PersonaSearchParams) {
  await requirePermission(["ESTUDIANTES.VER", "ESTUDIANTES.EDITAR", "SISTEMA.ADMINISTRAR"]);

  const supabase = await createClient();
  const page = params.page || 1;
  const limit = params.limit || 10;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("personas")
    .select(`
      *,
      estudiantes ( id, codigo_estudiante, status )
    `, { count: "exact" });

  if (params.q) {
    query = query.or(`nombres.ilike.%${params.q}%,apellido_paterno.ilike.%${params.q}%,apellido_materno.ilike.%${params.q}%,numero_documento.ilike.%${params.q}%`);
  }
  
  if (params.status && params.status !== "TODOS") {
    query = query.eq("status", params.status);
  }

  if (params.tipo_documento && params.tipo_documento !== "TODOS") {
    query = query.eq("tipo_documento", params.tipo_documento);
  }

  if (params.es_estudiante === "true") {
    // We only want personas that have a linked estudiante
    // In Supabase, filtering by a joined table isn't trivial with eq, 
    // we use not.is.null on the joined relation if we used inner join. 
    // A simpler way is inner join!
    query = supabase
      .from("personas")
      .select(`
        *,
        estudiantes!inner ( id, codigo_estudiante, status )
      `, { count: "exact" });
      
    if (params.q) query = query.or(`nombres.ilike.%${params.q}%,apellido_paterno.ilike.%${params.q}%,apellido_materno.ilike.%${params.q}%,numero_documento.ilike.%${params.q}%`);
    if (params.status && params.status !== "TODOS") query = query.eq("status", params.status);
    if (params.tipo_documento && params.tipo_documento !== "TODOS") query = query.eq("tipo_documento", params.tipo_documento);
  } else if (params.es_estudiante === "false") {
    // Filter where estudiantes is null - Supabase doesn't easily support this out of the box in PostgREST without advanced syntax
    // We'll leave it as is, and let the user use standard filters. 
    // Wait, we can't easily filter "doesn't have relation" without a view or RPC.
  }

  const { data, error: dbError, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (dbError) {
    console.error("Error fetching personas:", dbError);
    throw new Error("No se pudo cargar las personas.");
  }

  return {
    data,
    count: count || 0,
    page,
    limit,
    totalPages: count ? Math.ceil(count / limit) : 0,
  };
}

export async function getPersonaById(id: string) {
  await requirePermission(["ESTUDIANTES.VER", "ESTUDIANTES.EDITAR", "SISTEMA.ADMINISTRAR"]);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("personas")
    .select(`
      *,
      estudiantes ( * )
    `)
    .eq("id", id)
    .single();

  if (error) {
    throw new Error("No se pudo cargar la persona.");
  }

  return data;
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
      const query = supabase
        .from("personas")
        .select("id")
        .eq("email", payload.email);
      
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
      // Update
      const { error: updateError } = await supabase
        .from("personas")
        .update(personaData)
        .eq("id", personaId);

      if (updateError) throw updateError;
    } else {
      // Create
      const { data: newPersona, error: insertError } = await supabase
        .from("personas")
        .insert(personaData)
        .select("id")
        .single();

      if (insertError) throw insertError;
      personaId = newPersona.id;
    }

    revalidatePath("/personas");
    if (personaId) {
      revalidatePath(`/personas/${personaId}`);
    }
    
    return success(payload.id ? "Persona actualizada exitosamente" : "Persona creada exitosamente");
  } catch (err: unknown) {
    console.error("savePersona error:", err);
    return error(((err as Error).message) || "Ocurrió un error al guardar la persona");
  }
}

export async function convertirAEstudiante(personaId: string, payload: { codigo_estudiante?: string, observaciones?: string }): Promise<ActionState> {
  await requirePermission(["ESTUDIANTES.EDITAR", "SISTEMA.ADMINISTRAR"]);

  try {
    const supabase = await createClient();
    
    // Check if persona exists
    const { data: persona } = await supabase.from("personas").select("id, status").eq("id", personaId).single();
    if (!persona) return error("La persona no existe.");

    // Check if already a student
    const { data: existingEstudiante } = await supabase.from("estudiantes").select("id").eq("persona_id", personaId).maybeSingle();
    if (existingEstudiante) {
      return error("La persona ya es un estudiante.");
    }

    const { error: insertError } = await supabase.from("estudiantes").insert({
      persona_id: personaId,
      codigo_estudiante: payload.codigo_estudiante || null,
      observaciones: payload.observaciones || null,
      status: "ACTIVO"
    });

    if (insertError) throw insertError;

    revalidatePath("/personas");
    revalidatePath(`/personas/${personaId}`);
    
    return success("Convertido a estudiante exitosamente.");
  } catch (err: unknown) {
    console.error("convertirAEstudiante error:", err);
    return error(((err as Error).message) || "Ocurrió un error al convertir a estudiante.");
  }
}

export async function togglePersonaStatus(personaId: string, currentStatus: string): Promise<ActionState> {
  await requirePermission(["ESTUDIANTES.EDITAR", "SISTEMA.ADMINISTRAR"]);
  
  try {
    const supabase = await createClient();
    const newStatus = currentStatus === "ACTIVO" ? "INACTIVO" : "ACTIVO";
    
    const { error: updateError } = await supabase.from("personas").update({ status: newStatus }).eq("id", personaId);
    if (updateError) throw updateError;
    
    revalidatePath("/personas");
    revalidatePath(`/personas/${personaId}`);
    
    return success(`Persona ${newStatus === 'ACTIVO' ? 'activada' : 'inactivada'} exitosamente.`);
  } catch (err: unknown) {
    console.error("togglePersonaStatus error:", err);
    return error(((err as Error).message) || "Ocurrió un error al cambiar el estado.");
  }
}
export async function getPersonasMetrics() {
  await requirePermission(["ESTUDIANTES.VER", "ESTUDIANTES.EDITAR", "SISTEMA.ADMINISTRAR"]);
  const supabase = await createClient();

  const [{ count: totalPersonas }, { count: estudiantesActivos }, { count: estudiantesNuevos }, { count: expedientesIncompletos }] = await Promise.all([
    supabase.from("personas").select("*", { count: "exact", head: true }),
    supabase.from("estudiantes").select("*", { count: "exact", head: true }).eq("status", "ACTIVO"),
    supabase.from("estudiantes").select("*", { count: "exact", head: true }).gte("created_at", new Date(new Date().setDate(new Date().getDate() - 30)).toISOString()),
    supabase.from("personas").select("*, estudiantes!inner(*)", { count: "exact", head: true }).is("tipo_documento", null) // Just an example of incomplete
  ]);

  return {
    totalPersonas: totalPersonas || 0,
    estudiantesActivos: estudiantesActivos || 0,
    estudiantesNuevos: estudiantesNuevos || 0,
    expedientesIncompletos: expedientesIncompletos || 0,
  };
}


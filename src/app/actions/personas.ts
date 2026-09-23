"use server";

import { createClient } from "@/lib/supabase/server";
import { personaSchema, PersonaFormData } from "@/lib/validators/personas";
import { ActionState, success, error } from "@/lib/utils/actions";
import { revalidatePath } from "next/cache";

export async function savePersona(data: PersonaFormData): Promise<ActionState> {
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
        .eq("numero_documento", payload.numero_documento);
      
      if (payload.id) {
        query.neq("id", payload.id);
      }
      
      const { data: existingDoc } = await query.single();
      if (existingDoc) {
        return error("El número de documento ya está registrado.");
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

      const { data: existingEmail } = await query.single();
      if (existingEmail) {
        return error("El correo electrónico ya está registrado.");
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
      status: payload.status,
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

    // Handle Estudiante
    if (personaId) {
      const { data: existingEstudiante } = await supabase
        .from("estudiantes")
        .select("id")
        .eq("persona_id", personaId)
        .single();

      if (payload.es_estudiante) {
        const estudianteData = {
          persona_id: personaId,
          codigo_estudiante: payload.codigo_estudiante || null,
          observaciones: payload.observaciones || null,
          status: "activo",
        };

        if (existingEstudiante) {
          const { error: estUpdateError } = await supabase
            .from("estudiantes")
            .update(estudianteData)
            .eq("id", existingEstudiante.id);
          if (estUpdateError) throw estUpdateError;
        } else {
          const { error: estInsertError } = await supabase
            .from("estudiantes")
            .insert(estudianteData);
          if (estInsertError) throw estInsertError;
        }
      } else {
        // If they were a student and shouldn't be anymore, we could potentially delete or mark inactive
        // But let's assume we don't delete them for now.
      }
    }

    revalidatePath("/personas");
    return success(payload.id ? "Persona actualizada exitosamente" : "Persona creada exitosamente");
  } catch (err: any) {
    console.error("savePersona error:", err);
    return error(err.message || "Ocurrió un error al guardar la persona");
  }
}

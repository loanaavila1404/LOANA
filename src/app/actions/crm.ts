"use server";

import { createClient } from "@/lib/supabase/server";
import { prospectoSchema } from "@/lib/validators/crm";
import { ActionState, success, error } from "@/lib/utils/actions";
import { revalidatePath } from "next/cache";

export async function createProspecto(formData: FormData): Promise<ActionState> {
  try {
    const rawData = {
      nombres: formData.get("nombres"),
      apellidos: formData.get("apellidos"),
      email: formData.get("email"),
      telefono: formData.get("telefono"),
      status: formData.get("status") || "NUEVO",
      nivel_interes: formData.get("nivel_interes") || "MEDIO",
    };

    const validated = prospectoSchema.safeParse(rawData);

    if (!validated.success) {
      return error("Error de validación", validated.error.flatten().fieldErrors);
    }

    const supabase = await createClient();

    // Generate a basic code if missing
    const codigo = `PROS-${Date.now().toString().slice(-6)}`;

    const insertData = {
      ...validated.data,
      codigo,
    };

    const { error: dbError } = await supabase.from("prospectos").insert([insertData]);

    if (dbError) {
      console.error("Supabase error:", dbError);
      return error("Error al crear prospecto");
    }

    revalidatePath("/crm");
    return success("Prospecto creado exitosamente");
  } catch (err) {
    console.error("Action error:", err);
    return error("Error interno");
  }
}

export async function updateProspectoStatus(id: string, status: string): Promise<ActionState> {
  try {
    if (!id || !status) {
      return error("Faltan parámetros");
    }

    const supabase = await createClient();
    
    const { error: dbError } = await supabase
      .from("prospectos")
      .update({ status })
      .eq("id", id);

    if (dbError) {
      console.error("Supabase error:", dbError);
      return error("Error al actualizar estado");
    }

    revalidatePath("/crm");
    return success("Estado actualizado");
  } catch (err) {
    console.error("Action error:", err);
    return error("Error interno");
  }
}

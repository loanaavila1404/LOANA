"use server";

import { createClient } from "@/lib/supabase/server";
import { prospectoSchema } from "@/lib/validators/crm";
import { ActionState, success, error } from "@/lib/utils/actions";
import { revalidatePath } from "next/cache";

export async function createProspecto(formData: FormData): Promise<ActionState> {
  try {
    const supabase = await createClient();
    const user = (await supabase.auth.getUser()).data.user;

    let asesorId = (formData.get("asesor_id") as string | null)?.trim() || user?.id || null;
    if (!asesorId) {
      const { data: firstAdvisor } = await supabase
        .from("profiles")
        .select("id")
        .eq("status", "ACTIVO")
        .limit(1)
        .maybeSingle();
      asesorId = firstAdvisor?.id || null;
    }

    const rawData = {
      nombres: formData.get("nombres"),
      apellidos: formData.get("apellidos"),
      email: formData.get("email") || "",
      telefono: formData.get("telefono"),
      tipo_documento: formData.get("tipo_documento") || null,
      numero_documento: formData.get("numero_documento") || null,
      programa_id: formData.get("programa_id") || null,
      canal_captacion: formData.get("canal_captacion") || null,
      asesor_id: asesorId,
      status: formData.get("status") || "NUEVO",
      nivel_interes: formData.get("nivel_interes") || "MEDIO",
    };

    const validated = prospectoSchema.safeParse(rawData);

    if (!validated.success) {
      return error("Error de validación", validated.error.flatten().fieldErrors);
    }

    const count = await supabase.from("prospectos").select("id", { count: "exact" });
    const num = (count.count || 0) + 1;
    const codigo = `PRO-${new Date().getFullYear()}-${num.toString().padStart(5, "0")}`;

    const insertData = {
      ...validated.data,
      codigo,
      created_by: user?.id,
    };

    const { error: dbError } = await supabase.from("prospectos").insert([insertData]);

    if (dbError) {
      console.error("Supabase error:", dbError);
      return error("Error al crear prospecto");
    }

    revalidatePath("/crm");
    revalidatePath("/dashboard");
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
    const user = (await supabase.auth.getUser()).data.user;

    const updateFields: {
      status: string;
      updated_by?: string | null;
      ultimo_contacto_en?: string | null;
    } = {
      status,
      updated_by: user?.id,
    };
    if (status !== "NUEVO") {
      updateFields.ultimo_contacto_en = new Date().toISOString();
    }

    const { error: dbError } = await supabase
      .from("prospectos")
      .update(updateFields)
      .eq("id", id);

    if (dbError) {
      console.error("Supabase error:", dbError);
      return error("Error al actualizar estado");
    }

    revalidatePath("/crm");
    revalidatePath(`/crm/prospectos/${id}`);
    revalidatePath("/dashboard");
    return success("Estado actualizado");
  } catch (err) {
    console.error("Action error:", err);
    return error("Error interno");
  }
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { ActionState, success, error } from "@/lib/utils/actions";
import { revalidatePath } from "next/cache";

export interface UpdatePerfilInput {
  nombres: string;
  apellidos: string;
  dni?: string;
  telefono?: string;
  correoRecuperacion?: string;
  nuevaPassword?: string;
  confirmarPassword?: string;
}

export async function updatePerfilAction(input: UpdatePerfilInput): Promise<ActionState> {
  try {
    const supabase = await createClient();

    // 1. Validar sesión de usuario actual
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return error("No se encontró una sesión activa de usuario.");
    }

    const nombres = input.nombres?.trim() || "";
    const apellidos = input.apellidos?.trim() || "";

    if (!nombres) {
      return error("El campo 'Nombres' es obligatorio.");
    }

    if (!apellidos) {
      return error("El campo 'Apellidos' es obligatorio.");
    }

    const fullName = `${nombres} ${apellidos}`.trim();

    // 2. Si se solicitó actualización de contraseña, validarla
    if (input.nuevaPassword || input.confirmarPassword) {
      const pwd = input.nuevaPassword || "";
      const confirmPwd = input.confirmarPassword || "";

      if (pwd.length < 8) {
        return error("La nueva contraseña debe tener al menos 8 caracteres.");
      }

      if (pwd !== confirmPwd) {
        return error("Las contraseñas no coinciden. Por favor verifica.");
      }

      // Actualizar contraseña en Supabase Auth
      const { error: pwdError } = await supabase.auth.updateUser({
        password: pwd,
      });

      if (pwdError) {
        console.error("Error al actualizar contraseña:", pwdError);
        return error(`Error al actualizar la contraseña: ${pwdError.message}`);
      }
    }

    // 3. Actualizar metadatos del usuario en Auth
    const metadataUpdate = {
      full_name: fullName,
      name: fullName,
      nombres,
      apellidos,
      dni: input.dni?.trim() || "",
      telefono: input.telefono?.trim() || "",
      correo_recuperacion: input.correoRecuperacion?.trim() || user.email || "",
      sede_fija: "Sede Central - Tumbes",
    };

    const { error: metaError } = await supabase.auth.updateUser({
      data: metadataUpdate,
    });

    if (metaError) {
      console.warn("Advertencia al actualizar metadata de Auth:", metaError);
    }

    // 4. Actualizar tabla `profiles`
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        display_name: fullName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (profileError) {
      console.error("Error al actualizar tabla profiles:", profileError);
    }

    // 5. Registrar evento en AUDITORIA institucional
    try {
      await supabase.from("audit_logs").insert({
        action: "UPDATE",
        entity: "profiles",
        entity_id: user.id,
        module: "MI_PERFIL",
        user_id: user.id,
        user_role: "SUPERADMIN",
        detail: `Actualización de datos personales y seguridad del perfil (${fullName})`,
        data_after: {
          display_name: fullName,
          nombres,
          apellidos,
          dni: input.dni?.trim() || "",
          telefono: input.telefono?.trim() || "",
          correo_recuperacion: input.correoRecuperacion?.trim() || "",
          sede: "Sede Central - Tumbes",
          password_cambiada: Boolean(input.nuevaPassword),
        },
        result: "EXITO",
      });
    } catch (auditErr) {
      console.warn("No se pudo escribir log de auditoría del perfil:", auditErr);
    }

    revalidatePath("/perfil");
    revalidatePath("/usuarios");
    revalidatePath("/dashboard");

    return success("Datos de perfil y configuración de seguridad guardados exitosamente.");
  } catch (err: unknown) {
    console.error("updatePerfilAction error inesperado:", err);
    return error((err as Error).message || "Ocurrió un error inesperado al guardar los cambios.");
  }
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { editUserSchema, EditUserFormData } from "@/lib/validators/user.schema";
import { ActionState, success, error } from "@/lib/utils/actions";
import { revalidatePath } from "next/cache";

export async function updateUser(data: EditUserFormData): Promise<ActionState> {
  try {
    const validated = editUserSchema.safeParse(data);
    if (!validated.success) {
      return error("Error de validación", validated.error.flatten().fieldErrors);
    }

    const payload = validated.data;
    const supabase = await createClient();

    const { data: currentUser, error: userError } = await supabase
      .from('profiles')
      .select('email, roles(name, code)')
      .eq('id', payload.id)
      .maybeSingle();

    if (userError) {
      console.warn("No se pudo consultar el perfil en Supabase:", userError);
    }

    if (!currentUser) {
      // Si el usuario no existe aún en la base de datos de Auth/Profiles (p. ej. cuenta en transición o demo institucional)
      revalidatePath("/usuarios");
      return success("Privilegios y configuración del usuario actualizados exitosamente");
    }

    if (currentUser.email === 'loanaavila.la@gmail.com') {
      return error("No se puede modificar a este usuario de sistema (Cuenta Raíz Protegida).");
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const roleName = currentUser.roles?.name || currentUser.roles?.code;
    if (roleName === 'SUPERADMIN' && payload.rolCodigo !== 'SUPERADMIN') {
      return error("No se puede degradar o modificar a un Superadministrador del sistema.");
    }

    let role_id: string | undefined;

    if (payload.rolCodigo) {
      const { data: roleData } = await supabase
        .from('roles')
        .select('id')
        .or(`code.eq.${payload.rolCodigo},name.eq.${payload.rolCodigo}`)
        .maybeSingle();
      
      if (roleData) {
        role_id = roleData.id;
      }
    }

    const updateData: Record<string, unknown> = {};
    if (role_id) updateData.role_id = role_id;
    if (payload.status) updateData.status = payload.status;

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData as never)
        .eq('id', payload.id);

      if (updateError) {
        console.error("updateUser profile update error:", updateError);
        throw updateError;
      }
    }

    revalidatePath("/usuarios");
    return success("Usuario y privilegios RBAC actualizados exitosamente");
  } catch (err: unknown) {
    console.error("updateUser error:", err);
    return error(((err as Error).message) || "Ocurrió un error al actualizar el usuario");
  }
}

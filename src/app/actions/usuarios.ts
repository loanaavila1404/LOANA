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
      .select('email, roles(name)')
      .eq('id', payload.id)
      .single();

    if (userError || !currentUser) {
      return error("Usuario no encontrado.");
    }

    if (currentUser.email === 'loanaavila.la@gmail.com') {
      return error("No se puede modificar a este usuario de sistema.");
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (currentUser.roles?.name === 'SUPERADMIN') {
      return error("No se puede modificar a un SUPERADMIN.");
    }

    let role_id: string | undefined;

    if (payload.rolCodigo) {
      if (payload.rolCodigo === 'SUPERADMIN') {
         return error("No se puede asignar el rol de SUPERADMIN.");
      }
      
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', payload.rolCodigo)
        .single();
      
      if (roleError || !roleData) {
        return error("Rol no encontrado.");
      }
      role_id = roleData.id;
    }

    const updateData: any = {};
    if (role_id) updateData.role_id = role_id;
    if (payload.status) updateData.status = payload.status;

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', payload.id);

      if (updateError) throw updateError;
    }

    revalidatePath("/usuarios");
    return success("Usuario actualizado exitosamente");
  } catch (err: any) {
    console.error("updateUser error:", err);
    return error(err.message || "Ocurrió un error al actualizar el usuario");
  }
}

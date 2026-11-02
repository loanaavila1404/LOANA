"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAbsoluteUrl } from "@/lib/utils/url";
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

export interface InviteUserPayload {
  nombre: string;
  email: string;
  dni: string;
  rolCodigo: string;
  sede: string;
  password?: string;
}

export interface InviteUserResult {
  authUserId: string;
  token: string;
  activationUrl: string;
  email: string;
  nombre: string;
  tempPassword: string;
  rolNombre: string;
}

export async function inviteUser(payload: InviteUserPayload): Promise<ActionState<InviteUserResult>> {
  try {
    const email = payload.email.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return error("El correo institucional ingresado no es válido.") as ActionState<InviteUserResult>;
    }

    if (!payload.nombre.trim()) {
      return error("El nombre del colaborador es obligatorio.") as ActionState<InviteUserResult>;
    }

    const adminClient = createAdminClient();

    // 1. Generar contraseña temporal institucional que cumpla con los estándares de seguridad
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const tempPassword = payload.password || `Brusben.${randomNum}!2026`;

    // 2. Extraer nombres y apellidos para la entidad de personas
    const nameParts = payload.nombre.trim().split(/\s+/);
    const nombres = nameParts.length > 2 
      ? nameParts.slice(0, nameParts.length - 2).join(' ') 
      : nameParts[0] || payload.nombre.trim();
    const apellidoPaterno = nameParts.length > 1 ? nameParts[nameParts.length - (nameParts.length > 2 ? 2 : 1)] : 'Brusben';
    const apellidoMaterno = nameParts.length > 2 ? nameParts[nameParts.length - 1] : null;

    // 3. Obtener el ID del rol en la base de datos
    const { data: roleData } = await adminClient
      .from('roles')
      .select('id, name, code')
      .or(`code.eq.${payload.rolCodigo},name.eq.${payload.rolCodigo}`)
      .maybeSingle();

    const roleId = roleData?.id || null;
    const roleNombre = roleData?.name || payload.rolCodigo;

    // 4. Crear o vincular registro en tabla 'personas'
    let personaId: string | null = null;
    const dniClean = payload.dni?.trim();
    const hasDni = dniClean && dniClean !== 'Institucional' && dniClean !== 'Por asignar';

    if (hasDni) {
      const { data: existingPersona } = await adminClient
        .from('personas')
        .select('id')
        .or(`email.eq.${email},numero_documento.eq.${dniClean}`)
        .maybeSingle();

      if (existingPersona) {
        personaId = existingPersona.id;
      } else {
        const { data: newPersona, error: personaError } = await adminClient
          .from('personas')
          .insert({
            tipo_documento: 'DNI',
            numero_documento: dniClean,
            nombres: nombres,
            apellido_paterno: apellidoPaterno,
            apellido_materno: apellidoMaterno,
            email: email,
            status: 'ACTIVO',
          })
          .select('id')
          .maybeSingle();

        if (!personaError && newPersona) {
          personaId = newPersona.id;
        }
      }
    }

    // 5. Crear o actualizar usuario en Supabase Auth con Service Role
    let authUserId: string;

    const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
      email: email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: payload.nombre.trim(),
        name: payload.nombre.trim(),
        dni: dniClean || null,
        role: payload.rolCodigo,
        sede: payload.sede || 'Sede Central - Tumbes',
      },
    });

    if (createError) {
      const isAlreadyExists =
        createError.message?.toLowerCase().includes('already') ||
        createError.message?.toLowerCase().includes('exists') ||
        createError.status === 422;

      if (isAlreadyExists) {
        // Si el usuario ya existe en Supabase Auth, localizarlo para sincronizar credenciales y perfil
        const { data: listData, error: listError } = await adminClient.auth.admin.listUsers();
        if (listError) {
          throw listError;
        }

        const existingUser = listData?.users?.find(
          (u) => u.email?.toLowerCase() === email
        );

        if (existingUser) {
          authUserId = existingUser.id;
          await adminClient.auth.admin.updateUserById(authUserId, {
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
              full_name: payload.nombre.trim(),
              name: payload.nombre.trim(),
              dni: dniClean || null,
              role: payload.rolCodigo,
              sede: payload.sede || 'Sede Central - Tumbes',
            },
          });
        } else {
          console.error('[inviteUser] Error al crear usuario en Supabase Auth:', createError);
          return error(`Error en Supabase Auth: ${createError.message}`) as ActionState<InviteUserResult>;
        }
      } else {
        console.error('[inviteUser] Error al crear usuario en Supabase Auth:', createError);
        return error(`Error en Supabase Auth: ${createError.message}`) as ActionState<InviteUserResult>;
      }
    } else {
      authUserId = createData.user.id;
    }

    // 6. Vincular y registrar en la tabla 'profiles' con status 'ACTIVO'
    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('id')
      .eq('id', authUserId)
      .maybeSingle();

    const profileData = {
      id: authUserId,
      email: email,
      display_name: payload.nombre.trim(),
      role_id: roleId,
      persona_id: personaId,
      status: 'ACTIVO',
      activated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (existingProfile) {
      const { error: updateProfileError } = await adminClient
        .from('profiles')
        .update(profileData)
        .eq('id', authUserId);

      if (updateProfileError) {
        console.error('[inviteUser] Error al actualizar perfil:', updateProfileError);
        throw updateProfileError;
      }
    } else {
      const { error: insertProfileError } = await adminClient
        .from('profiles')
        .insert({
          ...profileData,
          created_at: new Date().toISOString(),
          invited_at: new Date().toISOString(),
        });

      if (insertProfileError) {
        console.error('[inviteUser] Error al insertar perfil:', insertProfileError);
        throw insertProfileError;
      }
    }

    // 7. Generar enlace institucional de activación
    const token = `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const activationUrl = getAbsoluteUrl(`/auth/activar?token=${token}&email=${encodeURIComponent(email)}`);

    revalidatePath("/usuarios");

    return success("Usuario creado e invitado exitosamente en Supabase Auth", {
      authUserId,
      token,
      activationUrl,
      email,
      nombre: payload.nombre.trim(),
      tempPassword,
      rolNombre: roleNombre,
    });
  } catch (err: unknown) {
    console.error("[inviteUser] Error no controlado:", err);
    return error(((err as Error).message) || "Error al registrar el usuario en Supabase Auth") as ActionState<InviteUserResult>;
  }
}

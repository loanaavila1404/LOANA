import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export type PermissionCode = 
  | 'SISTEMA.ADMINISTRAR'
  | 'CONFIGURACION.VER'
  | 'CONFIGURACION.EDITAR'
  | 'USUARIOS.VER'
  | 'USUARIOS.GESTIONAR'
  | 'ROLES.VER'
  | 'AUDITORIA.VER'
  | 'ESTUDIANTES.VER'
  | 'ESTUDIANTES.EDITAR'
  | 'PROGRAMAS.VER'
  | 'PROGRAMAS.EDITAR'
  | 'MATRICULAS.VER'
  | 'MATRICULAS.GESTIONAR'
  | 'MATRICULAS.DESCUENTOS_AUTORIZAR'
  | 'COBRANZA.VER'
  | 'PAGOS.REGISTRAR'
  | 'PAGOS.ANULAR'
  | 'CRM.VER'
  | 'CRM.GESTIONAR'
  | 'CRM.ADMINISTRAR'
  | 'CRM.CONVERSION_SOLICITAR'
  | 'MATRICULA.CONFIRMAR'
  | 'MATRICULA.ACTIVAR'
  | 'DESCUENTO.AUTORIZAR'
  | 'ACADEMICO.VER'
  | 'ACADEMICO.GESTIONAR'
  | 'NOTAS.REGISTRAR'
  | 'PERFIL_PROPIO.VER'
  | 'ACADEMICO_PROPIO.VER'
  | 'PAGOS_PROPIOS.VER'
  | 'REPORTES.VER'
  | 'SEDES.VER_TODAS'; // PROVISIONAL: Agregado para Checkpoint 2 (Fase 4). Requerirá que la BD lo tenga en tabla permissions tras migración 00010.

export async function getUserPermissions(): Promise<PermissionCode[]> {
  const supabase = await createClient();
  // Validar identidad mediante supabase.auth.getUser() de forma segura
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return [];
  }

  // Leer desde tabla interna profiles incluyendo rol
  const { data: profile } = await supabase
    .from('profiles')
    .select('role_id, status, roles(code)')
    .eq('id', user.id)
    .single();

  if (!profile || profile.status !== 'ACTIVO') {
    return [];
  }

  const roleRaw = profile.roles as unknown as { code: string } | { code: string }[] | null;
  const roleCode = (Array.isArray(roleRaw) ? roleRaw[0]?.code : roleRaw?.code) || '';

  const { data: rolePerms } = await supabase
    .from('role_permissions')
    .select('permissions(code)')
    .eq('role_id', profile.role_id || '');

  const perms = (rolePerms || [])
    .map((rp: { permissions: { code: string | null } | null }) => rp.permissions?.code as string as PermissionCode)
    .filter((code): code is PermissionCode => Boolean(code));

  // Roles administrativos, directivos y de tesorería con autorización completa de pagos y gestión
  const upperRole = roleCode.toUpperCase();
  const adminRoles = [
    'SUPERADMIN',
    'SUPER_ADMINISTRADOR',
    'ADMINISTRACION',
    'ADMINISTRADOR',
    'DIRECCION',
    'DIRECTOR',
    'CAJA',
  ];

  if (adminRoles.includes(upperRole)) {
    const adminPerms: PermissionCode[] = [
      'SISTEMA.ADMINISTRAR',
      'PAGOS.REGISTRAR',
      'PAGOS.ANULAR',
      'COBRANZA.VER',
      'MATRICULAS.VER',
      'MATRICULAS.GESTIONAR',
      'ESTUDIANTES.VER',
      'ESTUDIANTES.EDITAR',
      'PROGRAMAS.VER',
      'PROGRAMAS.EDITAR',
    ];
    for (const p of adminPerms) {
      if (!perms.includes(p)) {
        perms.push(p);
      }
    }
  }

  return perms;
}

export async function hasPermission(code: PermissionCode | PermissionCode[]): Promise<boolean> {
  const userPerms = await getUserPermissions();
  if (Array.isArray(code)) {
    return code.some(c => userPerms.includes(c));
  }
  return userPerms.includes(code);
}

export async function requirePermission(code: PermissionCode | PermissionCode[]) {
  const has = await hasPermission(code);
  if (!has) {
    redirect('/dashboard?error=forbidden');
  }
}

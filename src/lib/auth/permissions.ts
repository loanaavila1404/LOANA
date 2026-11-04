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

export interface UserAuthContext {
  userId: string;
  email: string;
  roleCode: string;
  roleName: string;
  isAsesor: boolean;
  permissions: PermissionCode[];
}

export function isAsesorComercialRole(roleCode?: string | null): boolean {
  if (!roleCode) return false;
  const upper = roleCode.toUpperCase().trim();
  return upper === 'ASESOR_COMERCIAL' || upper === 'ASESOR' || upper.includes('ASESOR');
}

export async function getUserAuthContext(): Promise<UserAuthContext | null> {
  const supabase = await createClient();
  // Validar identidad mediante supabase.auth.getUser() de forma segura
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Leer desde tabla interna profiles incluyendo rol
  const { data: profile } = await supabase
    .from('profiles')
    .select('role_id, status, roles(code, name)')
    .eq('id', user.id)
    .single();

  if (!profile || profile.status !== 'ACTIVO') {
    return null;
  }

  const roleRaw = profile.roles as unknown as { code: string; name?: string } | { code: string; name?: string }[] | null;
  const roleObj = Array.isArray(roleRaw) ? roleRaw[0] : roleRaw;
  const roleCode = (roleObj?.code || '').trim();
  const roleName = (roleObj?.name || roleCode || 'Usuario').trim();
  const upperRole = roleCode.toUpperCase();

  const { data: rolePerms } = await supabase
    .from('role_permissions')
    .select('permissions(code)')
    .eq('role_id', profile.role_id || '');

  const perms = (rolePerms || [])
    .map((rp: { permissions: { code: string | null } | null }) => rp.permissions?.code as string as PermissionCode)
    .filter((code): code is PermissionCode => Boolean(code));

  const isAdvisor = isAsesorComercialRole(upperRole) || isAsesorComercialRole(roleName);

  if (isAdvisor) {
    // Permisos autorizados para Asesor Comercial: CRM total, Consulta de Matrículas y Programas
    const advisorPerms: PermissionCode[] = [
      'CRM.VER',
      'CRM.GESTIONAR',
      'CRM.ADMINISTRAR',
      'CRM.CONVERSION_SOLICITAR',
      'MATRICULAS.VER',
      'PROGRAMAS.VER',
      'PERFIL_PROPIO.VER',
    ];
    for (const p of advisorPerms) {
      if (!perms.includes(p)) {
        perms.push(p);
      }
    }

    // Regla de seguridad crítica: El Asesor Comercial NUNCA debe tener permisos de escritura o finanzas en matrículas
    const forbiddenAdvisorPerms: PermissionCode[] = [
      'MATRICULAS.GESTIONAR',
      'MATRICULAS.DESCUENTOS_AUTORIZAR',
      'MATRICULA.CONFIRMAR',
      'MATRICULA.ACTIVAR',
      'DESCUENTO.AUTORIZAR',
      'PAGOS.REGISTRAR',
      'PAGOS.ANULAR',
      'COBRANZA.VER',
      'SISTEMA.ADMINISTRAR',
      'CONFIGURACION.EDITAR',
      'USUARIOS.GESTIONAR',
      'USUARIOS.VER',
      'AUDITORIA.VER',
      'NOTAS.REGISTRAR',
      'ACADEMICO.GESTIONAR',
      'ACADEMICO.VER',
    ];

    const safePerms = perms.filter(p => !forbiddenAdvisorPerms.includes(p));

    return {
      userId: user.id,
      email: user.email || '',
      roleCode: 'ASESOR_COMERCIAL',
      roleName: roleName || 'Asesor Comercial',
      isAsesor: true,
      permissions: safePerms,
    };
  }

  // Roles administrativos, directivos y de tesorería con autorización completa de pagos y gestión
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
      'CRM.VER',
      'CRM.GESTIONAR',
    ];
    for (const p of adminPerms) {
      if (!perms.includes(p)) {
        perms.push(p);
      }
    }
  }

  return {
    userId: user.id,
    email: user.email || '',
    roleCode,
    roleName,
    isAsesor: false,
    permissions: perms,
  };
}

export async function getUserPermissions(): Promise<PermissionCode[]> {
  const authCtx = await getUserAuthContext();
  return authCtx ? authCtx.permissions : [];
}

export async function isCurrentUserAdvisor(): Promise<boolean> {
  const authCtx = await getUserAuthContext();
  return Boolean(authCtx?.isAsesor);
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


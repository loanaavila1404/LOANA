import { Permission, ROLE_PERMISSIONS } from '../constants/permissions';

export function getPermissionsForRole(roleCode: string): Permission[] {
  return ROLE_PERMISSIONS[roleCode] || [];
}

export function hasPermission(userPermissions: string[], permission: Permission): boolean {
  return userPermissions.includes(permission) || userPermissions.includes(Permission.SISTEMA_ADMINISTRAR);
}

export function hasAnyPermission(userPermissions: string[], permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(userPermissions, p));
}

export function requirePermission(userPermissions: string[], permission: Permission): void {
  if (!hasPermission(userPermissions, permission)) {
    throw new Error(`Permiso denegado: Se requiere el permiso ${permission}`);
  }
}

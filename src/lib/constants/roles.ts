import { CODIGOS_ROL, CodigoRol } from './catalogs';

export const ROLES: Record<CodigoRol, { code: CodigoRol; name: string; description: string }> = {
  SUPERADMIN: {
    code: 'SUPERADMIN',
    name: 'Súper Administrador',
    description: 'Control total del sistema'
  },
  ADMIN: {
    code: 'ADMIN',
    name: 'Administrador',
    description: 'Gestión general de la institución'
  },
  COORDINADOR: {
    code: 'COORDINADOR',
    name: 'Coordinador Académico',
    description: 'Gestión de programas y docentes'
  },
  DOCENTE: {
    code: 'DOCENTE',
    name: 'Docente',
    description: 'Registro de notas y asistencia'
  },
  VENDEDOR: {
    code: 'VENDEDOR',
    name: 'Asesor de Ventas',
    description: 'Gestión de prospectos y matrículas'
  },
  CAJERO: {
    code: 'CAJERO',
    name: 'Cajero',
    description: 'Gestión de pagos y cobranzas'
  }
};

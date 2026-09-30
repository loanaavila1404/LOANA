export interface SessionUser {
  name: string;
  email: string;
  roleCode: string;
  role: string;
  photoUrl: string;
  permissions: string[];
}

export const TOKEN_SEDE_TODAS = 'TODAS';

export type Sede = {
  id: string;
  codigo: string;
  nombre: string;
  status: 'ACTIVO' | 'INACTIVO';
};

export type SeleccionSede =
  | { tipo: 'SEDE'; sedeId: string }
  | { tipo: 'TODAS' };

export type SedeContextEstado = 'COMPATIBILIDAD' | 'LISTO' | 'SIN_ACCESO' | 'ERROR';

export type SedeContextType = {
  estado: SedeContextEstado;
  sedesEnabled: boolean;
  modoCompatibilidad: boolean;
  sedeEfectiva: SeleccionSede | null;
  sedeSolicitada: SeleccionSede | null;
  sedesDisponibles: Sede[];
  permisoTodas: boolean;
  sinAcceso: boolean;
  etiquetaCompatibilidad?: string;
  cookieDebeLimpiarse: boolean;
  cookieDebeActualizarseA?: string;
};

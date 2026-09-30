import { Sede, SeleccionSede, SedeContextType, TOKEN_SEDE_TODAS } from '@/lib/types';
import { fetchSedesActivas, fetchUsuarioSedes } from '@/lib/services/sede-repository';

// Feature flag documentada, por defecto false.
// Cuando 00010_sedes_oferta se ejecute en BD, se debe cambiar a "true" (literal) en el entorno correspondiente.
export const NEXT_PUBLIC_SEDES_ENABLED = process.env.NEXT_PUBLIC_SEDES_ENABLED === 'true';

/**
 * Resolución pura del contexto de sede.
 * Separa la lectura de la BD de las reglas de negocio.
 * @param userId UUID del usuario
 * @param permissions Array de permisos funcionales efectivos
 * @param cookieSede Valor de la cookie (UUID o TOKEN_SEDE_TODAS)
 */
export async function getSedeContext(
  userId: string,
  permissions: string[],
  cookieSede?: string
): Promise<SedeContextType> {
  const permisoTodas = permissions.includes('SEDES.VER_TODAS');

  let sedeSolicitada: SeleccionSede | null = null;
  if (cookieSede === TOKEN_SEDE_TODAS) {
    sedeSolicitada = { tipo: 'TODAS' };
  } else if (cookieSede && cookieSede.trim() !== '') {
    sedeSolicitada = { tipo: 'SEDE', sedeId: cookieSede };
  }

  // A. MODO COMPATIBILIDAD (Sin instanciar repositorio)
  if (!NEXT_PUBLIC_SEDES_ENABLED) {
    return {
      estado: 'COMPATIBILIDAD',
      sedesEnabled: false,
      modoCompatibilidad: true,
      sedeEfectiva: null,
      sedeSolicitada: null,
      sedesDisponibles: [],
      permisoTodas: permisoTodas,
      sinAcceso: false,
      etiquetaCompatibilidad: 'Sede Central · Tumbes',
      cookieDebeLimpiarse: !!cookieSede, // Si hay una cookie vieja, marcar para limpiar
    };
  }

  // B. MODO REAL: Consultar repositorios de forma segura
  let allSedes: Sede[] = [];
  try {
    allSedes = await fetchSedesActivas();
  } catch (error) {
    console.error(error);
    return {
      estado: 'ERROR',
      sedesEnabled: true,
      modoCompatibilidad: false,
      sedeEfectiva: null,
      sedeSolicitada,
      sedesDisponibles: [],
      permisoTodas,
      sinAcceso: true,
      cookieDebeLimpiarse: false
    };
  }

  let sedesDisponibles: Sede[] = [];

  if (permisoTodas) {
    sedesDisponibles = allSedes;
  } else {
    try {
      const allowedIdsArray = await fetchUsuarioSedes(userId);
      const allowedIds = new Set(allowedIdsArray);
      sedesDisponibles = allSedes.filter(s => allowedIds.has(s.id));
    } catch (error) {
      console.error(error);
      return {
        estado: 'ERROR',
        sedesEnabled: true,
        modoCompatibilidad: false,
        sedeEfectiva: null,
        sedeSolicitada,
        sedesDisponibles: [],
        permisoTodas,
        sinAcceso: true,
        cookieDebeLimpiarse: false
      };
    }
  }

  // Estado explícito: sin asignaciones exitosas
  if (sedesDisponibles.length === 0 && !permisoTodas) {
    return {
      estado: 'SIN_ACCESO',
      sedesEnabled: true,
      modoCompatibilidad: false,
      sedeEfectiva: null,
      sedeSolicitada,
      sedesDisponibles: [],
      permisoTodas,
      sinAcceso: true,
      cookieDebeLimpiarse: !!cookieSede
    };
  }

  // C. RESOLVER SEDE EFECTIVA
  let sedeEfectiva: SeleccionSede | null = null;
  
  if (sedeSolicitada?.tipo === 'TODAS' && permisoTodas) {
    sedeEfectiva = { tipo: 'TODAS' };
  } else if (sedeSolicitada?.tipo === 'SEDE' && sedesDisponibles.some(s => s.id === sedeSolicitada?.sedeId)) {
    sedeEfectiva = { tipo: 'SEDE', sedeId: sedeSolicitada.sedeId };
  }

  let cookieDebeLimpiarse = false;
  let cookieDebeActualizarseA: string | undefined = undefined;

  // D. FALLBACK Y LIMPIEZA DE COOKIE
  if (!sedeEfectiva) {
    if (sedesDisponibles.length > 0) {
      sedeEfectiva = { tipo: 'SEDE', sedeId: sedesDisponibles[0].id };
    } else if (permisoTodas) {
      sedeEfectiva = { tipo: 'TODAS' };
    }
    
    if (cookieSede) {
      cookieDebeLimpiarse = true;
      cookieDebeActualizarseA = sedeEfectiva?.tipo === 'TODAS' ? TOKEN_SEDE_TODAS : sedeEfectiva?.sedeId;
    }
  }

  return {
    estado: 'LISTO',
    sedesEnabled: true,
    modoCompatibilidad: false,
    sedeEfectiva,
    sedeSolicitada,
    sedesDisponibles,
    permisoTodas,
    sinAcceso: false,
    cookieDebeLimpiarse,
    cookieDebeActualizarseA
  };
}

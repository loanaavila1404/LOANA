export type PersonaIntegrityResult = {
  completo: boolean;
  mensaje: string;
  faltantes: string[];
};

export function checkPersonaIntegrity(
  persona: {
    nombres?: string | null;
    apellido_paterno?: string | null;
    tipo_documento?: string | null;
    numero_documento?: string | null;
    email?: string | null;
    telefono?: string | null;
  },
  estudiante?: {
    codigo_estudiante?: string | null;
  } | null
): PersonaIntegrityResult {
  const faltantes: string[] = [];

  if (!persona.nombres?.trim()) faltantes.push("nombres");
  if (!persona.apellido_paterno?.trim()) faltantes.push("apellido_paterno");
  if (!persona.tipo_documento?.trim()) faltantes.push("tipo_documento");
  if (!persona.numero_documento?.trim()) faltantes.push("numero_documento");

  const datosPersonalesCompletos = faltantes.length === 0;

  let codigoEstudianteValido = true;
  const isEstudiante = estudiante !== undefined && estudiante !== null;

  if (isEstudiante) {
    if (!estudiante.codigo_estudiante?.trim()) {
      faltantes.push("codigo_estudiante");
      codigoEstudianteValido = false;
    }
  }

  if (faltantes.length === 0) {
    return {
      completo: true,
      mensaje: "Datos completos",
      faltantes
    };
  }

  if (!datosPersonalesCompletos) {
    return {
      completo: false,
      mensaje: "Datos personales incompletos",
      faltantes
    };
  }

  if (isEstudiante && !codigoEstudianteValido) {
    return {
      completo: false,
      mensaje: "Código de estudiante pendiente",
      faltantes
    };
  }

  return {
    completo: false,
    mensaje: "Datos incompletos",
    faltantes
  };
}

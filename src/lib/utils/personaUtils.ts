export type DocumentoRequisitoItem = {
  codigo: string;
  nombre: string;
  categoria: "IDENTIDAD" | "ACADEMICO" | "INSTITUCIONAL" | "CONTACTO";
  conforme: boolean;
  estado: "CONFORME" | "PENDIENTE" | "OBSERVADO";
  detalle: string;
  obligatorio: boolean;
};

export type PersonaIntegrityResult = {
  completo: boolean;
  mensaje: string;
  faltantes: string[];
  porcentaje: number;
  conformes: number;
  totalRequisitos: number;
  requisitos: DocumentoRequisitoItem[];
};

export function checkPersonaIntegrity(
  persona: {
    nombres?: string | null;
    apellido_paterno?: string | null;
    apellido_materno?: string | null;
    tipo_documento?: string | null;
    numero_documento?: string | null;
    email?: string | null;
    telefono?: string | null;
    direccion?: string | null;
    distrito?: string | null;
  },
  estudiante?: {
    codigo_estudiante?: string | null;
    observaciones?: string | null;
  } | null,
  hasActiveMatricula?: boolean
): PersonaIntegrityResult {
  const faltantes: string[] = [];

  const tieneIdentidad = Boolean(
    persona.nombres?.trim() &&
      persona.apellido_paterno?.trim() &&
      persona.tipo_documento?.trim() &&
      persona.numero_documento?.trim()
  );

  if (!persona.nombres?.trim()) faltantes.push("nombres");
  if (!persona.apellido_paterno?.trim()) faltantes.push("apellido_paterno");
  if (!persona.tipo_documento?.trim()) faltantes.push("tipo_documento");
  if (!persona.numero_documento?.trim()) faltantes.push("numero_documento");

  const tieneContacto = Boolean(persona.email?.trim() && persona.telefono?.trim());
  if (!persona.email?.trim()) faltantes.push("email");
  if (!persona.telefono?.trim()) faltantes.push("telefono");

  const isEstudiante = estudiante !== undefined && estudiante !== null;
  const tieneCodigoEstudiante = isEstudiante ? Boolean(estudiante?.codigo_estudiante?.trim()) : false;

  if (isEstudiante && !tieneCodigoEstudiante) {
    faltantes.push("codigo_estudiante");
  }

  const tieneFichaMatricula = Boolean(hasActiveMatricula || tieneCodigoEstudiante);
  const tieneCertificados = Boolean(
    tieneIdentidad &&
      tieneContacto &&
      isEstudiante &&
      tieneCodigoEstudiante &&
      !(estudiante?.observaciones || "").toUpperCase().includes("PENDIENTE")
  );

  const requisitos: DocumentoRequisitoItem[] = [
    {
      codigo: "DOC-DNI",
      nombre: `Documento de Identidad (${persona.tipo_documento || "DNI"})`,
      categoria: "IDENTIDAD",
      conforme: tieneIdentidad,
      estado: tieneIdentidad ? "CONFORME" : "PENDIENTE",
      detalle: tieneIdentidad
        ? `Verificado Nº ${persona.numero_documento}`
        : "Falta registrar documento de identidad válido",
      obligatorio: true,
    },
    {
      codigo: "DOC-CONTACTO",
      nombre: "Ficha de Datos de Contacto y Localización",
      categoria: "CONTACTO",
      conforme: tieneContacto,
      estado: tieneContacto ? "CONFORME" : "OBSERVADO",
      detalle: tieneContacto
        ? `${persona.telefono} · ${persona.email}`
        : "Pendiente completar correo electrónico o teléfono móvil",
      obligatorio: true,
    },
    {
      codigo: "DOC-CODIGO",
      nombre: "Registro y Código Institucional de Estudiante",
      categoria: "INSTITUCIONAL",
      conforme: isEstudiante && tieneCodigoEstudiante,
      estado: isEstudiante
        ? tieneCodigoEstudiante
          ? "CONFORME"
          : "PENDIENTE"
        : "PENDIENTE",
      detalle:
        isEstudiante && tieneCodigoEstudiante
          ? `Código asignado: ${estudiante?.codigo_estudiante}`
          : isEstudiante
            ? "Código estudiantil pendiente de generación en matrícula"
            : "Aún no habilitado como estudiante activo",
      obligatorio: true,
    },
    {
      codigo: "DOC-MATRICULA",
      nombre: "Ficha Oficial de Matrícula y Compromiso de Pagos",
      categoria: "INSTITUCIONAL",
      conforme: tieneFichaMatricula,
      estado: tieneFichaMatricula ? "CONFORME" : "PENDIENTE",
      detalle: tieneFichaMatricula
        ? "Expediente de matrícula vinculado en sistema"
        : "Sin ficha de matrícula activa vinculada",
      obligatorio: true,
    },
    {
      codigo: "DOC-CERTIFICADO",
      nombre: "Certificados Académicos / Requisitos de Admisión",
      categoria: "ACADEMICO",
      conforme: tieneCertificados,
      estado: tieneCertificados ? "CONFORME" : "PENDIENTE",
      detalle: tieneCertificados
        ? "Documentación académica conforme"
        : "Verificación de certificados de estudio pendiente",
      obligatorio: false,
    },
  ];

  const conformes = requisitos.filter(r => r.conforme).length;
  const totalRequisitos = requisitos.length;
  const porcentaje = Math.round((conformes / totalRequisitos) * 100);

  if (!tieneIdentidad) {
    return {
      completo: false,
      mensaje: "DNI / Identidad incompleta",
      faltantes,
      porcentaje,
      conformes,
      totalRequisitos,
      requisitos,
    };
  }

  if (isEstudiante && !tieneCodigoEstudiante) {
    return {
      completo: false,
      mensaje: "Código de estudiante pendiente",
      faltantes,
      porcentaje,
      conformes,
      totalRequisitos,
      requisitos,
    };
  }

  if (!tieneContacto) {
    return {
      completo: false,
      mensaje: "Contacto incompleto (correo/tel.)",
      faltantes,
      porcentaje,
      conformes,
      totalRequisitos,
      requisitos,
    };
  }

  return {
    completo: true,
    mensaje: "Expediente 100%",
    faltantes: [],
    porcentaje: 100,
    conformes: totalRequisitos,
    totalRequisitos,
    requisitos: requisitos.map(r => ({ ...r, conforme: true, estado: "CONFORME" })),
  };
}

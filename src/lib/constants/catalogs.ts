export const TIPOS_DOCUMENTO = ['DNI', 'CE', 'PASAPORTE'] as const;
export type TipoDocumento = typeof TIPOS_DOCUMENTO[number];

export const ESTADOS_PERSONA = ['ACTIVO', 'INACTIVO'] as const;
export type EstadoPersona = typeof ESTADOS_PERSONA[number];

export const ESTADOS_ESTUDIANTE = ['REGISTRADO', 'MATRICULADO', 'RETIRADO', 'EGRESADO'] as const;
export type EstadoEstudiante = typeof ESTADOS_ESTUDIANTE[number];

export const TIPOS_PROGRAMA = ['MODULAR', 'CARRERA_TECNICA', 'CURSO_LIBRE'] as const;
export type TipoPrograma = typeof TIPOS_PROGRAMA[number];

export const ESTADOS_USUARIO = ['ACTIVO', 'INACTIVO', 'BLOQUEADO'] as const;
export type EstadoUsuario = typeof ESTADOS_USUARIO[number];

export const CODIGOS_ROL = ['SUPERADMIN', 'ADMIN', 'COORDINADOR', 'DOCENTE', 'VENDEDOR', 'CAJERO'] as const;
export type CodigoRol = typeof CODIGOS_ROL[number];

export const ESTADOS_MATRICULA = ['PRE_MATRICULADO', 'ACTIVO', 'SUSPENDIDO', 'RETIRADO'] as const;
export type EstadoMatricula = typeof ESTADOS_MATRICULA[number];

export const ESTADOS_CUOTA = ['PENDIENTE', 'PAGADA', 'VENCIDA', 'ANULADA'] as const;
export type EstadoCuota = typeof ESTADOS_CUOTA[number];

export const ESTADOS_PAGO = ['PROCESADO', 'ANULADO', 'RECHAZADO'] as const;
export type EstadoPago = typeof ESTADOS_PAGO[number];

export const TIPOS_CUOTA = ['MATRICULA', 'MENSUALIDAD', 'CERTIFICADO', 'OTROS'] as const;
export type TipoCuota = typeof TIPOS_CUOTA[number];

export const DIAS_SEMANA = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'] as const;
export type DiaSemana = typeof DIAS_SEMANA[number];

export const ESTADOS_HORARIO = ['ACTIVO', 'INACTIVO'] as const;
export type EstadoHorario = typeof ESTADOS_HORARIO[number];

export const ESTADOS_CICLO = ['PLANIFICADO', 'EN_CURSO', 'FINALIZADO'] as const;
export type EstadoCiclo = typeof ESTADOS_CICLO[number];

export const ESTADOS_CURSO = ['ACTIVO', 'INACTIVO'] as const;
export type EstadoCurso = typeof ESTADOS_CURSO[number];

export const ESTADOS_PROSPECTO = ['NUEVO', 'CONTACTADO', 'INTERESADO', 'MATRICULADO', 'PERDIDO'] as const;
export type EstadoProspecto = typeof ESTADOS_PROSPECTO[number];

export const NIVELES_INTERES = ['ALTO', 'MEDIO', 'BAJO'] as const;
export type NivelInteres = typeof NIVELES_INTERES[number];

export const CANALES_CAPTACION = ['FACEBOOK', 'INSTAGRAM', 'WHATSAPP', 'WEB', 'REFERIDO', 'OTROS'] as const;
export type CanalCaptacion = typeof CANALES_CAPTACION[number];

export const TIPOS_ACTIVIDAD_CRM = ['LLAMADA', 'MENSAJE', 'CORREO', 'REUNION'] as const;
export type TipoActividadCrm = typeof TIPOS_ACTIVIDAD_CRM[number];

export const ESTADOS_TAREA_CRM = ['PENDIENTE', 'COMPLETADA', 'CANCELADA'] as const;
export type EstadoTareaCrm = typeof ESTADOS_TAREA_CRM[number];

export const MOTIVOS_PERDIDA = ['PRECIO', 'HORARIO', 'COMPETENCIA', 'NO_CONTESTA', 'OTROS'] as const;
export type MotivoPerdida = typeof MOTIVOS_PERDIDA[number];

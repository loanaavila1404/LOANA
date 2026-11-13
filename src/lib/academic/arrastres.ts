/**
 * Lógica Académica Institucional: Malla Curricular, Prerrequisitos, Kardex y Arrastres
 * Centro de Capacitaciones Brusben - Carreras Técnicas (3 Años / 6 Ciclos)
 * 
 * Regla Oficial de Arrastres:
 * - Nota mínima aprobatoria: 13 (escala vigesimal 0 a 20).
 * - Cursos con nota < 13 generan deuda académica o "arrastre".
 * - Bloqueo por 3 Arrastres: Si un estudiante acumula 3 o más cursos desaprobados,
 *   se bloquea automáticamente su matrícula en el ciclo regular siguiente, obligándolo
 *   a regularizar obligatoriamente en el Ciclo de Verano / Nivelación.
 * - Estudiantes con 1 o 2 arrastres son Aptos Condicionales para promoverse al ciclo regular.
 */

export type CondicionAcademica = 'REGULAR' | 'APTO_CON_ARRASTRES' | 'BLOQUEADO_TRES_ARRASTRES';

export interface EvaluacionDesglose {
  ec1: number | null; // Evaluación Continua 1 (20%)
  ec2: number | null; // Evaluación Continua 2 (20%)
  ep: number | null;  // Examen Parcial (30%)
  ef: number | null;  // Examen Final (30%)
  promedioFinal: number | null;
  estado: 'APROBADO' | 'DESAPROBADO' | 'PENDIENTE' | 'REGULARIZADO';
}

export interface CursoKardexItem {
  cursoId: string;
  codigo: string;
  nombre: string;
  creditos: number;
  horasSemanales: number;
  cicloOrden: number;
  cicloNombre: string;
  prerrequisitoCodigo?: string | null;
  prerrequisitoNombre?: string | null;
  prerrequisitoCumplido?: boolean;
  evaluaciones: EvaluacionDesglose;
  asistenciaPct: number;
  periodoNombre?: string;
  regularizadoEnVerano?: boolean;
}

export interface CicloKardexItem {
  cicloNumero: number;
  cicloNombre: string;
  cursos: CursoKardexItem[];
  promedioPonderado: number | null;
  creditosAprobados: number;
  creditosTotales: number;
  arrastresCount: number;
  estadoCiclo: 'APROBADO' | 'CON_ARRASTRES' | 'BLOQUEADO' | 'EN_CURSO' | 'PENDIENTE';
}

export interface ResumenKardex {
  ciclos: CicloKardexItem[];
  promedioPonderadoAcumulado: number;
  totalCreditosAprobados: number;
  totalCreditosPlan: number;
  totalArrastresActivos: number;
  totalArrastresRegularizados: number;
  condicion: CondicionAcademica;
  condicionTexto: string;
  condicionDescripcion: string;
  puedeMatricularSiguienteCiclo: boolean;
  requiereCicloVerano: boolean;
  cicloActualNumero: number;
  cicloSiguienteNumero: number;
  arrastresDetalle: {
    cursoId: string;
    cursoCodigo: string;
    cursoNombre: string;
    cicloOrden: number;
    nota: number;
    periodo?: string;
    esBloqueante: boolean;
    regularizado: boolean;
  }[];
}

/**
 * Calcula el promedio final de acuerdo a los pesos oficiales de Brusben:
 * EC1 (20%) + EC2 (20%) + EP (30%) + EF (30%)
 */
export function calcularPromedioPonderadoCurso(
  ec1: number | null,
  ec2: number | null,
  ep: number | null,
  ef: number | null
): number | null {
  if (ec1 === null && ec2 === null && ep === null && ef === null) return null;
  const n1 = ec1 ?? 0;
  const n2 = ec2 ?? 0;
  const p = ep ?? 0;
  const f = ef ?? 0;
  const raw = n1 * 0.2 + n2 * 0.2 + p * 0.3 + f * 0.3;
  return Math.round(raw);
}

/**
 * Genera el plan curricular estándar de 6 ciclos para una carrera técnica de Brusben
 * (con cursos, códigos y créditos institucionales si no hay cursos creados aún)
 */
export function getMallaEstandarBrusben(carreraNombre: string = 'General'): {
  cicloNumero: number;
  cicloNombre: string;
  cursos: {
    codigo: string;
    nombre: string;
    creditos: number;
    horas: number;
    prerrequisitoCodigo?: string | null;
  }[];
}[] {
  const isEnfermeria = carreraNombre.toLowerCase().includes('enferm') || carreraNombre.toLowerCase().includes('salud');
  const isContabilidad = carreraNombre.toLowerCase().includes('conta') || carreraNombre.toLowerCase().includes('finan');
  const isSistemas = carreraNombre.toLowerCase().includes('sistem') || carreraNombre.toLowerCase().includes('comput');

  if (isEnfermeria) {
    return [
      {
        cicloNumero: 1,
        cicloNombre: 'Ciclo I',
        cursos: [
          { codigo: 'ENF-101', nombre: 'Anatomía y Fisiología Humana', creditos: 4, horas: 5 },
          { codigo: 'ENF-102', nombre: 'Bioseguridad y Primeros Auxilios', creditos: 3, horas: 4 },
          { codigo: 'ENF-103', nombre: 'Fundamentos de Enfermería I', creditos: 4, horas: 5 },
          { codigo: 'ENF-104', nombre: 'Comunicación y Redacción Técnica', creditos: 3, horas: 3 },
          { codigo: 'ENF-105', nombre: 'Ofimática Aplicada a la Salud', creditos: 2, horas: 3 },
        ],
      },
      {
        cicloNumero: 2,
        cicloNombre: 'Ciclo II',
        cursos: [
          { codigo: 'ENF-201', nombre: 'Fundamentos de Enfermería II', creditos: 4, horas: 5, prerrequisitoCodigo: 'ENF-103' },
          { codigo: 'ENF-202', nombre: 'Microbiología y Parasitología', creditos: 3, horas: 4, prerrequisitoCodigo: 'ENF-101' },
          { codigo: 'ENF-203', nombre: 'Farmacología Básica', creditos: 4, horas: 4, prerrequisitoCodigo: 'ENF-101' },
          { codigo: 'ENF-204', nombre: 'Nutrición y Dietoterapia', creditos: 3, horas: 3 },
          { codigo: 'ENF-205', nombre: 'Ética y Deontología en Salud', creditos: 2, horas: 2 },
        ],
      },
      {
        cicloNumero: 3,
        cicloNombre: 'Ciclo III',
        cursos: [
          { codigo: 'ENF-301', nombre: 'Enfermería en Salud del Adulto I', creditos: 5, horas: 6, prerrequisitoCodigo: 'ENF-201' },
          { codigo: 'ENF-302', nombre: 'Farmacología Clínica Aplicada', creditos: 4, horas: 4, prerrequisitoCodigo: 'ENF-203' },
          { codigo: 'ENF-303', nombre: 'Epidemiología y Salud Pública', creditos: 3, horas: 4 },
          { codigo: 'ENF-304', nombre: 'Atención en Emergencias y Urgencias', creditos: 4, horas: 4, prerrequisitoCodigo: 'ENF-102' },
        ],
      },
      {
        cicloNumero: 4,
        cicloNombre: 'Ciclo IV',
        cursos: [
          { codigo: 'ENF-401', nombre: 'Enfermería en Salud del Adulto II', creditos: 5, horas: 6, prerrequisitoCodigo: 'ENF-301' },
          { codigo: 'ENF-402', nombre: 'Salud Materno Perinatal', creditos: 4, horas: 5, prerrequisitoCodigo: 'ENF-301' },
          { codigo: 'ENF-403', nombre: 'Salud Mental y Psiquiatría', creditos: 3, horas: 3 },
          { codigo: 'ENF-404', nombre: 'Práctica Preprofesional I (Clínica)', creditos: 4, horas: 8, prerrequisitoCodigo: 'ENF-301' },
        ],
      },
      {
        cicloNumero: 5,
        cicloNombre: 'Ciclo V',
        cursos: [
          { codigo: 'ENF-501', nombre: 'Enfermería en Salud del Niño y Adolescente', creditos: 5, horas: 6, prerrequisitoCodigo: 'ENF-402' },
          { codigo: 'ENF-502', nombre: 'Administración y Gestión en Salud', creditos: 3, horas: 4 },
          { codigo: 'ENF-503', nombre: 'Proyectos de Innovación Tecnológica', creditos: 4, horas: 4 },
          { codigo: 'ENF-504', nombre: 'Práctica Preprofesional II (Comunitaria)', creditos: 4, horas: 8, prerrequisitoCodigo: 'ENF-404' },
        ],
      },
      {
        cicloNumero: 6,
        cicloNombre: 'Ciclo VI',
        cursos: [
          { codigo: 'ENF-601', nombre: 'Enfermería en Cuidados Críticos y Quirúrgicos', creditos: 5, horas: 6, prerrequisitoCodigo: 'ENF-501' },
          { codigo: 'ENF-602', nombre: 'Seminario de Titulación e Investigación', creditos: 4, horas: 4, prerrequisitoCodigo: 'ENF-503' },
          { codigo: 'ENF-603', nombre: 'Liderazgo y Empleabilidad Laboral', creditos: 3, horas: 3 },
          { codigo: 'ENF-604', nombre: 'Internado Hospitalario Integral', creditos: 6, horas: 12, prerrequisitoCodigo: 'ENF-504' },
        ],
      },
    ];
  }

  if (isContabilidad) {
    return [
      {
        cicloNumero: 1,
        cicloNombre: 'Ciclo I',
        cursos: [
          { codigo: 'CON-101', nombre: 'Contabilidad General I', creditos: 4, horas: 5 },
          { codigo: 'CON-102', nombre: 'Documentación Comercial y Bancaria', creditos: 3, horas: 4 },
          { codigo: 'CON-103', nombre: 'Matemática Financiera', creditos: 4, horas: 4 },
          { codigo: 'CON-104', nombre: 'Administración Empresarial', creditos: 3, horas: 3 },
          { codigo: 'CON-105', nombre: 'Legislación Laboral y Comercial', creditos: 3, horas: 3 },
        ],
      },
      {
        cicloNumero: 2,
        cicloNombre: 'Ciclo II',
        cursos: [
          { codigo: 'CON-201', nombre: 'Contabilidad General II', creditos: 4, horas: 5, prerrequisitoCodigo: 'CON-101' },
          { codigo: 'CON-202', nombre: 'Plan Contable General Empresarial', creditos: 4, horas: 4, prerrequisitoCodigo: 'CON-101' },
          { codigo: 'CON-203', nombre: 'Legislación Tributaria I', creditos: 3, horas: 4, prerrequisitoCodigo: 'CON-105' },
          { codigo: 'CON-204', nombre: 'Software Contable I (Concar / SISCONT)', creditos: 3, horas: 4 },
          { codigo: 'CON-205', nombre: 'Estadística Aplicada a los Negocios', creditos: 3, horas: 3, prerrequisitoCodigo: 'CON-103' },
        ],
      },
      {
        cicloNumero: 3,
        cicloNombre: 'Ciclo III',
        cursos: [
          { codigo: 'CON-301', nombre: 'Contabilidad de Costos I', creditos: 4, horas: 5, prerrequisitoCodigo: 'CON-201' },
          { codigo: 'CON-302', nombre: 'Legislación Tributaria II (Impuesto a la Renta)', creditos: 4, horas: 4, prerrequisitoCodigo: 'CON-203' },
          { codigo: 'CON-303', nombre: 'Contabilidad de Sociedades', creditos: 4, horas: 4, prerrequisitoCodigo: 'CON-201' },
          { codigo: 'CON-304', nombre: 'Finanzas Corporativas I', creditos: 3, horas: 4, prerrequisitoCodigo: 'CON-205' },
        ],
      },
      {
        cicloNumero: 4,
        cicloNombre: 'Ciclo IV',
        cursos: [
          { codigo: 'CON-401', nombre: 'Contabilidad de Costos II', creditos: 4, horas: 5, prerrequisitoCodigo: 'CON-301' },
          { codigo: 'CON-402', nombre: 'Estados Financieros y NIIF', creditos: 5, horas: 5, prerrequisitoCodigo: 'CON-303' },
          { codigo: 'CON-403', nombre: 'Auditoría Financiera I', creditos: 4, horas: 4, prerrequisitoCodigo: 'CON-301' },
          { codigo: 'CON-404', nombre: 'Práctica Preprofesional Contable I', creditos: 4, horas: 8, prerrequisitoCodigo: 'CON-303' },
        ],
      },
      {
        cicloNumero: 5,
        cicloNombre: 'Ciclo V',
        cursos: [
          { codigo: 'CON-501', nombre: 'Auditoría Tributaria y Fiscalización SUNAT', creditos: 4, horas: 5, prerrequisitoCodigo: 'CON-403' },
          { codigo: 'CON-502', nombre: 'Contabilidad Gubernamental', creditos: 4, horas: 4, prerrequisitoCodigo: 'CON-402' },
          { codigo: 'CON-503', nombre: 'Formulación y Evaluación de Proyectos', creditos: 3, horas: 4 },
          { codigo: 'CON-504', nombre: 'Práctica Preprofesional Contable II', creditos: 4, horas: 8, prerrequisitoCodigo: 'CON-404' },
        ],
      },
      {
        cicloNumero: 6,
        cicloNombre: 'Ciclo VI',
        cursos: [
          { codigo: 'CON-601', nombre: 'Peritaje Contable y Judicial', creditos: 4, horas: 4, prerrequisitoCodigo: 'CON-501' },
          { codigo: 'CON-602', nombre: 'Seminario de Titulación e Integración Contable', creditos: 5, horas: 5, prerrequisitoCodigo: 'CON-503' },
          { codigo: 'CON-603', nombre: 'Asesoría y Consultoría Tributaria', creditos: 4, horas: 4, prerrequisitoCodigo: 'CON-501' },
          { codigo: 'CON-604', nombre: 'Práctica Profesional Integral', creditos: 5, horas: 10, prerrequisitoCodigo: 'CON-504' },
        ],
      },
    ];
  }

  // Default / Sistemas / General
  return [
    {
      cicloNumero: 1,
      cicloNombre: 'Ciclo I',
      cursos: [
        { codigo: 'SIS-101', nombre: 'Algoritmos y Estructura de Datos', creditos: 4, horas: 5 },
        { codigo: 'SIS-102', nombre: 'Arquitectura de Computadoras y Redes', creditos: 3, horas: 4 },
        { codigo: 'SIS-103', nombre: 'Fundamentos de Base de Datos', creditos: 4, horas: 4 },
        { codigo: 'SIS-104', nombre: 'Matemática para Computación', creditos: 3, horas: 3 },
        { codigo: 'SIS-105', nombre: 'Comunicación y Competencias Digitales', creditos: 2, horas: 2 },
      ],
    },
    {
      cicloNumero: 2,
      cicloNombre: 'Ciclo II',
      cursos: [
        { codigo: 'SIS-201', nombre: 'Programación Orientada a Objetos', creditos: 4, horas: 5, prerrequisitoCodigo: 'SIS-101' },
        { codigo: 'SIS-202', nombre: 'Administración de Bases de Datos SQL', creditos: 4, horas: 4, prerrequisitoCodigo: 'SIS-103' },
        { codigo: 'SIS-203', nombre: 'Redes de Datos y Cableado Estructurado', creditos: 3, horas: 4, prerrequisitoCodigo: 'SIS-102' },
        { codigo: 'SIS-204', nombre: 'Desarrollo Web Frontend', creditos: 3, horas: 4 },
        { codigo: 'SIS-205', nombre: 'Sistemas Operativos Servidores (Linux/Windows)', creditos: 3, horas: 3 },
      ],
    },
    {
      cicloNumero: 3,
      cicloNombre: 'Ciclo III',
      cursos: [
        { codigo: 'SIS-301', nombre: 'Desarrollo de Software Backend y APIs', creditos: 4, horas: 5, prerrequisitoCodigo: 'SIS-201' },
        { codigo: 'SIS-302', nombre: 'Bases de Datos NoSQL y Cloud', creditos: 4, horas: 4, prerrequisitoCodigo: 'SIS-202' },
        { codigo: 'SIS-303', nombre: 'Seguridad Informática y Ciberseguridad', creditos: 3, horas: 4, prerrequisitoCodigo: 'SIS-203' },
        { codigo: 'SIS-304', nombre: 'Análisis y Diseño de Sistemas', creditos: 4, horas: 4, prerrequisitoCodigo: 'SIS-201' },
      ],
    },
    {
      cicloNumero: 4,
      cicloNombre: 'Ciclo IV',
      cursos: [
        { codigo: 'SIS-401', nombre: 'Desarrollo de Aplicaciones Móviles', creditos: 4, horas: 5, prerrequisitoCodigo: 'SIS-301' },
        { codigo: 'SIS-402', nombre: 'Ingeniería de Software y Metodologías Ágiles', creditos: 4, horas: 4, prerrequisitoCodigo: 'SIS-304' },
        { codigo: 'SIS-403', nombre: 'DevOps y Despliegue en la Nube', creditos: 3, horas: 4, prerrequisitoCodigo: 'SIS-301' },
        { codigo: 'SIS-404', nombre: 'Práctica Preprofesional I (Desarrollo)', creditos: 4, horas: 8, prerrequisitoCodigo: 'SIS-304' },
      ],
    },
    {
      cicloNumero: 5,
      cicloNombre: 'Ciclo V',
      cursos: [
        { codigo: 'SIS-501', nombre: 'Inteligencia de Negocios y Big Data', creditos: 4, horas: 5, prerrequisitoCodigo: 'SIS-302' },
        { codigo: 'SIS-502', nombre: 'Gestión de Proyectos TI (PMBOK/Scrum)', creditos: 3, horas: 4, prerrequisitoCodigo: 'SIS-402' },
        { codigo: 'SIS-503', nombre: 'Auditoría y Gobierno de TI', creditos: 3, horas: 4 },
        { codigo: 'SIS-504', nombre: 'Práctica Preprofesional II (Sistemas)', creditos: 4, horas: 8, prerrequisitoCodigo: 'SIS-404' },
      ],
    },
    {
      cicloNumero: 6,
      cicloNombre: 'Ciclo VI',
      cursos: [
        { codigo: 'SIS-601', nombre: 'Desarrollo de Proyectos Integradores ERP/Web', creditos: 5, horas: 6, prerrequisitoCodigo: 'SIS-502' },
        { codigo: 'SIS-602', nombre: 'Seminario de Titulación e Innovación Tecnológica', creditos: 4, horas: 4, prerrequisitoCodigo: 'SIS-502' },
        { codigo: 'SIS-603', nombre: 'Arquitectura de Nube Empresarial', creditos: 3, horas: 3, prerrequisitoCodigo: 'SIS-403' },
        { codigo: 'SIS-604', nombre: 'Internado Profesional TI', creditos: 5, horas: 10, prerrequisitoCodigo: 'SIS-504' },
      ],
    },
  ];
}

/**
 * Procesa la trayectoria longitudinal del estudiante a través de los 6 ciclos.
 * Evalúa:
 * - Calificaciones de actas / notas guardadas
 * - Cálculo de arrastres
 * - Cumplimiento de prerrequisitos
 * - Aplicación estricta de la regla de bloqueo por 3 arrastres
 */
export function buildKardexEstudiante(params: {
  estudiante: any;
  programaNombre?: string;
  matriculas: any[];
  cursosDb?: any[];
  ciclosDb?: any[];
  totalCiclosPrograma?: number | null;
  prerrequisitosMap?: Record<string, string>; // cursoId o codigo -> prerrequisitoId o codigo
  calificacionesGuardadas?: Record<string, EvaluacionDesglose>; // key: `${estudianteId}_${cursoCodigo}`
}): ResumenKardex {
  const {
    estudiante,
    programaNombre = 'General',
    matriculas = [],
    cursosDb = [],
    ciclosDb = [],
    totalCiclosPrograma = null,
    prerrequisitosMap = {},
    calificacionesGuardadas = {},
  } = params;

  const estId = estudiante?.id || '';
  const estCodigo = estudiante?.codigo_estudiante || 'EST-2026';

  // 1. Determinar si existen ciclos y cursos reales cargados desde la base de datos
  const hasRealDbCiclos = Boolean(ciclosDb && ciclosDb.length > 0);

  type CicloSource = {
    cicloNumero: number;
    cicloNombre: string;
    cursos: {
      id?: string;
      codigo: string;
      nombre: string;
      creditos: number;
      horas: number;
      prerrequisitoCodigo?: string | null;
    }[];
  };

  let ciclosEstructura: CicloSource[] = [];

  if (hasRealDbCiclos) {
    const sortedDb = [...ciclosDb].sort(
      (a, b) => Number(a.numero_orden || 1) - Number(b.numero_orden || 1)
    );
    ciclosEstructura = sortedDb.map(cDb => {
      const cNum = Number(cDb.numero_orden || 1);
      const cNom = cDb.nombre || `Ciclo ${cNum}`;
      const cursosDelCiclo = cursosDb.filter((cd: any) => cd.ciclo_id === cDb.id);
      return {
        cicloNumero: cNum,
        cicloNombre: cNom,
        cursos: cursosDelCiclo.map((cd: any) => ({
          id: cd.id,
          codigo: cd.codigo || `CRS-${cd.id.slice(0, 6)}`,
          nombre: cd.nombre,
          creditos: Number(cd.creditos || 3),
          horas: Number(cd.horas_semanales || 4),
        })),
      };
    });
  } else {
    // Si no hay ciclos en la base de datos, limitar al total de ciclos configurado
    const maxCiclos = totalCiclosPrograma && totalCiclosPrograma > 0 ? Math.min(6, totalCiclosPrograma) : 6;
    const plantilla = getMallaEstandarBrusben(programaNombre).slice(0, maxCiclos);
    ciclosEstructura = plantilla.map(p => ({
      cicloNumero: p.cicloNumero,
      cicloNombre: p.cicloNombre,
      cursos: p.cursos,
    }));
  }

  // 2. Determinar ciclo actual basado en la última matrícula activa o mayor ciclo cursado
  let maxCicloMatriculado = 1;
  matriculas.forEach(m => {
    const ed = Array.isArray(m.ediciones) ? m.ediciones[0] : m.ediciones;
    const cic = Array.isArray(ed?.ciclos) ? ed.ciclos[0] : ed?.ciclos;
    const ord = Number(cic?.numero_orden || m.ciclo_ingreso || 1);
    if (ord > maxCicloMatriculado) maxCicloMatriculado = ord;
  });

  const cursosAprobadosCodigos = new Set<string>();
  const arrastresActivosList: ResumenKardex['arrastresDetalle'] = [];
  let totalArrastresActivosCount = 0;
  let totalArrastresRegularizadosCount = 0;
  let totalCreditosAprobadosAcum = 0;
  let totalCreditosPlanAcum = 0;
  let sumPuntosPonderados = 0;
  let sumCreditosConNota = 0;

  // Obtener calificaciones oficiales registradas o retornar estado pendiente limpio (en ceros)
  const getGrade = (cursoCod: string): EvaluacionDesglose => {
    // Si el estudiante ya tiene notas guardadas específicamente
    const customKey = `${estId}_${cursoCod}`;
    if (calificacionesGuardadas[customKey]) {
      return calificacionesGuardadas[customKey];
    }

    // Sin notas simuladas: arranca totalmente limpio / en ceros / PENDIENTE
    return {
      ec1: null,
      ec2: null,
      ep: null,
      ef: null,
      promedioFinal: null,
      estado: 'PENDIENTE',
    };
  };

  const ciclosKardex: CicloKardexItem[] = ciclosEstructura.map(plantillaCiclo => {
    const targetCicloNum = plantillaCiclo.cicloNumero;
    let cicloCreditosAprobados = 0;
    let cicloCreditosTotales = 0;
    let cicloArrastres = 0;
    let cicloSumaPuntos = 0;
    let cicloCreditosConNota = 0;

    const cursosMapeados: CursoKardexItem[] = plantillaCiclo.cursos.map((cPlantilla) => {
      // Buscar si el curso existe en base de datos
      const cursoDbMatch = cursosDb.find(
        (cd: any) =>
          (cd.codigo || '').toUpperCase() === cPlantilla.codigo.toUpperCase() ||
          (cd.nombre || '').toLowerCase() === cPlantilla.nombre.toLowerCase()
      );

      const cursoId = cPlantilla.id || cursoDbMatch?.id || `CRS-GEN-${cPlantilla.codigo}`;
      const creditos = cursoDbMatch?.creditos || cPlantilla.creditos || 3;
      const horas = cursoDbMatch?.horas_semanales || cPlantilla.horas || 4;

      // Prerrequisito asignado
      const prereqCod =
        prerrequisitosMap[cursoId] ||
        prerrequisitosMap[cPlantilla.codigo] ||
        cPlantilla.prerrequisitoCodigo ||
        null;

      const evalData = getGrade(cPlantilla.codigo);
      const isApproved = evalData.promedioFinal !== null && evalData.promedioFinal >= 13;
      const isFailed = evalData.promedioFinal !== null && evalData.promedioFinal < 13;

      if (isApproved) {
        cursosAprobadosCodigos.add(cPlantilla.codigo);
        cicloCreditosAprobados += creditos;
        totalCreditosAprobadosAcum += creditos;
      }

      if (evalData.promedioFinal !== null) {
        cicloSumaPuntos += evalData.promedioFinal * creditos;
        cicloCreditosConNota += creditos;
        sumPuntosPonderados += evalData.promedioFinal * creditos;
        sumCreditosConNota += creditos;
      }

      if (isFailed) {
        cicloArrastres++;
        totalArrastresActivosCount++;
        arrastresActivosList.push({
          cursoId,
          cursoCodigo: cPlantilla.codigo,
          cursoNombre: cPlantilla.nombre,
          cicloOrden: targetCicloNum,
          nota: evalData.promedioFinal || 0,
          periodo: `2026-${targetCicloNum % 2 === 1 ? 'I' : 'II'}`,
          esBloqueante: totalArrastresActivosCount >= 3,
          regularizado: false,
        });
      }

      // Validar si cumplió el prerrequisito
      const prereqCumplido = !prereqCod || cursosAprobadosCodigos.has(prereqCod.toUpperCase());

      cicloCreditosTotales += creditos;
      totalCreditosPlanAcum += creditos;

      const asistenciaPct = evalData.promedioFinal !== null ? 100 : 0;

      return {
        cursoId,
        codigo: cPlantilla.codigo,
        nombre: cPlantilla.nombre,
        creditos,
        horasSemanales: horas,
        cicloOrden: targetCicloNum,
        cicloNombre: plantillaCiclo.cicloNombre,
        prerrequisitoCodigo: prereqCod,
        prerrequisitoNombre: prereqCod ? `Asignatura previa (${prereqCod})` : null,
        prerrequisitoCumplido: prereqCumplido,
        evaluaciones: evalData,
        asistenciaPct,
        periodoNombre: `Periodo ${2026 + Math.floor((targetCicloNum - 1) / 2)}-${targetCicloNum % 2 === 1 ? 'I' : 'II'}`,
        regularizadoEnVerano: false,
      };
    });

    const cicloPPA = cicloCreditosConNota > 0 ? Number((cicloSumaPuntos / cicloCreditosConNota).toFixed(2)) : null;

    let estadoCiclo: CicloKardexItem['estadoCiclo'] = 'PENDIENTE';
    if (targetCicloNum < maxCicloMatriculado) {
      estadoCiclo = cicloArrastres >= 3 ? 'BLOQUEADO' : cicloArrastres > 0 ? 'CON_ARRASTRES' : 'APROBADO';
    } else if (targetCicloNum === maxCicloMatriculado) {
      estadoCiclo = 'EN_CURSO';
    }

    return {
      cicloNumero: targetCicloNum,
      cicloNombre: plantillaCiclo.cicloNombre,
      cursos: cursosMapeados,
      promedioPonderado: cicloPPA,
      creditosAprobados: cicloCreditosAprobados,
      creditosTotales: cicloCreditosTotales,
      arrastresCount: cicloArrastres,
      estadoCiclo,
    };
  });

  // 3. Evaluar Condición Académica y Regla Estricta de 3 Arrastres
  let condicion: CondicionAcademica = 'REGULAR';
  let condicionTexto = 'REGULAR (APTO)';
  let condicionDescripcion = 'Estudiante invicto sin arrastres académicos. Habilitado para promoción regular.';
  let puedeMatricularSiguienteCiclo = true;
  let requiereCicloVerano = false;

  if (totalArrastresActivosCount >= 3) {
    condicion = 'BLOQUEADO_TRES_ARRASTRES';
    condicionTexto = 'BLOQUEADO POR 3+ ARRASTRES';
    condicionDescripcion =
      'El estudiante acumula 3 o más cursos desaprobados. Conforme al reglamento de Brusben, se encuentra AUTOMÁTICAMENTE BLOQUEADO para matricularse en el ciclo regular siguiente. Debe regularizar obligatoriamente en Ciclo de Verano / Nivelación.';
    puedeMatricularSiguienteCiclo = false;
    requiereCicloVerano = true;
  } else if (totalArrastresActivosCount > 0) {
    condicion = 'APTO_CON_ARRASTRES';
    condicionTexto = `APTO CONDICIONAL (${totalArrastresActivosCount} ARRASTRE${totalArrastresActivosCount > 1 ? 'S' : ''})`;
    condicionDescripcion =
      'El estudiante puede matricularse en el siguiente ciclo regular llevando el arrastre pendiente, o regularizarlo opcionalmente en el Ciclo de Verano.';
    puedeMatricularSiguienteCiclo = true;
    requiereCicloVerano = false;
  }

  const ppaGeneral = sumCreditosConNota > 0 ? Number((sumPuntosPonderados / sumCreditosConNota).toFixed(2)) : 0;
  const cicloSiguiente = Math.min(6, maxCicloMatriculado + 1);

  return {
    ciclos: ciclosKardex,
    promedioPonderadoAcumulado: ppaGeneral,
    totalCreditosAprobados: totalCreditosAprobadosAcum,
    totalCreditosPlan: totalCreditosPlanAcum,
    totalArrastresActivos: totalArrastresActivosCount,
    totalArrastresRegularizados: totalArrastresRegularizadosCount,
    condicion,
    condicionTexto,
    condicionDescripcion,
    puedeMatricularSiguienteCiclo,
    requiereCicloVerano,
    cicloActualNumero: maxCicloMatriculado,
    cicloSiguienteNumero: cicloSiguiente,
    arrastresDetalle: arrastresActivosList,
  };
}

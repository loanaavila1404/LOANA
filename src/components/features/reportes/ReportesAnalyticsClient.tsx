'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/currency';
import {
  TrendingUp,
  DollarSign,
  GraduationCap,
  Users,
  AlertTriangle,
  BookOpen,
  BarChart3,
  Download,
  Filter,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Building2,
  Layers,
  ArrowUpRight,
  Clock,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  FileText,
  CreditCard,
  PieChart,
  UserCheck,
  Percent,
  Printer,
  ClipboardList,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export interface ReportePeriodo {
  id: string;
  codigo: string;
  nombre: string;
  status?: string | null;
}

export interface ReportePrograma {
  id: string;
  codigo: string;
  nombre: string;
  tipo_programa?: string | null;
  status?: string | null;
}

export interface ReporteCiclo {
  id: string;
  nombre: string;
  numero_orden?: number | null;
  plan_id?: string | null;
}

export interface ReporteEdicion {
  id: string;
  codigo: string;
  nombre?: string | null;
  modalidad?: string | null;
  turno?: string | null;
  vacantes?: number | null;
  status?: string | null;
  programa_id?: string | null;
  periodo_id?: string | null;
  ciclo_id?: string | null;
  programas?: {
    id: string;
    codigo: string;
    nombre: string;
    tipo_programa?: string | null;
  } | null;
  periodos?: {
    id: string;
    codigo: string;
    nombre: string;
  } | null;
  ciclos?: {
    id: string;
    nombre: string;
    numero_orden?: number | null;
  } | null;
}

export interface ReporteMatricula {
  id: string;
  codigo_matricula: string;
  estudiante_id: string;
  edicion_id: string;
  fecha_matricula?: string | null;
  status?: string | null;
  importe_matricula?: number | null;
  importe_pension?: number | null;
  numero_pensiones?: number | null;
  descuento_total?: number | null;
  created_at?: string | null;
  estudiantes?: {
    id: string;
    codigo_estudiante?: string | null;
    personas?: {
      nombres?: string | null;
      apellido_paterno?: string | null;
      apellido_materno?: string | null;
      numero_documento?: string | null;
    } | null;
  } | null;
  ediciones?: ReporteEdicion | null;
}

export interface ReporteCuota {
  id: string;
  matricula_id: string;
  concepto?: string | null;
  tipo_cuota?: string | null;
  numero_cuota?: number | null;
  fecha_vencimiento?: string | null;
  importe_original?: number | null;
  descuento?: number | null;
  importe_neto?: number | null;
  saldo?: number | null;
  status?: string | null;
  matriculas?: {
    id: string;
    codigo_matricula: string;
    edicion_id: string;
    estudiantes?: {
      id: string;
      codigo_estudiante?: string | null;
      personas?: {
        nombres?: string | null;
        apellido_paterno?: string | null;
        apellido_materno?: string | null;
      } | null;
    } | null;
    ediciones?: {
      id: string;
      modalidad?: string | null;
      turno?: string | null;
      periodo_id?: string | null;
      programa_id?: string | null;
      ciclo_id?: string | null;
      programas?: {
        id: string;
        nombre: string;
        codigo: string;
        tipo_programa?: string | null;
      } | null;
    } | null;
  } | null;
}

export interface ReportePago {
  id: string;
  estudiante_id: string;
  fecha_pago?: string | null;
  importe?: number | null;
  medio_pago?: string | null;
  numero_operacion?: string | null;
  comprobante_tipo?: string | null;
  comprobante_numero?: string | null;
  status?: string | null;
  observaciones?: string | null;
  created_at?: string | null;
  pago_aplicaciones?: Array<{
    id: string;
    cuota_id: string;
    importe_aplicado?: number | null;
    cuotas?: {
      id: string;
      matricula_id: string;
      matriculas?: {
        id: string;
        edicion_id: string;
        ediciones?: {
          id: string;
          modalidad?: string | null;
          turno?: string | null;
          periodo_id?: string | null;
          programa_id?: string | null;
          ciclo_id?: string | null;
          programas?: {
            id: string;
            nombre: string;
            codigo: string;
            tipo_programa?: string | null;
          } | null;
        } | null;
      } | null;
    } | null;
  }> | null;
}

export interface ReporteProspecto {
  id: string;
  codigo?: string | null;
  nombres?: string | null;
  apellidos?: string | null;
  telefono?: string | null;
  email?: string | null;
  canal_captacion?: string | null;
  nivel_interes?: string | null;
  status?: string | null;
  matricula_id?: string | null;
  programa_id?: string | null;
  created_at?: string | null;
  programas?: {
    id: string;
    codigo: string;
    nombre: string;
    tipo_programa?: string | null;
  } | null;
}

export interface ReportesAnalyticsProps {
  periodos: ReportePeriodo[];
  programas: ReportePrograma[];
  ediciones: ReporteEdicion[];
  ciclos: ReporteCiclo[];
  matriculas: ReporteMatricula[];
  cuotas: ReporteCuota[];
  pagos: ReportePago[];
  prospectos: ReporteProspecto[];
  totalPersonas: number;
  totalEstudiantesActivos: number;
}

type TabKey = 'resumen' | 'finanzas' | 'academico' | 'crm';

// Detección heurística de área técnica para clasificación institucional
function detectarAreaTecnica(nombrePrograma?: string | null, tipoPrograma?: string | null): string {
  const norm = (nombrePrograma || '').toLowerCase();
  const tipo = (tipoPrograma || '').toUpperCase();

  if (
    norm.includes('enferm') ||
    norm.includes('salud') ||
    norm.includes('farmac') ||
    norm.includes('fisioter') ||
    norm.includes('laborat') ||
    norm.includes('clin') ||
    norm.includes('medic')
  ) {
    return 'SALUD';
  }

  if (
    norm.includes('admin') ||
    norm.includes('contab') ||
    norm.includes('gestion') ||
    norm.includes('secret') ||
    norm.includes('negoc') ||
    norm.includes('asisten')
  ) {
    return 'ADMINISTRACION';
  }

  if (
    norm.includes('comput') ||
    norm.includes('sistem') ||
    norm.includes('inform') ||
    norm.includes('red') ||
    norm.includes('ofimat') ||
    norm.includes('softw') ||
    norm.includes('web')
  ) {
    return 'TECNOLOGIA';
  }

  if (tipo === 'CURSO_CORTO' || norm.includes('taller') || norm.includes('curso') || norm.includes('modular')) {
    return 'TALLERES';
  }

  return 'GENERAL';
}

export function ReportesAnalyticsClient({
  periodos,
  programas,
  ediciones,
  ciclos,
  matriculas,
  cuotas,
  pagos,
  prospectos,
  totalPersonas,
  totalEstudiantesActivos,
}: ReportesAnalyticsProps) {
  // Filtros globales
  const [periodoFiltro, setPeriodoFiltro] = useState<string>('TODOS');
  const [sedeFiltro, setSedeFiltro] = useState<string>('TODAS');
  const [areaFiltro, setAreaFiltro] = useState<string>('TODAS');
  const [modalidadFiltro, setModalidadFiltro] = useState<string>('TODAS');

  // Pestaña activa
  const [activeTab, setActiveTab] = useState<TabKey>('resumen');

  // Estado del Generador de Nómina Académica por Ciclo y Carrera
  const [nominaProgramaId, setNominaProgramaId] = useState<string>(programas[0]?.id || '');
  const [nominaCicloNombre, setNominaCicloNombre] = useState<string>('TODOS');
  const [nominaEdicionId, setNominaEdicionId] = useState<string>('');

  const hayFiltrosActivos =
    periodoFiltro !== 'TODOS' ||
    sedeFiltro !== 'TODAS' ||
    areaFiltro !== 'TODAS' ||
    modalidadFiltro !== 'TODAS';

  const resetFilters = () => {
    setPeriodoFiltro('TODOS');
    setSedeFiltro('TODAS');
    setAreaFiltro('TODAS');
    setModalidadFiltro('TODAS');
  };

  // Filtrado reactivo en tiempo real
  const {
    matriculasFiltradas,
    cuotasFiltradas,
    pagosFiltrados,
    prospectosFiltrados,
    edicionesFiltradas,
  } = useMemo(() => {
    // 1. Filtrar Ediciones
    const edMap = new Map<string, ReporteEdicion>();
    const edList = ediciones.filter(ed => {
      if (periodoFiltro !== 'TODOS' && ed.periodo_id !== periodoFiltro) return false;
      if (modalidadFiltro !== 'TODAS' && (ed.modalidad || '').toUpperCase() !== modalidadFiltro.toUpperCase()) return false;
      const prog = ed.programas;
      const area = detectarAreaTecnica(prog?.nombre, prog?.tipo_programa);
      if (areaFiltro !== 'TODAS' && area !== areaFiltro) return false;
      return true;
    });

    edList.forEach(e => edMap.set(e.id, e));

    // 2. Filtrar Matrículas
    const matList = matriculas.filter(m => {
      if (periodoFiltro !== 'TODOS' || modalidadFiltro !== 'TODAS' || areaFiltro !== 'TODAS') {
        if (!edMap.has(m.edicion_id)) return false;
      }
      return true;
    });

    const matIds = new Set(matList.map(m => m.id));

    // 3. Filtrar Cuotas
    const cuoList = cuotas.filter(c => {
      if (periodoFiltro !== 'TODOS' || modalidadFiltro !== 'TODAS' || areaFiltro !== 'TODAS') {
        if (!matIds.has(c.matricula_id)) return false;
      }
      return true;
    });

    // 4. Filtrar Pagos
    const pagList = pagos.filter(p => {
      if (periodoFiltro === 'TODOS' && modalidadFiltro === 'TODAS' && areaFiltro === 'TODAS') {
        return true;
      }
      const apps = p.pago_aplicaciones || [];
      if (apps.length > 0) {
        return apps.some(a => {
          const mId = a.cuotas?.matricula_id;
          return mId && matIds.has(mId);
        });
      }
      return matList.length === matriculas.length;
    });

    // 5. Filtrar Prospectos
    const proList = prospectos.filter(pr => {
      if (areaFiltro !== 'TODAS') {
        const prog = pr.programas;
        const area = detectarAreaTecnica(prog?.nombre, prog?.tipo_programa);
        if (area !== areaFiltro) return false;
      }
      return true;
    });

    return {
      matriculasFiltradas: matList,
      cuotasFiltradas: cuoList,
      pagosFiltrados: pagList,
      prospectosFiltrados: proList,
      edicionesFiltradas: edList,
    };
  }, [periodos, programas, ediciones, matriculas, cuotas, pagos, prospectos, periodoFiltro, sedeFiltro, areaFiltro, modalidadFiltro]);

  // Cálculos de KPIs Superiores
  // 1. Ingresos Totales Consolidados (en Soles S/, con meta del ciclo)
  const totalRecaudado = useMemo(() => {
    return pagosFiltrados
      .filter(p => p.status === 'REGISTRADO' || p.status === 'ACTIVO')
      .reduce((acc, p) => acc + Number(p.importe || 0), 0);
  }, [pagosFiltrados]);

  const metaCiclo = useMemo(() => {
    const totalContratado = matriculasFiltradas.reduce((acc, m) => {
      const mat = Number(m.importe_matricula || 0);
      const pen = Number(m.importe_pension || 0);
      const numPen = Number(m.numero_pensiones || 1);
      const desc = Number(m.descuento_total || 0);
      const contract = mat + pen * numPen - desc;
      return acc + (contract > 0 ? contract : 0);
    }, 0);
    return Math.max(totalContratado, 50000);
  }, [matriculasFiltradas]);

  const porcentajeMeta = metaCiclo > 0 ? Math.min(Math.round((totalRecaudado / metaCiclo) * 100), 100) : 0;

  // 2. Matrículas Vigentes / Alumnos Activos
  const matriculasActivas = useMemo(() => {
    return matriculasFiltradas.filter(m => (m.status || '').toUpperCase() === 'ACTIVA').length;
  }, [matriculasFiltradas]);

  const vacantesTotales = useMemo(() => {
    return edicionesFiltradas.reduce((acc, ed) => acc + Number(ed.vacantes || 0), 0);
  }, [edicionesFiltradas]);

  const porcentajeAforo = vacantesTotales > 0 ? Math.min(Math.round((matriculasActivas / vacantesTotales) * 100), 100) : 0;

  // 3. Tasa de Conversión CRM
  const totalProspectos = prospectosFiltrados.length;
  const prospectosConvertidos = useMemo(() => {
    return prospectosFiltrados.filter(
      pr => pr.status === 'MATRICULADO' || pr.status === 'CONVERTIDO' || Boolean(pr.matricula_id)
    ).length;
  }, [prospectosFiltrados]);

  const tasaConversion = totalProspectos > 0 ? ((prospectosConvertidos / totalProspectos) * 100).toFixed(1) : '0.0';

  // 4. Cartera de Cuotas y Morosidad
  const hoyIso = new Date().toISOString().split('T')[0];
  const { cuotasVencidasCount, montoMorosidad, totalSaldoPendiente, totalCarteraEmitida } = useMemo(() => {
    let countVencidas = 0;
    let mora = 0;
    let saldoTotal = 0;
    let carteraEmitida = 0;

    cuotasFiltradas.forEach(c => {
      const saldo = Number(c.saldo ?? c.importe_neto ?? 0);
      const neto = Number(c.importe_neto || 0);
      carteraEmitida += neto;

      if (c.status !== 'PAGADA' && c.status !== 'ANULADA') {
        saldoTotal += saldo;
        const estaVencida =
          c.status === 'VENCIDA' ||
          (saldo > 0 && c.fecha_vencimiento && c.fecha_vencimiento < hoyIso);
        if (estaVencida) {
          countVencidas++;
          mora += saldo;
        }
      }
    });

    return {
      cuotasVencidasCount: countVencidas,
      montoMorosidad: mora,
      totalSaldoPendiente: saldoTotal,
      totalCarteraEmitida: carteraEmitida,
    };
  }, [cuotasFiltradas, hoyIso]);

  const porcentajeMorosidad = totalSaldoPendiente > 0 ? Math.round((montoMorosidad / totalSaldoPendiente) * 100) : 0;

  // PASO 2: Desglose limpio y estructurado de Canales de Cobranza
  const mediosPagoDesglose = useMemo(() => {
    const mapa: Record<string, { total: number; count: number; nombre: string }> = {
      YAPE: { total: 0, count: 0, nombre: 'Yape Móvil' },
      PLIN: { total: 0, count: 0, nombre: 'Plin Interbancario' },
      BCP: { total: 0, count: 0, nombre: 'Transferencia BCP' },
      TRANSFERENCIA: { total: 0, count: 0, nombre: 'Otros Bancos / Transferencia' },
      EFECTIVO: { total: 0, count: 0, nombre: 'Efectivo en Caja Institucional' },
      TARJETA: { total: 0, count: 0, nombre: 'Tarjeta Débito / Crédito (POS)' },
      OTRO: { total: 0, count: 0, nombre: 'Otros Medios Autorizados' },
    };

    pagosFiltrados
      .filter(p => p.status === 'REGISTRADO' || p.status === 'ACTIVO')
      .forEach(p => {
        const medio = (p.medio_pago || '').toUpperCase().trim();
        const imp = Number(p.importe || 0);
        let key = 'OTRO';
        if (medio.includes('YAPE')) key = 'YAPE';
        else if (medio.includes('PLIN')) key = 'PLIN';
        else if (medio.includes('BCP')) key = 'BCP';
        else if (medio.includes('TRANSF')) key = 'TRANSFERENCIA';
        else if (medio.includes('EFECT') || medio.includes('CAJA')) key = 'EFECTIVO';
        else if (medio.includes('TARJ') || medio.includes('POS') || medio.includes('VISA')) key = 'TARJETA';

        mapa[key].total += imp;
        mapa[key].count += 1;
      });

    return Object.entries(mapa)
      .map(([key, d]) => ({
        key,
        nombre: d.nombre,
        total: d.total,
        count: d.count,
        porcentaje: totalRecaudado > 0 ? Math.round((d.total / totalRecaudado) * 100) : 0,
      }))
      .filter(d => d.total > 0 || d.count > 0)
      .sort((a, b) => b.total - a.total);
  }, [pagosFiltrados, totalRecaudado]);

  // Ciclos únicos sin duplicados agrupados por nombre limpio con Map/Set
  const ciclosUnicos = useMemo(() => {
    const mapaNombres = new Map<string, { clave: string; nombre: string; orden: number }>();

    // 1. Ciclos de las ediciones del programa seleccionado si aplica
    const ciclosDelPrograma: Array<{ id?: string; nombre?: string | null; numero_orden?: number | null }> = [];
    if (nominaProgramaId) {
      ediciones
        .filter(ed => ed.programa_id === nominaProgramaId && ed.ciclos)
        .forEach(ed => {
          if (ed.ciclos) ciclosDelPrograma.push(ed.ciclos);
        });
    }

    // 2. Si no hay ciclos en las ediciones del programa, usar el catálogo general de ciclos
    const fuente = ciclosDelPrograma.length > 0 ? ciclosDelPrograma : ciclos;

    fuente.forEach(c => {
      const nombreLimpio = (
        c.nombre ||
        (c.numero_orden ? `Ciclo ${c.numero_orden}` : 'Ciclo Regular')
      ).trim();
      const clave = nombreLimpio.toLowerCase();
      if (!mapaNombres.has(clave)) {
        mapaNombres.set(clave, {
          clave,
          nombre: nombreLimpio,
          orden: c.numero_orden || 99,
        });
      }
    });

    return Array.from(mapaNombres.values()).sort((a, b) => {
      if (a.orden !== b.orden) return a.orden - b.orden;
      return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
    });
  }, [ciclos, ediciones, nominaProgramaId]);

  // Ediciones filtradas para el Generador de Nómina Académica
  const edicionesParaNomina = useMemo(() => {
    return ediciones.filter(ed => {
      if (nominaProgramaId && ed.programa_id !== nominaProgramaId) return false;
      if (nominaCicloNombre !== 'TODOS') {
        const edCicloNombre = (
          ed.ciclos?.nombre ||
          (ed.ciclos?.numero_orden ? `Ciclo ${ed.ciclos.numero_orden}` : '')
        ).trim().toLowerCase();
        if (edCicloNombre !== nominaCicloNombre.trim().toLowerCase()) return false;
      }
      return true;
    });
  }, [ediciones, nominaProgramaId, nominaCicloNombre]);

  // Edición activa seleccionada en el generador de nómina
  const edicionNominaSeleccionada = useMemo(() => {
    if (nominaEdicionId) {
      const encontrada = edicionesParaNomina.find(e => e.id === nominaEdicionId);
      if (encontrada) return encontrada;
    }
    return edicionesParaNomina[0] || null;
  }, [edicionesParaNomina, nominaEdicionId]);

  // Conteo de estudiantes en la edición seleccionada
  const alumnosEnEdicionNomina = useMemo(() => {
    if (!edicionNominaSeleccionada) return 0;
    return matriculas.filter(
      m => m.edicion_id === edicionNominaSeleccionada.id && m.status !== 'ANULADA'
    ).length;
  }, [matriculas, edicionNominaSeleccionada]);

  // Cuotas críticas para Pestaña de Finanzas
  const cuotasCriticas = useMemo(() => {
    return cuotasFiltradas
      .filter(c => Number(c.saldo ?? c.importe_neto ?? 0) > 0 && (c.status === 'VENCIDA' || (c.fecha_vencimiento && c.fecha_vencimiento < hoyIso)))
      .slice(0, 8);
  }, [cuotasFiltradas, hoyIso]);

  // Resumen de programas
  const programasResumen = useMemo(() => {
    const mapa = new Map<
      string,
      {
        nombre: string;
        codigo: string;
        tipo: string;
        matriculados: number;
        vacantes: number;
        recaudado: number;
        mora: number;
      }
    >();

    programas.forEach(pr => {
      mapa.set(pr.id, {
        nombre: pr.nombre,
        codigo: pr.codigo,
        tipo: pr.tipo_programa || 'CARRERA_TECNICA',
        matriculados: 0,
        vacantes: 0,
        recaudado: 0,
        mora: 0,
      });
    });

    edicionesFiltradas.forEach(ed => {
      if (ed.programa_id && mapa.has(ed.programa_id)) {
        mapa.get(ed.programa_id)!.vacantes += Number(ed.vacantes || 0);
      }
    });

    matriculasFiltradas.forEach(m => {
      const progId = m.ediciones?.programa_id;
      if (progId && mapa.has(progId)) {
        if ((m.status || '').toUpperCase() === 'ACTIVA') {
          mapa.get(progId)!.matriculados += 1;
        }
      }
    });

    cuotasFiltradas.forEach(c => {
      const progId = c.matriculas?.ediciones?.programa_id;
      if (progId && mapa.has(progId)) {
        const saldo = Number(c.saldo ?? c.importe_neto ?? 0);
        if (saldo > 0 && c.status === 'VENCIDA') {
          mapa.get(progId)!.mora += saldo;
        }
      }
    });

    return Array.from(mapa.values())
      .filter(p => p.matriculados > 0 || p.vacantes > 0 || p.mora > 0)
      .sort((a, b) => b.matriculados - a.matriculados);
  }, [programas, edicionesFiltradas, matriculasFiltradas, cuotasFiltradas]);

  // Embudo CRM
  const embudoCRM = useMemo(() => {
    const nuevos = prospectosFiltrados.filter(p => p.status === 'NUEVO' || !p.status).length;
    const contactados = prospectosFiltrados.filter(p => p.status === 'CONTACTADO' || p.status === 'EN_SEGUIMIENTO').length;
    const interesados = prospectosFiltrados.filter(p => p.status === 'INTERESADO' || p.status === 'ALTA_PRIORIDAD').length;
    const convertidos = prospectosConvertidos;
    const perdidos = prospectosFiltrados.filter(p => p.status === 'PERDIDO').length;

    return { nuevos, contactados, interesados, convertidos, perdidos };
  }, [prospectosFiltrados, prospectosConvertidos]);

  // Canales de captación CRM
  const canalesCRM = useMemo(() => {
    const mapa: Record<string, { total: number; convertidos: number }> = {};
    prospectosFiltrados.forEach(p => {
      const canal = (p.canal_captacion || 'WhatsApp').trim();
      if (!mapa[canal]) mapa[canal] = { total: 0, convertidos: 0 };
      mapa[canal].total += 1;
      if (p.status === 'MATRICULADO' || p.status === 'CONVERTIDO' || Boolean(p.matricula_id)) {
        mapa[canal].convertidos += 1;
      }
    });

    return Object.entries(mapa)
      .map(([canal, d]) => ({
        canal,
        total: d.total,
        convertidos: d.convertidos,
        tasa: d.total > 0 ? ((d.convertidos / d.total) * 100).toFixed(1) : '0.0',
      }))
      .sort((a, b) => b.total - a.total);
  }, [prospectosFiltrados]);

  return (
    <div className="space-y-6">
      {/* ========================================================
          CABECERA EJECUTIVA Y TÍTULO INSTITUCIONAL
      ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-red-50 text-[#C4121A] border border-red-200">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C4121A] animate-pulse" />
              Inteligencia Analítica Oficial
            </span>
            <span className="text-xs text-slate-400 font-mono">ERP-BRUSBEN v2.0</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Reportes Institucionales y Analítica
          </h1>
          <p className="text-sm text-slate-500">
            Control de indicadores de rendimiento, balance financiero y emisión de reportes PDF oficiales.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Botón directo a Nómina de Estudiantes */}
          <Link
            href={edicionNominaSeleccionada ? `/reportes/nomina?edicionId=${edicionNominaSeleccionada.id}&print=1` : '/reportes/nomina?print=1'}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-2xs transition"
          >
            <ClipboardList className="w-3.5 h-3.5 text-red-400" />
            <span>Nómina por Aula (PDF)</span>
          </Link>
          <Link
            href="/reportes/financiero?print=1"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5 text-[#C4121A]" />
            <span>Balance Financiero PDF</span>
          </Link>
          <Link
            href="/reportes/padron-estudiantes?print=1"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#C4121A] hover:bg-red-800 text-white text-xs font-bold shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Padrón General (A4)</span>
          </Link>
        </div>
      </div>

      {/* ========================================================
          PASO 1: FILTROS GLOBALES DE ANALÍTICA (SUPERIORES)
      ======================================================== */}
      <Card className="bg-white border-slate-200 shadow-2xs">
        <div className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
                <Filter className="w-3.5 h-3.5 text-[#C4121A]" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block leading-tight">
                  Filtros Globales de Analítica
                </span>
                <span className="text-[11px] text-slate-500">
                  Segmentación instantánea para los 4 módulos de analítica y reportes imprimibles.
                </span>
              </div>
            </div>

            {hayFiltrosActivos && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
              >
                <RotateCcw className="w-3 h-3 text-[#C4121A]" />
                <span>Restablecer Filtros</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Selector de Periodo */}
            <div>
              <label htmlFor="filtro-periodo" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Periodo Académico
              </label>
              <select
                id="filtro-periodo"
                value={periodoFiltro}
                onChange={e => setPeriodoFiltro(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-slate-50/70 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#C4121A] focus:border-[#C4121A]"
              >
                <option value="TODOS">Todos los Periodos</option>
                {periodos.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.codigo} — {p.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Selector de Sede */}
            <div>
              <label htmlFor="filtro-sede" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Sede Institucional
              </label>
              <select
                id="filtro-sede"
                value={sedeFiltro}
                onChange={e => setSedeFiltro(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-slate-50/70 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#C4121A] focus:border-[#C4121A]"
              >
                <option value="TODAS">Todas las Sedes</option>
                <option value="SEDE_CENTRAL">Sede Central (Tumbes)</option>
                <option value="SEDE_ZARUMILLA">Sede Zarumilla</option>
                <option value="SEDE_AGUAS_VERDES">Sede Aguas Verdes</option>
                <option value="VIRTUAL_NACIONAL">Campus Virtual / Nacional</option>
              </select>
            </div>

            {/* 3. Selector de Área Técnica */}
            <div>
              <label htmlFor="filtro-area" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Área Técnica
              </label>
              <select
                id="filtro-area"
                value={areaFiltro}
                onChange={e => setAreaFiltro(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-slate-50/70 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#C4121A] focus:border-[#C4121A]"
              >
                <option value="TODAS">Todas las Áreas</option>
                <option value="SALUD">Salud y Enfermería Técnica</option>
                <option value="ADMINISTRACION">Gestión y Administración</option>
                <option value="TECNOLOGIA">Computación e Informática</option>
                <option value="TALLERES">Cursos Cortos y Talleres Modulares</option>
              </select>
            </div>

            {/* 4. Selector de Modalidad */}
            <div>
              <label htmlFor="filtro-modalidad" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Modalidad de Estudio
              </label>
              <select
                id="filtro-modalidad"
                value={modalidadFiltro}
                onChange={e => setModalidadFiltro(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-slate-50/70 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#C4121A] focus:border-[#C4121A]"
              >
                <option value="TODAS">Todas las Modalidades</option>
                <option value="PRESENCIAL">Presencial</option>
                <option value="SEMIPRESENCIAL">Semipresencial</option>
                <option value="VIRTUAL">Virtual</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>
              Registros en alcance: <strong>{matriculasFiltradas.length}</strong> matrículas,{' '}
              <strong>{pagosFiltrados.length}</strong> pagos validados, <strong>{prospectosFiltrados.length}</strong> prospectos CRM.
            </span>
            <span className="font-mono text-slate-400">
              Moneda: <strong className="text-slate-700">Soles (S/)</strong>
            </span>
          </div>
        </div>
      </Card>

      {/* ========================================================
          PASO 1: TARJETAS DE KPIS EJECUTIVOS SUPERIORES
      ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Ingresos Totales Consolidados */}
        <Card className="border-slate-200 shadow-2xs hover:shadow-xs transition bg-white">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Ingresos Consolidados
              </span>
              <div className="w-8 h-8 rounded-lg bg-red-50 text-[#C4121A] flex items-center justify-center border border-red-100">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {formatCurrency(totalRecaudado)}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                <span>Meta del ciclo:</span>
                <span className="font-bold text-slate-700">{formatCurrency(metaCiclo)}</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#C4121A] h-full rounded-full transition-all duration-500"
                  style={{ width: `${porcentajeMeta}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10.5px]">
                <span className="text-slate-500">Avance de recaudación</span>
                <span className="font-extrabold text-[#C4121A]">{porcentajeMeta}% alcanzado</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Matrículas Vigentes / Alumnos Activos */}
        <Card className="border-slate-200 shadow-2xs hover:shadow-xs transition bg-white">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Matrículas y Aforo
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center border border-blue-100">
                <GraduationCap className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {matriculasActivas}{' '}
                <span className="text-xs font-bold text-slate-500">
                  / {matriculasFiltradas.length} reg.
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                <span>Capacidad ofertada:</span>
                <span className="font-bold text-slate-700">{vacantesTotales} vacantes</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-800 h-full rounded-full transition-all duration-500"
                  style={{ width: `${porcentajeAforo}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10.5px]">
                <span className="text-slate-500">Aforo institucional</span>
                <span className="font-extrabold text-blue-900">{porcentajeAforo}% ocupado</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Tasa de Conversión CRM */}
        <Card className="border-slate-200 shadow-2xs hover:shadow-xs transition bg-white">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Conversión CRM
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-2xl font-black text-emerald-700 tracking-tight">
                {tasaConversion}%
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                <span>Prospectos cerrados:</span>
                <span className="font-bold text-slate-700">
                  {prospectosConvertidos} de {totalProspectos}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(Number(tasaConversion), 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10.5px]">
                <span className="text-slate-500">Efectividad comercial</span>
                <span className="font-extrabold text-emerald-700">
                  {prospectosConvertidos} matriculados
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Índice de Morosidad / Cuotas Vencidas */}
        <Card className="border-slate-200 shadow-2xs hover:shadow-xs transition bg-white">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Índice de Morosidad
              </span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                porcentajeMorosidad > 20
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className={`text-2xl font-black tracking-tight ${
                porcentajeMorosidad > 20 ? 'text-red-700' : 'text-slate-900'
              }`}>
                {formatCurrency(montoMorosidad)}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                <span>Cuotas en retraso:</span>
                <span className="font-bold text-slate-700">{cuotasVencidasCount} cuotas venc.</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    porcentajeMorosidad > 20 ? 'bg-red-600' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(porcentajeMorosidad, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10.5px]">
                <span className="text-slate-500">Mora sobre cartera</span>
                <span className={`font-extrabold ${porcentajeMorosidad > 20 ? 'text-red-700' : 'text-amber-700'}`}>
                  {porcentajeMorosidad}% cartera
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================
          PASO 1 (NUEVO): GENERADOR DE NÓMINA ACADÉMICA POR CICLO Y CARRERA
      ======================================================== */}
      <Card className="border-slate-300 bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-700 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#C4121A] text-white flex items-center justify-center shrink-0 shadow-xs">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-2">
                  <span>Generador de Nómina Académica por Programa, Ciclo y Aula</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-red-950 text-red-200 border border-red-800">
                    PDF A4
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  Seleccione el programa, ciclo y grupo para emitir la nómina oficial de alumnos con DNI, código institucional y estado de matrícula.
                </p>
              </div>
            </div>

            {edicionNominaSeleccionada && (
              <Link
                href={`/reportes/nomina?edicionId=${edicionNominaSeleccionada.id}&print=1`}
                target="_blank"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C4121A] hover:bg-red-700 text-white text-xs font-bold shadow-md transition shrink-0"
              >
                <Printer className="w-4 h-4" />
                <span>Generar e Imprimir Nómina Oficial (PDF)</span>
              </Link>
            )}
          </div>

          {/* Selectores de Filtrado de Nómina */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Carrera / Programa */}
            <div>
              <label htmlFor="nomina-prog" className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                1. Carrera o Programa Técnico
              </label>
              <select
                id="nomina-prog"
                value={nominaProgramaId}
                onChange={e => {
                  setNominaProgramaId(e.target.value);
                  setNominaCicloNombre('TODOS');
                  setNominaEdicionId(''); // Reiniciar grupo seleccionado
                }}
                className="w-full px-2.5 py-2 text-xs font-bold text-slate-900 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C4121A]"
              >
                {programas.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} ({p.codigo})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Ciclo Académico */}
            <div>
              <label htmlFor="nomina-ciclo" className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                2. Ciclo Académico
              </label>
              <select
                id="nomina-ciclo"
                value={nominaCicloNombre}
                onChange={e => {
                  setNominaCicloNombre(e.target.value);
                  setNominaEdicionId('');
                }}
                className="w-full px-2.5 py-2 text-xs font-bold text-slate-900 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C4121A]"
              >
                <option value="TODOS">Todos los Ciclos del Programa</option>
                {ciclosUnicos.map(c => (
                  <option key={c.clave} value={c.nombre}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Edición / Grupo / Aula */}
            <div>
              <label htmlFor="nomina-edicion" className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                3. Edición / Grupo de Clase
              </label>
              <select
                id="nomina-edicion"
                value={edicionNominaSeleccionada?.id || ''}
                onChange={e => setNominaEdicionId(e.target.value)}
                disabled={edicionesParaNomina.length === 0}
                className="w-full px-2.5 py-2 text-xs font-bold text-slate-900 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C4121A] disabled:opacity-50"
              >
                {edicionesParaNomina.length === 0 ? (
                  <option value="">No hay ediciones en este criterio</option>
                ) : (
                  edicionesParaNomina.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.codigo} — {e.modalidad || 'Presencial'} / {e.turno || 'Regular'} ({e.vacantes || '-'} vac.)
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Resumen Informativo del Grupo Seleccionado */}
          {edicionNominaSeleccionada ? (
            <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="font-bold text-white flex items-center gap-2">
                  <span>Grupo Activo: {edicionNominaSeleccionada.codigo}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900 text-emerald-200">
                    {edicionNominaSeleccionada.status || 'ACTIVO'}
                  </span>
                </div>
                <div className="text-slate-300 text-[11px]">
                  Modalidad: <strong>{edicionNominaSeleccionada.modalidad || 'Presencial'}</strong> · Turno: <strong>{edicionNominaSeleccionada.turno || 'Regular'}</strong>
                </div>
              </div>

              <div className="flex items-center gap-4 text-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Alumnos en Nómina</span>
                  <span className="font-black text-sm text-white">{alumnosEnEdicionNomina} matriculados</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Aforo de Vacantes</span>
                  <span className="font-black text-sm text-white">{edicionNominaSeleccionada.vacantes || '-'} lugares</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-amber-200 italic">
              Seleccione una carrera con ediciones abiertas para previsualizar y generar la nómina.
            </p>
          )}
        </div>
      </Card>

      {/* ========================================================
          PASO 2: PESTAÑAS DE NAVEGACIÓN ANALÍTICA
      ======================================================== */}
      <div className="space-y-5">
        {/* Barra de Tabs Estilo Stitch */}
        <div className="border-b border-slate-200 bg-white rounded-t-xl px-2 pt-2 flex flex-wrap gap-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('resumen')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition border-b-2 ${
              activeTab === 'resumen'
                ? 'border-[#C4121A] text-[#C4121A] bg-red-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Resumen Ejecutivo & KPIs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('finanzas')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition border-b-2 ${
              activeTab === 'finanzas'
                ? 'border-[#C4121A] text-[#C4121A] bg-red-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Finanzas y Cobranzas</span>
            {cuotasVencidasCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-red-100 text-red-700">
                {cuotasVencidasCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('academico')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition border-b-2 ${
              activeTab === 'academico'
                ? 'border-[#C4121A] text-[#C4121A] bg-red-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Gestión Académica & Talleres</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('crm')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition border-b-2 ${
              activeTab === 'crm'
                ? 'border-[#C4121A] text-[#C4121A] bg-red-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Rendimiento Comercial CRM</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
              {tasaConversion}%
            </span>
          </button>
        </div>

        {/* ========================================================
            CONTENIDO TAB 1: RESUMEN EJECUTIVO & KPIS
        ======================================================== */}
        {activeTab === 'resumen' && (
          <div className="space-y-6">
            {/* Matriz de Salud Institucional */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase mb-2">
                  <span>Salud Financiera</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-lg font-black text-slate-900">
                  {formatCurrency(totalRecaudado)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Saldo pendiente por cobrar: <strong>{formatCurrency(totalSaldoPendiente)}</strong>
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase mb-2">
                  <span>Capacidad Operativa</span>
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-lg font-black text-slate-900">
                  {matriculasActivas} Alumnos Activos
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Ocupación de aforo: <strong>{porcentajeAforo}%</strong> de {vacantesTotales} vacantes
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase mb-2">
                  <span>Dinamismo Comercial</span>
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-lg font-black text-slate-900">
                  {tasaConversion}% Conversión
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Prospectos atendidos en el ciclo: <strong>{totalProspectos}</strong>
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase mb-2">
                  <span>Riesgo de Cartera</span>
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-lg font-black text-slate-900">
                  {formatCurrency(montoMorosidad)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Cuotas vencidas: <strong>{cuotasVencidasCount}</strong> ({porcentajeMorosidad}% de mora)
                </p>
              </div>
            </div>

            {/* Comparativa por Programa Académico */}
            <Card className="border-slate-200 bg-white shadow-2xs">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    Rendimiento Comparativo por Programa Académico
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ocupación de vacantes, recaudación efectiva y saldo en mora desglosado por carrera técnica.
                  </p>
                </div>
                <Link
                  href="/reportes/academico?print=1"
                  target="_blank"
                  className="text-xs font-bold text-[#C4121A] hover:underline inline-flex items-center gap-1"
                >
                  <span>Ver Reporte Académico A4</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-bold">
                        <th className="py-2.5 px-4">Programa / Especialidad</th>
                        <th className="py-2.5 px-3">Código</th>
                        <th className="py-2.5 px-3 text-center">Vacantes</th>
                        <th className="py-2.5 px-3 text-center">Inscritos</th>
                        <th className="py-2.5 px-4 text-center">Aforo Cubierto</th>
                        <th className="py-2.5 px-4 text-right">Mora Reportada</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {programasResumen.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                            No se registran datos para los filtros seleccionados.
                          </td>
                        </tr>
                      ) : (
                        programasResumen.map(prog => {
                          const pct = prog.vacantes > 0 ? Math.min(Math.round((prog.matriculados / prog.vacantes) * 100), 100) : 0;
                          return (
                            <tr key={prog.codigo} className="hover:bg-slate-50/80 transition">
                              <td className="py-3 px-4 font-bold text-slate-900">
                                {prog.nombre}
                              </td>
                              <td className="py-3 px-3 font-mono text-slate-600">
                                {prog.codigo}
                              </td>
                              <td className="py-3 px-3 text-center text-slate-600 font-semibold">
                                {prog.vacantes || '-'}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className="font-bold text-slate-900">{prog.matriculados}</span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2 max-w-[140px] mx-auto">
                                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        pct >= 80 ? 'bg-emerald-600' : pct >= 40 ? 'bg-blue-600' : 'bg-amber-500'
                                      }`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <span className="text-[10.5px] font-mono font-bold text-slate-700 w-8 text-right">
                                    {pct}%
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-bold">
                                {prog.mora > 0 ? (
                                  <span className="text-red-700">{formatCurrency(prog.mora)}</span>
                                ) : (
                                  <span className="text-emerald-700">S/ 0.00</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Centro de Documentos Oficiales con Enlace a Nómina y Reportes */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Dossier de Reportes y Documentos Oficiales Brusben (PDF A4)
                </h3>
                <span className="text-xs text-slate-500">Documentos oficiales listos para impresión con firmas directivas</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Nómina por Aula */}
                <div className="border border-slate-200 bg-white rounded-xl p-4 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-900 text-white">
                        NOM-AULA
                      </span>
                      <ClipboardList className="w-4 h-4 text-slate-800" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-2">
                      Nómina de Alumnos por Aula
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Padrón oficial de clase con DNI, código, estado y espacio de firmas de control.
                    </p>
                  </div>
                  <div className="pt-3 mt-3 border-t border-slate-100 flex gap-2">
                    <Link
                      href={edicionNominaSeleccionada ? `/reportes/nomina?edicionId=${edicionNominaSeleccionada.id}` : '/reportes/nomina'}
                      className="flex-1"
                    >
                      <Button variant="outline" className="w-full text-xs h-8">
                        Ver
                      </Button>
                    </Link>
                    <Link
                      href={edicionNominaSeleccionada ? `/reportes/nomina?edicionId=${edicionNominaSeleccionada.id}&print=1` : '/reportes/nomina?print=1'}
                      target="_blank"
                    >
                      <Button variant="secondary" className="px-2.5 h-8 text-xs font-bold" title="Descargar Nómina PDF">
                        <Download className="w-3.5 h-3.5 text-[#C4121A]" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* 2. Reporte Financiero */}
                <div className="border border-slate-200 bg-white rounded-xl p-4 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        REP-FIN-01
                      </span>
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-2">
                      Reporte Financiero y Cobranzas
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Balance consolidado de caja, ingresos, cuotas emitidas y saldos vencidos.
                    </p>
                  </div>
                  <div className="pt-3 mt-3 border-t border-slate-100 flex gap-2">
                    <Link href="/reportes/financiero" className="flex-1">
                      <Button variant="outline" className="w-full text-xs h-8">
                        Ver
                      </Button>
                    </Link>
                    <Link href="/reportes/financiero?print=1" target="_blank">
                      <Button variant="secondary" className="px-2.5 h-8 text-xs font-bold" title="Descargar PDF">
                        <Download className="w-3.5 h-3.5 text-[#C4121A]" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* 3. Reporte Académico */}
                <div className="border border-slate-200 bg-white rounded-xl p-4 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                        REP-ACA-02
                      </span>
                      <BookOpen className="w-4 h-4 text-blue-800" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-2">
                      Matrículas y Ocupación
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Listado oficial de matrículas activas, vacantes por cohorte y cobertura por turno.
                    </p>
                  </div>
                  <div className="pt-3 mt-3 border-t border-slate-100 flex gap-2">
                    <Link href="/reportes/academico" className="flex-1">
                      <Button variant="outline" className="w-full text-xs h-8">
                        Ver
                      </Button>
                    </Link>
                    <Link href="/reportes/academico?print=1" target="_blank">
                      <Button variant="secondary" className="px-2.5 h-8 text-xs font-bold" title="Descargar PDF">
                        <Download className="w-3.5 h-3.5 text-[#C4121A]" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* 4. Padrón Institucional */}
                <div className="border border-slate-200 bg-white rounded-xl p-4 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-red-50 text-[#C4121A] border border-red-200">
                        PAD-EST-2026
                      </span>
                      <Users className="w-4 h-4 text-[#C4121A]" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-2">
                      Padrón General de Alumnos
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Nómina consolidada con códigos estudiantiles, DNI, programa y sellos de dirección.
                    </p>
                  </div>
                  <div className="pt-3 mt-3 border-t border-slate-100 flex gap-2">
                    <Link href="/reportes/demografia" className="flex-1">
                      <Button variant="outline" className="w-full text-xs h-8">
                        Ver
                      </Button>
                    </Link>
                    <Link href="/reportes/padron-estudiantes?print=1" target="_blank">
                      <Button variant="secondary" className="px-2.5 h-8 text-xs font-bold" title="Descargar PDF">
                        <Download className="w-3.5 h-3.5 text-[#C4121A]" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            CONTENIDO TAB 2: FINANZAS Y COBRANZAS (PASO 2: LIMPIEZA Y CLARIDAD)
        ======================================================== */}
        {activeTab === 'finanzas' && (
          <div className="space-y-6">
            {/* Banner de Resumen Ejecutivo de Tesorería */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block">
                  Estado Financiero y Cobranzas del Ciclo
                </span>
                <p className="text-sm text-slate-700 mt-0.5">
                  Se ha recaudado un total de <strong className="text-slate-900">{formatCurrency(totalRecaudado)}</strong> sobre una cartera emitida de{' '}
                  <strong className="text-slate-900">{formatCurrency(totalCarteraEmitida)}</strong>, registrando una efectividad de cobranza del{' '}
                  <strong className="text-emerald-700">{100 - porcentajeMorosidad}%</strong>.
                </p>
              </div>

              <Link
                href="/reportes/financiero?print=1"
                target="_blank"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C4121A] hover:bg-red-800 text-white text-xs font-bold shadow-2xs transition shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Exportar Reporte Financiero (PDF A4)</span>
              </Link>
            </div>

            {/* 4 Métricas Clave Limpias y Elegantes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">Recaudado en Caja</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {formatCurrency(totalRecaudado)}
                </div>
                <p className="text-[11px] text-emerald-700 font-medium">
                  {pagosFiltrados.length} pagos validados
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">Saldo al Día</span>
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {formatCurrency(Math.max(totalSaldoPendiente - montoMorosidad, 0))}
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Cuotas por vencer según cronograma
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">Cartera Vencida</span>
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                </div>
                <div className="text-2xl font-black text-red-700">
                  {formatCurrency(montoMorosidad)}
                </div>
                <p className="text-[11px] text-red-600 font-medium">
                  {cuotasVencidasCount} cuotas fuera de plazo ({porcentajeMorosidad}%)
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">Cartera Total Emitida</span>
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {formatCurrency(totalCarteraEmitida)}
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Base contractual de cuotas
                </p>
              </div>
            </div>

            {/* PASO 2: Recaudación por Canal de Cobro — Tabla Limpia, Ordenada y Comprensible */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="border-slate-200 bg-white shadow-2xs">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-[#C4121A]" />
                        Recaudación por Canal de Cobro
                      </CardTitle>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Volumen de operaciones y montos recaudados clasificados por medio de pago.
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md">
                      Total: {formatCurrency(totalRecaudado)}
                    </span>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-bold">
                            <th className="py-2.5 px-4">Canal / Medio de Cobro</th>
                            <th className="py-2.5 px-3 text-center">N° Operaciones</th>
                            <th className="py-2.5 px-4 text-right">Monto Recaudado</th>
                            <th className="py-2.5 px-4 text-center">Participación %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {mediosPagoDesglose.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-6 text-center text-slate-400 italic">
                                No se registran pagos en el periodo seleccionado.
                              </td>
                            </tr>
                          ) : (
                            mediosPagoDesglose.map(m => (
                              <tr key={m.key} className="hover:bg-slate-50/80 transition">
                                <td className="py-2.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-[#C4121A]" />
                                  <span>{m.nombre}</span>
                                </td>
                                <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-700">
                                  {m.count}
                                </td>
                                <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                                  {formatCurrency(m.total)}
                                </td>
                                <td className="py-2.5 px-4">
                                  <div className="flex items-center gap-2 max-w-[120px] mx-auto">
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                      <div
                                        className="bg-[#C4121A] h-full rounded-full"
                                        style={{ width: `${m.porcentaje}%` }}
                                      />
                                    </div>
                                    <span className="text-[10px] font-mono font-bold text-slate-600 w-7 text-right">
                                      {m.porcentaje}%
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                        {mediosPagoDesglose.length > 0 && (
                          <tfoot>
                            <tr className="bg-slate-50/80 border-t border-slate-200 font-bold text-slate-900">
                              <td className="py-2.5 px-4 uppercase text-[10.5px]">Total Consolidado</td>
                              <td className="py-2.5 px-3 text-center font-mono">{pagosFiltrados.length}</td>
                              <td className="py-2.5 px-4 text-right font-mono text-[#C4121A]">{formatCurrency(totalRecaudado)}</td>
                              <td className="py-2.5 px-4 text-center font-mono">100%</td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tarjeta de Documento Oficial REP-FIN-01 */}
              <div>
                <Card className="border-slate-200 bg-white shadow-2xs h-full flex flex-col justify-between">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Documento Oficial
                      </span>
                      <span className="text-xs font-mono text-slate-400">REP-FIN-01</span>
                    </div>
                    <CardTitle className="text-base font-bold text-slate-900 mt-2">
                      Reporte de Caja y Cobranzas
                    </CardTitle>
                    <p className="text-xs text-slate-500 mt-1">
                      Genera el informe imprimible en formato A4 con membrete institucional de Brusben y detalle de transacciones.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-2">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Recaudado Confirmado:</span>
                        <strong className="text-slate-900">{formatCurrency(totalRecaudado)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Cartera en Mora:</span>
                        <strong className="text-red-700">{formatCurrency(montoMorosidad)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Efectividad de Cobro:</span>
                        <strong className="text-emerald-700">{100 - porcentajeMorosidad}%</strong>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Link href="/reportes/financiero?print=1" target="_blank" className="block">
                        <Button className="w-full text-xs font-bold gap-2">
                          <Download className="w-4 h-4" />
                          <span>Descargar Reporte PDF (A4)</span>
                        </Button>
                      </Link>
                      <Link href="/reportes/financiero" className="block text-center text-xs font-bold text-slate-600 hover:text-slate-900 hover:underline">
                        Ver vista previa detallada &rarr;
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Cuotas Críticas en Mora */}
            <Card className="border-slate-200 bg-white shadow-2xs">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                    Cartera Vencida Prioritaria para Gestión de Cobranza
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cuotas vencidas que requieren contacto inmediato vía WhatsApp o llamada telefónica.
                  </p>
                </div>
                <Link
                  href="/reportes/financiero"
                  className="text-xs font-bold text-[#C4121A] hover:underline"
                >
                  Ver Cartera Completa &rarr;
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-bold">
                        <th className="py-2.5 px-4">Cód. Matrícula</th>
                        <th className="py-2.5 px-3">Estudiante</th>
                        <th className="py-2.5 px-3">Concepto</th>
                        <th className="py-2.5 px-3 text-center">Vencimiento</th>
                        <th className="py-2.5 px-4 text-right">Saldo en Mora</th>
                        <th className="py-2.5 px-3 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cuotasCriticas.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                            ¡Excelente! No hay cuotas vencidas bajo los filtros seleccionados.
                          </td>
                        </tr>
                      ) : (
                        cuotasCriticas.map(c => {
                          const mat = c.matriculas;
                          const est = mat?.estudiantes;
                          const per = est?.personas;
                          const nombre = per ? `${per.apellido_paterno || ''} ${per.nombres || ''}`.trim() : (est?.codigo_estudiante || '-');
                          return (
                            <tr key={c.id} className="hover:bg-slate-50/80 transition">
                              <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                                {mat?.codigo_matricula || '-'}
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-slate-800">
                                {nombre}
                              </td>
                              <td className="py-2.5 px-3 text-slate-700">
                                {c.concepto || 'Pensión Académica'}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                                {c.fecha_vencimiento || '-'}
                              </td>
                              <td className="py-2.5 px-4 text-right font-mono font-bold text-red-700">
                                {formatCurrency(Number(c.saldo ?? c.importe_neto ?? 0))}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-700">
                                  VENCIDA
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ========================================================
            CONTENIDO TAB 3: GESTIÓN ACADÉMICA & TALLERES
        ======================================================== */}
        {activeTab === 'academico' && (
          <div className="space-y-6">
            {/* Ocupación por Cohorte y Edición Académica */}
            <Card className="border-slate-200 bg-white shadow-2xs">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    Ocupación de Cohortes y Ediciones Académicas
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Seguimiento de vacantes ofertadas vs estudiantes activos por grupo, con acceso a su nómina de clase.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href="/reportes/academico?print=1"
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
                  >
                    <Download className="w-3.5 h-3.5 text-[#C4121A]" />
                    <span>Reporte Académico (A4)</span>
                  </Link>
                  <Link
                    href="/reportes/padron-estudiantes?print=1"
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C4121A] hover:bg-red-800 text-white text-xs font-bold transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Padrón de Alumnos (PDF)</span>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-bold">
                        <th className="py-2.5 px-4">Código Grupo</th>
                        <th className="py-2.5 px-3">Programa Académico</th>
                        <th className="py-2.5 px-3 text-center">Modalidad / Turno</th>
                        <th className="py-2.5 px-3 text-center">Vacantes</th>
                        <th className="py-2.5 px-4 text-center">Aforo Cubierto</th>
                        <th className="py-2.5 px-3 text-center">Estado</th>
                        <th className="py-2.5 px-3 text-center">Acción Nómina</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {edicionesFiltradas.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-slate-400 italic">
                            No existen ediciones registradas bajo estos filtros.
                          </td>
                        </tr>
                      ) : (
                        edicionesFiltradas.map(ed => {
                          const matriculadosEd = matriculasFiltradas.filter(
                            m => m.edicion_id === ed.id && (m.status || '').toUpperCase() === 'ACTIVA'
                          ).length;
                          const vac = Number(ed.vacantes || 0);
                          const pct = vac > 0 ? Math.min(Math.round((matriculadosEd / vac) * 100), 100) : 0;
                          return (
                            <tr key={ed.id} className="hover:bg-slate-50/80 transition">
                              <td className="py-3 px-4 font-mono font-bold text-slate-900">
                                {ed.codigo}
                              </td>
                              <td className="py-3 px-3 text-slate-800 font-semibold">
                                {ed.programas?.nombre || ed.nombre || 'Programa Técnico'}
                              </td>
                              <td className="py-3 px-3 text-center text-slate-600">
                                {ed.modalidad || 'Presencial'} / {ed.turno || 'Regular'}
                              </td>
                              <td className="py-3 px-3 text-center font-mono font-semibold text-slate-700">
                                {ed.vacantes ?? '-'}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2 max-w-[140px] mx-auto">
                                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        pct >= 80 ? 'bg-emerald-600' : pct >= 40 ? 'bg-blue-600' : 'bg-amber-500'
                                      }`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <span className="text-[10.5px] font-mono font-bold text-slate-700 w-8 text-right">
                                    {pct}%
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  ed.status === 'ACTIVO'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {ed.status || 'ACTIVO'}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <Link
                                  href={`/reportes/nomina?edicionId=${ed.id}&print=1`}
                                  target="_blank"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold transition"
                                >
                                  <Printer className="w-3 h-3 text-[#C4121A]" />
                                  <span>Nómina PDF</span>
                                </Link>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ========================================================
            CONTENIDO TAB 4: RENDIMIENTO COMERCIAL CRM
        ======================================================== */}
        {activeTab === 'crm' && (
          <div className="space-y-6">
            {/* Embudo Visual de Conversión */}
            <Card className="border-slate-200 bg-white shadow-2xs">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Embudo de Conversión de Prospectos a Matrícula
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pipeline comercial desde el primer contacto hasta el cierre de matrícula institucional.
                  </p>
                </div>
                <Link
                  href="/reportes/crm?print=1"
                  target="_blank"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#C4121A] text-white text-xs font-bold hover:bg-red-800 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Reporte Comercial (PDF)</span>
                </Link>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Etapa 1 */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 text-center space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-slate-500">
                      1. Captados / Nuevos
                    </span>
                    <div className="text-2xl font-black text-slate-900">
                      {embudoCRM.nuevos}
                    </div>
                    <p className="text-[11px] text-slate-500">Primer registro en CRM</p>
                  </div>

                  {/* Etapa 2 */}
                  <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 text-center space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-blue-700">
                      2. En Seguimiento
                    </span>
                    <div className="text-2xl font-black text-blue-900">
                      {embudoCRM.contactados}
                    </div>
                    <p className="text-[11px] text-blue-600">Contactados por asesor</p>
                  </div>

                  {/* Etapa 3 */}
                  <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/40 text-center space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-purple-700">
                      3. Alta Intención
                    </span>
                    <div className="text-2xl font-black text-purple-900">
                      {embudoCRM.interesados}
                    </div>
                    <p className="text-[11px] text-purple-600">Interesados confirmados</p>
                  </div>

                  {/* Etapa 4 */}
                  <div className="p-3.5 rounded-xl border border-emerald-300 bg-emerald-50 text-center space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-emerald-800">
                      4. Matrícula Efectiva
                    </span>
                    <div className="text-2xl font-black text-emerald-700">
                      {embudoCRM.convertidos}
                    </div>
                    <p className="text-[11px] text-emerald-600 font-bold">
                      {tasaConversion}% conversión
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rendimiento por Canal de Captación */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-slate-200 bg-white shadow-2xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-[#C4121A]" />
                    Efectividad por Canal de Captación
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-bold">
                        <th className="py-2.5 px-4">Canal</th>
                        <th className="py-2.5 px-3 text-center">Prospectos</th>
                        <th className="py-2.5 px-3 text-center">Matriculados</th>
                        <th className="py-2.5 px-4 text-right">Efectividad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {canalesCRM.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-slate-400 italic">
                            Sin registros de prospectos.
                          </td>
                        </tr>
                      ) : (
                        canalesCRM.map(c => (
                          <tr key={c.canal} className="hover:bg-slate-50/80 transition">
                            <td className="py-2.5 px-4 font-bold text-slate-900">{c.canal}</td>
                            <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-700">
                              {c.total}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700">
                              {c.convertidos}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                              {c.tasa}%
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* Tarjeta de Resumen Comercial y Exportación */}
              <Card className="border-slate-200 bg-white shadow-2xs flex flex-col justify-between">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                      Auditoría Comercial
                    </span>
                    <span className="text-xs font-mono text-slate-400">REF: REP-CRM-03</span>
                  </div>
                  <CardTitle className="text-base font-bold text-slate-900 mt-2">
                    Reporte de Gestión Comercial y Pipeline
                  </CardTitle>
                  <p className="text-xs text-slate-600 mt-1">
                    Análisis de atracción de postulantes, tiempo de maduración comercial de leads
                    y conversión a contratos de matrícula firmados.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Prospectos Captados:</span>
                      <strong className="text-slate-900">{totalProspectos}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Cierres Exitosos (Matrícula):</span>
                      <strong className="text-emerald-700">{prospectosConvertidos}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tasa de Conversión Global:</span>
                      <strong className="text-purple-700">{tasaConversion}%</strong>
                    </div>
                  </div>

                  <Link href="/reportes/crm?print=1" target="_blank" className="block">
                    <Button className="w-full text-xs font-bold gap-2">
                      <Download className="w-4 h-4" />
                      <span>Descargar Reporte Comercial Oficial (PDF A4)</span>
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

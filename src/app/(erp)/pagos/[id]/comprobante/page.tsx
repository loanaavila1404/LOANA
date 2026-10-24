import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/permissions';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/currency';
import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  UserCheck,
  GraduationCap,
  Calendar,
  CreditCard,
  Hash,
} from 'lucide-react';
import PrintButton from '@/app/(erp)/matriculas/[id]/ficha/PrintButton';

export const metadata = {
  title: 'Recibo de Pago Institucional - ERP Brusben',
};

// Conversor formal de montos en soles a texto en castellano
function montoEnLetras(monto: number): string {
  const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const especiales: Record<number, string> = {
    10: 'DIEZ',
    11: 'ONCE',
    12: 'DOCE',
    13: 'TRECE',
    14: 'CATORCE',
    15: 'QUINCE',
    16: 'DIECISÉIS',
    17: 'DIECISIETE',
    18: 'DIECIOCHO',
    19: 'DIECINUEVE',
    20: 'VEINTE',
    21: 'VEINTIUNO',
    22: 'VEINTIDÓS',
    23: 'VEINTITRÉS',
    24: 'VEINTICUATRO',
    25: 'VEINTICINCO',
    26: 'VEINTISÉIS',
    27: 'VEINTISIETE',
    28: 'VEINTIOCHO',
    29: 'VEINTINUEVE',
  };
  const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  function convertirGrupo(n: number): string {
    if (n === 0) return '';
    if (n === 100) return 'CIEN';
    let res = '';
    const c = Math.floor(n / 100);
    const du = n % 100;
    const d = Math.floor(du / 10);
    const u = du % 10;

    if (c > 0) res += centenas[c] + ' ';

    if (especiales[du]) {
      res += especiales[du];
    } else if (d > 0 && u > 0) {
      res += decenas[d] + ' Y ' + unidades[u];
    } else if (d > 0) {
      res += decenas[d];
    } else if (u > 0) {
      res += unidades[u];
    }
    return res.trim();
  }

  const num = Math.abs(Number(monto) || 0);
  const entero = Math.floor(num);
  const centavos = Math.round((num - entero) * 100);
  const centavosStr = `${centavos.toString().padStart(2, '0')}/100 SOLES`;

  if (entero === 0) return `CERO CON ${centavosStr}`;

  const partes: string[] = [];
  const miles = Math.floor(entero / 1000);
  const resto = entero % 1000;

  if (miles === 1) {
    partes.push('MIL');
  } else if (miles > 1) {
    partes.push(convertirGrupo(miles) + ' MIL');
  }

  if (resto > 0) {
    partes.push(convertirGrupo(resto));
  }

  return `${partes.join(' ')} CON ${centavosStr}`;
}

// Resuelve de manera exacta y explícita el concepto de la cuota pagada
function resolverConceptoCuota(
  cuota: any,
  pago: any,
  index: number = 0,
  periodoNombre?: string | null
): { titulo: string; detalle?: string } {
  if (cuota) {
    const rawConcepto = (cuota.concepto || '').trim();
    const tipo = (cuota.tipo_cuota || '').toUpperCase();
    const num = cuota.numero_cuota;

    let titulo = rawConcepto;
    if (!titulo) {
      if (tipo === 'MATRICULA') {
        titulo = 'Matrícula';
      } else if (tipo === 'PENSION') {
        const numCuota = num !== null && num !== undefined && num > 0 ? num : index + 1;
        titulo = `Pensión ${numCuota}`;
      } else {
        titulo = 'Concepto Institucional';
      }
    }

    const detalle = periodoNombre ? `Periodo Académico: ${periodoNombre}` : undefined;
    return { titulo, detalle };
  }

  // Fallback si no hay cuota vinculada directamente en la aplicación
  if (pago?.numero_operacion && pago.numero_operacion.includes('·')) {
    const conceptoOp = pago.numero_operacion.split('·')[1].trim();
    if (conceptoOp) {
      return {
        titulo: conceptoOp,
        detalle: periodoNombre ? `Periodo Académico: ${periodoNombre}` : undefined,
      };
    }
  }

  if (pago?.observaciones && pago.observaciones.trim().length > 3) {
    return {
      titulo: pago.observaciones.trim(),
      detalle: periodoNombre ? `Periodo Académico: ${periodoNombre}` : undefined,
    };
  }

  return {
    titulo: 'Abono / Cuota Institucional',
    detalle: periodoNombre ? `Periodo Académico: ${periodoNombre}` : undefined,
  };
}

export default async function ComprobantePagoPage(props: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(['COBRANZA.VER', 'PAGOS.REGISTRAR', 'MATRICULAS.VER', 'SISTEMA.ADMINISTRAR']);
  const supabase = await createClient();
  const resolvedParams = await props.params;
  const pagoId = resolvedParams.id;

  if (!pagoId) notFound();

  // Consultar pago con estudiante, persona y aplicaciones
  const { data: pago, error: pagoError } = await supabase
    .from('pagos')
    .select(`
      *,
      estudiantes (
        id,
        codigo_estudiante,
        personas (
          id,
          nombres,
          apellido_paterno,
          apellido_materno,
          tipo_documento,
          numero_documento,
          telefono,
          email
        )
      ),
      pago_aplicaciones (
        id,
        cuota_id,
        importe_aplicado,
        cuotas (
          id,
          matricula_id,
          concepto,
          tipo_cuota,
          numero_cuota,
          fecha_emision,
          fecha_vencimiento,
          importe_original,
          descuento,
          recargo,
          importe_neto,
          saldo
        )
      )
    `)
    .eq('id', pagoId)
    .maybeSingle();

  if (pagoError || !pago) {
    notFound();
  }

  const est = Array.isArray(pago.estudiantes) ? pago.estudiantes[0] : pago.estudiantes;
  const persona = Array.isArray(est?.personas) ? est?.personas[0] : est?.personas;

  // Consultar matrícula vinculada si existe a través de la primera cuota
  const firstCuota = pago.pago_aplicaciones?.[0]?.cuotas;
  let matriculaData: any = null;
  if (firstCuota?.matricula_id) {
    const { data: m } = await supabase
      .from('matriculas')
      .select(`
        id,
        codigo_matricula,
        importe_matricula,
        importe_pension,
        numero_pensiones,
        descuento_total,
        edicion_id,
        estudiante_id,
        ediciones (
          id,
          codigo,
          nombre,
          modalidad,
          turno,
          programa_id,
          periodo_id,
          programas ( id, codigo, nombre, tipo_programa ),
          periodos ( id, codigo, nombre )
        )
      `)
      .eq('id', firstCuota.matricula_id)
      .maybeSingle();
    matriculaData = m;
  }

  // Fallback si no hay matricula_id directa en la cuota: buscar por estudiante_id
  if (!matriculaData && est?.id) {
    const { data: m } = await supabase
      .from('matriculas')
      .select(`
        id,
        codigo_matricula,
        importe_matricula,
        importe_pension,
        numero_pensiones,
        descuento_total,
        edicion_id,
        estudiante_id,
        ediciones (
          id,
          codigo,
          nombre,
          modalidad,
          turno,
          programa_id,
          periodo_id,
          programas ( id, codigo, nombre, tipo_programa ),
          periodos ( id, codigo, nombre )
        )
      `)
      .eq('estudiante_id', est.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    matriculaData = m;
  }

  let ed = Array.isArray(matriculaData?.ediciones) ? matriculaData?.ediciones[0] : matriculaData?.ediciones;
  let prog = Array.isArray(ed?.programas) ? ed?.programas[0] : ed?.programas;
  let periodo = Array.isArray(ed?.periodos) ? ed?.periodos[0] : ed?.periodos;

  // Fallbacks de recuperación por ID directo si la relación anidada viniera nula
  if (!prog && ed?.programa_id) {
    const { data: progRes } = await supabase
      .from('programas')
      .select('id, codigo, nombre, tipo_programa')
      .eq('id', ed.programa_id)
      .maybeSingle();
    if (progRes) prog = progRes;
  }

  if (!periodo && ed?.periodo_id) {
    const { data: perRes } = await supabase
      .from('periodos')
      .select('id, codigo, nombre')
      .eq('id', ed.periodo_id)
      .maybeSingle();
    if (perRes) periodo = perRes;
  }

  if (!ed && matriculaData?.edicion_id) {
    const { data: edRes } = await supabase
      .from('ediciones')
      .select('id, codigo, nombre, modalidad, turno, programa_id, periodo_id, programas(id, codigo, nombre, tipo_programa), periodos(id, codigo, nombre)')
      .eq('id', matriculaData.edicion_id)
      .maybeSingle();
    if (edRes) {
      ed = edRes;
      if (!prog) prog = Array.isArray(ed.programas) ? ed.programas[0] : ed.programas;
      if (!periodo) periodo = Array.isArray(ed.periodos) ? ed.periodos[0] : ed.periodos;
    }
  }

  // Nombre real de la carrera en mayúsculas, sin texto genérico quemado
  const carreraNombre = (
    prog?.nombre ||
    ed?.nombre ||
    'Carrera Técnica / Formación Profesional'
  ).toUpperCase();

  // Resumen financiero global de la matrícula para contexto administrativo
  let resumenGlobal: { totalComprometido: number; saldoPendienteGlobal: number; totalPagadoGlobal: number } | null = null;
  if (matriculaData?.id) {
    const { data: allCuotas } = await supabase
      .from('cuotas')
      .select('importe_neto, saldo, status')
      .eq('matricula_id', matriculaData.id);

    if (allCuotas && allCuotas.length > 0) {
      const activeCuotas = allCuotas.filter(c => (c.status || '').toUpperCase() !== 'ANULADA');
      const totalComprometido = activeCuotas.reduce((acc, c) => acc + Number(c.importe_neto || 0), 0);
      const saldoPendienteGlobal = activeCuotas.reduce(
        (acc, c) => acc + (c.saldo !== null && c.saldo !== undefined ? Number(c.saldo) : Number(c.importe_neto || 0)),
        0
      );
      const totalPagadoGlobal = Math.max(0, totalComprometido - saldoPendienteGlobal);
      resumenGlobal = {
        totalComprometido,
        saldoPendienteGlobal,
        totalPagadoGlobal,
      };
    }
  }

  const codigoRecibo = pago.comprobante_numero
    ? (pago.comprobante_numero.startsWith('REC-') ? pago.comprobante_numero : `REC-${pago.comprobante_numero}`)
    : `REC-${pago.id.substring(0, 8).toUpperCase()}`;

  // Formato de fechas y horas en zona local
  const fechaPagoDate = pago.fecha_pago ? new Date(pago.fecha_pago) : new Date();
  const fechaEmisionDate = pago.registrado_en ? new Date(pago.registrado_en) : fechaPagoDate;

  const fechaPagoFormateada = fechaPagoDate.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const fechaEmisionCompleta = fechaEmisionDate.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const horaEmision = fechaEmisionDate.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const isAnulado = (pago.status || '').toUpperCase() === 'ANULADO';

  const aplicaciones = pago.pago_aplicaciones || [];

  return (
    <div className="min-h-screen bg-slate-100 py-4 sm:py-6 print:py-0 print:bg-white text-slate-800">
      {/* Estilos específicos para impresión forzada en 1 sola hoja A4 */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @page {
              size: A4 portrait;
              margin: 6mm 8mm 6mm 8mm;
            }
            @media print {
              html, body {
                height: 100% !important;
                max-height: 100vh !important;
                overflow: hidden !important;
                background: #ffffff !important;
                font-size: 11px !important;
                margin: 0 !important;
                padding: 0 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .receipt-container {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                max-height: 98vh !important;
                overflow: hidden !important;
                padding: 4px 6px !important;
                font-size: 11px !important;
                border: none !important;
                box-shadow: none !important;
                margin: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
              }
            }
          `,
        }}
      />

      {/* Barra superior de acciones (oculta al imprimir) */}
      <div className="max-w-[850px] mx-auto px-4 mb-3 flex items-center justify-between print:hidden">
        <Link
          href="/matriculas"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 px-3.5 py-1.5 rounded-lg shadow-2xs hover:bg-slate-50 transition"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Volver a Matrículas</span>
        </Link>

        <div className="flex items-center gap-2">
          <PrintButton label="Imprimir Recibo / Guardar PDF" />
        </div>
      </div>

      {/* Contenedor del Comprobante (Hoja A4 / Carta para impresión profesional en 1 sola hoja) */}
      <div className="receipt-container max-w-[850px] mx-auto bg-white border border-slate-300 shadow-xl rounded-xl p-6 sm:p-7 print:p-1 print:border-none print:shadow-none print:m-0 print:max-w-none print:w-full font-sans text-slate-800">
        
        {/* ============================================================== */}
        {/* CABECERA CORPORATIVA OFICIAL BRUSBEN */}
        {/* ============================================================== */}
        <header className="border-t-4 border-[#990000] pt-3 pb-3 print:pt-1.5 print:pb-2 border-b border-slate-300 mb-3.5 print:mb-2 break-inside-avoid">
          <div className="flex flex-col sm:flex-row print:flex-row items-start sm:items-center print:items-center justify-between gap-3">
            
            {/* Logo y Membrete Institucional */}
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-brusben.png"
                alt="Centro de Capacitaciones Brusben"
                className="h-14 sm:h-16 print:h-11 w-auto object-contain shrink-0"
              />
              <div>
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#990000]">
                  Centro de Capacitaciones
                </p>
                <h1 className="text-xl sm:text-2xl print:text-xl font-black tracking-tight text-slate-900 uppercase leading-none">
                  BRUSBEN
                </h1>
                <p className="text-xs print:text-[11px] text-slate-600 font-semibold mt-0.5 leading-tight">
                  Formación Continua, Especialización Profesional y Certificación
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Sede Central: Tumbes, Perú · RUC Institucional: 20608934521
                </p>
              </div>
            </div>

            {/* Recuadro de Control Documental */}
            <div className="w-full sm:w-auto print:w-auto min-w-[230px] border-2 border-slate-800 rounded-lg p-2.5 print:p-2 bg-slate-50/80 text-left sm:text-right print:text-right shrink-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#990000]">
                RECIBO DE PAGO INSTITUCIONAL
              </p>
              <p className="text-[8.5px] font-bold uppercase tracking-widest text-slate-500">
                (CONTROL INTERNO DE CAJA)
              </p>
              <p className="text-base sm:text-lg print:text-base font-black font-mono text-slate-900 mt-0.5 tracking-tight">
                {codigoRecibo}
              </p>
              <div className="mt-1.5 flex sm:justify-end print:justify-end items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-black uppercase border ${
                    isAnulado
                      ? 'bg-red-50 text-red-700 border-red-300'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  }`}
                >
                  {isAnulado ? 'ANULADO' : '✓ PAGADO / CONFORME'}
                </span>
                <span className="text-[9.5px] font-mono text-slate-500 font-medium">
                  {fechaPagoFormateada}
                </span>
              </div>
            </div>
          </div>

          {/* Subcabecera: Fecha y Hora Exacta de Emisión */}
          <div className="mt-2 pt-1.5 border-t border-slate-200 flex flex-wrap items-center justify-between text-[10.5px] text-slate-600">
            <div>
              <span className="font-bold text-slate-800 uppercase tracking-wide">Constancia Oficial de Abono y Cancelación</span>
            </div>
            <div className="flex items-center gap-2.5 text-[9.5px] text-slate-500">
              <span>Emisión: <strong className="text-slate-700">{fechaEmisionCompleta}</strong> a las <strong className="text-slate-700">{horaEmision}</strong></span>
              <span>·</span>
              <span className="font-mono">Tumbes - Perú</span>
            </div>
          </div>
        </header>

        {/* ============================================================== */}
        {/* BLOQUE DE DATOS: ESTUDIANTE Y PROGRAMA (2 COLUMNAS PERFECTAS) */}
        {/* ============================================================== */}
        <div className="grid grid-cols-2 gap-3 mb-3.5 print:mb-2 break-inside-avoid">
          {/* Tarjeta 1: Estudiante / Titular */}
          <div className="border border-slate-300 rounded-lg p-3 print:p-2 bg-slate-50/70 text-xs">
            <div className="flex items-center gap-1.5 border-b border-slate-200 pb-1.5 mb-2 text-[#990000] font-extrabold uppercase text-[9.5px] tracking-wider">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Datos del Estudiante / Titular</span>
            </div>
            <div className="space-y-1">
              <div>
                <span className="text-[9.5px] uppercase font-bold text-slate-400 block tracking-wider">Apellidos y Nombres</span>
                <p className="font-extrabold text-sm text-slate-900 leading-tight">
                  {persona?.nombres} {persona?.apellido_paterno} {persona?.apellido_materno}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/70 text-slate-700">
                <div>
                  <span className="text-[9.5px] uppercase font-bold text-slate-400 block">{persona?.tipo_documento || 'DNI'}</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">{persona?.numero_documento || '-'}</span>
                </div>
                <div>
                  <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Código Alumno</span>
                  <span className="font-mono font-bold text-[#990000] text-xs">{est?.codigo_estudiante || 'Pendiente'}</span>
                </div>
              </div>
              {(persona?.telefono || persona?.email) && (
                <div className="pt-0.5 border-t border-slate-200/60 text-[10.5px] text-slate-600 truncate">
                  <span className="text-slate-400">Contacto: </span>
                  <span className="font-medium text-slate-800">{persona?.telefono || '-'} · {persona?.email || '-'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tarjeta 2: Programa Académico y Matrícula */}
          <div className="border border-slate-300 rounded-lg p-3 print:p-2 bg-slate-50/70 text-xs">
            <div className="flex items-center gap-1.5 border-b border-slate-200 pb-1.5 mb-2 text-[#990000] font-extrabold uppercase text-[9.5px] tracking-wider">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Programa Académico y Matrícula</span>
            </div>
            <div className="space-y-1">
              <div>
                <span className="text-[9.5px] uppercase font-bold text-slate-400 block tracking-wider">Carrera / Especialización</span>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <p className="font-extrabold text-sm text-slate-900 leading-tight uppercase">
                    {carreraNombre}
                  </p>
                  {prog?.codigo && (
                    <span className="text-[9.5px] font-mono font-bold text-slate-500 uppercase">
                      ({prog.codigo})
                    </span>
                  )}
                </div>
                {prog?.tipo_programa && (
                  <span className="text-[9.5px] font-semibold text-slate-500 uppercase block mt-0.5">
                    {prog.tipo_programa === 'CARRERA_TECNICA'
                      ? 'Carrera Técnica'
                      : prog.tipo_programa === 'CURSO_CORTO'
                      ? 'Curso Corto'
                      : 'Programa Modular'}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/70 text-slate-700">
                <div>
                  <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Edición / Grupo</span>
                  <span className="font-semibold text-slate-900 text-xs truncate block" title={ed?.nombre || ed?.codigo}>
                    {ed?.codigo ? `${ed.codigo} ` : ''}{ed?.nombre ? `(${ed.nombre})` : 'Edición Regular'}
                  </span>
                </div>
                <div>
                  <span className="text-[9.5px] uppercase font-bold text-slate-400 block">N° Matrícula</span>
                  <span className="font-mono font-bold text-[#990000] text-xs">{matriculaData?.codigo_matricula || 'MAT-REGULAR'}</span>
                </div>
              </div>
              <div className="pt-0.5 border-t border-slate-200/60 text-[10.5px] text-slate-600 flex justify-between">
                <span>Periodo: <strong className="text-slate-800">{periodo?.nombre || periodo?.codigo || 'Ciclo Activo'}</strong></span>
                <span>Sede: <strong className="text-slate-800">Sede Central · Tumbes</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* BARRA DE DATOS OPERATIVOS Y FINANCIEROS (4 COLUMNAS) */}
        {/* ============================================================== */}
        <div className="grid grid-cols-4 gap-2.5 border border-slate-300 rounded-lg p-2.5 print:p-2 bg-white mb-3.5 print:mb-2 text-xs break-inside-avoid">
          <div className="border-r border-slate-200 pr-2">
            <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Medio de Pago</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <CreditCard className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span className="font-bold text-slate-900 uppercase">{pago.medio_pago || 'TRANSFERENCIA'}</span>
            </div>
          </div>

          <div className="border-r border-slate-200 pr-2">
            <span className="text-[9.5px] uppercase font-bold text-slate-400 block">N° Operación / Ref.</span>
            <span className="font-mono font-bold text-[#990000] block mt-0.5 truncate" title={pago.numero_operacion || 'Caja / Directo'}>
              {pago.numero_operacion || 'Caja / Efectivo'}
            </span>
          </div>

          <div className="border-r border-slate-200 pr-2">
            <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Fecha del Abono</span>
            <span className="font-semibold text-slate-800 block mt-0.5">{fechaPagoFormateada}</span>
          </div>

          <div>
            <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Caja Responsable</span>
            <span className="font-semibold text-slate-800 block mt-0.5">Caja Central · Tumbes</span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* TABLA DE DETALLE EXPLÍCITO DE CUOTAS Y CONCEPTOS AMORTIZADOS */}
        {/* ============================================================== */}
        <div className="mb-3.5 print:mb-2 overflow-hidden rounded-lg border border-slate-300 break-inside-avoid">
          <div className="bg-[#990000] text-white py-1.5 px-3 print:py-1 print:px-2 flex items-center justify-between">
            <span className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider">
              Detalle Explícito de Cuotas y Amortizaciones
            </span>
            <span className="text-[9.5px] uppercase font-semibold text-red-100">
              Moneda Oficial: Soles (PEN - S/)
            </span>
          </div>

          <table className="w-full text-xs print:text-[10.5px] text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[9.5px] print:text-[9px] tracking-wider border-b border-slate-300">
                <th className="py-1.5 px-2.5 print:py-1 print:px-2 text-center w-[6%] border-r border-slate-200">N°</th>
                <th className="py-1.5 px-2.5 print:py-1 print:px-2 w-[40%] border-r border-slate-200">Concepto / Cuota Detallada</th>
                <th className="py-1.5 px-2.5 print:py-1 print:px-2 text-center w-[14%] border-r border-slate-200">Vencimiento</th>
                <th className="py-1.5 px-2.5 print:py-1 print:px-2 text-right w-[14%] border-r border-slate-200">Importe Cuota</th>
                <th className="py-1.5 px-2.5 print:py-1 print:px-2 text-right w-[14%] border-r border-slate-200 bg-red-50/50 text-[#990000]">
                  Amortizado Hoy
                </th>
                <th className="py-1.5 px-2.5 print:py-1 print:px-2 text-right w-[12%]">Saldo Restante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {aplicaciones.length === 0 ? (
                (() => {
                  const { titulo: conceptoTitulo, detalle: conceptoDetalle } = resolverConceptoCuota(
                    null,
                    pago,
                    0,
                    periodo?.nombre || periodo?.codigo
                  );
                  return (
                    <tr>
                      <td className="py-2 px-2.5 print:py-1 print:px-2 text-center font-mono text-slate-500 border-r border-slate-200">1</td>
                      <td className="py-2 px-2.5 print:py-1 print:px-2 font-semibold text-slate-800 border-r border-slate-200">
                        <span className="block leading-tight font-bold text-slate-900">{conceptoTitulo}</span>
                        {conceptoDetalle && (
                          <span className="text-[9.5px] text-slate-500 font-medium block mt-0.5">
                            {conceptoDetalle}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2.5 print:py-1 print:px-2 text-center text-slate-500 border-r border-slate-200">
                        {fechaPagoFormateada}
                      </td>
                      <td className="py-2 px-2.5 print:py-1 print:px-2 text-right text-slate-700 font-mono border-r border-slate-200">
                        {formatCurrency(Number(pago.importe) || 0)}
                      </td>
                      <td className="py-2 px-2.5 print:py-1 print:px-2 text-right font-black text-[#990000] font-mono border-r border-slate-200 bg-red-50/30">
                        {formatCurrency(Number(pago.importe) || 0)}
                      </td>
                      <td className="py-2 px-2.5 print:py-1 print:px-2 text-right text-emerald-700 font-mono font-bold">
                        {formatCurrency(0)}
                      </td>
                    </tr>
                  );
                })()
              ) : (
                aplicaciones.map((app: any, idx: number) => {
                  const c = app.cuotas;
                  const { titulo: conceptoTitulo, detalle: conceptoDetalle } = resolverConceptoCuota(
                    c,
                    pago,
                    idx,
                    periodo?.nombre || periodo?.codigo
                  );

                  const importeCuota = Number(c?.importe_neto || app.importe_aplicado || 0);
                  const montoAmortizado = Number(app.importe_aplicado || 0);
                  const saldoRestante =
                    c?.saldo !== null && c?.saldo !== undefined
                      ? Number(c.saldo)
                      : Math.max(0, importeCuota - montoAmortizado);

                  return (
                    <tr key={app.id || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-1.5 px-2.5 print:py-1 print:px-2 text-center font-mono text-slate-500 border-r border-slate-200 font-bold">
                        {idx + 1}
                      </td>
                      <td className="py-1.5 px-2.5 print:py-1 print:px-2 font-semibold text-slate-800 border-r border-slate-200">
                        <span className="block leading-tight font-bold text-slate-900">{conceptoTitulo}</span>
                        {conceptoDetalle && (
                          <span className="text-[9.5px] text-slate-500 font-medium block mt-0.5">
                            {conceptoDetalle}
                          </span>
                        )}
                      </td>
                      <td className="py-1.5 px-2.5 print:py-1 print:px-2 text-center text-slate-600 border-r border-slate-200 font-mono">
                        {c?.fecha_vencimiento
                          ? new Date(c.fecha_vencimiento).toLocaleDateString('es-PE')
                          : 'Al Día'}
                      </td>
                      <td className="py-1.5 px-2.5 print:py-1 print:px-2 text-right text-slate-700 border-r border-slate-200 font-mono">
                        {formatCurrency(importeCuota)}
                      </td>
                      <td className="py-1.5 px-2.5 print:py-1 print:px-2 text-right font-black text-[#990000] border-r border-slate-200 bg-red-50/40 font-mono">
                        {formatCurrency(montoAmortizado)}
                      </td>
                      <td className="py-1.5 px-2.5 print:py-1 print:px-2 text-right font-mono font-bold text-slate-800">
                        {saldoRestante === 0 ? (
                          <span className="text-emerald-700 font-black">CANCELADO (S/ 0.00)</span>
                        ) : (
                          <span className="text-slate-900">{formatCurrency(saldoRestante)}</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              {/* Fila de Total Cancelado */}
              <tr className="bg-slate-100 font-bold border-t border-slate-400">
                <td colSpan={4} className="py-2 px-2.5 print:py-1 print:px-2 text-right uppercase text-slate-800 tracking-wider text-[11px] print:text-[10px] border-r border-slate-300">
                  Total Cancelado en esta Operación:
                </td>
                <td className="py-2 px-2.5 print:py-1 print:px-2 text-right text-sm sm:text-base print:text-sm font-black text-[#990000] font-mono border-r border-slate-300 bg-red-100/50">
                  {formatCurrency(Number(pago.importe) || 0)}
                </td>
                <td className="py-2 px-2.5 print:py-1 print:px-2 text-right text-[10px] font-bold text-emerald-800">
                  {aplicaciones.length > 0 && aplicaciones.every((a: any) => (a.cuotas?.saldo ?? 0) === 0)
                    ? 'Cuotas Cubiertas'
                    : 'Abono Procesado'}
                </td>
              </tr>
              {/* Fila con Importe en Letras */}
              <tr className="bg-slate-50 border-t border-slate-200 text-slate-700">
                <td colSpan={6} className="py-1.5 px-2.5 print:py-1 print:px-2 text-[10.5px] print:text-[9.5px]">
                  <span className="font-extrabold uppercase text-slate-500 mr-2">SON:</span>
                  <span className="font-bold text-slate-900 uppercase font-mono">
                    {montoEnLetras(Number(pago.importe) || 0)}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ============================================================== */}
        {/* RESUMEN FINANCIERO GLOBAL DEL EXPEDIENTE (CONTEXTO GENERAL) */}
        {/* ============================================================== */}
        {resumenGlobal && (
          <div className="mb-3.5 print:mb-2 p-2.5 print:p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs break-inside-avoid">
            <span className="text-[9.5px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
              Estado Financiero General del Expediente Académico
            </span>
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="bg-white p-1.5 rounded border border-slate-200">
                <span className="text-[9.5px] text-slate-500 block">Total Comprometido</span>
                <span className="font-bold text-slate-900 font-mono text-xs">
                  {formatCurrency(resumenGlobal.totalComprometido)}
                </span>
              </div>
              <div className="bg-white p-1.5 rounded border border-slate-200">
                <span className="text-[9.5px] text-slate-500 block">Total Pagado a la Fecha</span>
                <span className="font-bold text-emerald-700 font-mono text-xs">
                  {formatCurrency(resumenGlobal.totalPagadoGlobal)}
                </span>
              </div>
              <div className="bg-white p-1.5 rounded border border-slate-200">
                <span className="text-[9.5px] text-slate-500 block">Saldo Deudor Restante</span>
                <span className={`font-black font-mono text-xs ${resumenGlobal.saldoPendienteGlobal > 0 ? 'text-[#990000]' : 'text-emerald-700'}`}>
                  {formatCurrency(resumenGlobal.saldoPendienteGlobal)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* NOTA INSTITUCIONAL Y DESCARGO LEGAL ANTE SUNAT */}
        {/* ============================================================== */}
        <div className="border border-slate-300 bg-slate-50/80 rounded-lg p-2.5 print:p-2 mb-3.5 print:mb-2 text-xs text-slate-600 space-y-1 break-inside-avoid">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 text-[11px] print:text-[10px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Certificación de Pago Interno — Centro de Capacitaciones Brusben</span>
          </div>
          <p className="text-[10.5px] print:text-[9.5px] text-slate-600 leading-snug">
            Este recibo acredita la cancelación del importe especificado y la amortización de cuotas en el Sistema ERP Académico Institucional. Válido para trámites curriculares internos, derecho a evaluaciones periódicas y constancias de no adeudo.
          </p>
          <div className="pt-1 border-t border-slate-200 flex items-start gap-1.5 text-slate-500 text-[9.5px] print:text-[8.5px]">
            <span className="font-black text-[#990000] shrink-0 uppercase tracking-wider">Aviso Importante:</span>
            <span className="font-semibold italic">
              Recibo de pago interno para control académico y financiero. No válido como comprobante fiscal ante la SUNAT.
            </span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* FIRMAS Y SELLOS INSTITUCIONALES (ALINEADOS Y ESTRUCTURADOS) */}
        {/* ============================================================== */}
        <div className="grid grid-cols-2 gap-6 pt-3.5 print:pt-2 border-t-2 border-dashed border-slate-300 text-center text-xs break-inside-avoid">
          {/* Firma Estudiante */}
          <div className="flex flex-col justify-end">
            <div className="h-8 print:h-5" />
            <div className="border-t border-slate-400 pt-1.5 max-w-[240px] mx-auto w-full">
              <p className="font-bold text-slate-900 uppercase leading-tight text-xs print:text-[10.5px]">
                {persona?.nombres} {persona?.apellido_paterno}
              </p>
              <p className="text-[9.5px] text-slate-500 font-medium mt-0.5">
                {persona?.tipo_documento || 'DNI'}: {persona?.numero_documento || '-'}
              </p>
              <p className="text-[9.5px] text-slate-400 mt-0.5 uppercase tracking-wider font-semibold">
                Firma del Estudiante / Titular
              </p>
            </div>
          </div>

          {/* Sello y Validación Tesorería */}
          <div>
            <div className="border-2 border-emerald-600 bg-emerald-50/60 rounded-xl p-2.5 print:p-1.5 max-w-[260px] mx-auto shadow-2xs">
              <div className="flex items-center justify-center gap-1 text-emerald-800 font-black text-[10.5px] print:text-[9.5px] uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pago Registrado en Tesorería</span>
              </div>
              <p className="text-[9.5px] font-bold text-slate-800 mt-0.5 uppercase">
                Centro de Capacitaciones Brusben
              </p>
              <p className="text-[8.5px] text-slate-600 font-mono">
                AUT: {codigoRecibo} · {fechaPagoFormateada}
              </p>
              <div className="mt-1.5 pt-1 border-t border-emerald-200 text-[8.5px] text-emerald-900 font-semibold uppercase">
                Área de Caja y Cobranzas
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* PIE DE DOCUMENTO Y VERIFICACIÓN */}
        {/* ============================================================== */}
        <footer className="mt-4 pt-2 print:mt-1.5 print:pt-1 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-1 text-[9.5px] print:text-[8.5px] text-slate-400 break-inside-avoid">
          <div>
            <span className="font-bold text-slate-600">CENTRO DE CAPACITACIONES BRUSBEN</span> · Sistema Integrado de Control Académico y Financiero
          </div>
          <div className="font-mono text-slate-500">
            REF: {codigoRecibo} · HASH: {pago.id.substring(0, 16).toUpperCase()}
          </div>
        </footer>
      </div>
    </div>
  );
}

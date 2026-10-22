import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/permissions';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import PrintButton from '@/app/(erp)/matriculas/[id]/ficha/PrintButton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const metadata = {
  title: 'Detalle de Reporte Institucional - ERP Brusben'
};

const TIPOS_VALIDOS = new Set(['financiero', 'academico', 'asistencia', 'crm', 'demografia']);

export default async function ReporteDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ tipo: string }>;
  searchParams: Promise<{ print?: string }>;
}) {
  await requirePermission(['REPORTES.VER', 'SISTEMA.ADMINISTRAR']);
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const tipoRaw = decodeURIComponent(resolvedParams.tipo || '').trim().toLowerCase();

  if (!TIPOS_VALIDOS.has(tipoRaw)) {
    notFound();
  }

  // Alias 'asistencia' -> 'academico' para evitar cualquier 404 histórico
  const tipo = tipoRaw === 'asistencia' ? 'academico' : tipoRaw;
  const autoPrint = resolvedSearch?.print === '1';
  const supabase = await createClient();

  const titulos: Record<string, { titulo: string; subtitulo: string; codigo: string }> = {
    financiero: {
      titulo: 'Reporte Financiero y de Cobranza',
      subtitulo: 'Estado de ingresos recaudados, pagos aplicados y cartera de cuotas pendientes',
      codigo: 'REP-FIN-01',
    },
    academico: {
      titulo: 'Reporte Académico de Matrículas y Ediciones',
      subtitulo: 'Consolidado de matrículas por estado, ocupación de ediciones y cobertura académica',
      codigo: 'REP-ACA-02',
    },
    crm: {
      titulo: 'Reporte Comercial y Embudo CRM',
      subtitulo: 'Efectividad comercial, captación por canal y conversión de prospectos a matrícula',
      codigo: 'REP-CRM-03',
    },
    demografia: {
      titulo: 'Padrón Institucional y Demografía de Estudiantes',
      subtitulo: 'Registro consolidado de personas, códigos estudiantiles y distribución geográfica',
      codigo: 'REP-DEM-04',
    },
  };

  const infoReporte = titulos[tipo];

  // Variables para renderizado según tipo
  let kpis: { label: string; value: string; accent?: string }[] = [];
  let headers: string[] = [];
  let rows: string[][] = [];
  let secondaryTitle = '';
  let secondaryHeaders: string[] = [];
  let secondaryRows: string[][] = [];

  if (tipo === 'financiero') {
    const [{ data: pagos }, { data: cuotas }] = await Promise.all([
      supabase
        .from('pagos')
        .select('id, fecha_pago, importe, medio_pago, numero_operacion, comprobante_tipo, comprobante_numero, status, estudiantes(codigo_estudiante, personas(nombres, apellido_paterno, apellido_materno, numero_documento))')
        .order('fecha_pago', { ascending: false })
        .limit(100),
      supabase
        .from('cuotas')
        .select('id, concepto, fecha_vencimiento, importe_original, descuento, importe_neto, saldo, status, matriculas(codigo_matricula)')
        .order('fecha_vencimiento', { ascending: true })
        .limit(100),
    ]);

    const pagosList = pagos || [];
    const cuotasList = cuotas || [];

    const totalRecaudado = pagosList
      .filter(p => p.status === 'REGISTRADO' || p.status === 'ACTIVO')
      .reduce((acc, p) => acc + Number(p.importe || 0), 0);
    const pagosAnulados = pagosList.filter(p => p.status === 'ANULADO').length;
    const totalEmitidoNeto = cuotasList
      .filter(c => c.status !== 'ANULADA')
      .reduce((acc, c) => acc + Number(c.importe_neto || 0), 0);
    const totalSaldoPendiente = cuotasList
      .filter(c => c.status === 'PENDIENTE' || c.status === 'PARCIAL' || c.status === 'VENCIDA')
      .reduce((acc, c) => acc + Number(c.saldo ?? c.importe_neto ?? 0), 0);

    kpis = [
      { label: 'Total Recaudado (Pagos)', value: `S/ ${totalRecaudado.toFixed(2)}`, accent: 'text-emerald-700' },
      { label: 'Cartera Emitida (Neto)', value: `S/ ${totalEmitidoNeto.toFixed(2)}` },
      { label: 'Saldo Pendiente por Cobrar', value: `S/ ${totalSaldoPendiente.toFixed(2)}`, accent: 'text-red-700' },
      { label: 'Pagos Registrados / Anulados', value: `${pagosList.length - pagosAnulados} / ${pagosAnulados}` },
    ];

    headers = ['Fecha Pago', 'Estudiante / Documento', 'Medio / Operación', 'Comprobante', 'Importe (S/)', 'Estado'];
    rows = pagosList.map(p => {
      const est = Array.isArray(p.estudiantes) ? p.estudiantes[0] : p.estudiantes;
      const per = Array.isArray(est?.personas) ? est?.personas[0] : est?.personas;
      const nombre = per ? `${per.nombres || ''} ${per.apellido_paterno || ''}`.trim() : (est?.codigo_estudiante || '-');
      const doc = per?.numero_documento ? ` (${per.numero_documento})` : '';
      return [
        p.fecha_pago ? format(new Date(p.fecha_pago + 'T00:00:00'), 'dd/MM/yyyy') : '-',
        `${nombre}${doc}`,
        `${p.medio_pago || '-'}${p.numero_operacion ? ` • Op: ${p.numero_operacion}` : ''}`,
        `${p.comprobante_tipo || ''} ${p.comprobante_numero || '-'}`.trim(),
        `S/ ${Number(p.importe || 0).toFixed(2)}`,
        p.status || 'REGISTRADO',
      ];
    });

    secondaryTitle = 'Detalle de Cuotas Emitidas y Saldos';
    secondaryHeaders = ['Matrícula', 'Concepto', 'Vencimiento', 'Neto (S/)', 'Saldo (S/)', 'Estado'];
    secondaryRows = cuotasList.map(c => {
      const mat = Array.isArray(c.matriculas) ? c.matriculas[0] : c.matriculas;
      return [
        mat?.codigo_matricula || '-',
        c.concepto || '-',
        c.fecha_vencimiento ? format(new Date(c.fecha_vencimiento + 'T00:00:00'), 'dd/MM/yyyy') : '-',
        `S/ ${Number(c.importe_neto || 0).toFixed(2)}`,
        `S/ ${Number(c.saldo ?? c.importe_neto ?? 0).toFixed(2)}`,
        c.status || '-',
      ];
    });
  } else if (tipo === 'academico') {
    const [{ data: matriculas }, { data: ediciones }] = await Promise.all([
      supabase
        .from('matriculas')
        .select('id, codigo_matricula, fecha_matricula, status, importe_matricula, importe_pension, numero_pensiones, descuento_total, estudiantes(codigo_estudiante, personas(nombres, apellido_paterno, apellido_materno, numero_documento)), ediciones(codigo, modalidad, turno, programas(nombre, codigo))')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('ediciones')
        .select('id, codigo, modalidad, turno, fecha_inicio, fecha_fin, vacantes, status, programas(nombre, codigo), periodos(nombre)')
        .order('created_at', { ascending: false }),
    ]);

    const matList = matriculas || [];
    const edList = ediciones || [];

    const activas = matList.filter(m => m.status === 'ACTIVA').length;
    const prematriculas = matList.filter(m => m.status === 'PREMATRICULA' || m.status === 'RESERVADA').length;
    const edicionesActivas = edList.filter(e => e.status === 'ACTIVO').length;
    const vacantesTotales = edList.reduce((acc, e) => acc + Number(e.vacantes || 0), 0);

    kpis = [
      { label: 'Total Matrículas', value: `${matList.length}` },
      { label: 'Matrículas Activas', value: `${activas}`, accent: 'text-emerald-700' },
      { label: 'Prematrículas / Reservadas', value: `${prematriculas}` },
      { label: 'Ediciones Activas / Vacantes', value: `${edicionesActivas} (${vacantesTotales} vac.)`, accent: 'text-blue-900' },
    ];

    headers = ['Código Matrícula', 'Estudiante', 'Código Est.', 'Programa / Edición', 'Modalidad / Turno', 'Fecha', 'Estado'];
    rows = matList.map(m => {
      const est = Array.isArray(m.estudiantes) ? m.estudiantes[0] : m.estudiantes;
      const per = Array.isArray(est?.personas) ? est?.personas[0] : est?.personas;
      const ed = Array.isArray(m.ediciones) ? m.ediciones[0] : m.ediciones;
      const prog = Array.isArray(ed?.programas) ? ed?.programas[0] : ed?.programas;

      return [
        m.codigo_matricula,
        per ? `${per.nombres || ''} ${per.apellido_paterno || ''} ${per.apellido_materno || ''}`.trim() : '-',
        est?.codigo_estudiante || 'Pendiente',
        `${prog?.nombre || '-'} (${ed?.codigo || '-'})`,
        `${ed?.modalidad || '-'} / ${ed?.turno || '-'}`,
        m.fecha_matricula ? format(new Date(m.fecha_matricula + 'T00:00:00'), 'dd/MM/yyyy') : '-',
        m.status || '-',
      ];
    });

    secondaryTitle = 'Ocupación por Edición Académica';
    secondaryHeaders = ['Código Edición', 'Programa', 'Periodo', 'Modalidad / Turno', 'Vacantes', 'Estado'];
    secondaryRows = edList.map(e => {
      const prog = Array.isArray(e.programas) ? e.programas[0] : e.programas;
      const per = Array.isArray(e.periodos) ? e.periodos[0] : e.periodos;
      return [
        e.codigo,
        prog?.nombre || '-',
        per?.nombre || '-',
        `${e.modalidad || '-'} / ${e.turno || '-'}`,
        `${e.vacantes ?? '-'}`,
        e.status || '-',
      ];
    });
  } else if (tipo === 'crm') {
    const { data: prospectos } = await supabase
      .from('prospectos')
      .select('id, codigo, nombres, apellidos, telefono, email, canal_captacion, nivel_interes, status, matricula_id, created_at, programas(nombre, codigo)')
      .order('created_at', { ascending: false })
      .limit(100);

    const list = prospectos || [];
    const convertidos = list.filter(p => p.status === 'MATRICULADO' || p.status === 'CONVERTIDO' || Boolean(p.matricula_id)).length;
    const perdidos = list.filter(p => p.status === 'PERDIDO').length;
    const enGestion = list.length - convertidos - perdidos;
    const tasa = list.length > 0 ? ((convertidos / list.length) * 100).toFixed(1) : '0.0';

    kpis = [
      { label: 'Total Prospectos', value: `${list.length}` },
      { label: 'Convertidos a Matrícula', value: `${convertidos} (${tasa}%)`, accent: 'text-emerald-700' },
      { label: 'En Gestión Activa', value: `${enGestion}`, accent: 'text-blue-900' },
      { label: 'Marcados como Perdidos', value: `${perdidos}`, accent: 'text-red-700' },
    ];

    headers = ['Código', 'Prospecto', 'Contacto', 'Programa de Interés', 'Canal', 'Interés', 'Estado'];
    rows = list.map(p => {
      const prog = Array.isArray(p.programas) ? p.programas[0] : p.programas;
      return [
        p.codigo,
        `${p.nombres || ''} ${p.apellidos || ''}`.trim() || '-',
        `${p.telefono || '-'}${p.email ? ` • ${p.email}` : ''}`,
        prog?.nombre || 'General',
        p.canal_captacion || '-',
        p.nivel_interes || '-',
        p.status || 'NUEVO',
      ];
    });
  } else if (tipo === 'demografia') {
    const [{ data: personas }, { data: estudiantes }] = await Promise.all([
      supabase
        .from('personas')
        .select('id, tipo_documento, numero_documento, nombres, apellido_paterno, apellido_materno, email, telefono, departamento, provincia, distrito, status, created_at')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('estudiantes')
        .select('id, persona_id, codigo_estudiante, fecha_ingreso, status'),
    ]);

    const perList = personas || [];
    const estList = estudiantes || [];
    const estPorPersona = new Map(estList.map(e => [e.persona_id, e]));

    const conCodigo = estList.filter(e => Boolean(e.codigo_estudiante)).length;
    const activos = perList.filter(p => p.status === 'ACTIVO').length;

    kpis = [
      { label: 'Total Personas en Padrón', value: `${perList.length}` },
      { label: 'Personas Activas', value: `${activos}`, accent: 'text-emerald-700' },
      { label: 'Rol Estudiante Asignado', value: `${estList.length}`, accent: 'text-blue-900' },
      { label: 'Con Código Institucional (BRU)', value: `${conCodigo}` },
    ];

    headers = ['Documento', 'Apellidos y Nombres', 'Código Estudiante', 'Contacto', 'Ubicación (Dep/Prov/Dist)', 'Estado'];
    rows = perList.map(p => {
      const est = estPorPersona.get(p.id);
      const ubicacion = [p.departamento, p.provincia, p.distrito].filter(Boolean).join(' / ') || 'Tumbes';
      return [
        `${p.tipo_documento || 'DNI'} ${p.numero_documento || '-'}`.trim(),
        `${p.apellido_paterno || ''} ${p.apellido_materno || ''}, ${p.nombres || ''}`.trim(),
        est?.codigo_estudiante || (est ? 'Estudiante (Sin matrícula)' : 'No estudiante'),
        `${p.telefono || '-'}${p.email ? ` • ${p.email}` : ''}`,
        ubicacion,
        p.status || 'ACTIVO',
      ];
    });
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          .md\\:w-64, header, nav, .print\\:hidden { display: none !important; }
          .flex.h-screen, main { height: auto !important; overflow: visible !important; display: block !important; }
          main { padding: 0 !important; }
          body { background: white !important; }
        }
      `}} />

      <div className="max-w-5xl mx-auto p-6 bg-white min-h-screen text-slate-900 print:p-0 print:max-w-none">
        {/* Barra superior (no imprimible) */}
        <div className="flex justify-between items-center mb-6 print:hidden border-b pb-4">
          <Link
            href="/reportes"
            className="text-slate-600 hover:text-slate-900 font-medium text-sm flex items-center gap-2"
          >
            ← Volver a Reportes
          </Link>
          <PrintButton label="Imprimir / Guardar PDF" autoPrint={autoPrint} />
        </div>

        {/* Documento de Reporte Institucional */}
        <div className="print:block border-2 border-slate-200 p-8 rounded-lg print:border-none print:p-0">
          {/* Encabezado Oficial Brusben */}
          <div className="flex justify-between items-start mb-8 border-b-2 border-red-700 pb-6">
            <div>
              <h1 className="text-3xl font-bold text-red-700 tracking-tight">Centro de Capacitaciones Brusben</h1>
              <p className="text-sm text-slate-500 mt-1">{infoReporte.subtitulo}</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-black text-blue-900 uppercase">{infoReporte.titulo}</h2>
              <div className="text-xs font-mono font-bold text-slate-600 mt-1">Código: {infoReporte.codigo}</div>
              <div className="inline-block mt-2 px-3 py-0.5 bg-slate-100 border border-slate-300 rounded font-semibold text-xs text-slate-800">
                Corte: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}
              </div>
            </div>
          </div>

          {/* Tarjetas KPI */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {kpis.map((kpi, idx) => (
              <div key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-center">
                <div className="text-xs text-slate-500 uppercase font-semibold">{kpi.label}</div>
                <div className={`text-xl font-black mt-1 ${kpi.accent || 'text-slate-900'}`}>{kpi.value}</div>
              </div>
            ))}
          </div>

          {/* Tabla Principal */}
          <div className="mb-10">
            <h3 className="text-base font-bold text-blue-900 border-b border-slate-200 pb-2 mb-4">
              Detalle de Registros ({rows.length})
            </h3>
            {rows.length === 0 ? (
              <p className="text-sm text-slate-500 italic py-4">No existen registros disponibles para este reporte.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-y border-slate-300 text-slate-700">
                      {headers.map((h, i) => (
                        <th key={i} className="py-2.5 px-3 text-left font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {rows.map((r, rIdx) => (
                      <tr key={rIdx}>
                        {r.map((cell, cIdx) => (
                          <td key={cIdx} className={`py-2 px-3 ${cIdx === 0 ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Tabla Secundaria (si aplica) */}
          {secondaryHeaders.length > 0 && (
            <div className="mb-10">
              <h3 className="text-base font-bold text-blue-900 border-b border-slate-200 pb-2 mb-4">
                {secondaryTitle} ({secondaryRows.length})
              </h3>
              {secondaryRows.length === 0 ? (
                <p className="text-sm text-slate-500 italic py-4">Sin registros secundarios.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-y border-slate-300 text-slate-700">
                        {secondaryHeaders.map((h, i) => (
                          <th key={i} className="py-2.5 px-3 text-left font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {secondaryRows.map((r, rIdx) => (
                        <tr key={rIdx}>
                          {r.map((cell, cIdx) => (
                            <td key={cIdx} className={`py-2 px-3 ${cIdx === 0 ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Pie de página */}
          <div className="mt-12 pt-4 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400">
            <span>Centro de Capacitaciones Brusben — Sistema ERP Institucional</span>
            <span>Generado el {format(new Date(), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })} hrs.</span>
          </div>
        </div>
      </div>
    </>
  );
}

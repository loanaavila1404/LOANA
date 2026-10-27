import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/permissions';
import {
  ReportesAnalyticsClient,
  ReportePeriodo,
  ReportePrograma,
  ReporteEdicion,
  ReporteMatricula,
  ReporteCuota,
  ReportePago,
  ReporteProspecto,
  ReporteCiclo,
} from '@/components/features/reportes/ReportesAnalyticsClient';

export const metadata = {
  title: 'Reportes Institucionales e Inteligencia Analítica - ERP Brusben',
  description:
    'Centro de inteligencia y reportes oficiales del Centro de Capacitaciones Brusben. KPIs ejecutivos, estados financieros, ocupación académica y conversión CRM.',
};

export default async function ReportesPage() {
  await requirePermission(['REPORTES.VER', 'SISTEMA.ADMINISTRAR']);
  const supabase = await createClient();

  const [
    { data: periodosData },
    { data: programasData },
    { data: edicionesData },
    { data: ciclosData },
    { data: matriculasData },
    { data: cuotasData },
    { data: pagosData },
    { data: prospectosData },
    { count: totalPersonas },
    { count: totalEstudiantesActivos },
  ] = await Promise.all([
    supabase
      .from('periodos')
      .select('id, codigo, nombre, status')
      .order('fecha_inicio', { ascending: false, nullsFirst: false }),
    supabase
      .from('programas')
      .select('id, codigo, nombre, tipo_programa, status')
      .order('nombre', { ascending: true }),
    supabase
      .from('ediciones')
      .select(`
        id,
        codigo,
        nombre,
        modalidad,
        turno,
        vacantes,
        status,
        programa_id,
        periodo_id,
        ciclo_id,
        programas (id, codigo, nombre, tipo_programa),
        periodos (id, codigo, nombre),
        ciclos (id, nombre, numero_orden)
      `)
      .order('created_at', { ascending: false }),
    supabase
      .from('ciclos')
      .select('id, nombre, plan_id, numero_orden')
      .order('numero_orden', { ascending: true }),
    supabase
      .from('matriculas')
      .select(`
        id,
        codigo_matricula,
        estudiante_id,
        edicion_id,
        fecha_matricula,
        status,
        importe_matricula,
        importe_pension,
        numero_pensiones,
        descuento_total,
        created_at,
        estudiantes (
          id,
          codigo_estudiante,
          personas (
            nombres,
            apellido_paterno,
            apellido_materno,
            numero_documento
          )
        ),
        ediciones (
          id,
          codigo,
          nombre,
          modalidad,
          turno,
          vacantes,
          status,
          periodo_id,
          programa_id,
          ciclo_id,
          programas (id, codigo, nombre, tipo_programa),
          periodos (id, codigo, nombre),
          ciclos (id, nombre, numero_orden)
        )
      `)
      .order('created_at', { ascending: false }),
    supabase
      .from('cuotas')
      .select(`
        id,
        matricula_id,
        concepto,
        tipo_cuota,
        numero_cuota,
        fecha_vencimiento,
        importe_original,
        descuento,
        importe_neto,
        saldo,
        status,
        matriculas (
          id,
          codigo_matricula,
          edicion_id,
          estudiantes (
            id,
            codigo_estudiante,
            personas (
              nombres,
              apellido_paterno,
              apellido_materno
            )
          ),
          ediciones (
            id,
            modalidad,
            turno,
            periodo_id,
            programa_id,
            ciclo_id,
            programas (id, nombre, codigo, tipo_programa)
          )
        )
      `)
      .order('fecha_vencimiento', { ascending: true }),
    supabase
      .from('pagos')
      .select(`
        id,
        estudiante_id,
        fecha_pago,
        importe,
        medio_pago,
        numero_operacion,
        comprobante_tipo,
        comprobante_numero,
        status,
        observaciones,
        created_at,
        pago_aplicaciones (
          id,
          cuota_id,
          importe_aplicado,
          cuotas (
            id,
            matricula_id,
            matriculas (
              id,
              edicion_id,
              ediciones (
                id,
                modalidad,
                turno,
                periodo_id,
                programa_id,
                ciclo_id,
                programas (id, nombre, codigo, tipo_programa)
              )
            )
          )
        )
      `)
      .order('fecha_pago', { ascending: false }),
    supabase
      .from('prospectos')
      .select(`
        id,
        codigo,
        nombres,
        apellidos,
        telefono,
        email,
        canal_captacion,
        nivel_interes,
        status,
        matricula_id,
        programa_id,
        created_at,
        programas (id, codigo, nombre, tipo_programa)
      `)
      .order('created_at', { ascending: false }),
    supabase.from('personas').select('*', { count: 'exact', head: true }),
    supabase.from('estudiantes').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVO'),
  ]);

  // Deduplicación preventiva de ciclos académicos por nombre
  const ciclosVistos = new Set<string>();
  const ciclosUnicos: ReporteCiclo[] = [];
  ((ciclosData || []) as ReporteCiclo[]).forEach(c => {
    const nombreNormalizado = (c.nombre || (c.numero_orden ? `Ciclo ${c.numero_orden}` : 'Ciclo Regular')).trim().toLowerCase();
    if (!ciclosVistos.has(nombreNormalizado)) {
      ciclosVistos.add(nombreNormalizado);
      ciclosUnicos.push({
        id: c.id,
        nombre: (c.nombre || (c.numero_orden ? `Ciclo ${c.numero_orden}` : 'Ciclo Regular')).trim(),
        numero_orden: c.numero_orden,
        plan_id: c.plan_id,
      });
    }
  });

  return (
    <ReportesAnalyticsClient
      periodos={(periodosData || []) as ReportePeriodo[]}
      programas={(programasData || []) as ReportePrograma[]}
      ediciones={(edicionesData || []) as unknown as ReporteEdicion[]}
      ciclos={ciclosUnicos}
      matriculas={(matriculasData || []) as unknown as ReporteMatricula[]}
      cuotas={(cuotasData || []) as unknown as ReporteCuota[]}
      pagos={(pagosData || []) as unknown as ReportePago[]}
      prospectos={(prospectosData || []) as unknown as ReporteProspecto[]}
      totalPersonas={totalPersonas || 0}
      totalEstudiantesActivos={totalEstudiantesActivos || 0}
    />
  );
}

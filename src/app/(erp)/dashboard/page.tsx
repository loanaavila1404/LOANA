import { createClient } from '@/lib/supabase/server'
import {
  Users,
  BookOpen,
  GraduationCap,
  Clock,
  Download,
  Plus,
  ChevronRight,
  FileText,
  CheckCircle,
  AlertTriangle,
  MapPin,
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  DashboardRecentTabs,
  DashboardMatriculaRow,
  DashboardEstudianteRow,
  DashboardCuotaPendienteRow,
} from '@/components/features/dashboard/DashboardRecentTabs'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    prospectosRes,
    estudiantesRes,
    personasCountRes,
    matriculasRes,
    cuotasRes,
    pagosRes,
    tareasRes,
  ] = await Promise.all([
    supabase
      .from('prospectos')
      .select('id, codigo, nombres, apellidos, status, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('estudiantes')
      .select(
        'id, persona_id, codigo_estudiante, status, created_at, personas(id, nombres, apellido_paterno, apellido_materno, tipo_documento, numero_documento, email, telefono)'
      )
      .order('created_at', { ascending: false }),
    supabase.from('personas').select('*', { count: 'exact', head: true }),
    supabase
      .from('matriculas')
      .select(
        'id, codigo_matricula, fecha_matricula, created_at, status, estudiantes(codigo_estudiante, personas(nombres, apellido_paterno, apellido_materno, tipo_documento, numero_documento)), ediciones(codigo, modalidad, turno, programas(nombre, codigo))'
      )
      .order('created_at', { ascending: false }),
    supabase
      .from('cuotas')
      .select(
        'id, matricula_id, tipo_cuota, numero_cuota, concepto, fecha_vencimiento, importe_original, descuento, importe_neto, saldo, status, matriculas(id, codigo_matricula, estudiantes(personas(nombres, apellido_paterno, apellido_materno)))'
      )
      .in('status', ['PENDIENTE', 'VENCIDA', 'PARCIAL'])
      .order('fecha_vencimiento', { ascending: true }),
    supabase
      .from('pagos')
      .select('id, fecha_pago, importe, status')
      .in('status', ['REGISTRADO', 'ACTIVO']),
    supabase
      .from('tareas_comerciales')
      .select('id, status')
      .eq('status', 'PENDIENTE'),
  ])

  const prospectosList = prospectosRes.data || []
  const estudiantesList = estudiantesRes.data || []
  const totalPersonasCount = personasCountRes.count ?? estudiantesList.length
  const matriculasList = matriculasRes.data || []
  const cuotasPendientesList = cuotasRes.data || []
  const pagosList = pagosRes.data || []
  const tareasPendientesCount = (tareasRes.data || []).length

  // Métricas reales de Prospectos
  const prospectosEnGestion = prospectosList.filter(p =>
    ['NUEVO', 'CONTACTADO', 'INTERESADO', 'EN_SEGUIMIENTO'].includes(p.status || '')
  ).length
  const prospectosNuevos = prospectosList.filter(p => p.status === 'NUEVO').length

  // Métricas reales de Estudiantes
  const estudiantesActivosCount = estudiantesList.filter(e => e.status === 'ACTIVO').length

  // Métricas reales de Matrículas
  const matriculasActivasCount = matriculasList.filter(m => m.status === 'ACTIVA').length
  const prematriculasCount = matriculasList.filter(
    m => m.status === 'PREMATRICULA' || m.status === 'RESERVADA'
  ).length

  const currentYearMonth = new Date().toISOString().slice(0, 7)
  const matriculasMesActual = matriculasList.filter(m => {
    const fechaRef = m.fecha_matricula || m.created_at || ''
    return fechaRef.startsWith(currentYearMonth)
  }).length

  // Métricas reales de Cobranza y Pagos
  const todayIso = new Date().toISOString().slice(0, 10)
  const recaudacionAcumulada = pagosList.reduce((acc, p) => acc + Number(p.importe || 0), 0)
  const recaudacionHoy = pagosList
    .filter(p => (p.fecha_pago || '').startsWith(todayIso))
    .reduce((acc, p) => acc + Number(p.importe || 0), 0)

  const totalCarteraPorCobrar = cuotasPendientesList.reduce(
    (acc, c) => acc + Number(c.saldo ?? c.importe_neto ?? 0),
    0
  )

  // Filas formateadas para DashboardRecentTabs
  const matriculasRows: DashboardMatriculaRow[] = matriculasList.slice(0, 10).map(m => {
    const est = Array.isArray(m.estudiantes) ? m.estudiantes[0] : m.estudiantes
    const per = Array.isArray(est?.personas) ? est?.personas[0] : est?.personas
    const ed = Array.isArray(m.ediciones) ? m.ediciones[0] : m.ediciones
    const prog = Array.isArray(ed?.programas) ? ed?.programas[0] : ed?.programas

    const nombre = per
      ? `${per.nombres || ''} ${per.apellido_paterno || ''} ${per.apellido_materno || ''}`.trim()
      : 'Estudiante registrado'
    const doc = per
      ? `${per.tipo_documento || 'DNI'}: ${per.numero_documento || '-'}`
      : 'DNI no disponible'
    const fechaRaw = m.fecha_matricula || (m.created_at ? m.created_at.slice(0, 10) : '')
    const fechaFmt = fechaRaw
      ? format(new Date(fechaRaw + 'T00:00:00'), 'dd/MM/yyyy')
      : '-'

    return {
      id: m.id,
      codigoMatricula: m.codigo_matricula,
      estudianteNombre: nombre,
      documento: doc,
      codigoEstudiante: est?.codigo_estudiante || 'Sin código',
      programaNombre: prog?.nombre || 'Programa Académico',
      edicionCodigo: ed?.codigo || '-',
      fecha: fechaFmt,
      status: m.status || 'ACTIVA',
    }
  })

  const estudiantesRows: DashboardEstudianteRow[] = estudiantesList.slice(0, 10).map(e => {
    const per = Array.isArray(e.personas) ? e.personas[0] : e.personas
    const nombreCompleto = per
      ? `${per.nombres || ''} ${per.apellido_paterno || ''} ${per.apellido_materno || ''}`.trim()
      : 'Estudiante'
    const documento = per
      ? `${per.tipo_documento || 'DNI'}: ${per.numero_documento || '-'}`
      : '-'
    const contacto =
      [per?.email, per?.telefono].filter(Boolean).join(' • ') || 'Sin correo / teléfono'
    const fechaAlta = e.created_at
      ? format(new Date(e.created_at), 'dd/MM/yyyy')
      : '-'

    return {
      id: e.id,
      personaId: e.persona_id,
      nombreCompleto,
      documento,
      codigoEstudiante: e.codigo_estudiante || 'Sin código',
      contacto,
      fechaAlta,
      status: e.status || 'ACTIVO',
    }
  })

  const cuotasRows: DashboardCuotaPendienteRow[] = cuotasPendientesList.slice(0, 10).map(c => {
    const mat = Array.isArray(c.matriculas) ? c.matriculas[0] : c.matriculas
    const est = Array.isArray(mat?.estudiantes) ? mat?.estudiantes[0] : mat?.estudiantes
    const per = Array.isArray(est?.personas) ? est?.personas[0] : est?.personas
    const estudianteNombre = per
      ? `${per.nombres || ''} ${per.apellido_paterno || ''} ${per.apellido_materno || ''}`.trim()
      : 'Estudiante'

    return {
      id: c.id,
      matriculaId: c.matricula_id,
      codigoMatricula: mat?.codigo_matricula || '-',
      estudianteNombre,
      concepto: c.concepto || 'Cuota académica',
      fechaVencimiento: c.fecha_vencimiento
        ? format(new Date(c.fecha_vencimiento + 'T00:00:00'), 'dd/MM/yyyy')
        : '-',
      importeNeto: Number(c.importe_neto || 0),
      saldo: Number(c.saldo ?? c.importe_neto ?? 0),
      status: c.status || 'PENDIENTE',
    }
  })

  const fechaActualTexto = format(new Date(), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })

  return (
    <div className="flex-1 w-full space-y-4 sm:space-y-6 max-w-[1400px] mx-auto">
      {/* Encabezado Principal y Acciones Rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 sm:space-y-0">
          <div className="flex items-center justify-between sm:block">
            <div className="text-[11px] font-black sm:font-bold uppercase tracking-wider text-brusben-red sm:text-brand-700">
              Resumen Institucional • {fechaActualTexto}
            </div>
            <span className="sm:hidden text-[10px] bg-slate-200/80 text-slate-600 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-500" />
              Sede Central
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight mt-0 sm:mt-0.5">
            Panel principal
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            Monitoreo integral de admisión comercial, matrículas vigentes y estado de recaudación institucional.
          </p>
        </div>

        <div className="flex sm:flex-row items-center gap-2 sm:gap-2.5">
          <Link
            href="/reportes"
            className="inline-flex items-center px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            Reportes PDF
          </Link>

          <Link
            href="/personas"
            className="flex-1 sm:flex-none inline-flex items-center justify-center sm:justify-start px-4 py-2.5 sm:py-2 text-xs font-semibold text-white bg-brusben-red sm:bg-brand-700 hover:bg-brusben-redHover sm:hover:bg-brand-800 rounded-lg shadow-sm hover:shadow transition gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo estudiante</span>
          </Link>
        </div>
      </div>

      {/* 4 Tarjetas KPI Principales con Datos 100% Reales */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* KPI 1: Prospectos Activos */}
        <article className="bg-white rounded-xl p-3 sm:p-4 border-l-4 sm:border-l-0 border-l-brusben-red border border-slate-200 shadow-xs sm:shadow-sm sm:relative sm:overflow-hidden flex flex-col justify-between hover:border-slate-300 transition">
          <div className="hidden sm:block absolute left-0 top-0 bottom-0 w-1.5 bg-brand-700" />
          <div>
            <div className="flex items-start sm:items-center justify-between">
              <span className="text-[11px] sm:text-xs font-medium text-slate-500">Prospectos activos</span>
              <span className="p-1 sm:p-1.5 rounded-md bg-red-50 sm:bg-slate-50 text-brusben-red sm:text-slate-500 sm:border sm:border-slate-100">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
            </div>
            <div className="mt-2 sm:flex sm:items-baseline sm:gap-2">
              <div className="text-xl sm:text-3xl font-black sm:font-bold text-slate-900 tracking-tight">
                {prospectosEnGestion}
              </div>
              <p className="text-[10px] sm:text-[11px] font-semibold text-emerald-600 mt-1 sm:mt-0">
                de {prospectosList.length} total
              </p>
            </div>
          </div>
          <div className="hidden sm:block mt-3 text-[11px] text-slate-500">
            {prospectosNuevos} nuevo(s) • {prospectosEnGestion} en seguimiento comercial
          </div>
        </article>

        {/* KPI 2: Estudiantes Activos */}
        <article className="bg-white rounded-xl p-3 sm:p-4 border-l-4 sm:border-l-0 border-l-brusben-red border border-slate-200 shadow-xs sm:shadow-sm sm:relative sm:overflow-hidden flex flex-col justify-between hover:border-slate-300 transition">
          <div className="hidden sm:block absolute left-0 top-0 bottom-0 w-1.5 bg-brand-700" />
          <div>
            <div className="flex items-start sm:items-center justify-between">
              <span className="text-[11px] sm:text-xs font-medium text-slate-500">Estudiantes activos</span>
              <span className="p-1 sm:p-1.5 rounded-md bg-emerald-50 text-emerald-600 sm:border sm:border-emerald-100">
                <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
            </div>
            <div className="mt-2 sm:flex sm:items-baseline sm:gap-2">
              <div className="text-xl sm:text-3xl font-black sm:font-bold text-slate-900 tracking-tight">
                {estudiantesActivosCount}
              </div>
              <p className="text-[10px] sm:text-[11px] font-semibold text-emerald-600 mt-1 sm:mt-0">
                de {totalPersonasCount} personas
              </p>
            </div>
          </div>
          <div className="hidden sm:block mt-3 text-[11px] text-slate-500">
            Registrados en el padrón estudiantil de la institución
          </div>
        </article>

        {/* KPI 3: Matrículas Activas / Prematrículas */}
        <article className="bg-white rounded-xl p-3 sm:p-4 border-l-4 sm:border-l-0 border-l-brusben-red border border-slate-200 shadow-xs sm:shadow-sm sm:relative sm:overflow-hidden flex flex-col justify-between hover:border-slate-300 transition">
          <div className="hidden sm:block absolute left-0 top-0 bottom-0 w-1.5 bg-brand-700" />
          <div>
            <div className="flex items-start sm:items-center justify-between">
              <span className="text-[11px] sm:text-xs font-medium text-slate-500">
                Matrículas activas
              </span>
              <span className="p-1 sm:p-1.5 rounded-md bg-amber-50 text-amber-600 sm:border sm:border-amber-100">
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
            </div>
            <div className="mt-2 sm:flex sm:items-baseline sm:gap-2">
              <div className="text-xl sm:text-3xl font-black sm:font-bold text-slate-900 tracking-tight">
                {matriculasActivasCount}
              </div>
              <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 mt-1 sm:mt-0">
                {prematriculasCount} en prematrícula/reserva
              </p>
            </div>
          </div>
          <div className="hidden sm:block mt-3 text-[11px] text-slate-500">
            {matriculasList.length} matrícula(s) registrada(s) en total
          </div>
        </article>

        {/* KPI 4: Tareas y Cuotas Pendientes */}
        <article className="bg-white rounded-xl p-3 sm:p-4 border-l-4 sm:border-l-0 border-l-brusben-red border border-slate-200 shadow-xs sm:shadow-sm sm:relative sm:overflow-hidden flex flex-col justify-between hover:border-slate-300 transition">
          <div className="hidden sm:block absolute left-0 top-0 bottom-0 w-1.5 bg-brand-700" />
          <div>
            <div className="flex items-start sm:items-center justify-between">
              <span className="text-[11px] sm:text-xs font-medium text-slate-500">
                Tareas y cuotas pendientes
              </span>
              <span className="p-1 sm:p-1.5 rounded-md bg-blue-50 text-blue-600 sm:border sm:border-blue-100">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
            </div>
            <div className="mt-2 sm:flex sm:items-baseline sm:gap-2">
              <div className="text-xl sm:text-3xl font-black sm:font-bold text-slate-900 tracking-tight">
                {tareasPendientesCount + cuotasPendientesList.length}
              </div>
              <p className="text-[10px] sm:text-[11px] font-medium text-amber-700 mt-1 sm:mt-0 truncate">
                {cuotasPendientesList.length} cuota(s) • {tareasPendientesCount} tarea(s)
              </p>
            </div>
          </div>
          <div className="hidden sm:block mt-3 text-[11px] text-slate-500">
            {cuotasPendientesList.length} obligación(es) de cobro y {tareasPendientesCount} seguimiento(s) CRM
          </div>
        </article>
      </section>

      {/* Franja Intermedia de Indicadores Operativos Reales */}
      <section className="bg-white rounded-xl sm:rounded-lg sm:px-4 p-3 sm:py-3 border border-slate-200 shadow-2xs sm:shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4 sm:divide-x divide-slate-100">
        <div className="sm:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
          Indicadores operativos en tiempo real
        </div>

        <div className="flex sm:contents items-center gap-3 overflow-x-auto no-scrollbar py-0.5 sm:py-0">
          <div className="shrink-0 bg-slate-50 sm:bg-transparent border border-slate-100 sm:border-none rounded-lg px-2.5 py-1.5 sm:p-0 text-center sm:text-left min-w-[130px] sm:min-w-0 sm:flex sm:items-center sm:justify-between sm:pr-4">
            <span className="text-[10px] sm:text-xs text-slate-500 block sm:inline">
              Matrículas (total / mes)
            </span>
            <span className="text-sm sm:text-xs font-extrabold sm:font-bold text-slate-800 block sm:inline mt-0.5 sm:mt-0">
              {matriculasList.length} total / {matriculasMesActual} mes
            </span>
          </div>

          <div className="shrink-0 bg-slate-50 sm:bg-transparent border border-slate-100 sm:border-none rounded-lg px-2.5 py-1.5 sm:p-0 text-center sm:text-left min-w-[130px] sm:min-w-0 sm:flex sm:items-center sm:justify-between sm:px-4">
            <span className="text-[10px] sm:text-xs text-slate-500 block sm:inline">
              Prospectos en gestión
            </span>
            <span className="text-sm sm:text-xs font-extrabold sm:font-bold text-brand-700 block sm:inline mt-0.5 sm:mt-0">
              {prospectosEnGestion} activo(s)
            </span>
          </div>

          <div className="shrink-0 bg-slate-50 sm:bg-transparent border border-slate-100 sm:border-none rounded-lg px-2.5 py-1.5 sm:p-0 text-center sm:text-left min-w-[140px] sm:min-w-0 sm:flex sm:items-center sm:justify-between sm:px-4">
            <span className="text-[10px] sm:text-xs text-slate-500 block sm:inline">
              Recaudación (acum. / hoy)
            </span>
            <span className="text-sm sm:text-xs font-extrabold sm:font-bold text-emerald-700 block sm:inline mt-0.5 sm:mt-0">
              S/ {recaudacionAcumulada.toFixed(2)} (Hoy: S/ {recaudacionHoy.toFixed(2)})
            </span>
          </div>

          <div className="shrink-0 bg-slate-50 sm:bg-transparent border border-slate-100 sm:border-none rounded-lg px-2.5 py-1.5 sm:p-0 text-center sm:text-left min-w-[140px] sm:min-w-0 sm:flex sm:items-center sm:justify-between sm:pl-4">
            <span className="text-[10px] sm:text-xs text-slate-500 block sm:inline">
              Cartera por cobrar
            </span>
            <span className="text-sm sm:text-xs font-extrabold sm:font-semibold text-amber-700 block sm:inline mt-0.5 sm:mt-0">
              {cuotasPendientesList.length} cuota(s) (S/ {totalCarteraPorCobrar.toFixed(2)})
            </span>
          </div>
        </div>
      </section>

      {/* Grid Principal: Tabla Interactiva de Registros Reales + Columna Derecha */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        <DashboardRecentTabs
          matriculas={matriculasRows}
          estudiantes={estudiantesRows}
          cuotasPendientes={cuotasRows}
          totalMatriculasCount={matriculasList.length}
          totalEstudiantesCount={estudiantesList.length}
          totalCuotasPendientesCount={cuotasPendientesList.length}
        />

        {/* Columna Derecha: Módulos Institucionales + Obligaciones de Cobranza Reales */}
        <div className="lg:col-span-4 space-y-4 sm:space-y-6">
          {/* Módulos Institucionales */}
          <div className="bg-transparent sm:bg-white sm:rounded-xl sm:border sm:border-slate-200 sm:shadow-sm sm:p-5">
            <div className="sm:border-b sm:border-slate-100 sm:pb-3 sm:mb-4 mb-2 flex sm:block items-center justify-between">
              <h2 className="text-xs sm:text-base font-bold uppercase sm:capitalize tracking-wider sm:tracking-normal text-slate-600 sm:text-slate-900">
                Módulos institucionales
              </h2>
              <span className="sm:hidden text-[10px] text-slate-400">Accesos directos</span>
              <p className="hidden sm:block text-xs text-slate-500 mt-0.5">
                Accesos directos a la operación académica y comercial.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:space-y-3 sm:gap-0">
              <Link
                href="/crm/prospectos"
                className="bg-white sm:bg-transparent p-3 sm:p-3.5 rounded-xl sm:rounded-lg border border-slate-200 shadow-2xs sm:shadow-none flex items-center justify-between hover:border-brand-700/50 sm:hover:bg-slate-50/80 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-auto sm:h-auto sm:p-2 rounded-lg sm:rounded bg-red-50 text-brand-700 group-hover:bg-brand-700 group-hover:text-white flex items-center justify-center shrink-0 transition">
                    <Users className="w-5 h-5 sm:w-4 sm:h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 sm:text-slate-900 group-hover:text-brand-700 transition">
                      CRM Comercial
                    </h3>
                    <p className="text-[10.5px] sm:text-[11px] text-slate-500 leading-tight mt-0.5">
                      Prospectos, embudo, seguimientos y conversión
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-700 group-hover:translate-x-0.5 transition" />
              </Link>

              <Link
                href="/oferta/programas"
                className="bg-white sm:bg-transparent p-3 sm:p-3.5 rounded-xl sm:rounded-lg border border-slate-200 shadow-2xs sm:shadow-none flex items-center justify-between hover:border-brand-700/50 sm:hover:bg-slate-50/80 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-auto sm:h-auto sm:p-2 rounded-lg sm:rounded bg-slate-100 text-slate-700 group-hover:bg-slate-800 group-hover:text-white flex items-center justify-center shrink-0 transition">
                    <BookOpen className="w-5 h-5 sm:w-4 sm:h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 sm:text-slate-900 group-hover:text-brand-700 transition">
                      Oferta académica
                    </h3>
                    <p className="text-[10.5px] sm:text-[11px] text-slate-500 leading-tight mt-0.5">
                      Programas, planes, periodos y ediciones
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-700 group-hover:translate-x-0.5 transition" />
              </Link>

              <Link
                href="/matriculas"
                className="bg-white sm:bg-transparent p-3 sm:p-3.5 rounded-xl sm:rounded-lg border border-slate-200 shadow-2xs sm:shadow-none flex items-center justify-between hover:border-brand-700/50 sm:hover:bg-slate-50/80 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-auto sm:h-auto sm:p-2 rounded-lg sm:rounded bg-emerald-50 text-emerald-700 sm:bg-slate-100 sm:text-slate-700 group-hover:bg-slate-800 group-hover:text-white flex items-center justify-center shrink-0 transition">
                    <FileText className="w-5 h-5 sm:w-4 sm:h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 sm:text-slate-900 group-hover:text-brand-700 transition">
                      Matrículas &amp; Pagos
                    </h3>
                    <p className="text-[10.5px] sm:text-[11px] text-slate-500 leading-tight mt-0.5">
                      Contratos, cronograma de cuotas y cobranza
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-700 group-hover:translate-x-0.5 transition" />
              </Link>

              <Link
                href="/personas"
                className="bg-white sm:bg-transparent p-3 sm:p-3.5 rounded-xl sm:rounded-lg border border-slate-200 shadow-2xs sm:shadow-none flex items-center justify-between hover:border-brand-700/50 sm:hover:bg-slate-50/80 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-auto sm:h-auto sm:p-2 rounded-lg sm:rounded bg-blue-50 text-blue-700 sm:bg-slate-100 sm:text-slate-700 group-hover:bg-slate-800 group-hover:text-white flex items-center justify-center shrink-0 transition">
                    <GraduationCap className="w-5 h-5 sm:w-4 sm:h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 sm:text-slate-900 group-hover:text-brand-700 transition">
                      Personas y estudiantes
                    </h3>
                    <p className="text-[10.5px] sm:text-[11px] text-slate-500 leading-tight mt-0.5">
                      Padrón general y expedientes estudiantiles
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-700 group-hover:translate-x-0.5 transition" />
              </Link>
            </div>
          </div>

          {/* Widget Operativo Real: Obligaciones y Vencimientos Próximos (Cobranza) */}
          <div className="bg-amber-50/70 border border-amber-200/90 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-xs font-bold text-amber-950">
                  Obligaciones y Vencimientos Próximos (Cobranza)
                </h4>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-snug">
                  {cuotasPendientesList.length === 0
                    ? 'No existen cuotas pendientes ni vencidas en este momento.'
                    : `Existen ${cuotasPendientesList.length} cuota(s) pendiente(s) por un total de S/ ${totalCarteraPorCobrar.toFixed(2)}.`}
                </p>
              </div>
            </div>

            {cuotasRows.length > 0 && (
              <div className="space-y-2 pt-1">
                {cuotasRows.slice(0, 4).map(c => (
                  <Link
                    key={c.id}
                    href={`/matriculas/${c.matriculaId}`}
                    className="block bg-white/90 hover:bg-white border border-amber-200 rounded-lg p-2.5 transition shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900">{c.concepto}</span>
                      <span className="text-xs font-extrabold text-amber-800">
                        S/ {c.saldo.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10.5px] text-slate-600 mt-1">
                      <span className="font-mono font-semibold">{c.codigoMatricula}</span>
                      <span>Vence: {c.fechaVencimiento}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <div className="pt-1 flex items-center justify-between text-[11px]">
              <Link
                href="/reportes/financiero"
                className="font-bold text-brand-700 hover:underline inline-flex items-center gap-1"
              >
                Ver reporte financiero →
              </Link>
              <Link
                href="/matriculas"
                className="font-semibold text-amber-900 hover:underline"
              >
                Gestionar matrículas
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

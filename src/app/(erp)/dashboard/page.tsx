import { createClient } from '@/lib/supabase/server'
import {
  Users,
  BookOpen,
  GraduationCap,
  Clock,
  Download,
  Plus,
  ChevronRight,
  TrendingUp,
  FileText,
  CheckCircle,
  AlertTriangle,
  MapPin
} from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Real count fetches
  const { count: estudiantesActivos } = await supabase
    .from('estudiantes')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'ACTIVO') // Default active state

  const { count: prematriculas } = await supabase
    .from('matriculas')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'PRE_MATRICULADO')

  const { count: prospectosActivos } = await supabase
    .from('prospectos')
    .select('*', { count: 'exact', head: true })
    .in('status', ['NUEVO', 'CONTACTADO', 'INTERESADO'])

  const { count: tareasPendientes } = await supabase
    .from('tareas_comerciales')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'PENDIENTE')

  return (
    <div className="flex-1 w-full space-y-4 sm:space-y-6 max-w-[1400px] mx-auto">
      {/* Section Header & Quick Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 sm:space-y-0">
          <div className="flex items-center justify-between sm:block">
            <div className="text-[11px] font-black sm:font-bold uppercase tracking-wider text-brusben-red sm:text-brand-700">
              Resumen Institucional
            </div>
            <span className="sm:hidden text-[10px] bg-slate-200/80 text-slate-600 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-500" />
              Sede Central • Lima
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight mt-0 sm:mt-0.5">Panel principal</h1>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            Hola, <span className="font-semibold sm:font-medium text-slate-700">Loana Avila Neyra</span>.
            <span className="hidden sm:inline"> Este es el estado actual operativo del ERP Brusben.</span>
            <span className="sm:hidden"> Consulta los principales indicadores y gestiona las operaciones.</span>
          </p>
        </div>

        <div className="flex sm:flex-row items-center gap-2 sm:gap-2.5">
          {/* Secondary Action: Export (Desktop) */}
          <button type="button" className="hidden items-center px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 shadow-sm transition">
            <Download className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            Exportar datos
          </button>
          
          {/* Primary Action: New Student */}
          <Link href="/personas" className="flex-1 sm:flex-none inline-flex items-center justify-center sm:justify-start px-4 sm:px-4 py-2.5 sm:py-2 text-xs font-semibold text-white bg-brusben-red sm:bg-brand-700 hover:bg-brusben-redHover sm:hover:bg-brand-800 active:scale-[0.98] sm:active:scale-100 rounded-lg shadow-sm hover:shadow transition focus:ring-2 focus:ring-offset-2 focus:ring-brand-700 gap-1.5 sm:gap-0">
  <Plus className="w-4 h-4 sm:mr-1.5" />
  <span>Nuevo estudiante</span>
</Link>
          
          {/* Secondary Action: Export (Mobile) */}
          <button type="button" className="hidden active:scale-[0.98] text-slate-700 text-xs font-semibold py-2.5 px-3 rounded-lg shadow-2xs flex items-center justify-center gap-1.5 transition-all">
            <Download className="w-4 h-4 text-slate-500" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metric Cards Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* KPI 1: Prospectos Activos (Red style matching "Estudiantes registrados") */}
        <article className="bg-white rounded-xl p-3 sm:p-4 border-l-4 sm:border-l-0 border-l-brusben-red border border-slate-200/90 sm:border-slate-200 shadow-xs sm:shadow-sm sm:relative sm:overflow-hidden flex flex-col justify-between hover:border-slate-300 transition">
          <div className="hidden sm:block absolute left-0 top-0 bottom-0 w-1.5 bg-brand-700"></div>
          <div>
            <div className="flex items-start sm:items-center justify-between">
              <span className="text-[11px] sm:text-xs font-medium text-slate-500 leading-tight sm:leading-normal">Prospectos activos</span>
              <span className="p-1 sm:p-1.5 rounded-md bg-red-50 sm:bg-slate-50 text-brusben-red sm:text-slate-400 sm:border sm:border-slate-100">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
            </div>
            <div className="mt-2 sm:flex sm:items-baseline sm:gap-2">
              <div className="text-xl sm:text-3xl font-black sm:font-bold text-slate-900 tracking-tight leading-none sm:leading-normal">{prospectosActivos || '0'}</div>
              <p className="text-[10px] sm:text-[11px] font-semibold sm:font-medium text-emerald-600 mt-1 sm:mt-0 flex items-center sm:gap-0 gap-0.5">
                <TrendingUp className="w-3 h-3 sm:hidden mr-0.5" />
                <span className="hidden sm:inline">↑ </span>— <span className="text-slate-400 font-normal sm:hidden ml-0.5">padrón</span>
              </p>
            </div>
          </div>
          <div className="hidden sm:block mt-3 text-[11px] text-slate-400">Total acumulado en la plataforma</div>
        </article>

        {/* KPI 2: Estudiantes Activos (Emerald style matching "Estudiantes activos") */}
        <article className="bg-white rounded-xl p-3 sm:p-4 border-l-4 sm:border-l-0 border-l-brusben-red border border-slate-200/90 sm:border-slate-200 shadow-xs sm:shadow-sm sm:relative sm:overflow-hidden flex flex-col justify-between hover:border-slate-300 transition">
          <div className="hidden sm:block absolute left-0 top-0 bottom-0 w-1.5 bg-brand-700"></div>
          <div>
            <div className="flex items-start sm:items-center justify-between">
              <span className="text-[11px] sm:text-xs font-medium text-slate-500 leading-tight sm:leading-normal">Estudiantes activos</span>
              <span className="p-1 sm:p-1.5 rounded-md bg-emerald-50 text-emerald-600 sm:border sm:border-emerald-100">
                <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
            </div>
            <div className="mt-2 sm:flex sm:items-baseline sm:gap-2">
              <div className="text-xl sm:text-3xl font-black sm:font-bold text-slate-900 tracking-tight leading-none sm:leading-normal">{estudiantesActivos || '0'}</div>
              <p className="text-[10px] sm:text-[11px] font-semibold sm:font-medium text-emerald-600 mt-1 sm:mt-0">
                — <span className="text-slate-400 font-normal sm:hidden ml-0.5">ciclo 2026-I</span>
                <span className="hidden sm:inline ml-1 text-slate-500">del padrón</span>
              </p>
            </div>
          </div>
          <div className="hidden sm:block mt-3 text-[11px] text-slate-400">Con matrícula vigente en ciclo 2026-I</div>
        </article>

        {/* KPI 3: Prematrículas (Amber style matching "Estudiantes inactivos") */}
        <article className="bg-white rounded-xl p-3 sm:p-4 border-l-4 sm:border-l-0 border-l-brusben-red border border-slate-200/90 sm:border-slate-200 shadow-xs sm:shadow-sm sm:relative sm:overflow-hidden flex flex-col justify-between hover:border-slate-300 transition">
          <div className="hidden sm:block absolute left-0 top-0 bottom-0 w-1.5 bg-brand-700"></div>
          <div>
            <div className="flex items-start sm:items-center justify-between">
              <span className="text-[11px] sm:text-xs font-medium text-slate-500 leading-tight sm:leading-normal">Prematrículas</span>
              <span className="p-1 sm:p-1.5 rounded-md bg-amber-50 text-amber-600 sm:border sm:border-amber-100">
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
            </div>
            <div className="mt-2 sm:flex sm:items-baseline sm:gap-2">
              <div className="text-xl sm:text-3xl font-black sm:font-bold text-slate-900 tracking-tight leading-none sm:leading-normal">{prematriculas || '0'}</div>
              <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 mt-1 sm:mt-0">
                — <span className="text-slate-400 font-normal sm:hidden ml-0.5">egreso/reserva</span>
              </p>
            </div>
          </div>
          <div className="hidden sm:block mt-3 text-[11px] text-slate-400">Egresados o en reserva de matrícula</div>
        </article>

        {/* KPI 4: Tareas pendientes (Blue style matching "Programas registrados") */}
        <article className="bg-white rounded-xl p-3 sm:p-4 border-l-4 sm:border-l-0 border-l-brusben-red border border-slate-200/90 sm:border-slate-200 shadow-xs sm:shadow-sm sm:relative sm:overflow-hidden flex flex-col justify-between hover:border-slate-300 transition">
          <div className="hidden sm:block absolute left-0 top-0 bottom-0 w-1.5 bg-brand-700"></div>
          <div>
            <div className="flex items-start sm:items-center justify-between">
              <span className="text-[11px] sm:text-xs font-medium text-slate-500 leading-tight sm:leading-normal">Tareas pendientes</span>
              <span className="p-1 sm:p-1.5 rounded-md bg-blue-50 text-blue-600 sm:border sm:border-blue-100">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
            </div>
            <div className="mt-2 sm:flex sm:items-baseline sm:gap-2">
              <div className="text-xl sm:text-3xl font-black sm:font-bold text-slate-900 tracking-tight leading-none sm:leading-normal">{tareasPendientes || '0'}</div>
              <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 mt-1 sm:mt-0 truncate">
                <span className="sm:hidden">Sin datos</span>
                <span className="hidden sm:inline text-slate-600">Activos en sede</span>
              </p>
            </div>
          </div>
          <div className="hidden sm:block mt-3 text-[11px] text-slate-400">Sin datos</div>
        </article>
      </section>

      {/* Operational Metrics Horizontal Scroll Strip */}
      <section className="bg-white rounded-xl sm:rounded-lg sm:px-4 p-3 sm:py-2.5 border border-slate-200 shadow-2xs sm:shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-0 sm:gap-4 sm:divide-x divide-slate-100">
        <div className="sm:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Métricas operativas del día</div>
        
        {/* Mobile wraps this in a flex container for horizontal scroll. Desktop is just grid. */}
        <div className="flex sm:contents items-center gap-3 overflow-x-auto no-scrollbar py-0.5 sm:py-0">
          <div className="shrink-0 bg-slate-50 sm:bg-transparent border border-slate-100 sm:border-none rounded-lg px-2.5 py-1.5 sm:p-0 text-center sm:text-left min-w-[105px] sm:min-w-0 sm:flex sm:items-center sm:justify-between sm:pr-4">
            <span className="text-[10px] sm:text-xs text-slate-500 block sm:inline">Matrículas mes</span>
            <span className="text-sm sm:text-xs font-extrabold sm:font-bold text-slate-800 block sm:inline mt-0.5 sm:mt-0">0</span>
          </div>
          <div className="shrink-0 bg-slate-50 sm:bg-transparent border border-slate-100 sm:border-none rounded-lg px-2.5 py-1.5 sm:p-0 text-center sm:text-left min-w-[105px] sm:min-w-0 sm:flex sm:items-center sm:justify-between sm:px-4">
            <span className="text-[10px] sm:text-xs text-slate-500 block sm:inline">Prospectos nuevos</span>
            <span className="text-sm sm:text-xs font-extrabold sm:font-bold text-brand-700 block sm:inline mt-0.5 sm:mt-0">0 <span className="sm:hidden">leads</span></span>
          </div>
          <div className="shrink-0 bg-slate-50 sm:bg-transparent border border-slate-100 sm:border-none rounded-lg px-2.5 py-1.5 sm:p-0 text-center sm:text-left min-w-[115px] sm:min-w-0 sm:flex sm:items-center sm:justify-between sm:px-4">
            <span className="text-[10px] sm:text-xs text-slate-500 block sm:inline">Cobranza del día</span>
            <span className="text-sm sm:text-xs font-extrabold sm:font-bold text-emerald-700 block sm:inline mt-0.5 sm:mt-0">S/ 0<span className="hidden sm:inline">.00</span></span>
          </div>
          <div className="shrink-0 bg-slate-50 sm:bg-transparent border border-slate-100 sm:border-none rounded-lg px-2.5 py-1.5 sm:p-0 text-center sm:text-left min-w-[110px] sm:min-w-0 sm:flex sm:items-center sm:justify-between sm:pl-4">
            <span className="text-[10px] sm:text-xs text-slate-500 block sm:inline">Cuotas por vencer</span>
            <span className="text-sm sm:text-xs font-extrabold sm:font-semibold text-amber-700 block sm:inline mt-0.5 sm:mt-0">0 pendientes</span>
          </div>
        </div>
      </section>

      {/* Main Content Grid (Registros Recientes + Módulos) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* LEFT COLUMN: Registros Recientes (8 of 12 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-2xs sm:shadow-sm overflow-hidden flex flex-col">
          {/* Section Header */}
          <div className="p-3.5 sm:p-5 border-b border-slate-100 flex items-center justify-between sm:gap-3">
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h2 className="text-xs sm:text-base font-bold text-slate-800 sm:text-slate-900 tracking-tight sm:tracking-normal">Registros recientes</h2>
                <span className="bg-slate-100 text-slate-600 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded sm:rounded-full font-medium">Últimos<span className="hidden sm:inline"> incorporados</span></span>
              </div>
              <p className="text-[10.5px] sm:text-xs text-slate-400 sm:text-slate-500 mt-0.5">Estudiantes recién cargados al sistema<span className="hidden sm:inline"> escolar.</span></p>
            </div>
            <Link href="/personas" className="text-[11px] sm:text-xs font-bold sm:font-semibold text-brand-700 hover:text-brand-800 sm:hover:underline inline-flex items-center gap-1 transition">
  <span>Ver todos ({estudiantesActivos || '0'})</span>
              <ChevronRight className="w-3.5 h-3.5 hidden sm:inline" />
            </Link>
          </div>
          
          {/* Filter Tabs */}
          <div className="px-3 sm:px-5 pt-2.5 sm:py-2.5 pb-1 sm:pb-2.5 sm:bg-slate-50/70 border-b border-slate-100 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar text-xs">
            <button type="button" className="shrink-0 sm:shrink px-2.5 py-1 font-bold sm:font-medium bg-red-50 sm:bg-white text-brand-700 border border-red-200/60 sm:border-slate-200 rounded-md sm:rounded shadow-sm text-[11px] sm:text-xs">
              Todos (0)
            </button>
            <button type="button" className="shrink-0 sm:shrink px-2.5 py-1 font-medium bg-slate-50 sm:bg-transparent text-slate-600 hover:bg-slate-100 sm:hover:bg-white/80 rounded-md sm:rounded text-[11px] sm:text-xs">
              Matriculados
            </button>
            <button type="button" className="shrink-0 sm:shrink px-2.5 py-1 font-medium bg-slate-50 sm:bg-transparent text-slate-600 hover:bg-slate-100 sm:hover:bg-white/80 rounded-md sm:rounded text-[11px] sm:text-xs">
              En proceso
            </button>
            <button type="button" className="shrink-0 sm:shrink px-2.5 py-1 font-medium bg-slate-50 sm:bg-transparent text-slate-600 hover:bg-slate-100 sm:hover:bg-white/80 rounded-md sm:rounded text-[11px] sm:text-xs">
              Pendientes de pago
            </button>
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4" scope="col">Estudiante / Identificación</th>
                  <th className="py-3 px-3" scope="col">Código Matrícula</th>
                  <th className="py-3 px-3" scope="col">Programa Académico</th>
                  <th className="py-3 px-3" scope="col">Fecha y Hora</th>
                  <th className="py-3 px-3" scope="col">Estado</th>
                  <th className="py-3 px-4 text-right" scope="col">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
    <tr>
      <td colSpan={6} className="py-8 text-center text-slate-500">
        Sin datos recientes
      </td>
    </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="sm:hidden divide-y divide-slate-100">
            {/* Student 1 */}
            <article className="p-3 hover:bg-slate-50/70 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200 shrink-0 mt-0.5">CM</div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 leading-snug">Carlos Mendoza Ruiz</h3>
                    <p className="text-[10.5px] text-slate-500 font-medium">Soldadura Estructural y TIG</p>
                    <div className="flex items-center gap-2 mt-1 text-[9.5px] text-slate-400">
                      <span>DNI: 72849102</span><span>•</span><span className="font-mono text-slate-600">EST-2026-0841</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">Matriculado</span>
                  <span className="text-[9.5px] text-slate-400">Hoy, 09:15 AM</span>
                </div>
              </div>
            </article>
            {/* Student 2 */}
            <article className="p-3 hover:bg-slate-50/70 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200 shrink-0 mt-0.5">YP</div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 leading-snug">Yuliana Paredes Quispe</h3>
                    <p className="text-[10.5px] text-slate-500 font-medium">Seguridad Industrial y Minera (SOMA)</p>
                    <div className="flex items-center gap-2 mt-1 text-[9.5px] text-slate-400">
                      <span>DNI: 48190321</span><span>•</span><span className="font-mono text-slate-600">EST-2026-0840</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/70">Validando pago</span>
                  <span className="text-[9.5px] text-slate-400">Hoy, 08:42 AM</span>
                </div>
              </div>
            </article>
            {/* Student 3 */}
            <article className="p-3 hover:bg-slate-50/70 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200 shrink-0 mt-0.5">JA</div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 leading-snug">Jorge Alanya Cárdenas</h3>
                    <p className="text-[10.5px] text-slate-500 font-medium">Operador de Maquinaria Pesada</p>
                    <div className="flex items-center gap-2 mt-1 text-[9.5px] text-slate-400">
                      <span>DNI: 70912445</span><span>•</span><span className="font-mono text-slate-600">EST-2026-0839</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">Matriculado</span>
                  <span className="text-[9.5px] text-slate-400">Ayer, 17:30 PM</span>
                </div>
              </div>
            </article>
            {/* Student 4 */}
            <article className="p-3 hover:bg-slate-50/70 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-700 font-bold text-xs flex items-center justify-center border border-amber-200 shrink-0 mt-0.5">MV</div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 leading-snug">María Vargas Huamán</h3>
                    <p className="text-[10.5px] text-slate-500 font-medium">Electricidad y Tableros Industriales</p>
                    <div className="flex items-center gap-2 mt-1 text-[9.5px] text-slate-400">
                      <span>DNI: 75128490</span><span>•</span><span className="font-mono text-slate-600">EST-2026-0838</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/70">Docs pendientes</span>
                  <span className="text-[9.5px] text-slate-400">Ayer, 16:15 PM</span>
                </div>
              </div>
            </article>
          </div>

          {/* Sync Status Bottom Bar */}
          <div className="p-3 sm:bg-slate-50/50 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 sm:text-slate-500">
            <span>Mostrando 4 de 1,248 estudiantes</span>
            <span className="sm:hidden flex items-center gap-1 text-emerald-600 font-medium">
              <CheckCircle className="w-3 h-3" />
              Sincronizado
            </span>
            <span className="hidden sm:inline text-slate-400">Sincronizado con Base de Datos Brusben</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Módulos Institucionales & Direct Actions (4 of 12 Cols) */}
        <div className="lg:col-span-4 space-y-4 sm:space-y-6">
          {/* Módulos Institucionales Widget */}
          <div className="bg-transparent sm:bg-white sm:rounded-xl sm:border sm:border-slate-200 sm:shadow-sm sm:p-5">
            <div className="sm:border-b sm:border-slate-100 sm:pb-3 sm:mb-4 mb-2 flex sm:block items-center justify-between">
              <h2 className="text-xs sm:text-base font-bold uppercase sm:capitalize tracking-wider sm:tracking-normal text-slate-600 sm:text-slate-900">Módulos institucionales</h2>
              <span className="sm:hidden text-[10px] text-slate-400">Accesos directos</span>
              <p className="hidden sm:block text-xs text-slate-500 mt-0.5">Accesos según tus permisos de rol.</p>
            </div>
            
            <div className="grid grid-cols-1 gap-2 sm:space-y-3 sm:gap-0">
              {/* Module 1: CRM Comercial */}
              <Link href="/crm" className="bg-white sm:bg-transparent p-3 sm:p-3.5 rounded-xl sm:rounded-lg border border-slate-200 shadow-2xs sm:shadow-none flex items-center justify-between hover:border-brand-700/50 sm:hover:bg-slate-50/80 active:bg-slate-50 transition group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-auto sm:h-auto sm:p-2 rounded-lg sm:rounded bg-red-50 text-brand-700 group-hover:bg-brand-700 group-hover:text-white flex items-center justify-center shrink-0 transition">
                    <Users className="w-5 h-5 sm:w-4 sm:h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 sm:text-slate-900 group-hover:text-brand-700 transition">CRM Comercial</h3>
                    <p className="text-[10.5px] sm:text-[11px] text-slate-400 sm:text-slate-500 leading-tight mt-0.5">Prospectos, embudo<span className="hidden sm:inline">, seguimientos</span> y conversión</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-700 group-hover:translate-x-0.5 transition" />
              </Link>
              
              {/* Module 2: Oferta Académica */}
              <Link href="/oferta" className="bg-white sm:bg-transparent p-3 sm:p-3.5 rounded-xl sm:rounded-lg border border-slate-200 shadow-2xs sm:shadow-none flex items-center justify-between hover:border-brand-700/50 sm:hover:bg-slate-50/80 active:bg-slate-50 transition group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-auto sm:h-auto sm:p-2 rounded-lg sm:rounded bg-slate-100 text-slate-700 group-hover:bg-slate-800 group-hover:text-white flex items-center justify-center shrink-0 transition">
                    <BookOpen className="w-5 h-5 sm:w-4 sm:h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 sm:text-slate-900 group-hover:text-brand-700 transition">Oferta académica</h3>
                    <p className="text-[10.5px] sm:text-[11px] text-slate-400 sm:text-slate-500 leading-tight mt-0.5">Programas, planes<span className="hidden sm:inline">, periodos</span> y ediciones</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-700 group-hover:translate-x-0.5 transition" />
              </Link>
              
              {/* Module 3: Matrículas */}
              <Link href="/matriculas" className="bg-white sm:bg-transparent p-3 sm:p-3.5 rounded-xl sm:rounded-lg border border-slate-200 shadow-2xs sm:shadow-none flex items-center justify-between hover:border-brand-700/50 sm:hover:bg-slate-50/80 active:bg-slate-50 transition group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-auto sm:h-auto sm:p-2 rounded-lg sm:rounded bg-emerald-50 text-emerald-700 sm:bg-slate-100 sm:text-slate-700 group-hover:bg-slate-800 group-hover:text-white flex items-center justify-center shrink-0 transition">
                    <FileText className="w-5 h-5 sm:w-4 sm:h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 sm:text-slate-900 group-hover:text-brand-700 transition">Matrículas &amp; Pagos</h3>
                    <p className="text-[10.5px] sm:text-[11px] text-slate-400 sm:text-slate-500 leading-tight mt-0.5">Contratos, cuotas y <span className="hidden sm:inline">emisión de </span>boletas</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-700 group-hover:translate-x-0.5 transition" />
              </Link>
              
              {/* Module 4: Personas y Estudiantes */}
              <Link href="/personas" className="bg-white sm:bg-transparent p-3 sm:p-3.5 rounded-xl sm:rounded-lg border border-slate-200 shadow-2xs sm:shadow-none flex items-center justify-between hover:border-brand-700/50 sm:hover:bg-slate-50/80 active:bg-slate-50 transition group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-auto sm:h-auto sm:p-2 rounded-lg sm:rounded bg-blue-50 text-blue-700 sm:bg-slate-100 sm:text-slate-700 group-hover:bg-slate-800 group-hover:text-white flex items-center justify-center shrink-0 transition">
                    <GraduationCap className="w-5 h-5 sm:w-4 sm:h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 sm:text-slate-900 group-hover:text-brand-700 transition">Personas y estudiantes</h3>
                    <p className="text-[10.5px] sm:text-[11px] text-slate-400 sm:text-slate-500 leading-tight mt-0.5">Expedientes <span className="hidden sm:inline">académicos </span>y asistencias</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-700 group-hover:translate-x-0.5 transition" />
              </Link>
            </div>
          </div>

          {/* Pending Tasks / System Alerts Box */}
          <div className="bg-amber-50/70 sm:bg-amber-50/70 bg-amber-50 border border-amber-200/80 sm:border-amber-200/80 border-amber-200/90 rounded-xl p-3.5 sm:p-4 flex items-start gap-2.5 sm:space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-xs font-bold text-amber-900">Validación de certificados pendientes</h4>
              <p className="text-[11px] text-amber-800 mt-0.5 sm:mt-1 leading-snug sm:leading-relaxed">
                Hay <strong className="sm:font-normal font-bold">9 expedientes técnicos</strong> del programa Soldadura TIG pendientes de firma <span className="hidden sm:inline">de </span><span className="sm:hidden">por </span>Superadministración.
              </p>
              <Link href="#" className="inline-flex sm:inline-block items-center gap-1 sm:gap-0 mt-2 text-[11px] font-bold sm:font-semibold text-brand-700 hover:underline">
                Revisar lista de pendientes →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

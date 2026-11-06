import { createClient, getSafeDbClient } from '@/lib/supabase/server';
import { requirePermission, getUserAuthContext } from '@/lib/auth/permissions';
import Link from 'next/link';
import {
  Users,
  PhoneCall,
  FileCheck,
  TrendingUp,
  Sparkles,
  Clock,
  UserCheck,
  CalendarCheck,
  Download,
} from 'lucide-react';
import { CRMWorkspaceClient } from '@/components/features/crm/CRMWorkspaceClient';
import { EnrichedProspecto, normalizeProspectoStage, CRMConversationItem } from '@/lib/utils/crm';
import { AsesorOption } from './prospectos/ProspectoFormModalClient';

export const metadata = {
  title: 'CRM Comercial & Admisiones - ERP Brusben',
};

export default async function CRMPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requirePermission(['CRM.VER', 'SISTEMA.ADMINISTRAR']);
  const supabase = await createClient();
  const db = await getSafeDbClient();
  const authCtx = await getUserAuthContext();
  const isAdvisor = Boolean(authCtx?.isAsesor);
  const sp = await searchParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const currentUserId = user?.id || authCtx?.userId;

  // Consultas base del módulo CRM
  let prospectosQuery = db
    .from('prospectos')
    .select(`
      *,
      programas (id, nombre, codigo),
      ediciones (id, codigo),
      profiles!prospectos_asesor_id_fkey (id, display_name, email, photo_url)
    `)
    .order('created_at', { ascending: false });

  let seguimientosQuery = db
    .from('seguimientos')
    .select(`
      id,
      prospecto_id,
      tipo_actividad,
      fecha_hora,
      resultado,
      nota,
      estado_anterior,
      estado_nuevo,
      proximo_seguimiento,
      asesor_id,
      profiles!seguimientos_asesor_id_fkey (id, display_name, email)
    `)
    .order('fecha_hora', { ascending: false });

  let tareasQuery = db
    .from('tareas_comerciales')
    .select('id, prospecto_id, tipo_tarea, fecha_programada, status')
    .eq('status', 'PENDIENTE');

  let matriculasQuery = db
    .from('matriculas')
    .select('id, status, asesor_comercial_id')
    .in('status', ['PREMATRICULA', 'RESERVADA', 'ACTIVA']);

  // FILTRADO DE SEGURIDAD POR ROL:
  // Si el usuario conectado tiene el rol de Asesor Comercial, solo devolver los prospectos
  // y actividades asignados a su ID de usuario. Los roles administrativos ven la lista completa.
  if (isAdvisor && currentUserId) {
    prospectosQuery = prospectosQuery.eq('asesor_id', currentUserId);
    seguimientosQuery = seguimientosQuery.eq('asesor_id', currentUserId);
    tareasQuery = tareasQuery.eq('asesor_id', currentUserId);
    matriculasQuery = matriculasQuery.eq('asesor_comercial_id', currentUserId);
  }

  const [
    prospectosRes,
    programasRes,
    planesRes,
    edicionesRes,
    catalogosRes,
    profilesRes,
    seguimientosRes,
    tareasRes,
    matriculasRes,
  ] = await Promise.all([
    prospectosQuery,
    db
      .from('programas')
      .select('id, nombre, codigo, status')
      .or('status.eq.ACTIVO,status.is.null')
      .order('nombre'),
    db
      .from('planes_estudio')
      .select('id, nombre, programa_id, status')
      .or('status.eq.ACTIVO,status.is.null'),
    db
      .from('ediciones')
      .select('id, codigo, programa_id, status')
      .or('status.eq.ACTIVO,status.is.null'),
    db.from('catalogos_comerciales').select('*').eq('active', true),
    db
      .from('profiles')
      .select('id, display_name, email, status, role_id, roles(name, code)')
      .order('display_name'),
    seguimientosQuery,
    tareasQuery,
    matriculasQuery,
  ]);

  const prospectos = (prospectosRes.data || []) as unknown as EnrichedProspecto[];
  let programas = programasRes.data || [];
  if (programas.length === 0) {
    const { data: allProgs } = await db.from('programas').select('id, nombre, codigo, status').order('nombre');
    if (allProgs && allProgs.length > 0) {
      programas = allProgs;
    }
  }
  const planes = planesRes.data || [];
  const ediciones = edicionesRes.data || [];
  const catalogos = catalogosRes.data || [];
  const seguimientos = seguimientosRes.data || [];
  const tareasPendientes = tareasRes.data || [];
  const matriculas = matriculasRes.data || [];

  // Filtrar asesores activos con roles comerciales o administrativos
  const rawProfiles = profilesRes.data || [];
  const asesores: AsesorOption[] = rawProfiles
    .filter(p => !p.status || p.status === 'ACTIVO')
    .map(p => {
      const roleObj = Array.isArray(p.roles) ? p.roles[0] : p.roles;
      return {
        id: p.id,
        display_name: p.display_name || p.email || 'Asesor Brusben',
        email: p.email,
        role_name: roleObj?.name || roleObj?.code || 'Comercial / Admin',
      };
    });

  // Cálculos de KPIs Superiores (Diseño Stitch con Datos Reales)
  const totalProspectos = prospectos.length;

  const now = new Date();
  const currentMonthPrefix = now.toISOString().slice(0, 7);
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthPrefix = prevMonthDate.toISOString().slice(0, 7);
  const todayPrefix = now.toISOString().slice(0, 10);

  const prospectosMesActual = prospectos.filter(p =>
    (p.created_at || '').startsWith(currentMonthPrefix)
  ).length;
  const prospectosMesAnterior = prospectos.filter(p =>
    (p.created_at || '').startsWith(prevMonthPrefix)
  ).length;

  const crecimientoMensualPct =
    prospectosMesAnterior > 0
      ? (((prospectosMesActual - prospectosMesAnterior) / prospectosMesAnterior) * 100).toFixed(1)
      : totalProspectos > 0
        ? `+${((prospectosMesActual / totalProspectos) * 100).toFixed(1)}`
        : '0.0';

  const enSeguimientoActivo = prospectos.filter(p => {
    const st = normalizeProspectoStage(p.status);
    return ['NUEVO', 'CONTACTADO', 'EN SEGUIMIENTO', 'INTERESADO'].includes(st);
  }).length;

  const llamadasRegistradas = seguimientos.filter(s =>
    (s.tipo_actividad || '').toUpperCase().includes('LLAMADA')
  ).length;
  const whatsappRegistrados = seguimientos.filter(s =>
    (s.tipo_actividad || '').toUpperCase().includes('WHATSAPP') ||
    (s.tipo_actividad || '').toUpperCase().includes('MENSAJE')
  ).length;
  const canalesWhatsappProspectos = prospectos.filter(
    p => (p.canal_captacion || '').toUpperCase() === 'WHATSAPP'
  ).length;

  const prematriculasCrm = prospectos.filter(
    p => normalizeProspectoStage(p.status) === 'PREMATRICULA'
  ).length;
  const prematriculasTabla = matriculas.filter(
    m => m.status === 'PREMATRICULA' || m.status === 'RESERVADA'
  ).length;
  const totalPrematriculasReservas = Math.max(prematriculasCrm, prematriculasTabla);
  const metaCupos = 70;
  const avanceMetaCupos = Math.min(100, Math.round(((totalPrematriculasReservas + matriculas.length) / metaCupos) * 100));

  const convertidosCount = prospectos.filter(
    p => normalizeProspectoStage(p.status) === 'MATRICULADO' || Boolean(p.matricula_id)
  ).length;
  const tasaConversionVal =
    totalProspectos > 0 ? ((convertidosCount / totalProspectos) * 100).toFixed(1) : '0.0';

  // Métricas de la Franja de Actividad Rápida del Día
  const leadsHoy = prospectos.filter(p => (p.created_at || '').startsWith(todayPrefix)).length;
  const nuevosSinContactar = prospectos.filter(p => normalizeProspectoStage(p.status) === 'NUEVO').length;

  // Calcular tiempo medio de 1er contacto real si hay seguimientos, o mostrar indicador operativo
  let tiempoMedioPrimerContacto = '< 15 min';
  const diffsMinutos: number[] = [];
  for (const p of prospectos) {
    if (!p.created_at) continue;
    const segsProspecto = seguimientos.filter(s => s.prospecto_id === p.id && s.fecha_hora);
    if (segsProspecto.length > 0) {
      const earliest = segsProspecto[segsProspecto.length - 1];
      if (earliest?.fecha_hora) {
        const diffMs = new Date(earliest.fecha_hora).getTime() - new Date(p.created_at).getTime();
        if (diffMs > 0) {
          diffsMinutos.push(Math.round(diffMs / 60000));
        }
      }
    }
  }
  if (diffsMinutos.length > 0) {
    const avgMin = Math.round(diffsMinutos.reduce((a, b) => a + b, 0) / diffsMinutos.length);
    tiempoMedioPrimerContacto = avgMin < 60 ? `${avgMin} min` : `${(avgMin / 60).toFixed(1)} hrs`;
  }

  return (
    <div className="space-y-5">
      {/* Encabezado Empresarial CRM (Diseño Stitch) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#C4121A] bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
            <Sparkles className="w-3 h-3" />
            <span>Gestión de Admisiones &amp; Embudo Comercial</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            CRM Comercial
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Control integral de captación de leads, asignación de asesores, seguimiento multicanal y conversión a matrícula.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Link
            href="/reportes/crm"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Reporte CRM PDF</span>
          </Link>
        </div>
      </div>

      {/* PASO 2.1: 4 Tarjetas Superiores de Indicadores (Inspiradas en Stitch) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Prospectos */}
        <article className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#C4121A]" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total prospectos</span>
              <span className="p-2 rounded-lg bg-red-50 text-[#C4121A] border border-red-100">
                <Users className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2.5">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {totalProspectos}
              </span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                ↑ {crecimientoMensualPct.toString().startsWith('+') ? crecimientoMensualPct : `+${crecimientoMensualPct}`}% este mes
              </span>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-slate-500">
            <strong>{prospectosMesActual}</strong> captado(s) en el mes actual • Padrón comercial activo
          </p>
        </article>

        {/* KPI 2: En Seguimiento Activo */}
        <article className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">En seguimiento activo</span>
              <span className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                <PhoneCall className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2.5">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {enSeguimientoActivo}
              </span>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                Gestión multicanal
              </span>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-slate-500">
            <strong>{canalesWhatsappProspectos + whatsappRegistrados}</strong> WhatsApp •{' '}
            <strong>{llamadasRegistradas}</strong> llamadas registradas
          </p>
        </article>

        {/* KPI 3: Prematrículas / Reservas */}
        <article className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Prematrículas / Reservas</span>
              <span className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                <FileCheck className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between gap-2">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {totalPrematriculasReservas}
              </span>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Meta: {metaCupos} cupos
              </span>
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${ Math.max(8, avanceMetaCupos) }%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              {convertidosCount} matrícula(s) cerrada(s) hacia la meta de campaña
            </p>
          </div>
        </article>

        {/* KPI 4: Tasa de Conversión */}
        <article className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-600" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Tasa de conversión</span>
              <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2.5">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {tasaConversionVal}%
              </span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {convertidosCount} de {totalProspectos} leads
              </span>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-slate-500">
            Conversión efectiva de prospecto a estudiante matriculado
          </p>
        </article>
      </section>

      {/* PASO 2.2: Franja de Actividad Rápida del Día */}
      <section className="bg-white rounded-xl px-4 py-3 border border-slate-200 shadow-2xs grid grid-cols-2 lg:grid-cols-4 gap-3 lg:divide-x divide-slate-100">
        <div className="flex items-center justify-between lg:pr-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C4121A]" />
            <span className="text-xs text-slate-500 font-medium">Leads de hoy / Nuevos</span>
          </div>
          <span className="text-xs font-extrabold text-slate-900">
            {leadsHoy} hoy ({nuevosSinContactar} por contactar)
          </span>
        </div>

        <div className="flex items-center justify-between lg:px-4">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-xs text-slate-500 font-medium">Tareas por contactar hoy</span>
          </div>
          <span className="text-xs font-extrabold text-amber-700">
            {tareasPendientes.length} pendiente(s)
          </span>
        </div>

        <div className="flex items-center justify-between lg:px-4">
          <div className="flex items-center gap-2">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs text-slate-500 font-medium">
              {isAdvisor ? 'Cartera Asignada' : 'Asesores activos'}
            </span>
          </div>
          <span className="text-xs font-extrabold text-emerald-700">
            {isAdvisor ? `${prospectos.length} prospectos` : `${asesores.length} en línea`}
          </span>
        </div>

        <div className="flex items-center justify-between lg:pl-4">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-xs text-slate-500 font-medium">Tiempo medio 1er contacto</span>
          </div>
          <span className="text-xs font-extrabold text-blue-700">
            {tiempoMedioPrimerContacto}
          </span>
        </div>
      </section>

      {/* PASO 3: Workspace Interactivo (Listado Avanzado + Embudo Kanban de 7 Etapas + Filtros en Cascada) */}
      <CRMWorkspaceClient
        initialProspectos={prospectos}
        initialSeguimientos={seguimientos as unknown as CRMConversationItem[]}
        programas={programas}
        planes={planes}
        ediciones={ediciones}
        catalogos={catalogos}
        asesores={asesores}
        currentUserId={currentUserId}
        isAdvisor={isAdvisor}
        initialQuery={sp?.q || ''}
        initialStatus={sp?.status || 'TODOS'}
      />
    </div>
  );
}

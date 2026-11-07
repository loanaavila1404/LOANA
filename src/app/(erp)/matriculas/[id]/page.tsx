import { createClient, getSafeDbClient } from '@/lib/supabase/server';
import { requirePermission, isCurrentUserAdvisor } from '@/lib/auth/permissions';
import { notFound } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/currency';
import {
  MatriculaFinanceViewClient,
  CuotaDetailItem,
  PagoDetailItem,
} from '@/components/features/matriculas/MatriculaFinanceViewClient';
import {
  ArrowLeft,
  FileText,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  Calendar,
  User,
  GraduationCap,
  Building2,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Phone,
  Mail,
  ExternalLink,
} from 'lucide-react';

export const metadata = {
  title: 'Expediente de Matrícula - ERP Brusben',
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function MatriculaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(['MATRICULAS.VER', 'COBRANZA.VER', 'SISTEMA.ADMINISTRAR']);
  const supabase = await createClient();
  const db = await getSafeDbClient();
  const resolvedParams = await params;
  const rawId = decodeURIComponent(resolvedParams.id || '').trim();

  if (!rawId) {
    notFound();
  }

  const isUuid = UUID_REGEX.test(rawId);

  // Consultar matrícula completa mediante cliente seguro
  const matriculaQuery = db.from('matriculas').select(`
    *,
    estudiantes (
      id,
      persona_id,
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
    ediciones (
      id,
      codigo,
      nombre,
      turno,
      modalidad,
      fecha_inicio,
      fecha_fin,
      programas (id, nombre, codigo),
      planes_estudio (id, nombre, codigo),
      ciclos (id, nombre, numero_orden),
      periodos (id, nombre, codigo)
    )
  `);

  const { data: matricula, error: matriculaError } = await (
    isUuid
      ? matriculaQuery.eq('id', rawId)
      : matriculaQuery.eq('codigo_matricula', rawId.toUpperCase())
  ).maybeSingle();

  if (matriculaError) {
    console.error('[MatriculaDetail] Error al obtener matrícula:', matriculaError);
    throw new Error(`Error al consultar la matrícula: ${matriculaError.message}`);
  }

  if (!matricula) notFound();

  type EstudianteRel = {
    id: string;
    persona_id?: string | null;
    codigo_estudiante: string | null;
    personas: {
      id?: string | null;
      nombres: string | null;
      apellido_paterno: string | null;
      apellido_materno: string | null;
      tipo_documento?: string | null;
      numero_documento: string | null;
      telefono?: string | null;
      email?: string | null;
    } | null;
  };

  type EdicionRel = {
    id: string;
    codigo: string;
    nombre: string | null;
    turno?: string | null;
    modalidad?: string | null;
    fecha_inicio?: string | null;
    fecha_fin?: string | null;
    programas: { id: string; nombre: string; codigo: string } | null;
    planes_estudio: { id: string; nombre: string; codigo: string } | null;
    ciclos: { id: string; nombre: string; numero_orden: number } | null;
    periodos: { id: string; nombre: string; codigo: string } | null;
  };

  const estRaw = matricula.estudiantes as unknown as EstudianteRel | EstudianteRel[] | null;
  const est = Array.isArray(estRaw) ? estRaw[0] : estRaw;
  const persona = Array.isArray(est?.personas) ? est?.personas[0] : est?.personas;
  const personaId = persona?.id || est?.persona_id || est?.id;

  const edRaw = matricula.ediciones as unknown as EdicionRel | EdicionRel[] | null;
  const ed = Array.isArray(edRaw) ? edRaw[0] : edRaw;
  const prog = Array.isArray(ed?.programas) ? ed?.programas[0] : ed?.programas;
  const plan = Array.isArray(ed?.planes_estudio) ? ed?.planes_estudio[0] : ed?.planes_estudio;
  const ciclo = Array.isArray(ed?.ciclos) ? ed?.ciclos[0] : ed?.ciclos;
  const periodo = Array.isArray(ed?.periodos) ? ed?.periodos[0] : ed?.periodos;

  // Cargar Cuotas mediante cliente seguro
  const { data: cuotasRaw } = await db
    .from('cuotas')
    .select('*')
    .eq('matricula_id', matricula.id)
    .order('numero_cuota', { ascending: true });

  const cuotas = (cuotasRaw || []) as CuotaDetailItem[];

  // Cargar Pagos con aplicaciones de cuotas mediante cliente seguro
  const { data: pagosRaw } = await db
    .from('pagos')
    .select(`
      *,
      pago_aplicaciones (
        id,
        cuota_id,
        importe_aplicado,
        cuotas (
          id,
          concepto,
          tipo_cuota,
          numero_cuota
        )
      )
    `)
    .eq('estudiante_id', est?.id || matricula.estudiante_id)
    .order('fecha_pago', { ascending: false });

  const pagos = (pagosRaw || []) as PagoDetailItem[];

  // --- CÁLCULOS FINANCIEROS AVANZADOS ---
  const today = new Date().toISOString().split('T')[0];

  const totalNetoFromCuotas = cuotas.reduce((acc, c) => acc + (Number(c.importe_neto) || 0), 0);
  const fallbackNeto =
    (Number(matricula.importe_matricula) || 0) +
    (Number(matricula.importe_pension) || 0) * (Number(matricula.numero_pensiones) || 0) -
    (Number(matricula.descuento_total) || 0);

  const totalNeto = totalNetoFromCuotas > 0 ? totalNetoFromCuotas : Math.max(0, fallbackNeto);
  const totalSaldo = cuotas.reduce((acc, c) => acc + (Number(c.saldo) || 0), 0);
  const totalPagado = Math.max(0, totalNeto - totalSaldo);
  const porcentajeAmortizado = Math.min(
    100,
    Math.round((totalPagado / (totalNeto > 0 ? totalNeto : 1)) * 100)
  );

  const cuotasPagadasCount = cuotas.filter(c => c.status === 'PAGADA').length;
  const cuotasPendientesCount = cuotas.filter(c => c.status === 'PENDIENTE' || c.status === 'PARCIAL').length;
  const cuotasVencidas = cuotas.filter(
    c =>
      (c.status === 'PENDIENTE' || c.status === 'PARCIAL') &&
      c.fecha_vencimiento &&
      c.fecha_vencimiento < today
  );
  const cuotasVencidasCount = cuotasVencidas.length;
  const saldoVencido = cuotasVencidas.reduce((acc, c) => acc + (Number(c.saldo) || 0), 0);

  const nombreCompleto = persona
    ? `${persona.nombres || ''} ${persona.apellido_paterno || ''} ${persona.apellido_materno || ''}`.trim()
    : 'Estudiante Titular';

  const isAdvisor = await isCurrentUserAdvisor();

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-12">
      {/* ============================================================== */}
      {/* 1. CABECERA 360° INSTITUCIONAL */}
      {/* ============================================================== */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <Link
              href="/matriculas"
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-900 transition shadow-2xs mt-1"
              title="Volver al Listado de Matrículas"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-[#C4121A] border border-red-100 uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Expediente de Matrícula
                </span>
                {isAdvisor && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-wider">
                    Modo Consulta (Solo Lectura)
                  </span>
                )}
                <Badge
                  variant={
                    matricula.status === 'ACTIVA'
                      ? 'success'
                      : matricula.status === 'PREMATRICULA'
                      ? 'default'
                      : matricula.status === 'RESERVADA'
                      ? 'warning'
                      : 'danger'
                  }
                >
                  {matricula.status}
                </Badge>
                {totalSaldo === 0 && totalNeto > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Cancelado 100%
                  </span>
                )}
                {saldoVencido > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                    <AlertTriangle className="w-3 h-3 text-red-600" />
                    Mora: {formatCurrency(saldoVencido)}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight mt-1.5">
                {matricula.codigo_matricula}
              </h1>

              {/* Subtítulo con Estudiante, Documento y Oferta */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 mt-1">
                {personaId ? (
                  <Link
                    href={`/personas/${personaId}`}
                    className="font-bold text-[#C4121A] hover:underline flex items-center gap-1 group"
                  >
                    <span>{nombreCompleto}</span>
                    <ExternalLink className="w-3 h-3 text-[#C4121A] opacity-70 group-hover:opacity-100" />
                  </Link>
                ) : (
                  <span className="font-bold text-slate-800">{nombreCompleto}</span>
                )}

                <span>•</span>
                <span>
                  <strong>{persona?.tipo_documento || 'DNI'}:</strong> {persona?.numero_documento || '-'}
                </span>

                {est?.codigo_estudiante && (
                  <>
                    <span>•</span>
                    <span>
                      <strong>Cód. Estudiantil:</strong>{' '}
                      <span className="font-mono text-slate-700">{est.codigo_estudiante}</span>
                    </span>
                  </>
                )}

                <span>•</span>
                <span>
                  <strong>Programa:</strong> {prog?.nombre || 'Formación Técnica'} ({ed?.codigo || '-'})
                </span>
              </div>
            </div>
          </div>

          {/* Botones de acción superior */}
          <div className="flex items-center gap-2.5 sm:self-center">
            <Link
              href={`/matriculas/${matricula.id}/ficha`}
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition"
            >
              <FileText className="w-4 h-4 text-[#C4121A]" />
              <span>Ver / Imprimir Ficha PDF</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. TARJETAS DE RESUMEN FINANCIERO SUPERIORES (4 KPIS) */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Costo Total del Programa / Pactado */}
        <Card className="border-slate-200 shadow-2xs bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Inversión Total Pactada
              </span>
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {formatCurrency(totalNeto)}
              </span>
            </div>

            <div className="mt-2 text-xs text-slate-500 space-y-0.5">
              <p>
                Matrícula: {formatCurrency(Number(matricula.importe_matricula) || 0)}
              </p>
              <p>
                {matricula.numero_pensiones || 0} pensiones x {formatCurrency(Number(matricula.importe_pension) || 0)}
              </p>
            </div>

            {Boolean(matricula.descuento_total && Number(matricula.descuento_total) > 0) && (
              <div className="mt-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span>Beca: -{formatCurrency(Number(matricula.descuento_total))}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* KPI 2: Total Pagado / Amortizado */}
        <Card className="border-slate-200 shadow-2xs bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total Amortizado
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-600 tracking-tight">
                {formatCurrency(totalPagado)}
              </span>
            </div>

            {/* Barra de Progreso */}
            <div className="mt-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Progreso:</span>
                <span className="font-bold text-slate-800">{porcentajeAmortizado}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${porcentajeAmortizado}%` }}
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-500 mt-2">
              {cuotasPagadasCount} de {cuotas.length} cuotas canceladas
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Saldo Pendiente por Cobrar */}
        <Card className="border-slate-200 shadow-2xs bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Saldo Pendiente
              </span>
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  totalSaldo > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                {totalSaldo > 0 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              </div>
            </div>

            <div className="mt-3">
              <span
                className={`text-2xl font-black tracking-tight ${
                  totalSaldo > 0 ? 'text-red-600' : 'text-emerald-700'
                }`}
              >
                {formatCurrency(totalSaldo)}
              </span>
            </div>

            <div className="mt-2 text-xs">
              {totalSaldo > 0 ? (
                <span className="text-slate-600 font-medium">
                  {cuotasPendientesCount} cuota(s) pendiente(s) de pago
                </span>
              ) : (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Sin saldo deudor vigente
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-500 mt-2">
              Sujeto a cronograma institucional y fecha de vencimiento
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Estado y Salud de Cuotas */}
        <Card className="border-slate-200 shadow-2xs bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Estado de Cuotas
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <span className="text-xl font-black text-slate-900">
                {cuotasPagadasCount} pag. / {cuotasPendientesCount} pend.
              </span>
            </div>

            <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
              {cuotasVencidasCount > 0 ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 border border-red-300">
                  {cuotasVencidasCount} cuota(s) vencida(s)
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Al día en cronograma
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-500 mt-2">
              Primer vencimiento: {matricula.primer_vencimiento || 'No registrado'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ============================================================== */}
      {/* 3. LAYOUT PRINCIPAL: DETALLE ACADÉMICO + CRONOGRAMA & HISTORIAL */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* COLUMNA LATERAL: DETALLE DEL EXPEDIENTE ACADÉMICO */}
        <div className="space-y-6">
          {/* Card Académica */}
          <Card className="border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#C4121A]" />
                <span>Oferta Académica & Sede</span>
              </h3>
            </div>
            <CardContent className="p-4 space-y-3.5 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                  Programa de Estudios
                </span>
                <span className="font-bold text-slate-900 block mt-0.5">
                  {prog?.nombre || 'Carrera / Curso'}
                </span>
                <span className="font-mono text-slate-500 text-[11px]">
                  Cód: {prog?.codigo || '-'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                  Edición y Grupo
                </span>
                <span className="font-bold text-slate-800 block mt-0.5">
                  {ed?.codigo} {ed?.nombre ? `• ${ed.nombre}` : ''}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                    Turno
                  </span>
                  <span className="font-semibold text-slate-800">
                    {ed?.turno || 'Regular'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                    Modalidad
                  </span>
                  <span className="font-semibold text-slate-800">
                    {ed?.modalidad || 'Presencial'}
                  </span>
                </div>
              </div>

              <div className="pt-1 border-t border-slate-100">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                  Sede Institucional
                </span>
                <span className="font-bold text-slate-800 block mt-0.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  Sede Central · Tumbes
                </span>
              </div>

              {plan && (
                <div className="pt-1 border-t border-slate-100">
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                    Plan Curricular
                  </span>
                  <span className="text-slate-700 font-medium">
                    {plan.nombre} ({plan.codigo})
                  </span>
                </div>
              )}

              <div className="pt-1 border-t border-slate-100">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                  Fecha de Matrícula
                </span>
                <span className="text-slate-700 font-medium">
                  {matricula.fecha_matricula
                    ? new Date(matricula.fecha_matricula).toLocaleDateString('es-PE', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })
                    : '-'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Card Datos de Contacto del Alumno */}
          <Card className="border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-[#C4121A]" />
                <span>Datos del Estudiante</span>
              </h3>
            </div>
            <CardContent className="p-4 space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                  Titular
                </span>
                <span className="font-bold text-slate-900 block mt-0.5">
                  {nombreCompleto}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                  DNI / Documento
                </span>
                <span className="font-semibold text-slate-800">
                  {persona?.numero_documento || '-'}
                </span>
              </div>

              {persona?.telefono && (
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{persona.telefono}</span>
                </div>
              )}

              {persona?.email && (
                <div className="flex items-center gap-2 text-slate-700 truncate" title={persona.email}>
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{persona.email}</span>
                </div>
              )}

              {personaId && (
                <div className="pt-2 border-t border-slate-100">
                  <Link
                    href={`/personas/${personaId}`}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition shadow-2xs"
                  >
                    <span>Ver Ficha 360° del Alumno</span>
                    <ExternalLink className="w-3 h-3 text-slate-600" />
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* COLUMNA CENTRAL & DERECHA: CRONOGRAMA INTERACTIVO & HISTORIAL DE PAGOS */}
        <div className="lg:col-span-3 space-y-6">
          <MatriculaFinanceViewClient
            estudianteId={est?.id || matricula.estudiante_id}
            cuotas={cuotas}
            pagos={pagos}
            matriculaStatus={matricula.status || 'ACTIVA'}
            readOnly={isAdvisor}
            matriculaParaValidar={{
              id: matricula.id,
              codigo_matricula: matricula.codigo_matricula,
              importe_matricula: matricula.importe_matricula,
              importe_pension: matricula.importe_pension,
              numero_pensiones: matricula.numero_pensiones,
              descuento_total: matricula.descuento_total,
              totalNeto,
              estudianteNombre: nombreCompleto,
              estudianteDni: persona?.numero_documento || undefined,
              programaNombre: prog?.nombre || undefined,
            }}
          />
        </div>

      </div>
    </div>
  );
}

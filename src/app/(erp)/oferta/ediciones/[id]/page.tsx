import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/permissions';
import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { HorarioFormModalClient } from './HorarioFormModalClient';
import { Calendar, Clock, MapPin, UserCheck, BookOpen, ArrowLeft, FileText, Users } from 'lucide-react';

export const metadata = {
  title: 'Detalle de Edición y Horarios - ERP Brusben'
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ORDEN_DIAS: Record<string, number> = {
  LUNES: 1,
  MARTES: 2,
  MIERCOLES: 3,
  JUEVES: 4,
  VIERNES: 5,
  SABADO: 6,
  DOMINGO: 7,
};

const ETIQUETA_DIAS: Record<string, string> = {
  LUNES: 'Lunes',
  MARTES: 'Martes',
  MIERCOLES: 'Miércoles',
  JUEVES: 'Jueves',
  VIERNES: 'Viernes',
  SABADO: 'Sábado',
  DOMINGO: 'Domingo',
};

export default async function EdicionDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  await requirePermission(['PROGRAMAS.VER', 'SISTEMA.ADMINISTRAR']);
  const supabase = await createClient();
  const resolvedParams = await params;
  const rawId = decodeURIComponent(resolvedParams.id || '').trim();

  if (!rawId) {
    notFound();
  }

  const isUuid = UUID_REGEX.test(rawId);
  const edicionQuery = supabase
    .from('ediciones')
    .select(`
      *,
      programas (id, nombre, codigo),
      planes_estudio (id, nombre, codigo),
      periodos (id, nombre, codigo),
      ciclos (id, nombre, numero_orden)
    `);

  const { data: edicion } = await (
    isUuid
      ? edicionQuery.eq('id', rawId)
      : edicionQuery.eq('codigo', rawId.toUpperCase())
  ).maybeSingle();

  if (!edicion) {
    notFound();
  }

  const programaRel = Array.isArray(edicion.programas) ? edicion.programas[0] : edicion.programas;
  const planRel = Array.isArray(edicion.planes_estudio) ? edicion.planes_estudio[0] : edicion.planes_estudio;
  const periodoRel = Array.isArray(edicion.periodos) ? edicion.periodos[0] : edicion.periodos;
  const cicloRel = Array.isArray(edicion.ciclos) ? edicion.ciclos[0] : edicion.ciclos;

  // 1. Obtener horarios de la edición y ordenarlos por día y hora de inicio
  const { data: horariosRaw } = await supabase
    .from('horarios')
    .select(`
      *,
      cursos (id, nombre, codigo, creditos, horas_semanales)
    `)
    .eq('edicion_id', edicion.id)
    .order('hora_inicio', { ascending: true });

  const horarios = (horariosRaw || []).sort((a, b) => {
    const diaA = ORDEN_DIAS[a.dia_semana || ''] || 99;
    const diaB = ORDEN_DIAS[b.dia_semana || ''] || 99;
    if (diaA !== diaB) return diaA - diaB;
    return (a.hora_inicio || '').localeCompare(b.hora_inicio || '');
  });

  // 2. Obtener cursos conectados a la edición (por ciclo_id, plan_id o programa_id) sin errores UUID
  let cursosDisponibles: { id: string; nombre: string | null; codigo: string | null }[] = [];

  if (edicion.ciclo_id && UUID_REGEX.test(edicion.ciclo_id)) {
    const { data: cursosCiclo } = await supabase
      .from('cursos')
      .select('id, nombre, codigo')
      .eq('ciclo_id', edicion.ciclo_id)
      .eq('status', 'ACTIVO')
      .order('nombre');
    if (cursosCiclo && cursosCiclo.length > 0) {
      cursosDisponibles = cursosCiclo;
    }
  }

  if (cursosDisponibles.length === 0 && edicion.plan_id && UUID_REGEX.test(edicion.plan_id)) {
    const { data: cursosPlan } = await supabase
      .from('cursos')
      .select('id, nombre, codigo')
      .eq('plan_id', edicion.plan_id)
      .eq('status', 'ACTIVO')
      .order('nombre');
    if (cursosPlan && cursosPlan.length > 0) {
      cursosDisponibles = cursosPlan;
    }
  }

  if (cursosDisponibles.length === 0 && edicion.programa_id && UUID_REGEX.test(edicion.programa_id)) {
    const { data: planesProg } = await supabase
      .from('planes_estudio')
      .select('id')
      .eq('programa_id', edicion.programa_id);
    const planIds = (planesProg || []).map(p => p.id);
    if (planIds.length > 0) {
      const { data: cursosProg } = await supabase
        .from('cursos')
        .select('id, nombre, codigo')
        .in('plan_id', planIds)
        .eq('status', 'ACTIVO')
        .order('nombre');
      if (cursosProg && cursosProg.length > 0) {
        cursosDisponibles = cursosProg;
      }
    }
  }

  if (cursosDisponibles.length === 0) {
    const { data: todosCursos } = await supabase
      .from('cursos')
      .select('id, nombre, codigo')
      .eq('status', 'ACTIVO')
      .order('nombre');
    cursosDisponibles = todosCursos || [];
  }

  // 3. Conteo de matrículas activas en esta edición
  const { count: matriculadosCount } = await supabase
    .from('matriculas')
    .select('id', { count: 'exact', head: true })
    .eq('edicion_id', edicion.id)
    .in('status', ['ACTIVA', 'RESERVADA', 'PREMATRICULA', 'FINALIZADA']);

  const ocupadas = matriculadosCount || 0;
  const vacantesTotales = Number(edicion.vacantes || 30);
  const libres = Math.max(0, vacantesTotales - ocupadas);

  return (
    <div className="space-y-6">
      {/* Cabecera Institucional de la Edición / Grupo */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <Link
                href="/oferta/programas?tab=ediciones"
                className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-[#C4121A] transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver a Ediciones y Grupos</span>
              </Link>
              {programaRel && (
                <>
                  <span>/</span>
                  <Link
                    href={`/oferta/programas/${programaRel.id}`}
                    className="font-semibold text-slate-600 hover:text-[#C4121A] transition"
                  >
                    {programaRel.nombre}
                  </Link>
                </>
              )}
              <span>/</span>
              <span className="font-mono font-bold text-slate-800">{edicion.codigo}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="px-2.5 py-1 rounded-md bg-slate-900 text-white font-mono text-xs font-extrabold">
                {edicion.codigo}
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900">
                {edicion.nombre || `Grupo ${edicion.codigo}`}
              </h1>
              <Badge variant={edicion.status === 'ACTIVO' ? 'success' : 'default'}>
                {edicion.status}
              </Badge>
            </div>

            <p className="text-xs text-slate-600">
              Programa: <strong className="text-slate-900">{programaRel?.nombre || '-'}</strong> ·{' '}
              Plan: <strong className="text-slate-800">{planRel?.nombre || '-'}</strong> ·{' '}
              Periodo: <strong className="text-slate-800">{periodoRel?.nombre || '-'}</strong>
              {cicloRel ? (
                <>
                  {' '}· Ciclo <strong className="text-slate-800">{cicloRel.numero_orden}</strong>
                </>
              ) : null}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href={`/oferta/ediciones/${edicion.id}/ficha`}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 shadow-2xs text-xs font-bold transition-colors"
            >
              <FileText className="w-4 h-4 text-[#C4121A]" />
              <span>Descargar Horario PDF</span>
            </Link>
            <HorarioFormModalClient
              edicionId={edicion.id}
              cursos={cursosDisponibles}
              triggerText="+ Nuevo Horario"
            />
          </div>
        </div>

        {/* Resumen Rápido de Parámetros Operativos del Grupo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Modalidad y Turno
            </span>
            <p className="text-sm font-extrabold text-slate-900 mt-1">
              {edicion.modalidad || 'PRESENCIAL'} · {edicion.turno || 'REGULAR'}
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Vigencia del Grupo
            </span>
            <p className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#C4121A]" />
              <span>
                {edicion.fecha_inicio
                  ? new Date(edicion.fecha_inicio + 'T00:00:00').toLocaleDateString('es-PE')
                  : '-'}{' '}
                —{' '}
                {edicion.fecha_fin
                  ? new Date(edicion.fecha_fin + 'T00:00:00').toLocaleDateString('es-PE')
                  : '-'}
              </span>
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Control de Vacantes
            </span>
            <p className="text-sm font-extrabold text-slate-900 mt-1 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {ocupadas} / {vacantesTotales} inscritos ({libres} libres)
              </span>
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Inversión Académica
            </span>
            <p className="text-sm font-bold text-slate-900 mt-1">
              Matrícula: S/ {Number(edicion.precio_matricula || 0).toFixed(2)} · Pensión: S/{' '}
              {Number(edicion.precio_pension || 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* SECCIÓN INDEPENDIENTE Y ORDENADA DE GESTIÓN DE HORARIOS */}
      <Card className="bg-white border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#C4121A]" />
              <h2 className="text-base font-extrabold text-slate-900">
                Programación y Gestión de Horarios de Clases
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-200/80 text-slate-800">
                {horarios.length} sesiones
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Sesiones semanales ordenadas cronológicamente y vinculadas a las asignaturas del programa ({cursosDisponibles.length} cursos habilitados).
            </p>
          </div>

          <HorarioFormModalClient
            edicionId={edicion.id}
            cursos={cursosDisponibles}
            triggerText="+ Agregar Sesión de Horario"
          />
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-bold text-slate-700">Día de Semana</TableHead>
                <TableHead className="font-bold text-slate-700">Bloque Horario</TableHead>
                <TableHead className="font-bold text-slate-700">Curso / Asignatura</TableHead>
                <TableHead className="font-bold text-slate-700">Docente Asignado</TableHead>
                <TableHead className="font-bold text-slate-700">Aula / Ubicación</TableHead>
                <TableHead className="text-right font-bold text-slate-700">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {horarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-slate-500">
                    No hay sesiones de horario registradas para este grupo. Haz clic en{' '}
                    <strong className="text-slate-700">+ Agregar Sesión de Horario</strong> para programar las clases.
                  </TableCell>
                </TableRow>
              ) : (
                horarios.map(h => {
                  const cursoObj = Array.isArray(h.cursos) ? h.cursos[0] : h.cursos;
                  return (
                    <TableRow key={h.id} className="hover:bg-slate-50/80">
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-extrabold bg-slate-900 text-white">
                          {ETIQUETA_DIAS[h.dia_semana || ''] || h.dia_semana || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md">
                          <Clock className="w-3.5 h-3.5 text-[#C4121A]" />
                          {h.hora_inicio?.slice(0, 5)} — {h.hora_fin?.slice(0, 5)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
                          <div>
                            <p className="font-bold text-slate-900 text-xs">
                              {cursoObj?.nombre || 'Asignatura del Programa'}
                            </p>
                            {cursoObj?.codigo && (
                              <span className="font-mono text-[10px] text-slate-500">
                                Código: {cursoObj.codigo}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          {h.docente || 'Plana Docente Brusben'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-700">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {h.ubicacion || 'Sede Central - Tumbes'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <HorarioFormModalClient
                          edicionId={edicion.id}
                          horario={h}
                          cursos={cursosDisponibles}
                          triggerText="Editar"
                          variant="outline"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

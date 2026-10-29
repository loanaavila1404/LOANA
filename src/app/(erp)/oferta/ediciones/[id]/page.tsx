import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/permissions';
import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { EdicionFormModalClient } from '../EdicionFormModalClient';
import { Calendar, Clock, ArrowLeft, FileText, Users, LayoutGrid } from 'lucide-react';

export const metadata = {
  title: 'Detalle de Edición Académica - ERP Brusben'
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  // Catálogos para permitir editar la edición desde aquí
  const [{ data: programasCat }, { data: planesCat }, { data: periodosCat }, { data: ciclosCat }] = await Promise.all([
    supabase.from('programas').select('id, nombre').eq('status', 'ACTIVO').order('nombre'),
    supabase.from('planes_estudio').select('id, nombre, programa_id').eq('status', 'ACTIVO').order('nombre'),
    supabase.from('periodos').select('id, nombre, codigo').eq('status', 'ACTIVO').order('fecha_inicio', { ascending: false }),
    supabase.from('ciclos').select('id, nombre, plan_id, numero_orden').eq('status', 'ACTIVO').order('numero_orden'),
  ]);

  // Conteo de matrículas activas en esta edición
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
      {/* 1. CABECERA INSTITUCIONAL DE LA EDICIÓN / GRUPO */}
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
            <EdicionFormModalClient
              edicion={edicion}
              programas={programasCat || []}
              planes={planesCat || []}
              periodos={periodosCat || []}
              ciclos={ciclosCat || []}
              triggerText="Editar Edición"
              variant="outline"
            />
            <Link
              href={`/horarios?edicionId=${edicion.id}`}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-[#C4121A] text-white shadow-2xs text-xs font-bold transition-colors"
            >
              <Clock className="w-4 h-4" />
              <span>Ver Horario en Módulo Oficial</span>
            </Link>
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
              Matrícula:{' '}
              {edicion.precio_matricula !== null && edicion.precio_matricula !== undefined
                ? `S/ ${Number(edicion.precio_matricula).toFixed(2)}`
                : 'Sin configurar'}{' '}
              · Pensión:{' '}
              {edicion.precio_pension !== null && edicion.precio_pension !== undefined
                ? `S/ ${Number(edicion.precio_pension).toFixed(2)}`
                : 'Sin configurar'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. PROGRAMACIÓN Y HORARIOS CENTRALIZADOS EN EL MÓDULO OFICIAL */}
      <Card className="bg-white border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 bg-gradient-to-r from-slate-50 to-white">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-red-50 text-[#C4121A] border border-red-100">
                <Clock className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Programación de Horarios Académicos ({edicion.codigo})
                </h2>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 mt-0.5">
                  Módulo de Horarios Oficial
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              La planificación de clases, cuadrícula semanal exhaustiva (de 07:00 a 22:00 h de Lunes a Sábado), trazabilidad semanal de versiones y la generación del documento PDF oficial se gestionan de forma centralizada en el módulo oficial de <strong>Horarios</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href={`/oferta/ediciones/${edicion.id}/ficha`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition shadow-2xs"
            >
              <FileText className="w-4 h-4 text-[#C4121A]" />
              <span>Ficha PDF</span>
            </Link>
            <Link
              href={`/horarios?edicionId=${edicion.id}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C4121A] hover:bg-[#a00f15] text-white text-xs font-bold shadow-sm transition"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Abrir Cuadrícula en Horarios →</span>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}

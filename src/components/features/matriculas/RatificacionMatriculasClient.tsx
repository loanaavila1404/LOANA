'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Award,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  GraduationCap,
  Layers,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
  XCircle,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ConfirmModal, AlertModal } from '@/components/ui/Feedback';
import {
  EstudianteParaRatificacion,
  ratificarMatriculaIndividualAction,
  ratificarMatriculaMasivaAction,
} from '@/app/actions/matriculas/ratificacion';

interface RatificacionMatriculasClientProps {
  initialEstudiantes: EstudianteParaRatificacion[];
  programas: Array<{ id: string; codigo: string; nombre: string }>;
  ediciones: Array<{
    id: string;
    codigo: string;
    nombre: string;
    programa_id: string | null;
    ciclo_id: string | null;
    ciclos?: { numero_orden?: number; nombre?: string } | null;
  }>;
}

export function RatificacionMatriculasClient({
  initialEstudiantes,
  programas,
  ediciones,
}: RatificacionMatriculasClientProps) {
  const router = useRouter();
  const [estudiantes, setEstudiantes] = useState<EstudianteParaRatificacion[]>(initialEstudiantes);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrograma, setSelectedPrograma] = useState<string>('TODOS');
  const [selectedCiclo, setSelectedCiclo] = useState<string>('TODOS');
  const [selectedCondicion, setSelectedCondicion] = useState<string>('TODOS');

  const [isPending, startTransition] = useTransition();

  // Estados para Modal de Confirmación Individual
  const [estudianteToPromote, setEstudianteToPromote] = useState<EstudianteParaRatificacion | null>(null);
  const [selectedEdicionDestinoId, setSelectedEdicionDestinoId] = useState<string>('');

  // Estados para Modal de Confirmación Masiva
  const [showMassConfirm, setShowMassConfirm] = useState(false);

  // Estados para Modales de Alerta / Feedback
  const [alertFeedback, setAlertFeedback] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    variant: 'success' | 'error' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    description: '',
    variant: 'info',
  });

  // Filtrado de estudiantes
  const filteredEstudiantes = estudiantes.filter(e => {
    const matchesSearch =
      searchTerm === '' ||
      e.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.codigoEstudiante.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.numeroDocumento.includes(searchTerm);

    const matchesPrograma = selectedPrograma === 'TODOS' || e.programaId === selectedPrograma;
    const matchesCiclo = selectedCiclo === 'TODOS' || String(e.cicloActualNumero) === selectedCiclo;
    const matchesCondicion =
      selectedCondicion === 'TODOS' ||
      (selectedCondicion === 'APTO' && e.condicion === 'REGULAR') ||
      (selectedCondicion === 'CONDICIONAL' && e.condicion === 'APTO_CON_ARRASTRES') ||
      (selectedCondicion === 'BLOQUEADO' && e.condicion === 'BLOQUEADO_TRES_ARRASTRES');

    return matchesSearch && matchesPrograma && matchesCiclo && matchesCondicion;
  });

  // Métricas
  const totalEnEvaluacion = filteredEstudiantes.length;
  const aptosDirectos = filteredEstudiantes.filter(e => e.condicion === 'REGULAR').length;
  const aptosCondicionales = filteredEstudiantes.filter(e => e.condicion === 'APTO_CON_ARRASTRES').length;
  const bloqueadosTresArrastres = filteredEstudiantes.filter(e => e.condicion === 'BLOQUEADO_TRES_ARRASTRES').length;
  const totalPromocionables = aptosDirectos + aptosCondicionales;

  // Manejar apertura de modal individual
  const handleOpenIndividualModal = (est: EstudianteParaRatificacion) => {
    if (est.condicion === 'BLOQUEADO_TRES_ARRASTRES') {
      setAlertFeedback({
        isOpen: true,
        title: 'Promoción Bloqueada por Reglamento',
        description: `El estudiante ${est.nombreCompleto} registra ${est.arrastresCount} asignaturas desaprobadas. Conforme a la normativa académica de Brusben, se encuentra AUTOMÁTICAMENTE BLOQUEADO para matricularse en el ciclo regular siguiente y debe regularizar obligatoriamente en Ciclo de Verano.`,
        variant: 'error',
      });
      return;
    }

    setEstudianteToPromote(est);

    // Buscar una edición disponible para el siguiente ciclo
    const matchEdicion = ediciones.find(ed => {
      const ord = ed.ciclos?.numero_orden;
      return ed.programa_id === est.programaId && ord === est.cicloSiguienteNumero;
    }) || ediciones.find(ed => ed.programa_id === est.programaId) || ediciones[0];

    setSelectedEdicionDestinoId(matchEdicion?.id || '');
  };

  // Confirmar promoción individual
  const handleConfirmIndividualPromotion = () => {
    if (!estudianteToPromote) return;

    const targetEdId = selectedEdicionDestinoId || ediciones[0]?.id;
    if (!targetEdId) {
      setAlertFeedback({
        isOpen: true,
        title: 'Error de Configuración',
        description: 'No hay ninguna edición académica activa disponible para el ciclo destino.',
        variant: 'error',
      });
      return;
    }

    startTransition(async () => {
      const res = await ratificarMatriculaIndividualAction({
        estudianteId: estudianteToPromote.estudianteId,
        edicionOrigenId: estudianteToPromote.edicionActualId,
        edicionDestinoId: targetEdId,
        cicloDestinoNumero: estudianteToPromote.cicloSiguienteNumero,
      });

      setEstudianteToPromote(null);

      if (res.success) {
        setAlertFeedback({
          isOpen: true,
          title: '¡Promoción Exitosa!',
          description: res.message || 'La matrícula fue ratificada y promovida al siguiente ciclo con éxito.',
          variant: 'success',
        });
        router.refresh();
      } else {
        setAlertFeedback({
          isOpen: true,
          title: 'No se pudo promover',
          description: res.error || 'Ocurrió un error al procesar la ratificación.',
          variant: 'error',
        });
      }
    });
  };

  // Confirmar promoción masiva
  const handleConfirmMassPromotion = () => {
    setShowMassConfirm(false);

    const aptos = filteredEstudiantes.filter(e => e.aptoParaPromocion);
    if (aptos.length === 0) {
      setAlertFeedback({
        isOpen: true,
        title: 'Sin Estudiantes Aptos',
        description: 'No hay estudiantes aptos para promoción masiva con los filtros actuales.',
        variant: 'warning',
      });
      return;
    }

    startTransition(async () => {
      const items = aptos.map(est => {
        const matchEd = ediciones.find(ed => {
          const ord = ed.ciclos?.numero_orden;
          return ed.programa_id === est.programaId && ord === est.cicloSiguienteNumero;
        }) || ediciones[0];

        return {
          estudianteId: est.estudianteId,
          edicionOrigenId: est.edicionActualId,
          edicionDestinoId: matchEd?.id || '',
          cicloDestinoNumero: est.cicloSiguienteNumero,
        };
      });

      const res = await ratificarMatriculaMasivaAction({
        estudiantesIds: items.map(i => i.estudianteId),
        edicionOrigenId: items[0]?.edicionOrigenId || '',
        edicionDestinoId: items[0]?.edicionDestinoId || '',
        cicloDestinoNumero: items[0]?.cicloDestinoNumero || 2,
      });

      setAlertFeedback({
        isOpen: true,
        title: res.success ? 'Promoción Masiva Finalizada' : 'Atención en Promoción Masiva',
        description: res.message,
        variant: res.success ? 'success' : 'warning',
      });
      router.refresh();
    });
  };

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-12 text-slate-800">
      {/* ============================================================== */}
      {/* 1. CABECERA INSTITUCIONAL                                      */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              href="/matriculas"
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Volver a Matrículas y Cobranzas</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-50 text-[#C4121A] border border-red-100 shadow-2xs">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight">
                  Ratificación y Promoción Automática de Matrículas
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-[#C4121A] border border-red-200 uppercase font-mono">
                  Del 1ro al 6to Ciclo
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluación académica automatizada, control estricto de arrastres (&lt;3 permitidos) y generación de cronogramas en 1 clic.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.refresh()}
            disabled={isPending}
            className="text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`} />
            <span>Actualizar Padrón</span>
          </Button>

          <Button
            type="button"
            onClick={() => setShowMassConfirm(true)}
            disabled={isPending || totalPromocionables === 0}
            className="bg-[#C4121A] hover:bg-[#a00e15] text-white text-xs font-bold flex items-center gap-2 shadow-xs"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ratificar Aptos ({totalPromocionables})</span>
          </Button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. TARJETAS DE KPIS DE PROMOCIÓN                               */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Estudiantes en Evaluación */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Estudiantes Evaluados
            </span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-heading text-slate-900">
              {totalEnEvaluacion}
            </span>
            <span className="text-xs text-slate-500">estudiantes</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Matrículas activas en ciclo concluido
          </p>
        </div>

        {/* KPI 2: Aptos Invicto (Sin Arrastres) */}
        <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-2xs bg-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Aptos Invicto (0 Arrastres)
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-heading text-emerald-700">
              {aptosDirectos}
            </span>
            <span className="text-xs text-emerald-800">habilitados</span>
          </div>
          <p className="text-[11px] text-emerald-700 mt-1">
            Promoción directa sin observaciones
          </p>
        </div>

        {/* KPI 3: Aptos Condicionales (1 o 2 Arrastres) */}
        <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-2xs bg-amber-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Aptos con Arrastre (1-2)
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-heading text-amber-700">
              {aptosCondicionales}
            </span>
            <span className="text-xs text-amber-800">condicionales</span>
          </div>
          <p className="text-[11px] text-amber-700 mt-1">
            Permitidos según reglamento de Brusben
          </p>
        </div>

        {/* KPI 4: Bloqueados por 3+ Arrastres */}
        <div className="bg-white border border-rose-300 rounded-2xl p-4 shadow-2xs bg-rose-50/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
              Bloqueados (3+ Arrastres)
            </span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-heading text-rose-700">
              {bloqueadosTresArrastres}
            </span>
            <span className="text-xs text-rose-800">bloqueados</span>
          </div>
          <p className="text-[11px] text-rose-700 font-semibold mt-1">
            Requieren Ciclo de Verano / Nivelación
          </p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. BARRA DE FILTROS Y BÚSQUEDA                                 */}
      {/* ============================================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar por nombre, DNI o código..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          {/* Filtro por Carrera */}
          <div>
            <select
              value={selectedPrograma}
              onChange={e => setSelectedPrograma(e.target.value)}
              className="w-full text-xs font-semibold rounded-lg border border-slate-300 bg-white p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#C4121A]"
            >
              <option value="TODOS">Todos los Programas Técnicos</option>
              {programas.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nombre} ({p.codigo})
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Ciclo Origen */}
          <div>
            <select
              value={selectedCiclo}
              onChange={e => setSelectedCiclo(e.target.value)}
              className="w-full text-xs font-semibold rounded-lg border border-slate-300 bg-white p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#C4121A]"
            >
              <option value="TODOS">Todos los Ciclos de Origen</option>
              <option value="1">Ciclo I &rarr; Promover a Ciclo II</option>
              <option value="2">Ciclo II &rarr; Promover a Ciclo III</option>
              <option value="3">Ciclo III &rarr; Promover a Ciclo IV</option>
              <option value="4">Ciclo IV &rarr; Promover a Ciclo V</option>
              <option value="5">Ciclo V &rarr; Promover a Ciclo VI</option>
            </select>
          </div>

          {/* Filtro por Condición Académica */}
          <div>
            <select
              value={selectedCondicion}
              onChange={e => setSelectedCondicion(e.target.value)}
              className="w-full text-xs font-semibold rounded-lg border border-slate-300 bg-white p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#C4121A]"
            >
              <option value="TODOS">Todas las Condiciones</option>
              <option value="APTO">Apto Invicto (0 arrastres)</option>
              <option value="CONDICIONAL">Apto Condicional (1-2 arrastres)</option>
              <option value="BLOQUEADO">Bloqueado (3+ arrastres)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. TABLA DE EVALUACIÓN Y RATIFICACIÓN                          */}
      {/* ============================================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-[10px] uppercase font-bold">
                <th className="py-3 px-4">Estudiante / Código</th>
                <th className="py-3 px-3">Programa / Carrera</th>
                <th className="py-3 px-3">Ciclo Actual</th>
                <th className="py-3 px-3">Promoción Destino</th>
                <th className="py-3 px-2 text-center">PPA Ciclo</th>
                <th className="py-3 px-3 text-center">Arrastres</th>
                <th className="py-3 px-3">Condición Oficial</th>
                <th className="py-3 px-4 text-right">Acción de Ratificación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredEstudiantes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No se encontraron estudiantes para ratificar con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredEstudiantes.map(est => {
                  const isBlocked = est.condicion === 'BLOQUEADO_TRES_ARRASTRES';
                  const isConditional = est.condicion === 'APTO_CON_ARRASTRES';

                  return (
                    <tr
                      key={est.estudianteId}
                      className={`hover:bg-slate-50/70 transition ${
                        isBlocked ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      {/* Estudiante y DNI */}
                      <td className="py-3 px-4">
                        <Link
                          href={`/personas/${est.personaId}`}
                          className="font-bold text-slate-900 hover:text-[#C4121A] transition block"
                        >
                          {est.nombreCompleto}
                        </Link>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span className="font-mono">{est.codigoEstudiante}</span>
                          <span>•</span>
                          <span>{est.tipoDocumento}: {est.numeroDocumento}</span>
                        </div>
                      </td>

                      {/* Programa */}
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-800 block">
                          {est.programaNombre}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {est.edicionActualNombre}
                        </span>
                      </td>

                      {/* Ciclo Actual */}
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs">
                          {est.cicloActualNombre}
                        </span>
                      </td>

                      {/* Promoción Destino */}
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 text-[#C4121A] font-bold text-xs border border-red-200">
                          <span>{est.cicloSiguienteNombre}</span>
                          <ArrowRight className="w-3 h-3 text-[#C4121A]" />
                        </span>
                      </td>

                      {/* PPA Ciclo */}
                      <td className="py-3 px-2 text-center font-mono font-bold text-slate-800">
                        {est.promedioCicloActual.toFixed(2)}
                      </td>

                      {/* Arrastres */}
                      <td className="py-3 px-3 text-center">
                        {est.arrastresCount > 0 ? (
                          <div className="space-y-0.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                                isBlocked
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}
                            >
                              {est.arrastresCount} curso(s)
                            </span>
                            {est.arrastresDetalle.length > 0 && (
                              <div className="text-[10px] text-slate-500 font-mono">
                                {est.arrastresDetalle.map(a => a.cursoCodigo).join(', ')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-bold">
                            0 cursos
                          </span>
                        )}
                      </td>

                      {/* Condición */}
                      <td className="py-3 px-3">
                        {isBlocked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <ShieldAlert className="w-3 h-3 text-rose-600" />
                            <span>BLOQUEADO (3+ arrastres)</span>
                          </span>
                        ) : isConditional ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>APTO CONDICIONAL</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>APTO REGULAR</span>
                          </span>
                        )}
                      </td>

                      {/* Acción de Ratificación */}
                      <td className="py-3 px-4 text-right">
                        {isBlocked ? (
                          <Link
                            href={`/matriculas/nueva?estudiante_id=${est.estudianteId}&tipo=VERANO`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300 text-xs font-bold transition"
                          >
                            <Calendar className="w-3.5 h-3.5 text-rose-600" />
                            <span>Derivar a Verano</span>
                          </Link>
                        ) : (
                          <Button
                            type="button"
                            onClick={() => handleOpenIndividualModal(est)}
                            disabled={isPending}
                            className="bg-[#C4121A] hover:bg-[#a00e15] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs"
                          >
                            <span>Ratificar al Ciclo {est.cicloSiguienteNumero}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 5. MODAL DE CONFIRMACIÓN INDIVIDUAL DE RATIFICACIÓN            */}
      {/* ============================================================== */}
      {estudianteToPromote && (
        <ConfirmModal
          isOpen={Boolean(estudianteToPromote)}
          onClose={() => setEstudianteToPromote(null)}
          onConfirm={handleConfirmIndividualPromotion}
          title={`Ratificar Matrícula al Ciclo ${estudianteToPromote.cicloSiguienteNumero}`}
          description={
            <div className="space-y-3 text-xs text-slate-700">
              <p>
                Está a punto de formalizar la promoción de matrícula para{' '}
                <strong className="text-slate-900">{estudianteToPromote.nombreCompleto}</strong>{' '}
                (<span className="font-mono">{estudianteToPromote.codigoEstudiante}</span>).
              </p>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Programa Técnico:</span>
                  <span className="font-bold text-slate-900">{estudianteToPromote.programaNombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Transición Académica:</span>
                  <span className="font-bold text-[#C4121A]">
                    {estudianteToPromote.cicloActualNombre} &rarr; {estudianteToPromote.cicloSiguienteNombre}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Arrastres Registrados:</span>
                  <span className="font-mono font-bold">
                    {estudianteToPromote.arrastresCount} asignatura(s)
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">
                  Seleccionar Grupo / Edición Destino:
                </label>
                <select
                  value={selectedEdicionDestinoId}
                  onChange={e => setSelectedEdicionDestinoId(e.target.value)}
                  className="w-full text-xs font-semibold rounded-lg border border-slate-300 bg-white p-2 text-slate-900"
                >
                  {ediciones
                    .filter(ed => ed.programa_id === estudianteToPromote.programaId)
                    .map(ed => (
                      <option key={ed.id} value={ed.id}>
                        {ed.nombre} ({ed.codigo})
                      </option>
                    ))}
                </select>
              </div>

              <p className="text-[11px] text-slate-500">
                Al confirmar, el sistema creará la matrícula activa en la edición seleccionada, generará automáticamente el cronograma de matrícula + cuotas de pensión y registrará el evento en la bitácora de auditoría institucional.
              </p>
            </div>
          }
          confirmText={`Sí, Promover al Ciclo ${estudianteToPromote.cicloSiguienteNumero}`}
          cancelText="Cancelar"
          variant="primary"
          isLoading={isPending}
        />
      )}

      {/* ============================================================== */}
      {/* 6. MODAL DE CONFIRMACIÓN MASIVA DE APTOS                       */}
      {/* ============================================================== */}
      <ConfirmModal
        isOpen={showMassConfirm}
        onClose={() => setShowMassConfirm(false)}
        onConfirm={handleConfirmMassPromotion}
        title={`Ratificación Masiva de Matrículas (${totalPromocionables} Estudiantes)`}
        description={`¿Desea promover en lote a los ${totalPromocionables} estudiantes aptos visibles con los filtros actuales? Los estudiantes con 3 o más arrastres serán omitidos y resguardados para su derivación al Ciclo de Verano.`}
        confirmText="Confirmar Promoción Masiva"
        cancelText="Revisar Lista"
        variant="primary"
        isLoading={isPending}
      />

      {/* ============================================================== */}
      {/* 7. MODAL NATIVO DE ALERTA Y FEEDBACK                           */}
      {/* ============================================================== */}
      <AlertModal
        isOpen={alertFeedback.isOpen}
        onClose={() => setAlertFeedback(prev => ({ ...prev, isOpen: false }))}
        title={alertFeedback.title}
        description={alertFeedback.description}
        variant={alertFeedback.variant}
        buttonText="Entendido"
      />
    </div>
  );
}

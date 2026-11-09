'use client'

import { Database } from '@/types/database.types';
import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  createPlanAction,
  updatePlanAction,
  createCicloAction,
  updateCicloAction,
  createCursoAction,
  updateCursoAction,
  deleteCursoAction,
} from '@/app/actions/oferta/planes';
import { savePrerrequisitoAction } from '@/app/actions/academico/prerrequisitos';
import { ConfirmModal, AlertModal } from '@/components/ui/Feedback';

export function PlanFormModalClient({
  programaId,
  plan,
  trigger,
}: {
  programaId: string;
  plan?: Database['public']['Tables']['planes_estudio']['Row'];
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [codigo, setCodigo] = useState(plan?.codigo || '');
  const [nombre, setNombre] = useState(plan?.nombre || '');
  const [version, setVersion] = useState(plan?.version || '2026.1');
  const [totalCiclos, setTotalCiclos] = useState<string>(
    plan?.total_ciclos !== null && plan?.total_ciclos !== undefined
      ? String(plan.total_ciclos)
      : '2'
  );
  const [vigenciaDesde, setVigenciaDesde] = useState(
    plan?.fecha_vigencia_desde
      ? String(plan.fecha_vigencia_desde).slice(0, 10)
      : '2026-01-01'
  );
  const [vigenciaHasta, setVigenciaHasta] = useState(
    plan?.fecha_vigencia_hasta
      ? String(plan.fecha_vigencia_hasta).slice(0, 10)
      : ''
  );

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setCodigo(plan?.codigo || '');
      setNombre(plan?.nombre || '');
      setVersion(plan?.version || '2026.1');
      setTotalCiclos(
        plan?.total_ciclos !== null && plan?.total_ciclos !== undefined
          ? String(plan.total_ciclos)
          : '2'
      );
      setVigenciaDesde(
        plan?.fecha_vigencia_desde
          ? String(plan.fecha_vigencia_desde).slice(0, 10)
          : '2026-01-01'
      );
      setVigenciaHasta(
        plan?.fecha_vigencia_hasta
          ? String(plan.fecha_vigencia_hasta).slice(0, 10)
          : ''
      );
    }
  }, [isOpen, plan]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData();
    formData.append('programa_id', programaId);
    formData.append('codigo', codigo);
    formData.append('nombre', nombre);
    formData.append('version', version);
    formData.append('total_ciclos', totalCiclos);
    formData.append('fecha_vigencia_desde', vigenciaDesde);
    formData.append('fecha_vigencia_hasta', vigenciaHasta);
    formData.append('status', plan?.status || 'ACTIVO');

    startTransition(async () => {
      const res = plan
        ? await updatePlanAction(plan.id, formData)
        : await createPlanAction(formData);

      if (res?.error) {
        setError(res.error);
      } else {
        setIsOpen(false);
        router.refresh();
      }
    });
  };

  return (
    <>
      <div onClick={() => setIsOpen(true)} className="inline-block cursor-pointer">
        {trigger}
      </div>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={plan ? 'Editar Plan de Estudio' : 'Nuevo Plan de Estudio'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-slate-900">
          {error && (
            <div className="p-3 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Código del Plan *</label>
              <Input
                name="codigo"
                value={codigo}
                onChange={e => setCodigo(e.target.value)}
                required
                placeholder="EJ: PLN-2026-01"
                className="uppercase text-slate-900 bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Nombre del Plan *</label>
              <Input
                name="nombre"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                required
                placeholder="Ej: Plan Curricular 2026"
                className="text-slate-900 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Versión</label>
              <Input
                name="version"
                value={version}
                onChange={e => setVersion(e.target.value)}
                placeholder="Ej: 2026.1"
                className="text-slate-900 bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Total Ciclos</label>
              <Input
                type="number"
                name="total_ciclos"
                value={totalCiclos}
                onChange={e => setTotalCiclos(e.target.value)}
                min="1"
                className="text-slate-900 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Vigencia Desde</label>
              <Input
                type="date"
                name="fecha_vigencia_desde"
                value={vigenciaDesde}
                onChange={e => setVigenciaDesde(e.target.value)}
                className="text-slate-900 bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Vigencia Hasta</label>
              <Input
                type="date"
                name="fecha_vigencia_hasta"
                value={vigenciaHasta}
                onChange={e => setVigenciaHasta(e.target.value)}
                className="text-slate-900 bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-[#C4121A] hover:bg-[#a00e15] text-white"
            >
              {isPending ? 'Guardando...' : 'Guardar Plan'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function CicloFormModalClient({
  planId,
  ciclo,
  trigger,
}: {
  planId: string;
  ciclo?: Database['public']['Tables']['ciclos']['Row'];
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [numeroOrden, setNumeroOrden] = useState<string>(
    ciclo?.numero_orden !== null && ciclo?.numero_orden !== undefined
      ? String(ciclo.numero_orden)
      : '1'
  );
  const [nombre, setNombre] = useState(ciclo?.nombre || '');

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setNumeroOrden(
        ciclo?.numero_orden !== null && ciclo?.numero_orden !== undefined
          ? String(ciclo.numero_orden)
          : '1'
      );
      setNombre(ciclo?.nombre || '');
    }
  }, [isOpen, ciclo]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData();
    formData.append('plan_id', planId);
    formData.append('numero_orden', numeroOrden);
    formData.append('nombre', nombre);
    formData.append('status', ciclo?.status || 'ACTIVO');

    startTransition(async () => {
      const res = ciclo
        ? await updateCicloAction(ciclo.id, formData)
        : await createCicloAction(formData);

      if (res?.error) {
        setError(res.error);
      } else {
        setIsOpen(false);
        router.refresh();
      }
    });
  };

  return (
    <>
      <div onClick={() => setIsOpen(true)} className="inline-block cursor-pointer">
        {trigger}
      </div>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={ciclo ? 'Editar Ciclo Formativo' : 'Agregar Ciclo Formativo'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-slate-900">
          {error && (
            <div className="p-3 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              Número de Orden del Ciclo *
            </label>
            <Input
              type="number"
              name="numero_orden"
              value={numeroOrden}
              onChange={e => setNumeroOrden(e.target.value)}
              required
              min="1"
              placeholder="Ej: 1"
              className="text-slate-900 bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              Denominación del Ciclo (Opcional)
            </label>
            <Input
              name="nombre"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Ciclo I - Fundamentos Técnicos"
              className="text-slate-900 bg-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-[#C4121A] hover:bg-[#a00e15] text-white"
            >
              {isPending ? 'Guardando...' : 'Guardar Ciclo'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function CursoFormModalClient({
  planId,
  cicloId,
  curso,
  trigger,
}: {
  planId: string;
  cicloId: string;
  curso?: Database['public']['Tables']['cursos']['Row'];
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [codigo, setCodigo] = useState(curso?.codigo || '');
  const [nombre, setNombre] = useState(curso?.nombre || '');
  const [creditos, setCreditos] = useState<string>(
    curso?.creditos !== null && curso?.creditos !== undefined
      ? String(curso.creditos)
      : '4'
  );
  const [horasSemanales, setHorasSemanales] = useState<string>(
    curso?.horas_semanales !== null && curso?.horas_semanales !== undefined
      ? String(curso.horas_semanales)
      : '4'
  );
  const [prerrequisito, setPrerrequisito] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteFeedback, setDeleteFeedback] = useState<{
    title: string;
    message: string;
    variant: 'success' | 'error';
  } | null>(null);

  const handleDeleteCurso = () => {
    if (!curso) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteCursoAction(curso.id);
      if (result.error) {
        setDeleteFeedback({
          title: 'No se pudo eliminar la asignatura',
          message: result.error,
          variant: 'error',
        });
        setShowDeleteConfirm(false);
      } else {
        setShowDeleteConfirm(false);
        setIsOpen(false);
        router.refresh();
      }
    });
  };

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setCodigo(curso?.codigo || '');
      setNombre(curso?.nombre || '');
      setCreditos(
        curso?.creditos !== null && curso?.creditos !== undefined
          ? String(curso.creditos)
          : '4'
      );
      setHorasSemanales(
        curso?.horas_semanales !== null && curso?.horas_semanales !== undefined
          ? String(curso.horas_semanales)
          : '4'
      );
      setPrerrequisito('');
    }
  }, [isOpen, curso]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData();
    formData.append('plan_id', planId);
    formData.append('ciclo_id', cicloId);
    formData.append('codigo', codigo);
    formData.append('nombre', nombre);
    formData.append('creditos', creditos);
    formData.append('horas_semanales', horasSemanales);
    formData.append('status', curso?.status || 'ACTIVO');

    startTransition(async () => {
      const res = curso
        ? await updateCursoAction(curso.id, formData)
        : await createCursoAction(formData);

      if (res?.error) {
        setError(res.error);
      } else {
        const cursoId = (res as any)?.data?.id || curso?.id;
        if (cursoId) {
          await savePrerrequisitoAction(cursoId, prerrequisito.trim().toUpperCase() || null);
        }
        setIsOpen(false);
        router.refresh();
      }
    });
  };

  return (
    <>
      <div onClick={() => setIsOpen(true)} className="inline-block cursor-pointer">
        {trigger}
      </div>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={curso ? 'Editar Asignatura / Curso' : 'Agregar Asignatura al Ciclo'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-slate-900">
          {error && (
            <div className="p-3 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Código de Curso</label>
            <Input
              name="codigo"
              value={codigo}
              onChange={e => setCodigo(e.target.value)}
              placeholder="EJ: CRS-101"
              className="uppercase text-slate-900 bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              Nombre de la Asignatura *
            </label>
            <Input
              name="nombre"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              required
              placeholder="Ej: Anatomía y Fisiología Aplicada"
              className="text-slate-900 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Créditos</label>
              <Input
                type="number"
                name="creditos"
                value={creditos}
                onChange={e => setCreditos(e.target.value)}
                min="0"
                className="text-slate-900 bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Horas Semanales</label>
              <Input
                type="number"
                name="horas_semanales"
                value={horasSemanales}
                onChange={e => setHorasSemanales(e.target.value)}
                min="0"
                className="text-slate-900 bg-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              Prerrequisito Académico (Código de Curso Previo)
            </label>
            <Input
              name="prerrequisito"
              value={prerrequisito}
              onChange={e => setPrerrequisito(e.target.value.toUpperCase())}
              placeholder="Ej: ENF-101, CON-101 (opcional)"
              className="uppercase text-slate-900 bg-white font-mono"
            />
            <p className="text-[10.5px] text-slate-500">
              Asignatura obligatoria que el estudiante debe tener aprobada para cursar esta materia.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-100">
            {curso ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isPending}
                className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700 font-semibold"
              >
                Borrar Asignatura
              </Button>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-[#C4121A] hover:bg-[#a00e15] text-white"
              >
                {isPending ? 'Guardando...' : 'Guardar Curso'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal Nativo de Doble Confirmación para Eliminar Curso */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteCurso}
        title="Eliminar Asignatura / Curso"
        description={`¿Estás seguro de que deseas eliminar permanentemente la asignatura "${curso?.nombre || ''}" (${curso?.codigo || ''})? Esta acción se registrará en la bitácora institucional de auditoría y no se permitirá si registra evaluaciones en actas.`}
        confirmText="Sí, Eliminar Asignatura"
        cancelText="Conservar Asignatura"
        variant="danger"
        isLoading={isPending}
      />

      {/* Modal de Alerta / Feedback */}
      {deleteFeedback && (
        <AlertModal
          isOpen={Boolean(deleteFeedback)}
          onClose={() => setDeleteFeedback(null)}
          title={deleteFeedback.title}
          description={deleteFeedback.message}
          variant={deleteFeedback.variant}
        />
      )}
    </>
  );
}

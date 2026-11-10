'use client'

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Database } from '@/types/database.types';
import {
  createProgramaAction,
  updateProgramaAction,
  toggleProgramaStatusAction,
  deleteProgramaAction,
  getNextProgramaCodigoAction,
} from '@/app/actions/oferta/programas';
import { ConfirmModal, AlertModal } from '@/components/ui/Feedback';

type Programa = Database['public']['Tables']['programas']['Row'] & {
  inversionMatricula?: number | null;
  inversionMensual?: number | null;
  precio_matricula?: number | null;
  precio_pension?: number | null;
};

export function ProgramaFormModalClient({
  programa,
  triggerText = 'Nuevo Programa',
  variant = 'primary'
}: {
  programa?: Programa;
  triggerText?: string;
  variant?: 'primary' | 'outline' | 'ghost';
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [codigoValue, setCodigoValue] = useState(programa?.codigo || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteFeedback, setDeleteFeedback] = useState<{
    title: string;
    message: string;
    variant: 'success' | 'error';
  } | null>(null);

  const normalizeUnidad = (val?: string | null) => {
    const u = (val || 'Meses').trim().toUpperCase();
    if (u.startsWith('AÑ') || u.startsWith('AN')) return 'Años';
    if (u.startsWith('SEM')) return 'Semanas';
    if (u.startsWith('HOR')) return 'Horas';
    return 'Meses';
  };

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (programa?.codigo) {
      setCodigoValue(programa.codigo);
    } else {
      setCodigoValue('PRG-...');
      getNextProgramaCodigoAction()
        .then(code => setCodigoValue(code))
        .catch(() => setCodigoValue('PRG-001'));
    }
  }, [isOpen, programa]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    if (codigoValue && codigoValue !== 'PRG-...') {
      formData.set('codigo', codigoValue.trim().toUpperCase());
    } else {
      formData.set('codigo', '');
    }

    startTransition(async () => {
      let result;
      if (programa) {
        result = await updateProgramaAction(programa.id, {}, formData);
      } else {
        result = await createProgramaAction({}, formData);
      }

      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setIsOpen(false);
        router.refresh();
      }
    });
  };

  const handleToggleStatus = () => {
    if (!programa) return;
    setError(null);
    startTransition(async () => {
      const result = await toggleProgramaStatusAction(programa.id, programa.status || 'ACTIVO');
      if (result.error) {
        setError(result.error);
      } else {
        setIsOpen(false);
        router.refresh();
      }
    });
  };

  const handleDeletePrograma = () => {
    if (!programa) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteProgramaAction(programa.id);
      if (result.error) {
        setDeleteFeedback({
          title: 'No se pudo eliminar el programa',
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

  const initialMatricula =
    programa?.inversionMatricula ?? programa?.precio_matricula ?? '';
  const initialPension =
    programa?.inversionMensual ?? programa?.precio_pension ?? '';

  return (
    <>
      <Button variant={variant} onClick={() => setIsOpen(true)}>
        {triggerText}
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={programa ? 'Editar Programa Académico' : 'Nuevo Programa Académico'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-slate-900">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="codigo" className="text-xs font-semibold text-slate-700">
                  Código (Autogenerado)
                </label>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                  Automático
                </span>
              </div>
              <Input
                id="codigo"
                name="codigo"
                value={codigoValue}
                onChange={e => setCodigoValue(e.target.value.toUpperCase())}
                placeholder="PRG-001 (Automático)"
                className="uppercase font-mono font-bold text-slate-900 bg-slate-50 focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="tipo_programa" className="text-xs font-semibold text-slate-700">
                Tipo de Programa *
              </label>
              <select
                id="tipo_programa"
                name="tipo_programa"
                defaultValue={programa?.tipo_programa || 'CARRERA_TECNICA'}
                className="w-full h-[38px] border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              >
                <option value="CARRERA_TECNICA">Carrera Técnica</option>
                <option value="CURSO_CORTO">Curso Corto</option>
                <option value="PROGRAMA_VARIABLE">Programa Variable</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="nombre" className="text-xs font-semibold text-slate-700">
              Nombre del Programa *
            </label>
            <Input
              id="nombre"
              name="nombre"
              defaultValue={programa?.nombre || ''}
              required
              placeholder="Ej: Enfermería Técnica"
              className="text-slate-900 bg-white"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="descripcion" className="text-xs font-semibold text-slate-700">
              Descripción / Sumilla (opcional)
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              defaultValue={programa?.descripcion || ''}
              rows={3}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label htmlFor="total_ciclos" className="text-xs font-semibold text-slate-700">
                Total Ciclos
              </label>
              <Input
                id="total_ciclos"
                name="total_ciclos"
                type="number"
                min="1"
                defaultValue={programa?.total_ciclos || ''}
                className="text-slate-900 bg-white"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="duracion_cantidad" className="text-xs font-semibold text-slate-700">
                Duración
              </label>
              <Input
                id="duracion_cantidad"
                name="duracion_cantidad"
                type="number"
                min="1"
                defaultValue={programa?.duracion_cantidad || ''}
                className="text-slate-900 bg-white"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="duracion_unidad" className="text-xs font-semibold text-slate-700">
                Unidad
              </label>
              <select
                id="duracion_unidad"
                name="duracion_unidad"
                defaultValue={normalizeUnidad(programa?.duracion_unidad)}
                className="w-full h-[38px] border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="Meses">Meses</option>
                <option value="Años">Años</option>
                <option value="Semanas">Semanas</option>
                <option value="Horas">Horas</option>
              </select>
            </div>
          </div>

          {/* PASO 1: Campos de Precios (Derecho de Matrícula e Inversión Mensual / Pensión) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div className="space-y-1">
              <label htmlFor="precio_matricula" className="text-xs font-semibold text-slate-700">
                Derecho de Matrícula (S/)
              </label>
              <Input
                id="precio_matricula"
                name="precio_matricula"
                type="number"
                step="0.01"
                min="0"
                defaultValue={initialMatricula}
                placeholder="Ej: 100.00"
                className="text-slate-900 bg-white"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="precio_pension" className="text-xs font-semibold text-slate-700">
                Inversión Mensual / Pensión (S/)
              </label>
              <Input
                id="precio_pension"
                name="precio_pension"
                type="number"
                step="0.01"
                min="0"
                defaultValue={initialPension}
                placeholder="Ej: 250.00"
                className="text-slate-900 bg-white"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-100">
            {programa ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleToggleStatus}
                  disabled={isPending}
                  className={
                    programa.status === 'ACTIVO'
                      ? 'text-amber-700 border-amber-300 hover:bg-amber-50'
                      : 'text-green-600 border-green-200 hover:bg-green-50'
                  }
                >
                  {programa.status === 'ACTIVO' ? 'Inactivar Programa' : 'Activar Programa'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isPending}
                  className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700 font-semibold"
                >
                  Borrar Programa
                </Button>
              </div>
            ) : (
              <div />
            )}
            <div className="space-x-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal Nativo de Doble Confirmación para Eliminar Programa */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeletePrograma}
        title="Eliminar Programa Académico"
        description={`¿Estás seguro de que deseas eliminar permanentemente el programa "${programa?.nombre || ''}" (${programa?.codigo || ''})? Se eliminarán de forma física y en cascada sus planes de estudio, cursos, ciclos y elementos asociados, registrando un asiento inalterable en la bitácora institucional de auditoría.`}
        confirmText="Sí, Eliminar Programa"
        cancelText="Conservar Programa"
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

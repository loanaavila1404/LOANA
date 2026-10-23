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
  getNextProgramaCodigoAction,
} from '@/app/actions/oferta/programas';

type Programa = Database['public']['Tables']['programas']['Row'];

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
              Descripción (opcional)
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

          <div className="flex justify-between pt-4 border-t border-slate-100">
            {programa ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleToggleStatus}
                disabled={isPending}
                className={
                  programa.status === 'ACTIVO'
                    ? 'text-red-600 border-red-200 hover:bg-red-50'
                    : 'text-green-600 border-green-200 hover:bg-green-50'
                }
              >
                {programa.status === 'ACTIVO' ? 'Inactivar Programa' : 'Activar Programa'}
              </Button>
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
    </>
  );
}

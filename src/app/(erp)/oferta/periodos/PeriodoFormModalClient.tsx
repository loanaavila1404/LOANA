'use client'

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Database } from '@/types/database.types';
import { createPeriodoAction, updatePeriodoAction, togglePeriodoStatusAction } from '@/app/actions/oferta/periodos';

type Periodo = Database['public']['Tables']['periodos']['Row'];

export function PeriodoFormModalClient({ 
  periodo,
  triggerText = '+ Nuevo Periodo',
  variant = 'primary'
}: { 
  periodo?: Periodo;
  triggerText?: string;
  variant?: 'primary' | 'outline' | 'ghost';
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      let result;
      if (periodo) result = await updatePeriodoAction(periodo.id, formData);
      else result = await createPeriodoAction(formData);

      if (result.error) {
        setError(result.error);
      } else {
        setIsOpen(false);
        router.refresh();
      }
    });
  };

  const handleToggleStatus = () => {
    if (!periodo) return;
    setError(null);
    startTransition(async () => {
      const result = await togglePeriodoStatusAction(periodo.id, periodo.status || 'ACTIVO');
      if (result.error) {
        setError(result.error);
      } else {
        setIsOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <>
      <Button variant={variant} onClick={() => setIsOpen(true)}>
        {triggerText}
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={periodo ? 'Editar Periodo Académico' : 'Nuevo Periodo Académico'}>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-slate-900">
          {error && <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Código del Periodo *</label>
            <Input
              name="codigo"
              defaultValue={periodo?.codigo || `${new Date().getFullYear()}-I`}
              required
              placeholder="EJ: 2026-I"
              className="uppercase font-mono text-slate-900 bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Nombre Oficial *</label>
            <Input
              name="nombre"
              defaultValue={periodo?.nombre || ''}
              required
              placeholder="Ej: Primer Semestre Académico 2026"
              className="text-slate-900 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Fecha de Inicio</label>
              <Input
                type="date"
                name="fecha_inicio"
                defaultValue={periodo?.fecha_inicio || ''}
                className="text-slate-900 bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Fecha de Fin</label>
              <Input
                type="date"
                name="fecha_fin"
                defaultValue={periodo?.fecha_fin || ''}
                className="text-slate-900 bg-white"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            {periodo ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleToggleStatus}
                disabled={isPending}
                className={periodo.status === 'ACTIVO' ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-green-600 border-green-200 hover:bg-green-50'}
              >
                {periodo.status === 'ACTIVO' ? 'Inactivar' : 'Activar'}
              </Button>
            ) : <div />}
            <div className="space-x-2">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={isPending}>
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

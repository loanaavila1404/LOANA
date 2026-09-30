'use client'

import { useState, useTransition } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Database } from '@/types/database.types';
import { createPeriodoAction, updatePeriodoAction, togglePeriodoStatusAction } from '@/app/actions/oferta/periodos';

type Periodo = Database['public']['Tables']['periodos']['Row'];

export function PeriodoFormModalClient({ 
  periodo,
  triggerText = 'Nuevo Periodo',
  variant = 'primary'
}: { 
  periodo?: Periodo;
  triggerText?: string;
  variant?: 'primary' | 'outline' | 'ghost';
}) {
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

      if (result.error) setError(result.error);
      else setIsOpen(false);
    });
  };

  const handleToggleStatus = () => {
    if (!periodo) return;
    setError(null);
    startTransition(async () => {
      const result = await togglePeriodoStatusAction(periodo.id, periodo.status || 'ACTIVO');
      if (result.error) setError(result.error);
      else setIsOpen(false);
    });
  }

  return (
    <>
      <Button variant={variant} onClick={() => setIsOpen(true)}>
        {triggerText}
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={periodo ? 'Editar Periodo' : 'Nuevo Periodo'}>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {error && <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>}

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Código</label>
            <Input name="codigo" defaultValue={periodo?.codigo} required placeholder="EJ: 2024-I" className="uppercase" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Nombre</label>
            <Input name="nombre" defaultValue={periodo?.nombre} required placeholder="Ej: Primer Semestre 2024" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Fecha de Inicio</label>
              <Input type="date" name="fecha_inicio" defaultValue={periodo?.fecha_inicio || ''} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Fecha de Fin</label>
              <Input type="date" name="fecha_fin" defaultValue={periodo?.fecha_fin || ''} />
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            {periodo ? (
              <Button type="button" variant="outline" onClick={handleToggleStatus} disabled={isPending} className={periodo.status === 'ACTIVO' ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-green-600 border-green-200 hover:bg-green-50'}>
                {periodo.status === 'ACTIVO' ? 'Inactivar' : 'Activar'}
              </Button>
            ) : <div />}
            <div className="space-x-2">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={isPending}>Cancelar</Button>
              <Button type="submit" disabled={isPending}>Guardar</Button>
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}

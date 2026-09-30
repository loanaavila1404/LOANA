'use client'

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Database } from '@/types/database.types';
import { createProgramaAction, updateProgramaAction, toggleProgramaStatusAction } from '@/app/actions/oferta/programas';
import { useTransition } from 'react';

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
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    
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
      }
    });
  }

  return (
    <>
      <Button variant={variant} onClick={() => setIsOpen(true)}>
        {triggerText}
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={programa ? 'Editar Programa' : 'Nuevo Programa'}>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="codigo" className="text-xs font-medium text-slate-700">Código</label>
              <Input id="codigo" name="codigo" defaultValue={programa?.codigo} required placeholder="EJ: PRG-001" className="uppercase" />
            </div>
            
            <div className="space-y-1">
              <label htmlFor="tipo_programa" className="text-xs font-medium text-slate-700">Tipo de Programa</label>
              <select 
                id="tipo_programa" 
                name="tipo_programa" 
                defaultValue={programa?.tipo_programa || 'CARRERA_TECNICA'}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              >
                <option value="CARRERA_TECNICA">Carrera Técnica</option>
                <option value="CURSO_CORTO">Curso Corto</option>
                <option value="PROGRAMA_VARIABLE">Programa Variable</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="nombre" className="text-xs font-medium text-slate-700">Nombre del Programa</label>
            <Input id="nombre" name="nombre" defaultValue={programa?.nombre} required placeholder="Ej: Enfermería Técnica" />
          </div>

          <div className="space-y-1">
            <label htmlFor="descripcion" className="text-xs font-medium text-slate-700">Descripción (opcional)</label>
            <textarea 
              id="descripcion" 
              name="descripcion" 
              defaultValue={programa?.descripcion || ''} 
              rows={3}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label htmlFor="total_ciclos" className="text-xs font-medium text-slate-700">Total Ciclos</label>
              <Input id="total_ciclos" name="total_ciclos" type="number" min="1" defaultValue={programa?.total_ciclos || ''} />
            </div>
            <div className="space-y-1">
              <label htmlFor="duracion_cantidad" className="text-xs font-medium text-slate-700">Duración</label>
              <Input id="duracion_cantidad" name="duracion_cantidad" type="number" min="1" defaultValue={programa?.duracion_cantidad || ''} />
            </div>
            <div className="space-y-1">
              <label htmlFor="duracion_unidad" className="text-xs font-medium text-slate-700">Unidad</label>
              <Input id="duracion_unidad" name="duracion_unidad" placeholder="Meses, Años" defaultValue={programa?.duracion_unidad || ''} />
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            {programa ? (
              <Button type="button" variant="outline" onClick={handleToggleStatus} disabled={isPending} className={programa.status === 'ACTIVO' ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-green-600 border-green-200 hover:bg-green-50'}>
                {programa.status === 'ACTIVO' ? 'Inactivar Programa' : 'Activar Programa'}
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

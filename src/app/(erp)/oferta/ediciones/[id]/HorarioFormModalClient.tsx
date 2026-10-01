'use client'

import { useState, useTransition } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Database } from '@/types/database.types';
import { createHorarioAction, updateHorarioAction } from '@/app/actions/oferta/horarios';

type Horario = Database['public']['Tables']['horarios']['Row'];
type Curso = Pick<Database['public']['Tables']['cursos']['Row'], 'id' | 'nombre' | 'codigo'>;

export function HorarioFormModalClient({ 
  edicionId,
  horario,
  cursos,
  triggerText = 'Nuevo Horario',
  variant = 'primary'
}: { 
  edicionId: string;
  horario?: Horario;
  cursos: Curso[];
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
    formData.append('edicion_id', edicionId);
    
    startTransition(async () => {
      let result;
      if (horario) result = await updateHorarioAction(horario.id, formData);
      else result = await createHorarioAction(formData);

      if (result.error) setError(result.error);
      else setIsOpen(false);
    });
  };

  return (
    <>
      <Button variant={variant} onClick={() => setIsOpen(true)}>
        {triggerText}
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={horario ? 'Editar Horario' : 'Nuevo Horario'}>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {error && <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>}

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Curso</label>
            <select 
              name="curso_id" 
              defaultValue={horario?.curso_id || ''}
              required
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
            >
              <option value="">Seleccione un curso...</option>
              {cursos.map(c => <option key={c.id} value={c.id}>{c.codigo ? `${c.codigo} - ` : ''}{c.nombre}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Día de la semana</label>
              <select name="dia_semana" defaultValue={horario?.dia_semana || ''} required className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                <option value="">Seleccione...</option>
                <option value="LUNES">Lunes</option>
                <option value="MARTES">Martes</option>
                <option value="MIERCOLES">Miércoles</option>
                <option value="JUEVES">Jueves</option>
                <option value="VIERNES">Viernes</option>
                <option value="SABADO">Sábado</option>
                <option value="DOMINGO">Domingo</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Hora Inicio (HH:MM)</label>
              <Input type="time" name="hora_inicio" defaultValue={horario?.hora_inicio || ''} required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Hora Fin (HH:MM)</label>
              <Input type="time" name="hora_fin" defaultValue={horario?.hora_fin || ''} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Docente</label>
              <Input name="docente" defaultValue={horario?.docente || ''} placeholder="Nombre del docente" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Ubicación / Enlace</label>
              <Input name="ubicacion" defaultValue={horario?.ubicacion || ''} placeholder="Ej: Aula 101" />
            </div>
          </div>

          <div className="flex justify-end pt-4 space-x-2 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={isPending}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>Guardar</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

'use client'

import { useState, useTransition } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createTareaAction, completeTareaAction } from '@/app/actions/crm/actividades';

export function TareaFormModalClient({ 
  prospectoId,
  triggerText = 'Programar Tarea',
  variant = 'primary'
}: { 
  prospectoId: string;
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
    formData.append('prospecto_id', prospectoId);
    
    startTransition(async () => {
      const result = await createTareaAction(formData);
      if (result.error) setError(result.error);
      else setIsOpen(false);
    });
  };

  return (
    <>
      <Button variant={variant} onClick={() => setIsOpen(true)}>
        {triggerText}
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Programar Tarea">
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {error && <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>}

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Título de Tarea *</label>
            <Input name="titulo" required placeholder="Ej: Llamar para confirmar asistencia" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Tipo</label>
              <select name="tipo_tarea" required className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                <option value="LLAMADA">Llamada</option>
                <option value="CORREO">Correo</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="REUNION">Reunión</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Fecha y Hora *</label>
              <Input type="datetime-local" name="fecha_programada" required />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Descripción (Opcional)</label>
            <textarea name="descripcion" rows={2} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"></textarea>
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

export function CompleteTareaButtonClient({ 
  tareaId,
  prospectoId 
}: { 
  tareaId: string;
  prospectoId: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleComplete = () => {
    const result = prompt("Ingresa el resultado de la tarea:");
    if (result !== null) {
      startTransition(async () => {
        const res = await completeTareaAction(tareaId, prospectoId, result);
        if (res.error) alert(res.error);
      });
    }
  };

  return (
    <button onClick={handleComplete} disabled={isPending} className="text-xs text-green-600 border border-green-200 bg-green-50 px-2 py-1 rounded hover:bg-green-100">
      {isPending ? 'Guardando...' : 'Completar'}
    </button>
  );
}

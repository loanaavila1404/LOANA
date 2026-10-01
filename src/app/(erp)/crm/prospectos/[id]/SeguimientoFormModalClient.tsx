'use client'

import { useState, useTransition } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createSeguimientoAction } from '@/app/actions/crm/actividades';

export function SeguimientoFormModalClient({ 
  prospectoId,
  currentStatus,
  triggerText = 'Registrar Actividad',
  variant = 'primary'
}: { 
  prospectoId: string;
  currentStatus: string;
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
      const result = await createSeguimientoAction(formData);
      if (result.error) setError(result.error);
      else setIsOpen(false);
    });
  };

  return (
    <>
      <Button variant={variant} onClick={() => setIsOpen(true)}>
        {triggerText}
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Registrar Actividad">
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {error && <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Tipo de Actividad</label>
              <select name="tipo_actividad" required className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                <option value="LLAMADA">Llamada</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="CORREO">Correo</option>
                <option value="REUNION">Reunión</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Resultado Breve</label>
              <Input name="resultado" placeholder="Ej: Contestó, No contesta, Interesado" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Notas de la Actividad *</label>
            <textarea name="nota" required rows={3} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"></textarea>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Actualizar Estado</label>
              <select name="estado_nuevo" defaultValue={currentStatus} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                <option value="NUEVO">NUEVO</option>
                <option value="SEGUIMIENTO">SEGUIMIENTO</option>
                <option value="ENTREVISTA">ENTREVISTA</option>
                <option value="MATRICULADO">MATRICULADO (CIERRE)</option>
                <option value="PERDIDO">PERDIDO</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Próximo Seguimiento</label>
              <Input type="datetime-local" name="proximo_seguimiento" />
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

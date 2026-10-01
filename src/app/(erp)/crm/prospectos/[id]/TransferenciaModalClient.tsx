'use client'

import { useState, useTransition } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { transferProspectoAction } from '@/app/actions/crm/prospectos';

export function TransferenciaModalClient({ 
  prospectoId,
  asesores,
  asesorActualId
}: { 
  prospectoId: string;
  asesores: { id: string, display_name: string | null, role_id: string | null }[];
  asesorActualId: string | null;
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
      const result = await transferProspectoAction(formData);
      if (result.error) setError(result.error);
      else setIsOpen(false);
    });
  };

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        Reasignar Asesor
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Reasignar Prospecto">
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {error && <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>}

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Nuevo Asesor</label>
            <select name="asesor_nuevo_id" required className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
              <option value="">Seleccione un asesor...</option>
              {asesores.filter(a => a.id !== asesorActualId).map(a => (
                <option key={a.id} value={a.id}>{a.display_name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Motivo de Reasignación</label>
            <textarea name="motivo" required rows={3} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"></textarea>
          </div>

          <div className="flex justify-end pt-4 space-x-2 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={isPending}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>Reasignar</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

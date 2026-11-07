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
  const [isOpen, setIsOpen] = useState(false);
  const [outcome, setOutcome] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleClose = () => {
    if (isPending) return;
    setIsOpen(false);
    setErrorMsg(null);
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outcome.trim()) {
      setErrorMsg('Por favor describe el resultado obtenido al realizar la tarea.');
      return;
    }
    setErrorMsg(null);
    startTransition(async () => {
      const res = await completeTareaAction(tareaId, prospectoId, outcome.trim());
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setIsOpen(false);
        setOutcome('');
      }
    });
  };

  return (
    <>
      <button 
        type="button"
        onClick={() => {
          setErrorMsg(null);
          setIsOpen(true);
        }} 
        disabled={isPending} 
        className="text-xs text-green-700 font-semibold border border-green-200 bg-green-50 px-2 py-1 rounded-md hover:bg-green-100 transition shadow-2xs"
      >
        {isPending ? 'Guardando...' : 'Completar Tarea'}
      </button>

      <Modal isOpen={isOpen} onClose={handleClose} title="Completar Tarea Comercial">
        <form onSubmit={handleConfirm} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Ingresa el resumen de la gestión o acuerdos alcanzados para registrarla en la bitácora permanente del cliente.
          </p>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Resultado obtenido *
            </label>
            <textarea
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              rows={3}
              placeholder="Ej: Se llamó al prospecto y confirmó que realizará el pago de matrícula el día viernes..."
              className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
              required
              autoFocus
            />
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || !outcome.trim()}
              className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition shadow-2xs"
            >
              {isPending ? 'Guardando...' : 'Confirmar Cumplimiento'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

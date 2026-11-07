'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateProspectoStatusAction } from '@/app/actions/crm/prospectos';
import { Modal } from '@/components/ui/Modal';
import { UserX, AlertCircle } from 'lucide-react';

const MOTIVOS_PERDIDA = [
  'Precio / Falta de presupuesto',
  'Horario incompatible',
  'Eligió otra institución o competencia',
  'No contesta llamadas ni WhatsApp / Inubicable',
  'Desistió / Ya no está interesado en estudiar',
  'Problemas personales o de salud',
  'Otro motivo',
] as const;

export function MarcarPerdidoButtonClient({ prospectoId }: { prospectoId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [motivo, setMotivo] = useState<string>(MOTIVOS_PERDIDA[0]);
  const [detalle, setDetalle] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleClose = () => {
    if (isPending) return;
    setIsOpen(false);
    setErrorMsg(null);
  };

  const handleConfirmPerdido = () => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await updateProspectoStatusAction(
        prospectoId,
        'PERDIDO',
        motivo,
        detalle.trim() || undefined
      );
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setIsOpen(false);
        router.refresh();
      }
    });
  };

  return (
    <>
      <button
        onClick={() => {
          setErrorMsg(null);
          setIsOpen(true);
        }}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 transition shadow-2xs"
        title="Marcar como prospecto perdido o no interesado"
      >
        <UserX className="w-3.5 h-3.5 text-slate-500" />
        <span>Marcar Perdido</span>
      </button>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Marcar Prospecto como Perdido"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Al marcar este prospecto como <strong>PERDIDO</strong>, se cerrará el seguimiento comercial activo pero se preservará todo su historial y notas para auditoría institucional.
          </p>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Motivo principal de descarte *
            </label>
            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              disabled={isPending}
              className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-slate-800 font-medium"
            >
              {MOTIVOS_PERDIDA.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Observaciones adicionales (opcional)
            </label>
            <textarea
              value={detalle}
              onChange={(e) => setDetalle(e.target.value)}
              disabled={isPending}
              rows={3}
              placeholder="Ej: El cliente solicitó volver a contactarlo en el ciclo de agosto..."
              className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-slate-800 placeholder:text-slate-400"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmPerdido}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 disabled:opacity-50 transition shadow-2xs"
            >
              <UserX className="w-3.5 h-3.5" />
              <span>{isPending ? 'Guardando...' : 'Confirmar Estado Perdido'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

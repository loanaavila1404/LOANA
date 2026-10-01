'use client'

import { useState, useTransition } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { registrarPagoAction } from '@/app/actions/matriculas';

export function PagoFormModalClient({
  estudianteId,
  cuotasPendientes
}: {
  estudianteId: string;
  cuotasPendientes: any[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [importe, setImporte] = useState<number>(0);
  const [medioPago, setMedioPago] = useState('TRANSFERENCIA');
  const [numeroOperacion, setNumeroOperacion] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');

  const handleOpen = () => {
    setIdempotencyKey(window.crypto.randomUUID());
    setIsOpen(true);
  };

  // Para simplificar, aplicaremos el pago automáticamente a la cuota más antigua
  // En un sistema real complejo, permitiríamos seleccionar a qué cuotas aplicar.

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (importe <= 0) {
      setError('El importe debe ser mayor a 0');
      return;
    }

    // Distribuir el importe entre las cuotas pendientes
    let remaining = importe;
    const aplicaciones = [];

    for (const c of cuotasPendientes) {
      if (remaining <= 0) break;
      const saldo = c.saldo === null ? c.importe_neto : c.saldo;
      const aAplicar = Math.min(saldo, remaining);
      aplicaciones.push({
        cuota_id: c.id,
        importe: aAplicar
      });
      remaining -= aAplicar;
    }

    if (remaining > 0) {
      setError('El importe es mayor al total de la deuda pendiente');
      return;
    }

    const payload = {
      idempotency_key: idempotencyKey,
      estudiante_id: estudianteId,
      importe: Number(importe),
      medio_pago: medioPago,
      numero_operacion: numeroOperacion,
      cuotas_aplicadas: aplicaciones
    };

    startTransition(async () => {
      const res = await registrarPagoAction(payload);
      if (res.error) {
        setError(res.error);
      } else {
        setIsOpen(false);
        setImporte(0);
        setNumeroOperacion('');
        setError(null);
      }
    });
  };

  if (!isOpen) {
    return (
      <Button onClick={handleOpen} className="bg-red-600 hover:bg-red-700 text-white">
        Registrar Pago
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 bg-white shadow-xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-xl font-bold text-slate-800 mb-6">Registrar Pago</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">{error}</div>}

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Importe a Pagar (S/)</label>
            <Input
              type="number"
              step="0.01"
              min="0.1"
              required
              value={importe}
              onChange={e => setImporte(Number(e.target.value))}
            />
            <p className="text-xs text-slate-500">Se aplicará automáticamente a la(s) cuota(s) más antigua(s).</p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Medio de Pago</label>
            <select
              value={medioPago}
              onChange={e => setMedioPago(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
            >
              <option value="EFECTIVO">Efectivo</option>
              <option value="TRANSFERENCIA">Transferencia / Yape / Plin</option>
              <option value="TARJETA">Tarjeta (POS o Web)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Nº de Operación (Opcional)</label>
            <Input
              type="text"
              value={numeroOperacion}
              onChange={e => setNumeroOperacion(e.target.value)}
              placeholder="Ej: 123456789"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} className="bg-red-600 hover:bg-red-700">
              {isPending ? 'Guardando...' : 'Confirmar Pago'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

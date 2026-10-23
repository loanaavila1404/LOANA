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

  const [conceptoSeleccionado, setConceptoSeleccionado] = useState<string>('AUTOMATICO');
  const [conceptoLibre, setConceptoLibre] = useState<string>('Certificado / Constancia');
  const [importe, setImporte] = useState<number>(0);
  const [medioPago, setMedioPago] = useState('TRANSFERENCIA');
  const [numeroOperacion, setNumeroOperacion] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');

  const handleOpen = () => {
    setIdempotencyKey(window.crypto.randomUUID());
    setError(null);
    const primera = cuotasPendientes[0];
    if (primera) {
      const saldoInicial =
        primera.saldo !== null && primera.saldo !== undefined
          ? Number(primera.saldo)
          : Number(primera.importe_neto || 0);
      setConceptoSeleccionado(primera.id);
      setImporte(saldoInicial);
    } else {
      setConceptoSeleccionado('AUTOMATICO');
      setImporte(0);
    }
    setIsOpen(true);
  };

  const handleConceptoChange = (val: string) => {
    setConceptoSeleccionado(val);
    if (val !== 'AUTOMATICO' && val !== 'OTROS') {
      const cuota = cuotasPendientes.find(c => c.id === val);
      if (cuota) {
        const saldo =
          cuota.saldo !== null && cuota.saldo !== undefined
            ? Number(cuota.saldo)
            : Number(cuota.importe_neto || 0);
        setImporte(saldo);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (importe <= 0) {
      setError('El importe debe ser mayor a 0');
      return;
    }

    let remaining = Number(importe);
    const aplicaciones: { cuota_id: string; importe: number }[] = [];

    // Si eligió una cuota específica, priorizar aplicarla primero a esa cuota
    const orderedCuotas =
      conceptoSeleccionado !== 'AUTOMATICO' && conceptoSeleccionado !== 'OTROS'
        ? [
            ...cuotasPendientes.filter(c => c.id === conceptoSeleccionado),
            ...cuotasPendientes.filter(c => c.id !== conceptoSeleccionado),
          ]
        : cuotasPendientes;

    for (const c of orderedCuotas) {
      if (remaining <= 0) break;
      const saldo = c.saldo === null ? Number(c.importe_neto || 0) : Number(c.saldo);
      if (saldo <= 0) continue;
      const aAplicar = Math.min(saldo, remaining);
      aplicaciones.push({
        cuota_id: c.id,
        importe: Number(aAplicar.toFixed(2))
      });
      remaining = Number((remaining - aAplicar).toFixed(2));
    }

    if (remaining > 0.01) {
      setError('El importe es mayor al total de la deuda pendiente');
      return;
    }

    const payload = {
      idempotency_key: idempotencyKey,
      estudiante_id: estudianteId,
      importe: Number(importe),
      medio_pago: medioPago,
      numero_operacion:
        conceptoSeleccionado === 'OTROS' && conceptoLibre
          ? `${numeroOperacion ? `${numeroOperacion} · ` : ''}${conceptoLibre}`
          : numeroOperacion,
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
            <label className="text-sm font-medium text-slate-700">Concepto a Cancelar *</label>
            <select
              value={conceptoSeleccionado}
              onChange={e => handleConceptoChange(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
            >
              {cuotasPendientes.map(c => {
                const saldo =
                  c.saldo !== null && c.saldo !== undefined
                    ? Number(c.saldo)
                    : Number(c.importe_neto || 0);
                const etiqueta =
                  c.concepto ||
                  (c.tipo_cuota === 'MATRICULA'
                    ? 'Matrícula'
                    : `Pensión ${c.numero_cuota || ''}`);
                return (
                  <option key={c.id} value={c.id}>
                    {etiqueta} — Saldo: S/ {saldo.toFixed(2)}
                  </option>
                );
              })}
              <option value="AUTOMATICO">
                Distribución automática (cuotas más antiguas)
              </option>
              <option value="OTROS">Otros conceptos (Constancia / Carné / Derecho)</option>
            </select>
          </div>

          {conceptoSeleccionado === 'OTROS' && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Detalle del Concepto</label>
              <Input
                type="text"
                value={conceptoLibre}
                onChange={e => setConceptoLibre(e.target.value)}
                placeholder="Ej. Emisión de Certificado / Duplicado de Carné"
              />
            </div>
          )}

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
            <p className="text-xs text-slate-500">
              Se imputará al concepto seleccionado y el excedente a las cuotas pendientes.
            </p>
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

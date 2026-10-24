'use client'

import { useState, useTransition } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { registrarPagoAction } from '@/app/actions/matriculas';
import { AlertTriangle, ArrowLeft, CheckCircle2, FileText, ExternalLink } from 'lucide-react';

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
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [pagoExitosoId, setPagoExitosoId] = useState<string | null>(null);

  const handleOpen = () => {
    setIdempotencyKey(window.crypto.randomUUID());
    setError(null);
    setIsConfirming(false);
    setPagoExitosoId(null);
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

  const getConceptoLabel = () => {
    if (conceptoSeleccionado === 'AUTOMATICO') {
      return 'Distribución automática (cuotas más antiguas)';
    }
    if (conceptoSeleccionado === 'OTROS') {
      return conceptoLibre ? `Otro concepto: ${conceptoLibre}` : 'Otro concepto institucional';
    }
    const cuota = cuotasPendientes.find(c => c.id === conceptoSeleccionado);
    if (!cuota) return 'Cuota pendiente';
    return (
      cuota.concepto ||
      (cuota.tipo_cuota === 'MATRICULA' ? 'Derecho de Matrícula' : `Pensión ${cuota.numero_cuota || ''}`)
    );
  };

  const handleInitialSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (importe <= 0) {
      setError('El importe debe ser mayor a 0');
      return;
    }

    let remaining = Number(importe);
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
      remaining = Number((remaining - aAplicar).toFixed(2));
    }

    if (remaining > 0.01) {
      setError('El importe es mayor al total de la deuda pendiente');
      return;
    }

    // Activar paso de doble confirmación
    setIsConfirming(true);
  };

  const handleExecutePayment = () => {
    setError(null);

    let remaining = Number(importe);
    const aplicaciones: { cuota_id: string; importe: number }[] = [];

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

    const conceptoFinal = getConceptoLabel();
    const payload = {
      idempotency_key: idempotencyKey,
      estudiante_id: estudianteId,
      importe: Number(importe),
      medio_pago: medioPago,
      numero_operacion:
        conceptoSeleccionado === 'OTROS' && conceptoLibre
          ? `${numeroOperacion ? `${numeroOperacion} · ` : ''}${conceptoLibre}`
          : numeroOperacion,
      observaciones: conceptoFinal,
      cuotas_aplicadas: aplicaciones
    };

    startTransition(async () => {
      const res = await registrarPagoAction(payload);
      if (res.error) {
        setError(res.error);
        setIsConfirming(false);
      } else {
        const id = (res as any).pago_id ? String((res as any).pago_id) : null;
        setPagoExitosoId(id);
        setIsConfirming(false);
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
          onClick={() => {
            setIsOpen(false);
            setIsConfirming(false);
            setPagoExitosoId(null);
          }}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-xl font-bold text-slate-800 mb-6">
          {pagoExitosoId ? 'Comprobante de Pago' : 'Registrar Pago'}
        </h2>

        {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200 mb-4">{error}</div>}

        {pagoExitosoId ? (
          <div className="space-y-5 animate-in fade-in-50 duration-200 text-center py-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">¡Pago Registrado con Éxito!</h3>
              <p className="text-xs text-slate-500 mt-1">
                El abono ha sido procesado e imputado en el sistema institucional.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-2 text-left">
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Concepto:</span>
                <span className="font-bold text-slate-800 text-right truncate max-w-[200px]">{getConceptoLabel()}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Importe Pagado:</span>
                <span className="font-black text-sm text-[#C4121A]">S/ {Number(importe).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 font-medium">Medio de Pago:</span>
                <span className="font-semibold text-slate-800">{medioPago}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={`/pagos/${pagoExitosoId}/comprobante`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#C4121A] hover:bg-red-700 text-white font-bold text-xs shadow-md transition"
              >
                <FileText className="w-4 h-4" />
                <span>Ver Recibo de Pago (PDF)</span>
                <ExternalLink className="w-3.5 h-3.5 text-red-200" />
              </a>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPagoExitosoId(null);
                  setIsOpen(false);
                  setIsConfirming(false);
                  setImporte(0);
                  setNumeroOperacion('');
                  setError(null);
                }}
                className="w-full text-xs font-semibold"
              >
                Cerrar y Continuar
              </Button>
            </div>
          </div>
        ) : isConfirming ? (
          <div className="space-y-5 animate-in fade-in-50 duration-200">
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-amber-800 text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Confirmación de Registro de Pago</span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">
                ¿Confirma registrar el abono de <strong className="font-extrabold text-[#C4121A] text-sm">S/ {Number(importe).toFixed(2)}</strong> para el concepto <strong className="font-bold text-slate-900">"{getConceptoLabel()}"</strong>?
              </p>
            </div>

            <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Concepto:</span>
                <span className="font-bold text-slate-800 text-right max-w-[240px] truncate">{getConceptoLabel()}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Importe a Registrar:</span>
                <span className="font-black text-sm text-[#C4121A]">S/ {Number(importe).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Medio de Pago:</span>
                <span className="font-semibold text-slate-800">{medioPago}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 font-medium">N° de Operación:</span>
                <span className="font-mono text-slate-800">{numeroOperacion || 'Efectivo / Caja'}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic">
              * Esta operación amortizará las cuotas correspondientes y emitirá el Recibo de Pago Institucional. Verifique que los fondos hayan ingresado antes de confirmar.
            </p>

            <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsConfirming(false)}
                disabled={isPending}
                className="text-xs flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Modificar</span>
              </Button>
              <Button
                type="button"
                onClick={handleExecutePayment}
                disabled={isPending}
                className="bg-[#C4121A] hover:bg-red-700 text-white font-bold text-xs"
              >
                {isPending ? 'Guardando Pago...' : 'Sí, Confirmar Abono'}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleInitialSubmit} className="space-y-4">
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
                Confirmar Pago
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}

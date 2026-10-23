'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency } from '@/lib/utils/currency';
import { registrarPagoAction } from '@/app/actions/matriculas';
import {
  Calendar,
  CreditCard,
  FileText,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  Receipt,
  Smartphone,
  Building,
  Plus,
  X,
  ArrowRight,
} from 'lucide-react';

export type CuotaDetailItem = {
  id: string;
  matricula_id: string;
  tipo_cuota: string | null;
  numero_cuota: number;
  concepto: string | null;
  fecha_emision: string | null;
  fecha_vencimiento: string | null;
  importe_original: number | null;
  descuento: number | null;
  recargo: number | null;
  importe_neto: number | null;
  saldo: number | null;
  status: string | null;
};

export type PagoAplicacionDetail = {
  id: string;
  cuota_id: string;
  importe_aplicado: number;
  cuotas?: {
    concepto: string | null;
    tipo_cuota: string | null;
    numero_cuota: number | null;
  } | null;
};

export type PagoDetailItem = {
  id: string;
  estudiante_id: string;
  fecha_pago: string | null;
  importe: number | null;
  medio_pago: string | null;
  numero_operacion: string | null;
  comprobante_tipo: string | null;
  comprobante_numero: string | null;
  status: string | null;
  observaciones: string | null;
  registrado_en: string | null;
  motivo_anulacion?: string | null;
  pago_aplicaciones?: PagoAplicacionDetail[] | null;
};

interface Props {
  estudianteId: string;
  cuotas: CuotaDetailItem[];
  pagos: PagoDetailItem[];
  matriculaStatus: string;
}

export function MatriculaFinanceViewClient({
  estudianteId,
  cuotas,
  pagos,
  matriculaStatus,
}: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Estados del modal de pago
  const [selectedCuotaId, setSelectedCuotaId] = useState<string>('AUTOMATICO');
  const [conceptoLibre, setConceptoLibre] = useState<string>('');
  const [importe, setImporte] = useState<number>(0);
  const [medioPago, setMedioPago] = useState<string>('TRANSFERENCIA');
  const [numeroOperacion, setNumeroOperacion] = useState<string>('');
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');

  const cuotasPendientes = cuotas.filter(c => c.status === 'PENDIENTE' || c.status === 'PARCIAL');

  const today = new Date().toISOString().split('T')[0];

  // Abrir modal de pago general
  const handleOpenGeneralPago = () => {
    setIdempotencyKey(window.crypto.randomUUID());
    setError(null);
    const primera = cuotasPendientes[0];
    if (primera) {
      const saldo = primera.saldo !== null ? Number(primera.saldo) : Number(primera.importe_neto || 0);
      setSelectedCuotaId(primera.id);
      setImporte(saldo);
    } else {
      setSelectedCuotaId('AUTOMATICO');
      setImporte(0);
    }
    setIsModalOpen(true);
  };

  // Abrir modal de pago para una cuota específica
  const handleOpenCuotaPago = (cuota: CuotaDetailItem) => {
    setIdempotencyKey(window.crypto.randomUUID());
    setError(null);
    setSelectedCuotaId(cuota.id);
    const saldo = cuota.saldo !== null ? Number(cuota.saldo) : Number(cuota.importe_neto || 0);
    setImporte(saldo);
    setIsModalOpen(true);
  };

  const handleConceptoChange = (val: string) => {
    setSelectedCuotaId(val);
    if (val !== 'AUTOMATICO' && val !== 'OTROS') {
      const c = cuotasPendientes.find(item => item.id === val);
      if (c) {
        const saldo = c.saldo !== null ? Number(c.saldo) : Number(c.importe_neto || 0);
        setImporte(saldo);
      }
    }
  };

  const handleSubmitPago = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (importe <= 0) {
      setError('El importe debe ser mayor a 0');
      return;
    }

    let remaining = Number(importe);
    const aplicaciones: { cuota_id: string; importe: number }[] = [];

    const orderedCuotas =
      selectedCuotaId !== 'AUTOMATICO' && selectedCuotaId !== 'OTROS'
        ? [
            ...cuotasPendientes.filter(c => c.id === selectedCuotaId),
            ...cuotasPendientes.filter(c => c.id !== selectedCuotaId),
          ]
        : cuotasPendientes;

    for (const c of orderedCuotas) {
      if (remaining <= 0) break;
      const saldo = c.saldo === null ? Number(c.importe_neto || 0) : Number(c.saldo);
      if (saldo <= 0) continue;
      const aAplicar = Math.min(saldo, remaining);
      aplicaciones.push({
        cuota_id: c.id,
        importe: Number(aAplicar.toFixed(2)),
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
        selectedCuotaId === 'OTROS' && conceptoLibre
          ? `${numeroOperacion ? `${numeroOperacion} · ` : ''}${conceptoLibre}`
          : numeroOperacion,
      cuotas_aplicadas: aplicaciones,
    };

    startTransition(async () => {
      const res = await registrarPagoAction(payload);
      if (res.error) {
        setError(res.error);
      } else {
        setIsModalOpen(false);
        setImporte(0);
        setNumeroOperacion('');
        setError(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* ============================================================== */}
      {/* 1. CRONOGRAMA DE PAGOS Y CUOTAS (INTERACTIVO) */}
      {/* ============================================================== */}
      <Card className="border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-900 text-base">Cronograma de Pagos y Cuotas</h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-200/70 text-slate-700">
                {cuotas.length} cuotas
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Control de obligaciones arancelarias, fechas de vencimiento y saldos en tiempo real.
            </p>
          </div>

          {(matriculaStatus === 'ACTIVA' || matriculaStatus === 'FINALIZADA') && cuotasPendientes.length > 0 && (
            <Button
              type="button"
              onClick={handleOpenGeneralPago}
              className="h-9 px-3.5 bg-[#C4121A] hover:bg-red-700 text-white font-semibold text-xs flex items-center gap-2 shadow-2xs shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Pago</span>
            </Button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Concepto / N° Cuota</th>
                <th className="py-3 px-4">Fecha Vencimiento</th>
                <th className="py-3 px-4 text-right">Importe Pactado</th>
                <th className="py-3 px-4 text-right">Saldo Restante</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cuotas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500 italic">
                    No se han generado cuotas para esta matrícula.
                  </td>
                </tr>
              ) : (
                cuotas.map((c, idx) => {
                  const saldo = c.saldo !== null ? Number(c.saldo) : Number(c.importe_neto || 0);
                  const isOverdue =
                    (c.status === 'PENDIENTE' || c.status === 'PARCIAL') &&
                    c.fecha_vencimiento &&
                    c.fecha_vencimiento < today;

                  const conceptoLabel =
                    c.concepto ||
                    (c.tipo_cuota === 'MATRICULA'
                      ? 'Derecho de Matrícula'
                      : `Pensión N° 0${c.numero_cuota || idx + 1}`);

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Concepto */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                              c.tipo_cuota === 'MATRICULA'
                                ? 'bg-red-50 text-[#C4121A]'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {c.tipo_cuota === 'MATRICULA' ? 'M' : c.numero_cuota || idx + 1}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{conceptoLabel}</span>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                              {c.tipo_cuota || 'PENSION'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Vencimiento */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">
                          {c.fecha_vencimiento
                            ? new Date(c.fecha_vencimiento).toLocaleDateString('es-PE', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'Inmediato'}
                        </div>
                        {isOverdue && (
                          <span className="text-[10px] font-bold text-red-600 block mt-0.5">
                            ¡Cuota fuera de término!
                          </span>
                        )}
                      </td>

                      {/* Importe Pactado */}
                      <td className="py-3 px-4 text-right font-medium text-slate-700">
                        {formatCurrency(Number(c.importe_neto) || 0)}
                      </td>

                      {/* Saldo Restante */}
                      <td className="py-3 px-4 text-right">
                        {saldo > 0 ? (
                          <span className="font-extrabold text-red-600">{formatCurrency(saldo)}</span>
                        ) : (
                          <span className="font-bold text-emerald-700">{formatCurrency(0)}</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={
                            c.status === 'PAGADA'
                              ? 'success'
                              : isOverdue || c.status === 'VENCIDA'
                              ? 'danger'
                              : c.status === 'PARCIAL'
                              ? 'warning'
                              : 'default'
                          }
                        >
                          {isOverdue ? 'VENCIDA' : c.status}
                        </Badge>
                      </td>

                      {/* Acción Rápida por Cuota */}
                      <td className="py-3 px-4 text-center">
                        {saldo > 0 ? (
                          <button
                            type="button"
                            onClick={() => handleOpenCuotaPago(c)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-red-50 hover:bg-red-100 text-[#C4121A] border border-red-200 transition shadow-2xs"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>Abonar</span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Al día</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ============================================================== */}
      {/* 2. HISTORIAL DE PAGOS Y COMPROBANTES EMITIDOS */}
      {/* ============================================================== */}
      <Card className="border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-900 text-base">Historial de Pagos y Comprobantes</h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-200/70 text-slate-700">
                {pagos.length} recibos
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Registro histórico de abonos con descarga oficial de boletas y comprobantes para tesorería.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Comprobante / N° Operación</th>
                <th className="py-3 px-4">Fecha Abono</th>
                <th className="py-3 px-4">Medio de Pago</th>
                <th className="py-3 px-4">Cuotas Amortizadas</th>
                <th className="py-3 px-4 text-right">Monto Abonado</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-center">Comprobante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pagos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500 italic">
                    Aún no se han registrado abonos o pagos para esta matrícula.
                  </td>
                </tr>
              ) : (
                pagos.map(p => {
                  const apps = p.pago_aplicaciones || [];
                  const compCodigo = p.comprobante_numero
                    ? `${p.comprobante_tipo || 'BOL'}-${p.comprobante_numero}`
                    : `REC-${p.id.substring(0, 8).toUpperCase()}`;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Código de Recibo */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 block">{compCodigo}</span>
                        {p.numero_operacion && (
                          <span className="text-[11px] text-slate-500 font-mono">
                            Op: {p.numero_operacion}
                          </span>
                        )}
                      </td>

                      {/* Fecha de Pago */}
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {p.fecha_pago
                          ? new Date(p.fecha_pago).toLocaleDateString('es-PE', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '-'}
                      </td>

                      {/* Medio de Pago */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800">
                          {p.medio_pago === 'TRANSFERENCIA' && <Smartphone className="w-3 h-3 text-blue-600" />}
                          {p.medio_pago === 'EFECTIVO' && <DollarSign className="w-3 h-3 text-emerald-600" />}
                          {p.medio_pago === 'TARJETA' && <CreditCard className="w-3 h-3 text-purple-600" />}
                          <span>{p.medio_pago || 'TRANSFERENCIA'}</span>
                        </span>
                      </td>

                      {/* Cuotas Amortizadas */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {apps.length === 0 ? (
                            <span className="text-slate-400 text-[11px] italic">Abono general</span>
                          ) : (
                            apps.map((app, idx) => {
                              const c = app.cuotas;
                              const label =
                                c?.concepto ||
                                (c?.tipo_cuota === 'MATRICULA'
                                  ? 'Matrícula'
                                  : `Pensión ${c?.numero_cuota || idx + 1}`);

                              return (
                                <span
                                  key={app.id || idx}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
                                >
                                  {label} ({formatCurrency(Number(app.importe_aplicado) || 0)})
                                </span>
                              );
                            })
                          )}
                        </div>
                      </td>

                      {/* Monto Abonado */}
                      <td className="py-3 px-4 text-right font-black text-slate-900 text-sm">
                        {formatCurrency(Number(p.importe) || 0)}
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-4 text-center">
                        <Badge variant={p.status === 'ANULADO' ? 'danger' : 'success'}>
                          {p.status || 'REGISTRADO'}
                        </Badge>
                      </td>

                      {/* Botón Ver / Descargar Boleta PDF */}
                      <td className="py-3 px-4 text-center">
                        <Link
                          href={`/pagos/${p.id}/comprobante`}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 hover:text-[#C4121A] text-xs font-semibold shadow-2xs transition"
                          title="Ver / Descargar Boleta PDF Oficial"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#C4121A]" />
                          <span>Boleta PDF</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ============================================================== */}
      {/* MODAL DE REGISTRO DE PAGO INTEGRADO */}
      {/* ============================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 bg-white shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 border-slate-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#C4121A]">
                Tesorería y Caja
              </span>
              <h2 className="text-lg font-bold text-slate-900">Registrar Nuevo Abono / Pago</h2>
            </div>

            <form onSubmit={handleSubmitPago} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 font-semibold">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Concepto a Cancelar *</label>
                <select
                  value={selectedCuotaId}
                  onChange={e => handleConceptoChange(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                >
                  {cuotasPendientes.map(c => {
                    const saldo = c.saldo !== null ? Number(c.saldo) : Number(c.importe_neto || 0);
                    const etiqueta =
                      c.concepto ||
                      (c.tipo_cuota === 'MATRICULA' ? 'Matrícula' : `Pensión ${c.numero_cuota || ''}`);
                    return (
                      <option key={c.id} value={c.id}>
                        {etiqueta} — Saldo: S/ {saldo.toFixed(2)}
                      </option>
                    );
                  })}
                  <option value="AUTOMATICO">Distribución automática (cuotas más antiguas)</option>
                  <option value="OTROS">Otros conceptos (Constancia / Carné / Trámite)</option>
                </select>
              </div>

              {selectedCuotaId === 'OTROS' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Detalle del Concepto</label>
                  <Input
                    type="text"
                    value={conceptoLibre}
                    onChange={e => setConceptoLibre(e.target.value)}
                    placeholder="Ej. Emisión de Certificado / Carné de Alumno"
                    className="text-xs"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Importe a Pagar (S/)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.1"
                  required
                  value={importe}
                  onChange={e => setImporte(Number(e.target.value))}
                  className="text-xs font-bold text-slate-900"
                />
                <p className="text-[11px] text-slate-500">
                  El importe cancelará el concepto indicado y se imputará al saldo correspondiente.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Medio de Pago</label>
                <select
                  value={medioPago}
                  onChange={e => setMedioPago(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                >
                  <option value="TRANSFERENCIA">Transferencia / Yape / Plin</option>
                  <option value="EFECTIVO">Efectivo en Caja</option>
                  <option value="TARJETA">Tarjeta (POS o Web)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">N° de Operación (Opcional)</label>
                <Input
                  type="text"
                  value={numeroOperacion}
                  onChange={e => setNumeroOperacion(e.target.value)}
                  placeholder="Ej: YAPE-848392 ó BCP-192837"
                  className="text-xs font-mono"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2.5 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isPending}
                  className="h-9 px-3 text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="h-9 px-4 text-xs bg-[#C4121A] hover:bg-red-700 text-white font-bold"
                >
                  {isPending ? 'Guardando Abono...' : 'Confirmar Pago Oficial'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

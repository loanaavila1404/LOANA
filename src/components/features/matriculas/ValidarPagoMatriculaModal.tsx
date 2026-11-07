'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils/currency';
import { validarPagoMatriculaAction, ValidarPagoMatriculaInput } from '@/app/actions/matriculas';
import {
  CheckCircle2,
  X,
  ShieldCheck,
  AlertCircle,
  CreditCard,
  Building,
  Smartphone,
  Receipt,
  FileCheck,
  Loader2,
  User,
  GraduationCap,
} from 'lucide-react';

export interface MatriculaParaValidar {
  id: string;
  codigo_matricula: string;
  importe_matricula: number | null;
  importe_pension: number | null;
  numero_pensiones: number | null;
  descuento_total: number | null;
  totalNeto?: number;
  estudianteNombre?: string;
  estudianteDni?: string;
  programaNombre?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  matricula: MatriculaParaValidar | null;
  onSuccess?: (res: { codigoMatricula: string; importePagado: number }) => void;
}

export function ValidarPagoMatriculaModal({
  isOpen,
  onClose,
  matricula,
  onSuccess,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [tipoPago, setTipoPago] = useState<'MATRICULA' | 'TOTAL' | 'PARCIAL'>('MATRICULA');
  const [montoPersonalizado, setMontoPersonalizado] = useState<number>(0);
  const [medioPago, setMedioPago] = useState<string>('TRANSFERENCIA');
  const [numeroOperacion, setNumeroOperacion] = useState<string>('');
  const [comprobanteTipo, setComprobanteTipo] = useState<string>('RECIBO');
  const [comprobanteNumero, setComprobanteNumero] = useState<string>('');
  const [observaciones, setObservaciones] = useState<string>('Voucher y pago validados por Administración / Caja.');

  if (!isOpen || !matricula) return null;

  const montoMatricula = Number(matricula.importe_matricula) || 0;
  const montoPension = Number(matricula.importe_pension) || 0;
  const numPensiones = Number(matricula.numero_pensiones) || 0;
  const descuento = Number(matricula.descuento_total) || 0;
  const totalNeto =
    matricula.totalNeto !== undefined
      ? matricula.totalNeto
      : Math.max(0, montoMatricula + montoPension * numPensiones - descuento);

  const getMontoActual = (): number => {
    if (tipoPago === 'TOTAL') return totalNeto;
    if (tipoPago === 'MATRICULA') return montoMatricula;
    return Number(montoPersonalizado) || 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const monto = getMontoActual();
    if (monto <= 0 && totalNeto > 0) {
      setError('Debes ingresar un importe válido mayor a 0 soles.');
      return;
    }

    startTransition(async () => {
      const input: ValidarPagoMatriculaInput = {
        matriculaId: matricula.id,
        tipoPago,
        montoPersonalizado: tipoPago === 'PARCIAL' ? montoPersonalizado : undefined,
        medioPago,
        numeroOperacion: numeroOperacion.trim() || undefined,
        comprobanteTipo,
        comprobanteNumero: comprobanteNumero.trim() || undefined,
        observaciones: observaciones.trim() || undefined,
      };

      const res = await validarPagoMatriculaAction(input);

      if (res?.error) {
        setError(res.error);
        return;
      }

      if (res?.success) {
        if (onSuccess) {
          onSuccess({
            codigoMatricula: res.codigoMatricula || matricula.codigo_matricula,
            importePagado: res.importePagado || monto,
          });
        }
        router.refresh();
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => !isPending && onClose()}
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div
          className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-2xl transition-all border border-slate-200 animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-emerald-50 via-white to-slate-50 border-b border-slate-200 flex items-start justify-between">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Caja y Control Financiero
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    {matricula.codigo_matricula}
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  Validar Pago y Aprobar Matrícula
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Formaliza la prematrícula, genera el cronograma y activa al estudiante en el padrón oficial.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-5">
              {/* Resumen del Estudiante y Matrícula */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                    Estudiante Titular
                  </span>
                  <span className="font-bold text-slate-900 block mt-0.5">
                    {matricula.estudianteNombre || 'Estudiante'}
                  </span>
                  {matricula.estudianteDni && (
                    <span className="text-slate-500 text-[11px]">DNI: {matricula.estudianteDni}</span>
                  )}
                </div>

                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                    Programa / Carrera
                  </span>
                  <span className="font-bold text-slate-800 block mt-0.5 truncate">
                    {matricula.programaNombre || 'Programa Institucional'}
                  </span>
                  <span className="text-emerald-700 font-semibold text-[11px]">
                    Total Pactado: {formatCurrency(totalNeto)}
                  </span>
                </div>
              </div>

              {/* Banner informativo de activación */}
              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Efecto institucional de la validación:</span>
                  <span>
                    La matrícula pasará a estado <strong>ACTIVA</strong> con código formal, se creará el cronograma en Tesorería y el estudiante figurará en el <strong>Padrón de Estudiantes Activos</strong>.
                  </span>
                </div>
              </div>

              {/* Selector de Modalidad de Pago */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Modalidad de Validación Financiera
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Opción 1: Solo Pago de Matrícula */}
                  <label
                    className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                      tipoPago === 'MATRICULA'
                        ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="tipoPago"
                          value="MATRICULA"
                          checked={tipoPago === 'MATRICULA'}
                          onChange={() => setTipoPago('MATRICULA')}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-xs font-bold text-slate-900">Solo Matrícula</span>
                      </div>
                      <span className="text-xs font-black text-emerald-700">
                        {formatCurrency(montoMatricula)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 pl-5">
                      Activa la matrícula. Las {numPensiones} pensiones quedan calendarizadas como pendientes.
                    </p>
                  </label>

                  {/* Opción 2: Cancelación Total 100% */}
                  <label
                    className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                      tipoPago === 'TOTAL'
                        ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="tipoPago"
                          value="TOTAL"
                          checked={tipoPago === 'TOTAL'}
                          onChange={() => setTipoPago('TOTAL')}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-xs font-bold text-slate-900">Pago Total 100%</span>
                      </div>
                      <span className="text-xs font-black text-emerald-700">
                        {formatCurrency(totalNeto)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 pl-5">
                      Pasa a Matrícula Activa y estado <strong className="text-emerald-800">Pagado Total</strong> (sin deuda restante).
                    </p>
                  </label>
                </div>

                {/* Opción 3: Monto Personalizado */}
                <div className="pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="radio"
                      name="tipoPago"
                      value="PARCIAL"
                      checked={tipoPago === 'PARCIAL'}
                      onChange={() => setTipoPago('PARCIAL')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Ingresar monto abonado personalizado</span>
                  </label>

                  {tipoPago === 'PARCIAL' && (
                    <div className="mt-2 pl-5">
                      <div className="relative w-48">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          S/
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={montoPersonalizado}
                          onChange={(e) => setMontoPersonalizado(Number(e.target.value))}
                          placeholder="0.00"
                          className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Datos del Comprobante / Pago */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Medio de Pago <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={medioPago}
                    onChange={(e) => setMedioPago(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="TRANSFERENCIA">Transferencia Bancaria (BCP / BBVA)</option>
                    <option value="YAPE">Yape / Plin</option>
                    <option value="DEPOSITO">Depósito en Ventanilla / Agente</option>
                    <option value="EFECTIVO">Efectivo en Caja Sede</option>
                    <option value="TARJETA">Tarjeta de Débito / Crédito</option>
                    <option value="OTRO">Otro Medio</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    N° de Operación / Voucher
                  </label>
                  <input
                    type="text"
                    value={numeroOperacion}
                    onChange={(e) => setNumeroOperacion(e.target.value)}
                    placeholder="Ej: OP-8492038"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Tipo de Comprobante
                  </label>
                  <select
                    value={comprobanteTipo}
                    onChange={(e) => setComprobanteTipo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="RECIBO">Recibo de Caja Institucional</option>
                    <option value="BOLETA">Boleta de Venta Electrónica</option>
                    <option value="FACTURA">Factura Electrónica</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    N° de Comprobante / Serie
                  </label>
                  <input
                    type="text"
                    value={comprobanteNumero}
                    onChange={(e) => setComprobanteNumero(e.target.value)}
                    placeholder="Ej: B001-00054"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="font-semibold text-slate-700 block text-xs mb-1">
                  Observaciones de Caja / Validación
                </label>
                <textarea
                  rows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Detalles sobre el voucher, cuenta de abono o notas de caja..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-800">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="text-xs">
                <span className="text-slate-500 block">Monto a Validar:</span>
                <span className="text-base font-black text-emerald-700">
                  {formatCurrency(getMontoActual())}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isPending}
                  className="text-xs font-semibold"
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-2xs"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Validando y Activando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Validar Pago y Aprobar</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

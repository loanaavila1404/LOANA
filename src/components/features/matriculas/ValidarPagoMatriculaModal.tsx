'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils/currency';
import {
  validarPagoMatriculaAction,
  rechazarPrematriculaAction,
  ValidarPagoMatriculaInput,
} from '@/app/actions/matriculas';
import {
  CheckCircle2,
  X,
  ShieldCheck,
  AlertCircle,
  XCircle,
  RotateCcw,
  Loader2,
  AlertTriangle,
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

  // Modo: 'APROBAR' o 'RECHAZAR'
  const [modo, setModo] = useState<'APROBAR' | 'RECHAZAR'>('APROBAR');

  // Estados para Aprobación
  const [tipoPago, setTipoPago] = useState<'MATRICULA' | 'TOTAL' | 'PARCIAL'>('MATRICULA');
  const [montoPersonalizado, setMontoPersonalizado] = useState<number>(0);
  const [medioPago, setMedioPago] = useState<string>('TRANSFERENCIA');
  const [numeroOperacion, setNumeroOperacion] = useState<string>('');
  const [comprobanteTipo, setComprobanteTipo] = useState<string>('RECIBO');
  const [comprobanteNumero, setComprobanteNumero] = useState<string>('');
  const [observaciones, setObservaciones] = useState<string>(
    'Voucher y pago validados por Administración / Caja.'
  );

  // Estados para Rechazo
  const [motivoRechazo, setMotivoRechazo] = useState<string>(
    'Comprobante o voucher no válido / no verificado'
  );
  const [detalleRechazo, setDetalleRechazo] = useState<string>('');

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

  const handleAprobarSubmit = (e: React.FormEvent) => {
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

  const handleRechazarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const motivoCompleto = [motivoRechazo, detalleRechazo.trim()]
      .filter(Boolean)
      .join(' - ');

    startTransition(async () => {
      const res = await rechazarPrematriculaAction(matricula.id, motivoCompleto);

      if (res?.error) {
        setError(res.error);
        return;
      }

      if (res?.success) {
        router.refresh();
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      {/* Fondo oscuro opaco sin desenfoques que causen borrosidad visual */}
      <div
        className="fixed inset-0 bg-slate-900/80 transition-opacity"
        onClick={() => !isPending && onClose()}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        {/* Contenedor del Modal nítido y con contraste limpio */}
        <div
          className="relative z-10 w-full max-w-xl my-6 rounded-2xl bg-white text-left shadow-2xl border border-slate-200 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Cabecera */}
          <div
            className={`px-6 py-4 border-b flex items-start justify-between ${
              modo === 'RECHAZAR'
                ? 'bg-red-50/70 border-red-200'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                  modo === 'RECHAZAR'
                    ? 'bg-red-100 text-red-700 border-red-200'
                    : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                }`}
              >
                {modo === 'RECHAZAR' ? (
                  <XCircle className="w-5 h-5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                      modo === 'RECHAZAR'
                        ? 'text-red-800 bg-red-100 border-red-200'
                        : 'text-emerald-800 bg-emerald-100 border-emerald-200'
                    }`}
                  >
                    {modo === 'RECHAZAR' ? 'Rechazo de Prematrícula' : 'Caja y Finanzas'}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-600">
                    {matricula.codigo_matricula}
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  {modo === 'RECHAZAR'
                    ? 'Rechazar Voucher / Prematrícula'
                    : 'Validar Pago y Aprobar Matrícula'}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  {modo === 'RECHAZAR'
                    ? 'Desestima el comprobante y revierte el prospecto para subsanar el pago.'
                    : 'Formaliza la prematrícula, genera el cronograma y activa al alumno en el padrón.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tarjeta de Resumen del Alumno */}
          <div className="px-6 pt-5 pb-1">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 font-bold block text-[10px] uppercase">
                  Estudiante Titular
                </span>
                <span className="font-extrabold text-slate-900 block mt-0.5">
                  {matricula.estudianteNombre || 'Estudiante'}
                </span>
                {matricula.estudianteDni && (
                  <span className="text-slate-600 text-[11px] font-medium">
                    DNI: {matricula.estudianteDni}
                  </span>
                )}
              </div>

              <div>
                <span className="text-slate-500 font-bold block text-[10px] uppercase">
                  Programa / Carrera
                </span>
                <span className="font-extrabold text-slate-900 block mt-0.5 truncate">
                  {matricula.programaNombre || 'Programa Institucional'}
                </span>
                <span className="text-emerald-700 font-bold text-[11px]">
                  Total Pactado: {formatCurrency(totalNeto)}
                </span>
              </div>
            </div>
          </div>

          {/* FORMULARIO: MODO APROBAR */}
          {modo === 'APROBAR' && (
            <form onSubmit={handleAprobarSubmit}>
              <div className="p-6 pt-3 space-y-4">
                {/* Banner de Impacto Institucional */}
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-950">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Efecto de la validación:</span>
                    <span>
                      La matrícula cambiará a <strong>ACTIVA</strong> con código formal, se
                      generará el cronograma de cuotas y el estudiante figurará en el{' '}
                      <strong>Padrón Oficial de Estudiantes Activos</strong>.
                    </span>
                  </div>
                </div>

                {/* Modalidad de Pago */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                    Modalidad de Aprobación Financiera
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Opción 1: Solo Matrícula */}
                    <label
                      className={`p-3 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                        tipoPago === 'MATRICULA'
                          ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
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
                            className="text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                          />
                          <span className="text-xs font-bold text-slate-900">Solo Matrícula</span>
                        </div>
                        <span className="text-xs font-black text-emerald-700">
                          {formatCurrency(montoMatricula)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 pl-6">
                        Pasa a Matrícula Activa. Quedan {numPensiones} pensiones programadas.
                      </p>
                    </label>

                    {/* Opción 2: Cancelación Total 100% */}
                    <label
                      className={`p-3 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                        tipoPago === 'TOTAL'
                          ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
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
                            className="text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                          />
                          <span className="text-xs font-bold text-slate-900">Pago Total 100%</span>
                        </div>
                        <span className="text-xs font-black text-emerald-700">
                          {formatCurrency(totalNeto)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 pl-6">
                        Activa al estudiante con estado{' '}
                        <strong className="text-emerald-800">Pagado Total</strong> (sin deuda).
                      </p>
                    </label>
                  </div>

                  {/* Opción 3: Monto Personalizado */}
                  <div className="pt-1">
                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer font-medium">
                      <input
                        type="radio"
                        name="tipoPago"
                        value="PARCIAL"
                        checked={tipoPago === 'PARCIAL'}
                        onChange={() => setTipoPago('PARCIAL')}
                        className="text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                      <span>Ingresar abono personalizado</span>
                    </label>

                    {tipoPago === 'PARCIAL' && (
                      <div className="mt-2 pl-6">
                        <div className="relative w-48">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
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

                {/* Datos del Comprobante */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      Medio de Pago <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={medioPago}
                      onChange={(e) => setMedioPago(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                    <label className="font-bold text-slate-800 block mb-1">
                      N° de Operación / Voucher
                    </label>
                    <input
                      type="text"
                      value={numeroOperacion}
                      onChange={(e) => setNumeroOperacion(e.target.value)}
                      placeholder="Ej: OP-8492038"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      Tipo de Comprobante
                    </label>
                    <select
                      value={comprobanteTipo}
                      onChange={(e) => setComprobanteTipo(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="RECIBO">Recibo de Caja Institucional</option>
                      <option value="BOLETA">Boleta de Venta Electrónica</option>
                      <option value="FACTURA">Factura Electrónica</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      N° de Comprobante / Serie
                    </label>
                    <input
                      type="text"
                      value={comprobanteNumero}
                      onChange={(e) => setComprobanteNumero(e.target.value)}
                      placeholder="Ej: B001-00054"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Observaciones */}
                <div>
                  <label className="font-bold text-slate-800 block text-xs mb-1">
                    Observaciones de Caja
                  </label>
                  <textarea
                    rows={2}
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Notas sobre el voucher o validación..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-900 font-semibold">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              {/* Footer con Botones de Alto Contraste */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs w-full sm:w-auto text-left">
                  <span className="text-slate-500 font-semibold block">Monto a Validar:</span>
                  <span className="text-lg font-black text-emerald-700">
                    {formatCurrency(getMontoActual())}
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setModo('RECHAZAR');
                    }}
                    disabled={isPending}
                    className="px-3.5 py-2.5 rounded-xl border border-red-200 bg-white hover:bg-red-50 text-red-700 font-bold text-xs flex items-center gap-1.5 transition shadow-2xs"
                  >
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span>Rechazar</span>
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isPending}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition shadow-2xs"
                  >
                    Cancelar
                  </button>

                  <Button
                    type="submit"
                    disabled={isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Validando...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Aprobar Pago</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          )}

          {/* FORMULARIO: MODO RECHAZAR */}
          {modo === 'RECHAZAR' && (
            <form onSubmit={handleRechazarSubmit}>
              <div className="p-6 pt-3 space-y-4">
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-950">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Acción destructiva de rechazo:</span>
                    <span>
                      Al rechazar el voucher, la prematrícula será anulada y el prospecto
                      retornará al seguimiento comercial para solicitar un nuevo comprobante.
                    </span>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      Motivo del Rechazo <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={motivoRechazo}
                      onChange={(e) => setMotivoRechazo(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="Comprobante o voucher no válido / no verificado">
                        Comprobante o voucher no válido / no verificado
                      </option>
                      <option value="Abono no reflejado en cuenta bancaria institucional">
                        Abono no reflejado en cuenta bancaria institucional
                      </option>
                      <option value="Importe abonado no coincide con el pactado">
                        Importe abonado no coincide con el pactado
                      </option>
                      <option value="El postulante desistió de la matrícula">
                        El postulante desistió de la matrícula
                      </option>
                      <option value="Comprobante duplicado o ya utilizado">
                        Comprobante duplicado o ya utilizado
                      </option>
                      <option value="Otro motivo">Otro motivo</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      Detalle adicional / Observaciones (Opcional)
                    </label>
                    <textarea
                      rows={3}
                      value={detalleRechazo}
                      onChange={(e) => setDetalleRechazo(e.target.value)}
                      placeholder="Explica el motivo del rechazo para conocimiento del asesor comercial..."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-900 font-semibold">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              {/* Footer para Rechazar */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setModo('APROBAR');
                  }}
                  disabled={isPending}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Volver a Aprobación</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isPending}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition shadow-2xs"
                  >
                    Cancelar
                  </button>

                  <Button
                    type="submit"
                    disabled={isPending}
                    className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Rechazando...</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        <span>Confirmar Rechazo</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

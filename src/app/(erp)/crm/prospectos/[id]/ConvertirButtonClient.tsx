'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { convertirAEstudianteAction } from '@/app/actions/crm/prospectos';
import { FileCheck, ArrowUpRight, Clock, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

export function ConvertirButtonClient({
  prospectoId,
  status = 'NUEVO',
  matriculaId,
  prospectoName,
}: {
  prospectoId: string;
  status?: string;
  matriculaId?: string | null;
  prospectoName?: string;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMatriculaId, setSuccessMatriculaId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isPrematricula = status === 'PREMATRICULA';
  const isMatriculado = status === 'MATRICULADO';

  if (isMatriculado) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200">
        <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>Matrícula Validada en Caja</span>
      </div>
    );
  }

  if (isPrematricula) {
    return (
      <div className="inline-flex items-center gap-2 flex-wrap">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>Prematrícula Pendiente de Caja</span>
        </div>
        {matriculaId && (
          <Link
            href={`/matriculas/${matriculaId}`}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 transition shadow-2xs"
          >
            <span>Ver Ficha de Matrícula</span>
            <ArrowUpRight className="w-3 h-3 text-slate-400" />
          </Link>
        )}
      </div>
    );
  }

  const handleConfirmConvertir = () => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await convertirAEstudianteAction(prospectoId);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMatriculaId(res.matricula_id || null);
        router.refresh();
      }
    });
  };

  const handleClose = () => {
    if (isPending) return;
    setIsModalOpen(false);
    setErrorMsg(null);
    if (successMatriculaId) {
      router.refresh();
    }
  };

  return (
    <>
      <button
        onClick={() => {
          setErrorMsg(null);
          setIsModalOpen(true);
        }}
        disabled={isPending}
        title="Derivar al módulo de Matrículas para validación de pago en Caja"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition shadow-2xs"
      >
        <FileCheck className="w-3.5 h-3.5" />
        <span>Generar Prematrícula (Caja)</span>
      </button>

      {/* Modal Nativo de Confirmación y Derivación */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title="Generar Prematrícula & Derivación a Caja"
      >
        <div className="space-y-4">
          {successMatriculaId ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                ¡Prematrícula generada con éxito!
              </h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                El expediente ha sido transferido al módulo de Matrículas con estado{' '}
                <strong>PREMATRICULA</strong>. Para la activación oficial del estudiante se requiere la validación de pago en Caja.
              </p>
              <div className="pt-3 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                >
                  Permanecer en CRM
                </button>
                <Link
                  href={`/matriculas/${successMatriculaId}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-2xs"
                >
                  <span>Ir a Ficha de Matrícula</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 shrink-0 mt-0.5">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="space-y-1 text-xs text-indigo-950">
                  <h4 className="font-bold">
                    Requisitos del Flujo Financiero Institucional
                  </h4>
                  <p className="text-indigo-800 leading-relaxed">
                    Al confirmar la prematrícula para <strong>{prospectoName || 'este prospecto'}</strong>:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-indigo-900/90 mt-1">
                    <li>Se creará el registro de prematrícula con sus cuotas proyectadas.</li>
                    <li>
                      <strong>NO se activará en el padrón oficial</strong> de estudiantes hasta que Caja registre el pago del abono o cuota inicial.
                    </li>
                    <li>El prospecto quedará vinculado formalmente para trazabilidad y auditoría.</li>
                  </ul>
                </div>
              </div>

                {errorMsg && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

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
                  onClick={handleConfirmConvertir}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition shadow-2xs"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>{isPending ? 'Generando...' : 'Confirmar Prematrícula (Caja)'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}

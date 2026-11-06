'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { convertirAEstudianteAction } from '@/app/actions/crm/prospectos';
import { FileCheck, ArrowUpRight, Clock } from 'lucide-react';

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
  const [isPending, startTransition] = useTransition();

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

  const handleConvertir = () => {
    const nameStr = prospectoName ? ` de ${prospectoName}` : '';
    const confirmMsg =
      `¿Confirmas generar la PREMATRÍCULA${nameStr}?\n\n` +
      `• Se creará el expediente en el módulo de Matrículas.\n` +
      `• NO se activará como estudiante oficial hasta que Caja valide y registre el pago inicial.\n` +
      `• Los datos quedarán formalmente vinculados para el seguimiento financiero.`;

    if (!confirm(confirmMsg)) return;

    startTransition(async () => {
      const res = await convertirAEstudianteAction(prospectoId);
      if (res.error) {
        alert(res.error);
      } else {
        alert('¡Prematrícula generada con éxito!\nEl expediente ya se encuentra en el módulo de Matrículas a la espera de validación de pago en Caja.');
      }
    });
  };

  return (
    <button
      onClick={handleConvertir}
      disabled={isPending}
      title="Derivar al módulo de Matrículas para validación de pago en Caja"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition shadow-2xs"
    >
      <FileCheck className="w-3.5 h-3.5" />
      <span>{isPending ? 'Generando...' : 'Generar Prematrícula (Caja)'}</span>
    </button>
  );
}

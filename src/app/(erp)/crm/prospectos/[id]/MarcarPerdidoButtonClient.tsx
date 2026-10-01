'use client'

import { useTransition } from 'react';
import { updateProspectoStatusAction } from '@/app/actions/crm/prospectos';

export function MarcarPerdidoButtonClient({ prospectoId }: { prospectoId: string }) {
  const [isPending, startTransition] = useTransition();

  const handlePerdido = () => {
    const motivo = prompt('Motivo de la pérdida (ej: Precio, Competencia, Desistió):');
    if (!motivo) return;
    const detalle = prompt('Detalle adicional (opcional):');
    
    startTransition(async () => {
      const res = await updateProspectoStatusAction(prospectoId, 'PERDIDO', motivo, detalle || undefined);
      if (res.error) alert(res.error);
    });
  };

  return (
    <button 
      onClick={handlePerdido} 
      disabled={isPending}
      className="bg-red-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50"
    >
      {isPending ? 'Procesando...' : 'Marcar Perdido'}
    </button>
  );
}

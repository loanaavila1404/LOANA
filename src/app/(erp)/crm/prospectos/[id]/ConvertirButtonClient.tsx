'use client'

import { useTransition } from 'react';
import { convertirAEstudianteAction } from '@/app/actions/crm/prospectos';

export function ConvertirButtonClient({ prospectoId }: { prospectoId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleConvertir = () => {
    if (!confirm('¿Estás seguro de convertir este prospecto a Estudiante? Se creará una Persona y un Estudiante en la base de datos.')) return;
    
    startTransition(async () => {
      const res = await convertirAEstudianteAction(prospectoId);
      if (res.error) alert(res.error);
    });
  };

  return (
    <button 
      onClick={handleConvertir} 
      disabled={isPending}
      className="bg-green-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
    >
      {isPending ? 'Convirtiendo...' : 'Convertir a Estudiante'}
    </button>
  );
}

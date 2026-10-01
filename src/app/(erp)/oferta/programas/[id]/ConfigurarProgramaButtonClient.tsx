'use client'

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { createEstructuraBasicaAction } from '@/app/actions/oferta/programas';

export function ConfigurarProgramaButtonClient({ programaId }: { programaId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleConfigurar = () => {
    startTransition(async () => {
      setError(null);
      const res = await createEstructuraBasicaAction(programaId);
      if (res.error) {
        setError(res.error);
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
      <h3 className="text-lg font-medium text-slate-800 mb-2">Configuración académica pendiente</h3>
      <p className="text-sm text-slate-500 mb-4 max-w-md">
        Este programa todavía no tiene una estructura de ciclos y cursos. Es necesario crear la estructura básica para poder registrar cursos y abrir ediciones.
      </p>
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
      <Button onClick={handleConfigurar} disabled={isPending}>
        {isPending ? 'Configurando...' : 'Crear estructura básica'}
      </Button>
    </div>
  );
}

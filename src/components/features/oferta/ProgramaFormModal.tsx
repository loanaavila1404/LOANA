'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createPrograma } from '@/app/actions/oferta';
import { useFormState, useFormStatus } from 'react-dom';
import { useEffect } from 'react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Guardando...' : 'Guardar Programa'}
    </Button>
  );
}

interface ProgramaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProgramaFormModal({ isOpen, onClose }: ProgramaFormModalProps) {
  const [state, formAction] = useFormState(createPrograma, null);

  useEffect(() => {
    if (state?.success) {
      alert(state.message); // In a real app we'd use a toast
      onClose();
    } else if (state?.success === false && state.message) {
      alert(state.message);
    }
  }, [state, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Programa">
      <form action={formAction} className="space-y-4">
        {state?.success === false && !state.errors && (
          <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
            {state.message}
          </div>
        )}
        
        <div className="space-y-2">
          <label htmlFor="codigo" className="text-sm font-medium">Código</label>
          <Input id="codigo" name="codigo" required />
          {state?.errors?.codigo && <p className="text-xs text-red-500">{state.errors.codigo[0]}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="nombre" className="text-sm font-medium">Nombre</label>
          <Input id="nombre" name="nombre" required />
          {state?.errors?.nombre && <p className="text-xs text-red-500">{state.errors.nombre[0]}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="descripcion" className="text-sm font-medium">Descripción</label>
          <Input id="descripcion" name="descripcion" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="duracion_cantidad" className="text-sm font-medium">Duración</label>
            <Input id="duracion_cantidad" name="duracion_cantidad" type="number" min="1" />
          </div>
          <div className="space-y-2">
            <label htmlFor="duracion_unidad" className="text-sm font-medium">Unidad (Meses/Años)</label>
            <Input id="duracion_unidad" name="duracion_unidad" />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="total_ciclos" className="text-sm font-medium">Total de Ciclos</label>
          <Input id="total_ciclos" name="total_ciclos" type="number" min="1" />
        </div>

        <div className="flex justify-end pt-4 space-x-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <SubmitButton />
        </div>
      </form>
    </Modal>
  );
}

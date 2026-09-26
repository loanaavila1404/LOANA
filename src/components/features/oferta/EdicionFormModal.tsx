'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
// import { Select } from '@/components/ui/Select';
import { createEdicion } from '@/app/actions/oferta';
import { useFormState, useFormStatus } from 'react-dom';
import { useEffect } from 'react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Guardando...' : 'Guardar Edición'}
    </Button>
  );
}

interface EdicionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EdicionFormModal({ isOpen, onClose }: EdicionFormModalProps) {
  const [state, formAction] = useFormState(createEdicion, null);

  useEffect(() => {
    if (state?.success) {
      alert(state.message); // In a real app we'd use a toast
      onClose();
    } else if (state?.success === false && state.message) {
      alert(state.message);
    }
  }, [state, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva Edición">
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
          <Input id="nombre" name="nombre" />
          {state?.errors?.nombre && <p className="text-xs text-red-500">{state.errors.nombre[0]}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="modalidad" className="text-sm font-medium">Modalidad</label>
            <Input id="modalidad" name="modalidad" placeholder="Presencial / Virtual" />
          </div>
          <div className="space-y-2">
            <label htmlFor="turno" className="text-sm font-medium">Turno</label>
            <Input id="turno" name="turno" placeholder="Mañana / Tarde / Noche" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="fecha_inicio" className="text-sm font-medium">Fecha Inicio</label>
            <Input id="fecha_inicio" name="fecha_inicio" type="date" />
          </div>
          <div className="space-y-2">
            <label htmlFor="fecha_fin" className="text-sm font-medium">Fecha Fin</label>
            <Input id="fecha_fin" name="fecha_fin" type="date" />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="vacantes" className="text-sm font-medium">Vacantes</label>
          <Input id="vacantes" name="vacantes" type="number" min="0" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="precio_matricula" className="text-sm font-medium">Precio Matrícula</label>
            <Input id="precio_matricula" name="precio_matricula" type="number" step="0.01" min="0" />
          </div>
          <div className="space-y-2">
            <label htmlFor="precio_pension" className="text-sm font-medium">Precio Pensión</label>
            <Input id="precio_pension" name="precio_pension" type="number" step="0.01" min="0" />
          </div>
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

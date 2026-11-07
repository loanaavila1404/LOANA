'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { AlertModal } from '@/components/ui/Feedback';
import { Plus } from 'lucide-react';

export function NewEdicionButton() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <div className="flex gap-2">
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Nueva Edición
        </Button>
      </div>

      <AlertModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Apertura de Nueva Edición Académica"
        description="Para registrar y aperturar una nueva cohorte académica con sus aranceles y vacantes, ingresa a la ficha del Programa Académico respectivo en Oferta Académica y utiliza el botón de creación de edición."
        variant="info"
        buttonText="Entendido"
      />
    </>
  );
}

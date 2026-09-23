'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { EdicionFormModal } from './EdicionFormModal';
import { ProgramaFormModal } from './ProgramaFormModal';

export function NewEdicionButton() {
  const [isEdicionOpen, setIsEdicionOpen] = React.useState(false);
  const [isProgramaOpen, setIsProgramaOpen] = React.useState(false);

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setIsProgramaOpen(true)}>
          Nuevo Programa
        </Button>
        <Button onClick={() => setIsEdicionOpen(true)}>
          Nueva Edición
        </Button>
      </div>
      <EdicionFormModal isOpen={isEdicionOpen} onClose={() => setIsEdicionOpen(false)} />
      <ProgramaFormModal isOpen={isProgramaOpen} onClose={() => setIsProgramaOpen(false)} />
    </>
  );
}

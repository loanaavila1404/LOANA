'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';

export function NewEdicionButton() {
  return (
    <>
      <div className="flex gap-2">
        <Button onClick={() => alert('No implementado aún')}>
          Nueva Edición
        </Button>
      </div>
    </>
  );
}

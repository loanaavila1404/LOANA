'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';

export function NewEdicionButton() {
  return (
    <Button onClick={() => alert('Nueva Edición clicked!')}>
      Nueva Edición
    </Button>
  );
}

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { PlusCircle } from 'lucide-react'
import { MatriculaFormModal } from './MatriculaFormModal'

interface NewMatriculaButtonProps {
  estudiantes: { id: string, nombres: string, apellido_paterno: string }[]
  ediciones: { id: string, codigo: string, nombre: string }[]
}

export function NewMatriculaButton({ estudiantes, ediciones }: NewMatriculaButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button className="flex items-center gap-2" onClick={() => setIsOpen(true)}>
        <PlusCircle className="h-4 w-4" />
        Nueva Matrícula
      </Button>

      <MatriculaFormModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        estudiantes={estudiantes}
        ediciones={ediciones}
      />
    </>
  )
}

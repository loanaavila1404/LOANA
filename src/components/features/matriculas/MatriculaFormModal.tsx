'use client'

import { useState, useActionState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
// import { Select } from '@/components/ui/Select'
import { createMatricula } from '@/app/actions/matriculas'

interface MatriculaFormModalProps {
  isOpen: boolean
  onClose: () => void
  estudiantes: { id: string, nombres: string, apellido_paterno: string }[]
  ediciones: { id: string, codigo: string, nombre: string }[]
}

export function MatriculaFormModal({ isOpen, onClose, estudiantes, ediciones }: MatriculaFormModalProps) {
  const [state, formAction, isPending] = useActionState(createMatricula, null)
  const [registrarPago, setRegistrarPago] = useState(false)

  useEffect(() => {
    if (state?.success === true) {
      onClose()
    }
  }, [state, onClose])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva Matrícula">
      <form action={formAction} className="space-y-4">
        {state?.success === false && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
            {state.message}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-graphite-700 mb-1">Estudiante</label>
          <select 
            name="estudiante_id" 
            required 
            className="flex h-10 w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Seleccione un estudiante...</option>
            {estudiantes.map(e => (
              <option key={e.id} value={e.id}>{e.nombres} {e.apellido_paterno}</option>
            ))}
          </select>
          {state?.errors?.estudiante_id && <p className="text-red-500 text-xs mt-1">{state.errors.estudiante_id}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-graphite-700 mb-1">Edición</label>
          <select 
            name="edicion_id" 
            required 
            className="flex h-10 w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Seleccione una edición...</option>
            {ediciones.map(e => (
              <option key={e.id} value={e.id}>{e.codigo} - {e.nombre}</option>
            ))}
          </select>
          {state?.errors?.edicion_id && <p className="text-red-500 text-xs mt-1">{state.errors.edicion_id}</p>}
        </div>

        <Input 
          label="Importe Matrícula" 
          name="importe_matricula" 
          type="number" 
          step="0.01" 
          min="0"
          required 
          error={state?.errors?.importe_matricula?.join(', ')}
        />

        <Input 
          label="Observaciones" 
          name="observaciones" 
          type="text" 
          error={state?.errors?.observaciones?.join(', ')}
        />

        <div className="flex items-center gap-2 mt-4">
          <input 
            type="checkbox" 
            id="registrar_pago"
            name="registrar_pago"
            checked={registrarPago}
            onChange={(e) => setRegistrarPago(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="registrar_pago" className="text-sm text-graphite-700 font-medium">
            Registrar Pago Inicial
          </label>
        </div>

        {registrarPago && (
          <div className="space-y-4 p-4 border rounded-md bg-graphite-50 mt-2">
            <h4 className="text-sm font-semibold text-graphite-900">Detalles del Pago</h4>
            <Input 
              label="Monto de Pago" 
              name="monto_pago" 
              type="number" 
              step="0.01"
              min="0"
              required={registrarPago}
              error={state?.errors?.monto_pago?.join(', ')}
            />
            
            <div>
              <label className="block text-sm font-medium text-graphite-700 mb-1">Medio de Pago</label>
              <select 
                name="medio_pago" 
                className="flex h-10 w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="EFECTIVO">Efectivo</option>
                <option value="TARJETA">Tarjeta</option>
                <option value="TRANSFERENCIA">Transferencia</option>
              </select>
              {state?.errors?.medio_pago && <p className="text-red-500 text-xs mt-1">{state.errors.medio_pago}</p>}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Guardando...' : 'Crear Matrícula'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

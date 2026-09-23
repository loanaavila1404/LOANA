"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createProspecto } from "@/app/actions/crm";

interface ProspectoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProspectoFormModal({ isOpen, onClose }: ProspectoFormModalProps) {
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setFormError("");

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createProspecto(formData);

      if (result.success) {
        onClose();
      } else {
        if (result.errors) {
          setErrors(result.errors);
        } else if (result.message) {
          setFormError(result.message);
        }
      }
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Prospecto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
            {formError}
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <Input 
            label="Nombres" 
            name="nombres" 
            error={errors.nombres?.[0]} 
            required
          />
          <Input 
            label="Apellidos" 
            name="apellidos" 
            error={errors.apellidos?.[0]} 
            required
          />
        </div>

        <Input 
          label="Email" 
          name="email" 
          type="email" 
          error={errors.email?.[0]} 
        />
        
        <Input 
          label="Teléfono" 
          name="telefono" 
          type="tel" 
          error={errors.telefono?.[0]} 
        />

        <div className="flex flex-col gap-1 w-full">
          <label className="text-sm font-medium text-graphite-900">Nivel de Interés</label>
          <select 
            name="nivel_interes" 
            className="flex h-[38px] w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-graphite-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            defaultValue="MEDIO"
          >
            <option value="ALTO">Alto</option>
            <option value="MEDIO">Medio</option>
            <option value="BAJO">Bajo</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

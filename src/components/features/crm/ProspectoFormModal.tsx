"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createProspecto } from "@/app/actions/crm";

export interface ProspectoModalAdvisor {
  id: string;
  display_name: string | null;
  email?: string | null;
  role_name?: string | null;
}

interface ProspectoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  asesores?: ProspectoModalAdvisor[];
  programas?: { id: string; nombre: string }[];
}

export function ProspectoFormModal({
  isOpen,
  onClose,
  asesores = [],
  programas = [],
}: ProspectoFormModalProps) {
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
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Prospecto Comercial">
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
            {formError}
          </div>
        )}

        <div className="flex flex-col gap-1 w-full">
          <label className="text-sm font-medium text-graphite-900">Asesor Asignado *</label>
          <select
            name="asesor_id"
            defaultValue={asesores[0]?.id || ""}
            className="flex h-[38px] w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-graphite-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            {asesores.length === 0 ? (
              <option value="">Asignar automáticamente a mi usuario</option>
            ) : (
              asesores.map(a => (
                <option key={a.id} value={a.id}>
                  {a.display_name || a.email || "Asesor Activo"}
                  {a.role_name ? ` (${a.role_name})` : ""}
                </option>
              ))
            )}
          </select>
        </div>

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

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Nro. Documento (DNI)"
            name="numero_documento"
          />
          <Input
            label="Teléfono / WhatsApp"
            name="telefono"
            type="tel"
            error={errors.telefono?.[0]}
            required
          />
        </div>

        <Input
          label="Email"
          name="email"
          type="email"
          error={errors.email?.[0]}
        />

        {programas.length > 0 && (
          <div className="flex flex-col gap-1 w-full">
            <label className="text-sm font-medium text-graphite-900">Programa de Interés</label>
            <select
              name="programa_id"
              className="flex h-[38px] w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-graphite-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              defaultValue=""
            >
              <option value="">Seleccione un programa...</option>
              {programas.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1 w-full">
            <label className="text-sm font-medium text-graphite-900">Canal de Captación</label>
            <select
              name="canal_captacion"
              className="flex h-[38px] w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-graphite-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              defaultValue="WHATSAPP"
            >
              <option value="WHATSAPP">WhatsApp</option>
              <option value="FACEBOOK_ADS">Facebook Ads</option>
              <option value="WEB">Página Web</option>
              <option value="TIKTOK">TikTok</option>
              <option value="PRESENCIAL">Presencial</option>
              <option value="REFERIDO">Referido</option>
            </select>
          </div>

          <div className="flex flex-col gap-1 w-full">
            <label className="text-sm font-medium text-graphite-900">Temperatura / Interés</label>
            <select
              name="nivel_interes"
              className="flex h-[38px] w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-graphite-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              defaultValue="ALTO"
            >
              <option value="ALTO">Alta 🔥</option>
              <option value="MEDIO">Media</option>
              <option value="BAJO">Baja</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Guardando..." : "Guardar Prospecto"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

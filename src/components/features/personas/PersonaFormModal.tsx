"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { savePersona } from "@/app/actions/personas";
import { PersonaFormData } from "@/lib/validators/personas";
import { PlusCircle } from "lucide-react";

export function PersonaFormModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<PersonaFormData>({
    nombres: "",
    apellido_paterno: "",
    apellido_materno: "",
    tipo_documento: "DNI",
    numero_documento: "",
    email: "",
    telefono: "",
    status: "activo",
    es_estudiante: true, // Default to true since button says "Nuevo Estudiante"
    codigo_estudiante: "",
    observaciones: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    
    startTransition(async () => {
      const result = await savePersona(formData);
      if (result.success) {
        setIsOpen(false);
        // Reset form
        setFormData({
          nombres: "",
          apellido_paterno: "",
          apellido_materno: "",
          tipo_documento: "DNI",
          numero_documento: "",
          email: "",
          telefono: "",
          status: "activo",
          es_estudiante: true,
          codigo_estudiante: "",
          observaciones: ""
        });
      } else {
        setErrorMsg(result.message || "Ocurrió un error.");
      }
    });
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <PlusCircle className="mr-2 h-4 w-4" />
        Nuevo Estudiante / Persona
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Registrar Estudiante / Persona"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-100 text-red-700 rounded text-sm">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombres *</label>
              <Input
                name="nombres"
                value={formData.nombres}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Apellido Paterno *</label>
              <Input
                name="apellido_paterno"
                value={formData.apellido_paterno}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Apellido Materno</label>
              <Input
                name="apellido_materno"
                value={formData.apellido_materno}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo Doc *</label>
              <Select
                name="tipo_documento"
                value={formData.tipo_documento}
                onChange={handleChange}
              >
                <option value="DNI">DNI</option>
                <option value="CE">CE</option>
                <option value="Pasaporte">Pasaporte</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">N° Documento *</label>
              <Input
                name="numero_documento"
                value={formData.numero_documento}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Teléfono</label>
              <Input
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
              />
            </div>
            <div className="flex items-center space-x-2 pt-8">
              <input
                type="checkbox"
                id="es_estudiante"
                name="es_estudiante"
                checked={formData.es_estudiante}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="es_estudiante" className="text-sm font-medium">
                ¿Es Estudiante?
              </label>
            </div>
          </div>

          {formData.es_estudiante && (
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md">
              <div className="space-y-2">
                <label className="text-sm font-medium">Código de Estudiante</label>
                <Input
                  name="codigo_estudiante"
                  value={formData.codigo_estudiante}
                  onChange={handleChange}
                  placeholder="Generado auto si está vacío"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Observaciones</label>
                <Input
                  name="observaciones"
                  value={formData.observaciones}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

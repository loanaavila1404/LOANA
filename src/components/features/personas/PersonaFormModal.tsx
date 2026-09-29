"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { savePersona } from "@/app/actions/personas";
import { PersonaFormData } from "@/lib/validators/personas";
import { PlusCircle, Edit } from "lucide-react";



import { Database } from '@/types/database.types';

type InitialData = Partial<Database['public']['Tables']['personas']['Row']> & {
  es_estudiante?: boolean | null;
  observaciones?: string | null;
};

export function PersonaFormModal({ initialData }: { initialData?: InitialData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const isEditing = !!initialData;
  
  const [formData, setFormData] = useState<PersonaFormData>({
    id: initialData?.id || undefined,
    nombres: initialData?.nombres || "",
    apellido_paterno: initialData?.apellido_paterno || "",
    apellido_materno: initialData?.apellido_materno || "",
    tipo_documento: initialData?.tipo_documento || "DNI",
    numero_documento: initialData?.numero_documento || "",
    email: initialData?.email || "",
    telefono: initialData?.telefono || "",
    fecha_nacimiento: initialData?.fecha_nacimiento || "",
    direccion: initialData?.direccion || "",
    departamento: initialData?.departamento || "",
    provincia: initialData?.provincia || "",
    distrito: initialData?.distrito || "",
    status: (initialData?.status === "ACTIVO" || initialData?.status === "INACTIVO") ? initialData.status : "ACTIVO",
    es_estudiante: initialData?.es_estudiante || false,
    observaciones: initialData?.observaciones || ""
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
        if (!isEditing) {
          // Reset form only if creating
          setFormData({
            nombres: "",
            apellido_paterno: "",
            apellido_materno: "",
            tipo_documento: "DNI",
            numero_documento: "",
            email: "",
            telefono: "",
            fecha_nacimiento: "",
            direccion: "",
            departamento: "",
            provincia: "",
            distrito: "",
            status: "ACTIVO",
            es_estudiante: false,
            observaciones: ""
          });
        }
      } else {
        setErrorMsg(result.message || "Ocurrió un error.");
      }
    });
  };

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        variant={isEditing ? "outline" : "primary"}
                className={isEditing ? "bg-white border border-slate-300 text-slate-700 w-full md:w-auto" : "bg-[#c4121a] hover:bg-[#a00e15] text-white w-full md:w-auto"}
      >
        {isEditing ? (
          <>
            <Edit className="mr-2 h-4 w-4" />
            Editar Información
          </>
        ) : (
          <>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nueva persona
          </>
        )}
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={isEditing ? "Editar Persona" : "Registrar Persona"}
        className="max-w-3xl w-[800px]"
        variant="light"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} className="text-slate-600 hover:text-slate-900 hover:bg-slate-200">
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} onClick={handleSubmit} className="bg-[#c4121a] hover:bg-[#a00e15] text-white">
              {isPending ? "Guardando..." : (isEditing ? "Guardar Cambios" : "Registrar Persona")}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMsg && <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{errorMsg}</div>}


                    <div className="grid grid-cols-1 gap-x-6 gap-y-4">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#c4121a] uppercase tracking-wider border-b border-slate-200 pb-2">
                Datos Personales
              </h3>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Nombres *</label>
                <Input name="nombres" value={formData.nombres} onChange={handleChange} required className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Ap. Paterno *</label>
                  <Input name="apellido_paterno" value={formData.apellido_paterno} onChange={handleChange} required className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Ap. Materno</label>
                  <Input name="apellido_materno" value={formData.apellido_materno} onChange={handleChange} className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Tipo Doc. *</label>
                  <Select name="tipo_documento" value={formData.tipo_documento} onChange={handleChange} className="bg-white border-slate-300 text-slate-900">
                    <option value="DNI">DNI</option>
                    <option value="CE">CE</option>
                    <option value="PASAPORTE">Pasaporte</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Núm. Documento *</label>
                  <Input name="numero_documento" value={formData.numero_documento} onChange={handleChange} required className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Fecha de Nacimiento</label>
                  <Input type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleChange} className="bg-white border-slate-300 text-slate-900" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Estado del Registro</label>
                  <Select name="status" value={formData.status} onChange={handleChange} className="bg-white border-slate-300 text-slate-900">
                    <option value="ACTIVO">Activo</option>
                    <option value="INACTIVO">Inactivo</option>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4 mt-2">
              <h3 className="text-sm font-semibold text-[#c4121a] uppercase tracking-wider border-b border-slate-200 pb-2">
                Contacto y Ubicación
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Teléfono</label>
                  <Input name="telefono" value={formData.telefono} onChange={handleChange} className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Correo Electrónico</label>
                  <Input type="email" name="email" value={formData.email} onChange={handleChange} className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Dirección</label>
                <Input name="direccion" value={formData.direccion} onChange={handleChange} className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">Departamento</label>
                  <Input name="departamento" value={formData.departamento} onChange={handleChange} className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">Provincia</label>
                  <Input name="provincia" value={formData.provincia} onChange={handleChange} className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">Distrito</label>
                  <Input name="distrito" value={formData.distrito} onChange={handleChange} className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm" />
                </div>
              </div>
            </div>
          </div>
        </form>
      </Modal>

    </>
  );
}




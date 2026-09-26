"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { UserCheck } from "lucide-react";
import { convertirAEstudiante } from "@/app/actions/personas";


export function ConvertirEstudianteForm({ personaId }: { personaId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const codigo_estudiante = formData.get("codigo_estudiante") as string;
    const observaciones = formData.get("observaciones") as string;

    const res = await convertirAEstudiante(personaId, { codigo_estudiante, observaciones });
    setIsLoading(false);
    
    if (res.success) {
      setIsOpen(false);
    } else {
      setError(res.message || "Error");
    }
  };

  return (
    <>
      <Button 
        variant="primary" 
        className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 text-white" 
        onClick={() => setIsOpen(true)}
      >
        <UserCheck className="w-4 h-4 mr-2" />
        Convertir a Estudiante
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Convertir a Estudiante" >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">C&oacute;digo de Estudiante (Opcional)</label>
            <Input name="codigo_estudiante" placeholder="Si se deja en blanco se generar&aacute; autom&aacute;ticamente" className="bg-slate-900 border-slate-700" />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Observaciones iniciales (Opcional)</label>
            <Input name="observaciones" placeholder="Ej. Ingreso por traslado" className="bg-slate-900 border-slate-700" />
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-500 text-white">
              {isLoading ? "Convirtiendo..." : "Confirmar Conversi&oacute;n"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

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
    const observaciones = formData.get("observaciones") as string;
    const res = await convertirAEstudiante(personaId, { observaciones });
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
        className="w-full md:w-auto bg-[#c4121a] hover:bg-[#a00e15] text-white" 
        onClick={() => setIsOpen(true)}
      >
        <UserCheck className="w-4 h-4 mr-2" />
        Convertir a Estudiante
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Convertir a Estudiante" >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Observaciones iniciales (opcional)</label>
            <Input name="observaciones" placeholder="Ej. Ingreso por traslado" className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:ring-[#c4121a] focus:border-[#c4121a]" />
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isLoading} className="bg-[#c4121a] hover:bg-[#a00e15] text-white">
              {isLoading ? "Convirtiendo..." : "Confirmar conversión"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

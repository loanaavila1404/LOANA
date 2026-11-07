"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Power, PowerOff } from "lucide-react";
import { togglePersonaStatus } from "@/app/actions/personas";
import { useRouter } from "next/navigation";
import { ConfirmModal, AlertModal } from "@/components/ui/Feedback";

export function TogglePersonaStatusButton({ personaId, currentStatus }: { personaId: string, currentStatus: string }) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const isActive = (currentStatus || '').trim().toUpperCase() === "ACTIVO";

  const handleExecuteToggle = async () => {
    setIsLoading(true);
    const res = await togglePersonaStatus(personaId);
    setIsLoading(false);
    
    if (res.success) {
      setIsConfirmOpen(false);
      router.refresh();
    } else {
      setIsConfirmOpen(false);
      setErrorMessage(res.message || "Error al cambiar el estado del registro.");
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setIsConfirmOpen(true)} 
        disabled={isLoading}
        className={`w-full md:w-auto border-slate-300 bg-white ${isActive ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'}`}
      >
        {isActive ? (
          <>
            <PowerOff className="w-4 h-4 mr-2" />
            Inactivar Registro
          </>
        ) : (
          <>
            <Power className="w-4 h-4 mr-2" />
            Reactivar Registro
          </>
        )}
      </Button>

      {/* Modal Nativo de Confirmación */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleExecuteToggle}
        title={isActive ? "¿Inactivar Registro de Persona?" : "¿Reactivar Registro de Persona?"}
        description={
          isActive
            ? "El registro pasará a estado INACTIVO y no podrá vincularse a nuevas matrículas u operaciones hasta su reactivación."
            : "El registro pasará a estado ACTIVO para ser considerado en el padrón institucional."
        }
        confirmText={isActive ? "Confirmar Inactivación" : "Confirmar Reactivación"}
        variant={isActive ? "danger" : "primary"}
        isLoading={isLoading}
      />

      {/* Modal Nativo de Error / Alerta */}
      {errorMessage && (
        <AlertModal
          isOpen={Boolean(errorMessage)}
          onClose={() => setErrorMessage(null)}
          title="Atención"
          description={errorMessage}
          variant="error"
        />
      )}
    </>
  );
}

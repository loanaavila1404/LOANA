"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Power, PowerOff } from "lucide-react";
import { togglePersonaStatus } from "@/app/actions/personas";
import { useRouter } from "next/navigation";

export function TogglePersonaStatusButton({ personaId, currentStatus, isEstudiante }: { personaId: string, currentStatus: string, isEstudiante?: boolean }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const isActive = (currentStatus || '').toUpperCase() === "ACTIVO";

  const handleToggle = async () => {
    setIsLoading(true);
    const res = await togglePersonaStatus(personaId, currentStatus, isEstudiante);
    setIsLoading(false);
    
    if (res.success) {
      router.refresh();
    } else {
      alert(res.message);
    }
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleToggle} 
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
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Power, PowerOff } from "lucide-react";
import { togglePersonaStatus } from "@/app/actions/personas";
import { useRouter } from "next/navigation";

export function TogglePersonaStatusButton({ personaId, currentStatus }: { personaId: string, currentStatus: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const isActive = currentStatus === "ACTIVO";

  const handleToggle = async () => {
    setIsLoading(true);
    const res = await togglePersonaStatus(personaId, currentStatus);
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
      className={`w-full md:w-auto border-slate-700 bg-slate-900 ${isActive ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10' : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'}`}
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

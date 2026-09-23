"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useState } from "react";

export function AuditoriaFiltros({ currentEntity, currentAction }: { currentEntity: string; currentAction: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [entity, setEntity] = useState(currentEntity);
  const [action, setAction] = useState(currentAction);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (entity) params.set("entity", entity);
    else params.delete("entity");
    if (action) params.set("action", action);
    else params.delete("action");

    router.push(`/auditoria?${params.toString()}`);
  };

  const handleClear = () => {
    setEntity("");
    setAction("");
    router.push(`/auditoria`);
  };

  return (
    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 items-end">
      <div className="flex-1 w-full">
        <Input 
          label="Entidad / Tabla"
          placeholder="Ej. matriculas" 
          value={entity} 
          onChange={(e) => setEntity(e.target.value)} 
        />
      </div>
      <div className="flex-1 w-full">
        <Select 
          label="Acción"
          value={action}
          onChange={(e) => setAction(e.target.value)}
        >
          <option value="">Todas</option>
          <option value="INSERT">INSERT</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
        </Select>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={handleClear} className="h-[38px]">Limpiar</Button>
        <Button type="submit" className="h-[38px]">Filtrar</Button>
      </div>
    </form>
  );
}

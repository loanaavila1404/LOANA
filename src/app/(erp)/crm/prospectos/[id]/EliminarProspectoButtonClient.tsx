"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { ProspectoDeleteModal } from "@/components/features/crm/ProspectoDeleteModal";

export function EliminarProspectoButtonClient({
  prospectoId,
  prospectoCodigo,
  prospectoNombre,
}: {
  prospectoId: string;
  prospectoCodigo: string;
  prospectoNombre: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 transition shadow-2xs"
        title="Eliminar prospecto comercial con doble confirmación"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Eliminar</span>
      </button>

      <ProspectoDeleteModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        prospectoId={prospectoId}
        prospectoCodigo={prospectoCodigo}
        prospectoNombre={prospectoNombre}
        onDeleted={() => {
          router.push("/crm");
          router.refresh();
        }}
      />
    </>
  );
}

"use client";

import React, { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Trash2, AlertTriangle, AlertCircle, ShieldAlert } from "lucide-react";
import { deleteProspectoAction } from "@/app/actions/crm/prospectos";

interface ProspectoDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  prospectoId: string;
  prospectoCodigo: string;
  prospectoNombre: string;
  onDeleted?: (deletedId: string) => void;
}

const MOTIVOS_ELIMINACION = [
  "Prospecto duplicado en sistema",
  "Número telefónico equivocado o inexistente",
  "Desistió y solicitó retiro de la base de datos",
  "Registro de prueba / Error de digitación",
  "Otro motivo institucional",
] as const;

export function ProspectoDeleteModal({
  isOpen,
  onClose,
  prospectoId,
  prospectoCodigo,
  prospectoNombre,
  onDeleted,
}: ProspectoDeleteModalProps) {
  const [motivo, setMotivo] = useState<string>(MOTIVOS_ELIMINACION[0]);
  const [detalle, setDetalle] = useState<string>("");
  const [confirmationInput, setConfirmationInput] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isConfirmed = confirmationInput.trim().toUpperCase() === "ELIMINAR";

  const handleClose = () => {
    if (isPending) return;
    setConfirmationInput("");
    setDetalle("");
    setErrorMsg(null);
    onClose();
  };

  const handleDelete = () => {
    if (!isConfirmed) return;
    setErrorMsg(null);

    const fullMotivo = detalle.trim()
      ? `${motivo}: ${detalle.trim()}`
      : motivo;

    startTransition(async () => {
      const res = await deleteProspectoAction(prospectoId, fullMotivo);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        if (onDeleted) {
          onDeleted(prospectoId);
        }
        handleClose();
      }
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Eliminación de Prospecto Comercial">
      <div className="space-y-4">
        {/* Banner de advertencia */}
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-red-100 text-[#C4121A] shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-red-950 uppercase tracking-wide">
              Doble confirmación de seguridad
            </h4>
            <p className="text-xs text-red-800 leading-relaxed">
              Estás a punto de retirar al prospecto comercial{" "}
              <strong className="text-red-950 font-bold">{prospectoNombre}</strong> (
              <span className="font-mono font-bold">{prospectoCodigo}</span>) del CRM.
              Esta acción es destructiva y quedará registrada en la bitácora de auditoría.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-100/80 border border-rose-300 text-rose-900 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Motivo de la eliminación */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            Motivo de la eliminación *
          </label>
          <select
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            disabled={isPending}
            className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-[#C4121A]/20 focus:border-[#C4121A] text-slate-800 font-medium"
          >
            {MOTIVOS_ELIMINACION.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Detalle u observaciones */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            Observaciones o justificación adicional (opcional)
          </label>
          <textarea
            value={detalle}
            onChange={(e) => setDetalle(e.target.value)}
            disabled={isPending}
            rows={2}
            placeholder="Ej: El prospecto indicó que fue registrado dos veces por error..."
            className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-[#C4121A]/20 focus:border-[#C4121A] text-slate-800 placeholder:text-slate-400"
          />
        </div>

        {/* Verificación de texto: ELIMINAR */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <label className="text-xs font-bold text-slate-800 block">
            Para autorizar, escribe la palabra{" "}
            <span className="font-mono text-[#C4121A] bg-red-100 px-1.5 py-0.5 rounded font-black tracking-widest">
              ELIMINAR
            </span>{" "}
            en el campo inferior:
          </label>
          <input
            type="text"
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value)}
            disabled={isPending}
            placeholder="Escribe ELIMINAR para desbloquear"
            className="w-full text-xs font-mono font-bold tracking-wider uppercase bg-white border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-slate-900 placeholder:normal-case placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400"
          />
        </div>

        {/* Botones de acción */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending || !isConfirmed}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#C4121A] hover:bg-[#9E0E15] disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isPending ? "Eliminando..." : "Confirmar Eliminación Definitiva"}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

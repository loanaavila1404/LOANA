"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { updateUser } from "@/app/actions/usuarios";
import { CODIGOS_ROL } from "@/lib/constants/catalogs";

interface UserEditModalProps {
  user: {
    id: string;
    display_name: string | null;
    email: string | null;
    status: string | null;
    roleName: string | null;
  };
}

export function UserEditModal({ user }: UserEditModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    id: user.id,
    rolCodigo: user.roleName && CODIGOS_ROL.includes(user.roleName as any) ? user.roleName : "DOCENTE",
    status: user.status || "ACTIVO",
  });

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    
    startTransition(async () => {
      const result = await updateUser({
        id: formData.id,
        rolCodigo: formData.rolCodigo as any,
        status: formData.status as any,
      });

      if (result.success) {
        setSuccessMsg(result.message || "Usuario actualizado exitosamente");
        setTimeout(() => {
          setIsOpen(false);
          setSuccessMsg(null);
        }, 1500);
      } else {
        setErrorMsg(result.message || "Ocurrió un error al actualizar");
      }
    });
  };

  const isSuperadminOrSystem = user.roleName === 'SUPERADMIN' || user.email === 'loanaavila.la@gmail.com';

  return (
    <>
      <Button 
        variant="outline"
        onClick={() => setIsOpen(true)}
        disabled={isSuperadminOrSystem}
        title={isSuperadminOrSystem ? "No se puede editar este usuario" : "Editar usuario"}
      >
        Editar
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={`Editar Usuario: ${user.display_name || user.email}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md">
              {successMsg}
            </div>
          )}
          
          <div>
            <Select
              label="Rol"
              name="rolCodigo"
              value={formData.rolCodigo}
              onChange={handleChange}
              disabled={isPending}
              required
            >
              <option value="" disabled>Seleccione un rol</option>
              {CODIGOS_ROL.filter(r => r !== 'SUPERADMIN').map(rol => (
                <option key={rol} value={rol}>{rol}</option>
              ))}
            </Select>
          </div>
          
          <div>
            <Select
              label="Estado"
              name="status"
              value={formData.status}
              onChange={handleChange}
              disabled={isPending}
              required
            >
              <option value="ACTIVO">ACTIVO</option>
              <option value="INACTIVO">INACTIVO</option>
              <option value="BLOQUEADO">BLOQUEADO</option>
            </Select>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
            >
              {isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

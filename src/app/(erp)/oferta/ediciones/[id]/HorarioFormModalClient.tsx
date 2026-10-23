'use client'

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Database } from '@/types/database.types';
import { createHorarioAction, updateHorarioAction } from '@/app/actions/oferta/horarios';

type Horario = Database['public']['Tables']['horarios']['Row'];
type Curso = Pick<Database['public']['Tables']['cursos']['Row'], 'id' | 'nombre' | 'codigo'>;

export function HorarioFormModalClient({ 
  edicionId,
  horario,
  cursos,
  triggerText = '+ Nuevo Horario',
  variant = 'primary'
}: { 
  edicionId: string;
  horario?: Horario;
  cursos: Curso[];
  triggerText?: string;
  variant?: 'primary' | 'outline' | 'ghost';
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [cursoId, setCursoId] = useState(horario?.curso_id || '');
  const [diaSemana, setDiaSemana] = useState(horario?.dia_semana || 'LUNES');
  const [horaInicio, setHoraInicio] = useState(horario?.hora_inicio ? horario.hora_inicio.slice(0, 5) : '08:00');
  const [horaFin, setHoraFin] = useState(horario?.hora_fin ? horario.hora_fin.slice(0, 5) : '10:00');
  const [docente, setDocente] = useState(horario?.docente || '');
  const [ubicacion, setUbicacion] = useState(horario?.ubicacion || '');
  const [observaciones, setObservaciones] = useState(horario?.observaciones || '');

  useEffect(() => {
    if (isOpen) {
      setCursoId(horario?.curso_id || (cursos[0]?.id ?? ''));
      setDiaSemana(horario?.dia_semana || 'LUNES');
      setHoraInicio(horario?.hora_inicio ? horario.hora_inicio.slice(0, 5) : '08:00');
      setHoraFin(horario?.hora_fin ? horario.hora_fin.slice(0, 5) : '10:00');
      setDocente(horario?.docente || '');
      setUbicacion(horario?.ubicacion || '');
      setObservaciones(horario?.observaciones || '');
      setError(null);
    }
  }, [isOpen, horario, cursos]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set('edicion_id', edicionId);
    formData.set('curso_id', cursoId);
    formData.set('dia_semana', diaSemana);
    formData.set('hora_inicio', horaInicio);
    formData.set('hora_fin', horaFin);
    formData.set('docente', docente);
    formData.set('ubicacion', ubicacion);
    formData.set('observaciones', observaciones);
    
    startTransition(async () => {
      let result;
      if (horario) result = await updateHorarioAction(horario.id, formData);
      else result = await createHorarioAction(formData);

      if (result.error) {
        setError(result.error);
      } else {
        setIsOpen(false);
        router.refresh();
      }
    });
  };

  return (
    <>
      <Button variant={variant} onClick={() => setIsOpen(true)}>
        {triggerText}
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={horario ? 'Editar Sesión de Horario' : 'Registrar Nuevo Horario Académico'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-slate-900">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Curso / Asignatura *</label>
            <select 
              name="curso_id" 
              value={cursoId}
              onChange={(e) => setCursoId(e.target.value)}
              required
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
            >
              <option value="">Seleccione un curso de la malla...</option>
              {cursos.map(c => (
                <option key={c.id} value={c.id}>
                  {c.codigo ? `${c.codigo} — ` : ''}{c.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Día de la semana *</label>
              <select
                name="dia_semana"
                value={diaSemana}
                onChange={(e) => setDiaSemana(e.target.value)}
                required
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              >
                <option value="LUNES">Lunes</option>
                <option value="MARTES">Martes</option>
                <option value="MIERCOLES">Miércoles</option>
                <option value="JUEVES">Jueves</option>
                <option value="VIERNES">Viernes</option>
                <option value="SABADO">Sábado</option>
                <option value="DOMINGO">Domingo</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Hora Inicio (HH:MM) *</label>
              <Input
                type="time"
                name="hora_inicio"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                required
                className="text-slate-900 bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Hora Fin (HH:MM) *</label>
              <Input
                type="time"
                name="hora_fin"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
                required
                className="text-slate-900 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Docente Responsable</label>
              <Input
                name="docente"
                value={docente}
                onChange={(e) => setDocente(e.target.value)}
                placeholder="Ej. Lic. María Gómez"
                className="text-slate-900 bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Aula / Ambiente / Enlace</label>
              <Input
                name="ubicacion"
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value)}
                placeholder="Ej. Aula 101 - Sede Central"
                className="text-slate-900 bg-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Observaciones Académicas</label>
            <Input
              name="observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej. Laboratorio práctico / Sesión teórica"
              className="text-slate-900 bg-white"
            />
          </div>

          <div className="flex justify-end pt-4 space-x-2 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando...' : 'Guardar Horario'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

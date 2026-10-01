'use client'

import { useState, useTransition } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { confirmarMatriculaAction } from '@/app/actions/matriculas';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function MatriculaFormClient({
  estudiantes,
  prospectos,
  ediciones,
  asesores
}: {
  estudiantes: any[];
  prospectos: any[];
  ediciones: any[];
  asesores: any[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [selectedEstudianteId, setSelectedEstudianteId] = useState('');
  const [selectedEdicionId, setSelectedEdicionId] = useState('');
  
  const selectedEdicion = ediciones.find(e => e.id === selectedEdicionId);
  const selectedEstudiante = estudiantes.find(e => e.id === selectedEstudianteId);

  const [importeMatricula, setImporteMatricula] = useState<number>(0);
  const [importePension, setImportePension] = useState<number>(0);
  const [numeroPensiones, setNumeroPensiones] = useState<number>(1);
  const [primerVencimiento, setPrimerVencimiento] = useState<string>('');
  const [frecuenciaMeses, setFrecuenciaMeses] = useState<number>(1);

  // Sync state when edicion is selected
  const handleEdicionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedEdicionId(id);
    const ed = ediciones.find(x => x.id === id);
    if (ed) {
      setImporteMatricula(ed.precio_matricula || 0);
      setImportePension(ed.precio_pension || 0);
      setNumeroPensiones(ed.numero_pensiones || 1);
      setPrimerVencimiento(ed.primer_vencimiento || '');
      setFrecuenciaMeses(ed.frecuencia_meses || 1);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEstudianteId || !selectedEdicionId) {
      setError('Debes seleccionar estudiante y edición.');
      return;
    }
    setError(null);
    
    // Validar vacantes
    if (selectedEdicion?.vacantes !== null && selectedEdicion?.vacantes <= 0) {
      // In a real scenario, we'd calculate vacantes_ocupadas vs vacantes.
      // We rely on the backend RPC to block it safely to avoid race conditions.
    }

    const payload = {
      estudiante_id: selectedEstudianteId,
      edicion_id: selectedEdicionId,
      importe_matricula: Number(importeMatricula),
      importe_pension: Number(importePension),
      numero_pensiones: Number(numeroPensiones),
      primer_vencimiento: primerVencimiento,
      frecuencia_meses: Number(frecuenciaMeses),
      // Here we could add prospecto_id if selectedEstudianteId was actually a prospecto 
      // but to keep it simple, we assume selectedEstudianteId is already an estudiante. 
      // Si el prospecto aún no es estudiante, debió convertirse en CRM.
    };

    startTransition(async () => {
      const res = await confirmarMatriculaAction(payload);
      if (res.error) {
        setError(res.error);
      } else {
        router.push(`/matriculas/${res.matricula_id}`);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-md font-medium text-sm">{error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4 space-y-4">
          <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Datos del Estudiante</h3>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Estudiante *</label>
            <select 
              value={selectedEstudianteId} 
              onChange={e => setSelectedEstudianteId(e.target.value)}
              required
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
            >
              <option value="">Buscar o seleccionar estudiante...</option>
              {estudiantes.map(est => (
                <option key={est.id} value={est.id}>
                  {est.personas?.nombres} {est.personas?.apellido_paterno} {est.personas?.apellido_materno} ({est.personas?.numero_documento})
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500">Nota: El prospecto debe convertirse a Estudiante desde el CRM antes de generar matrícula.</p>
          </div>
          
          {selectedEstudiante && (
            <div className="bg-slate-50 p-3 rounded-md text-sm text-slate-700">
              <p><strong>DNI:</strong> {selectedEstudiante.personas?.numero_documento}</p>
              <p><strong>Código Estudiantil:</strong> {selectedEstudiante.codigo_estudiante || 'Se generará al confirmar'}</p>
            </div>
          )}
        </Card>

        <Card className="p-4 space-y-4">
          <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Selección de Edición</h3>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Programa / Edición *</label>
            <select 
              value={selectedEdicionId} 
              onChange={handleEdicionChange}
              required
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
            >
              <option value="">Seleccione una edición abierta...</option>
              {ediciones.map(ed => (
                <option key={ed.id} value={ed.id}>
                  {ed.codigo} - {ed.nombre} ({ed.programas?.nombre})
                </option>
              ))}
            </select>
          </div>

          {selectedEdicion && (
            <div className="bg-slate-50 p-3 rounded-md text-sm text-slate-700 grid grid-cols-2 gap-2">
              <p><strong>Vacantes Totales:</strong> {selectedEdicion.vacantes || 'Ilimitadas'}</p>
              <p><strong>Frecuencia:</strong> Cada {selectedEdicion.frecuencia_meses} mes(es)</p>
            </div>
          )}
        </Card>
      </div>

      <Card className="p-4 space-y-4">
        <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Estructura Financiera</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Importe Matrícula</label>
            <Input type="number" step="0.01" min="0" required value={importeMatricula} onChange={e => setImporteMatricula(Number(e.target.value))} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Importe por Pensión</label>
            <Input type="number" step="0.01" min="0" required value={importePension} onChange={e => setImportePension(Number(e.target.value))} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Nº Pensiones</label>
            <Input type="number" min="1" required value={numeroPensiones} onChange={e => setNumeroPensiones(Number(e.target.value))} />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-medium text-slate-700">1er Vencimiento Pensión</label>
            <Input type="date" required value={primerVencimiento} onChange={e => setPrimerVencimiento(e.target.value)} />
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Link href="/matriculas">
          <Button type="button" variant="ghost" disabled={isPending}>Cancelar</Button>
        </Link>
        <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700">
          {isPending ? 'Confirmando...' : 'Confirmar Matrícula'}
        </Button>
      </div>
    </form>
  );
}

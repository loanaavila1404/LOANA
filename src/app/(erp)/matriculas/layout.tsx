import { requirePermission } from '@/lib/auth/permissions';

export default async function MatriculasLayout({ children }: { children: React.ReactNode }) {
  await requirePermission(['MATRICULAS.VER', 'SISTEMA.ADMINISTRAR']);
  
  return (
    <div className="p-4 md:p-8 w-full max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Módulo de Matrículas</h1>
        <p className="text-slate-500">Gestión de inscripciones, reservas y pagos de estudiantes</p>
      </div>
      {children}
    </div>
  );
}

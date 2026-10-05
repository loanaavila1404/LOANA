import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-800">
      <h2 className="text-2xl font-bold mb-4">Registro no encontrado</h2>
      <p className="text-slate-600 mb-8">No pudimos encontrar la información solicitada o no existe.</p>
      <Link href="/matriculas" className="bg-slate-800 text-white px-4 py-2 rounded-md hover:bg-slate-700">
        Volver a Matrículas
      </Link>
    </div>
  );
}

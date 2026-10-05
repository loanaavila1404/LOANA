import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-800">
      <h2 className="text-2xl font-bold mb-4">404 - Página no encontrada</h2>
      <p className="text-slate-600 mb-8">La dirección que estás buscando no existe en el sistema.</p>
      <Link href="/" className="bg-slate-800 text-white px-4 py-2 rounded-md hover:bg-slate-700">
        Volver al Inicio
      </Link>
    </div>
  );
}

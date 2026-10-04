'use client';

export default function PrintButton() {
  return (
    <button 
      onClick={() => window.print()}
      className="bg-blue-900 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-800 transition-colors"
    >
      Imprimir / Guardar PDF
    </button>
  );
}

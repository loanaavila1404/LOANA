'use client';

import { useEffect } from 'react';

export default function PrintButton({
  label = 'Imprimir / Guardar PDF',
  autoPrint = false,
}: {
  label?: string;
  autoPrint?: boolean;
}) {
  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  return (
    <button 
      type="button"
      onClick={() => window.print()}
      className="bg-blue-900 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-800 transition-colors inline-flex items-center gap-2 shadow-xs cursor-pointer"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
      <span>{label}</span>
    </button>
  );
}

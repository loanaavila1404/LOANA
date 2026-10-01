export default function CRMLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800">CRM Comercial</h1>
        <p className="text-sm text-slate-500">Gestión de prospectos, embudo y tareas</p>
      </div>
      <div className="flex-1 p-6 overflow-auto">
        {children}
      </div>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { KanbanBoard } from "@/components/features/crm/KanbanBoard";
import { CRMHeader } from "@/components/features/crm/CRMHeader";

export default async function CRMPage() {
  const supabase = await createClient();

  // Fetch prospectos data
  const { data: prospectos, error } = await supabase
    .from("prospectos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching prospectos:", error);
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-[#F5F6F8]">
      <CRMHeader />
      
      {/* KPI Dashboard */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI Card 1 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 border-l-4 border-l-[#C4121A] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Total prospectos</span>
            <span className="p-1.5 bg-red-50 text-[#C4121A] rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{prospectos?.length || 0}</span>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">↑ +18.2% este mes</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-normal">Ciclo de admisiones activo 2026-I</p>
        </div>
        {/* KPI Card 2 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 border-l-4 border-l-blue-500 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>En seguimiento activo</span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">164</span>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">38.3% del embudo</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-normal">Con asesor asignado y llamada activa</p>
        </div>
        {/* KPI Card 3 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 border-l-4 border-l-amber-500 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Prematrículas / Reservas</span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">52</span>
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">Meta: 70 cupos</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-normal">Pendientes de validación de pago</p>
        </div>
        {/* KPI Card 4 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 border-l-4 border-l-emerald-500 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Tasa de conversión</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">28.4%</span>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">↑ +3.1% vs anterior</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-normal">Cierre efectivo a matrícula formal</p>
        </div>
      </section>

      {/* Operational Mini Ribbon */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between text-xs text-slate-600 shadow-sm gap-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-900">Leads de hoy:</span>
          <span className="font-bold text-[#C4121A] bg-red-50 px-2 py-0.5 rounded border border-red-100">19 nuevos</span>
        </div>
        <div className="h-3 w-px bg-slate-200 hidden md:block"></div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-900">Por contactar hoy:</span>
          <span className="font-semibold text-amber-600">34 tareas pendientes</span>
        </div>
        <div className="h-3 w-px bg-slate-200 hidden md:block"></div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-900">Asesores activos:</span>
          <span className="text-slate-700">6 en turno de atención</span>
        </div>
        <div className="h-3 w-px bg-slate-200 hidden md:block"></div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-900">Tiempo medio de 1er contacto:</span>
          <span className="font-bold text-emerald-600">14 min</span>
        </div>
      </div>

      {/* Main Board Section */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        {/* Controls Header */}
        <div className="p-4 border-b border-slate-200 space-y-4">
          {/* View Switcher Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <button className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1.5 transition">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 6h16M4 10h16M4 14h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                <span>Listado de prospectos</span>
              </button>
              <button className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-slate-900 text-white flex items-center gap-1.5 shadow-sm">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                <span>Embudo Kanban</span>
                <span className="bg-slate-700 text-white text-[10px] px-1.5 py-0.2 rounded-full">{prospectos?.length || 0}</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 p-4 bg-slate-50/50">
          <KanbanBoard prospectos={prospectos || []} />
        </div>
      </div>
    </div>
  );
}


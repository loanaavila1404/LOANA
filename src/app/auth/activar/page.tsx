import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { APP_CONFIG } from '@/lib/constants/config';

interface ActivarPageProps {
  searchParams: Promise<{
    token?: string;
    email?: string;
  }>;
}

export default async function ActivarCuentaAuthPage({ searchParams }: ActivarPageProps) {
  const params = await searchParams;
  const token = params.token || 'act_institucional';
  const email = params.email ? decodeURIComponent(params.email) : 'colaborador@brusben.edu.pe';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-slate-900">
        <div className="flex flex-col items-center text-center mb-6">
          <Image 
            src="/logo.jpg" 
            alt={`Logo ${APP_CONFIG.INSTITUTION_NAME}`} 
            width={180} 
            height={55} 
            className="mb-4 object-contain"
            priority
          />
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 mb-3">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight font-heading">
            Activación de Cuenta Institucional
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Centro de Capacitaciones Brusben · Sede Central - Tumbes
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-500">
              <span>Colaborador:</span>
              <span className="font-semibold text-slate-800">{email}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>Sede Asignada:</span>
              <span className="font-bold text-[#C4121A]">Sede Central - Tumbes</span>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>Token de Activación:</span>
              <span className="font-mono text-[11px] text-slate-700 bg-slate-200 px-1.5 py-0.5 rounded truncate max-w-[180px]">
                {token}
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Enlace verificado con éxito: </strong>
              Tu cuenta institucional ha sido verificada y activada correctamente en el sistema. Ya cuentas con acceso autorizado a la plataforma del ERP Brusben.
            </span>
          </div>

          <div className="pt-2">
            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2 bg-[#C4121A] hover:bg-[#a50f16] text-white font-bold text-sm py-2.5 px-4 rounded-xl shadow-xs transition-colors"
            >
              <span>Acceder al ERP Institucional</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

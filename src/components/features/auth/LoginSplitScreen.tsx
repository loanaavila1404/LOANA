"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  Award, 
  Users, 
  Cloud, 
  MapPin, 
  Lock, 
  ShieldCheck, 
  KeyRound, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  RefreshCw,
  Building2,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface LoginSplitScreenProps {
  initialError?: string | null;
}

export function LoginSplitScreen({ initialError }: LoginSplitScreenProps) {
  const router = useRouter();

  const [isContingencyOpen, setIsContingencyOpen] = useState(false);
  const [contingencyEmail, setContingencyEmail] = useState("");
  const [contingencyPassword, setContingencyPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [contingencyError, setContingencyError] = useState<string | null>(null);
  const [isLoggingIn, startTransition] = useTransition();

  const handleContingencySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContingencyError(null);

    if (!contingencyEmail.trim() || !contingencyPassword) {
      setContingencyError("Por favor ingresa tanto correo como contraseña.");
      return;
    }

    startTransition(async () => {
      try {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({
          email: contingencyEmail.trim().toLowerCase(),
          password: contingencyPassword,
        });

        if (error) {
          setContingencyError(error.message || "Credenciales de contingencia inválidas.");
          return;
        }

        router.push("/dashboard");
        router.refresh();
      } catch (err: unknown) {
        setContingencyError((err as Error).message || "Error al conectar con el servidor de autenticación.");
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#0F1117]">
      
      {/* ========================================================= */}
      {/* 1. PANEL IZQUIERDO: FONDO OSCURO CORPORATIVO (ESTILO STITCH) */}
      {/* ========================================================= */}
      <div className="w-full lg:w-[50%] xl:w-[52%] bg-[#12141A] text-white flex flex-col justify-between p-6 sm:p-10 lg:p-14 relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800/80">
        
        {/* Luces difusas de ambiente institucional */}
        <div className="absolute -top-32 -left-32 w-80 sm:w-96 h-80 sm:h-96 bg-[#c4121a]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 sm:w-96 h-80 sm:h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none opacity-40" />

        {/* Cabecera del Panel Izquierdo */}
        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-xs font-semibold text-rose-300 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-[#c4121a] animate-pulse" />
              <span>Plataforma Institucional Brusben</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
              ERP-STITCH • v2.4
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h1 className="text-2xl sm:text-4xl xl:text-5xl font-black font-heading text-white tracking-tight leading-[1.15]">
              Formación técnica con estándar de{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-red-300 to-amber-200">
                alta excelencia
              </span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl font-normal">
              Bienvenido al entorno unificado de control institucional del Centro de Capacitaciones Brusben E.I.R.L. Sede Central Tumbes. Gestión académica, seguimiento docente y control operativo en tiempo real.
            </p>
          </div>
        </div>

        {/* Tarjetas de Métricas Obligatorias */}
        <div className="relative z-10 my-8 sm:my-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            
            {/* Métrica 1: +10 Años */}
            <div className="bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 rounded-2xl p-4.5 backdrop-blur-sm transition duration-200 group">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-xl bg-[#c4121a]/20 border border-[#c4121a]/40 text-rose-400 group-hover:scale-105 transition-transform">
                  <Award className="w-4 h-4" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-rose-300/80 bg-rose-500/10 px-2 py-0.5 rounded">
                  Trayectoria
                </span>
              </div>
              <div className="text-2xl xl:text-3xl font-extrabold text-white tracking-tight">
                +10 Años
              </div>
              <p className="text-xs text-slate-300 mt-1 font-medium leading-snug">
                Liderazgo formando especialistas técnicos.
              </p>
            </div>

            {/* Métrica 2: +1,000 Estudiantes */}
            <div className="bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 rounded-2xl p-4.5 backdrop-blur-sm transition duration-200 group">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400 group-hover:scale-105 transition-transform">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-300/80 bg-blue-500/10 px-2 py-0.5 rounded">
                  Comunidad
                </span>
              </div>
              <div className="text-2xl xl:text-3xl font-extrabold text-white tracking-tight">
                +1,000 Estudiantes
              </div>
              <p className="text-xs text-slate-300 mt-1 font-medium leading-snug">
                Egresados con certificación oficial.
              </p>
            </div>

            {/* Métrica 3: 100% Cloud */}
            <div className="bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 rounded-2xl p-4.5 backdrop-blur-sm transition duration-200 group">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 group-hover:scale-105 transition-transform">
                  <Cloud className="w-4 h-4" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300/80 bg-emerald-500/10 px-2 py-0.5 rounded">
                  En Línea
                </span>
              </div>
              <div className="text-2xl xl:text-3xl font-extrabold text-white tracking-tight">
                100% Cloud
              </div>
              <p className="text-xs text-slate-300 mt-1 font-medium leading-snug">
                Disponibilidad 24/7 y auditoría en línea.
              </p>
            </div>

          </div>
        </div>

        {/* Pie de Panel Izquierdo */}
        <div className="relative z-10 border-t border-white/10 pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-slate-300 font-medium">
            <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Sede Central Tumbes - Filiales y Cobertura Nacional</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium bg-emerald-950/40 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Conexión Encriptada TLS 1.3</span>
          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* 2. PANEL DERECHO: FONDO LIMPIO OPERATIVO                  */}
      {/* ========================================================= */}
      <div className="w-full lg:w-[50%] xl:w-[48%] bg-[#F8FAFC] text-slate-900 flex flex-col justify-between p-6 sm:p-10 lg:p-14">
        
        {/* Cabecera con Indicadores Superiores */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>Sede Central - Tumbes</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sistema ERP v2.4 Activo</span>
          </div>
        </div>

        {/* Contenedor Central de Acceso / Login Card */}
        <div className="max-w-md w-full mx-auto my-auto py-8 space-y-6">
          
          {/* Logotipo Oficial */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200/90 inline-flex items-center justify-center">
              <Image 
                src="/logo.jpg" 
                alt="Logo Centro de Capacitaciones Brusben" 
                width={220} 
                height={70} 
                className="h-14 w-auto object-contain"
                priority
              />
            </div>
            
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 tracking-tight">
                Acceso Institucional Seguro
              </h2>
              <p className="text-xs text-slate-500 max-w-sm">
                Autenticación corporativa para personal directivo, docente y administrativo.
              </p>
            </div>
          </div>

          {/* Avisos de Error si existen */}
          {initialError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                {initialError === "inactive" 
                  ? "Acceso restringido: Tu cuenta está inactiva o no cuenta con los permisos asignados en el ERP."
                  : initialError === "OauthFailed"
                    ? "No se pudo completar la autenticación con Google. Por favor inténtalo de nuevo."
                    : "No se pudo iniciar sesión. Por favor verifica tus credenciales."}
              </div>
            </div>
          )}

          {/* Botón Principal Destacado: Iniciar Sesión con Google Workspace */}
          <div className="space-y-3">
            <form action="/auth/login-google" method="post">
              <button 
                type="submit"
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 border-2 border-slate-200/90 hover:border-slate-300 rounded-xl py-3.5 px-4 font-bold text-sm shadow-sm hover:shadow transition-all duration-150 cursor-pointer group"
              >
                <svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-slate-900 group-hover:text-black">
                  Iniciar sesión con Google Workspace
                </span>
              </button>
            </form>

            <div className="flex items-center gap-2 justify-center text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Autenticación de identidad institucional verificada</span>
            </div>
          </div>

          {/* Acordeón Discreto de Contingencia para Administradores de TI */}
          <div className="pt-2">
            <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => setIsContingencyOpen(!isContingencyOpen)}
                className="w-full px-4 py-3 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center justify-between transition-colors bg-slate-50/50 hover:bg-slate-50"
              >
                <div className="flex items-center gap-2">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                  <span>Acceso manual para Administradores de TI</span>
                </div>
                {isContingencyOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {isContingencyOpen && (
                <div className="p-4 border-t border-slate-100 bg-white space-y-3.5">
                  <div className="text-[11px] text-slate-500 leading-snug bg-amber-50/70 border border-amber-200/80 p-2.5 rounded-lg text-amber-900">
                    Modo contingencia exclusivo para mantenimiento de infraestructura y superadministradores en caso de soporte técnico.
                  </div>

                  {contingencyError && (
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{contingencyError}</span>
                    </div>
                  )}

                  <form onSubmit={handleContingencySubmit} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Correo Institucional
                      </label>
                      <input
                        type="email"
                        required
                        value={contingencyEmail}
                        onChange={(e) => setContingencyEmail(e.target.value)}
                        placeholder="admin@brusben.edu.pe"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#c4121a] focus:ring-1 focus:ring-[#c4121a] text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Contraseña de Contingencia
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={contingencyPassword}
                          onChange={(e) => setContingencyPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full pl-3 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#c4121a] focus:ring-1 focus:ring-[#c4121a] text-slate-800"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoggingIn}
                      className="w-full py-2.5 px-3 rounded-lg text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 active:bg-black transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      {isLoggingIn ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Validando credenciales...</span>
                        </>
                      ) : (
                        <span>Ingresar por Contingencia</span>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Pie de Página Institucional */}
        <div className="border-t border-slate-200/80 pt-4 text-center">
          <p className="text-xs text-slate-500 font-medium">
            2026 Centro de Capacitaciones Brusben E.I.R.L. • RUC: 28601234567 • Perú
          </p>
        </div>

      </div>

    </div>
  );
}

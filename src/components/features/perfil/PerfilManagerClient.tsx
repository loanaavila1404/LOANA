"use client";

import React, { useState, useTransition } from "react";
import { 
  ShieldCheck, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Lock, 
  Eye, 
  EyeOff, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  RefreshCw, 
  Building2, 
  BadgeCheck, 
  Fingerprint, 
  Globe2, 
  Smartphone, 
  Calendar,
  Sparkles,
  Laptop
} from "lucide-react";
import { updatePerfilAction, UpdatePerfilInput } from "@/app/actions/perfil";

export interface PerfilUsuarioData {
  id: string;
  email: string;
  displayName: string;
  nombres: string;
  apellidos: string;
  dni: string;
  telefono: string;
  correoRecuperacion: string;
  sede: string;
  rolNombre: string;
  rolCodigo: string;
  photoUrl: string | null;
  lastSignIn: string | null;
  provider: string;
  isProtected: boolean;
}

interface PerfilManagerClientProps {
  initialData: PerfilUsuarioData;
}

export function PerfilManagerClient({ initialData }: PerfilManagerClientProps) {
  const [formData, setFormData] = useState({
    nombres: initialData.nombres,
    apellidos: initialData.apellidos,
    dni: initialData.dni,
    telefono: initialData.telefono,
    correoRecuperacion: initialData.correoRecuperacion,
    nuevaPassword: "",
    confirmarPassword: "",
  });

  const [showNuevaPassword, setShowNuevaPassword] = useState(false);
  const [showConfirmarPassword, setShowConfirmarPassword] = useState(false);

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const getInitials = (nombres: string, apellidos: string) => {
    const n = nombres.trim() ? nombres.trim()[0] : "L";
    const a = apellidos.trim() ? apellidos.trim()[0] : "A";
    return `${n}${a}`.toUpperCase();
  };

  const currentFullName = `${formData.nombres} ${formData.apellidos}`.trim() || initialData.displayName;

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (feedback) setFeedback(null);
  };

  const handleReset = () => {
    setFormData({
      nombres: initialData.nombres,
      apellidos: initialData.apellidos,
      dni: initialData.dni,
      telefono: initialData.telefono,
      correoRecuperacion: initialData.correoRecuperacion,
      nuevaPassword: "",
      confirmarPassword: "",
    });
    setFeedback(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombres.trim()) {
      setFeedback({ type: "error", message: "El campo Nombres no puede quedar vacío." });
      return;
    }
    if (!formData.apellidos.trim()) {
      setFeedback({ type: "error", message: "El campo Apellidos no puede quedar vacío." });
      return;
    }

    if (formData.nuevaPassword || formData.confirmarPassword) {
      if (formData.nuevaPassword.length < 8) {
        setFeedback({ type: "error", message: "La nueva contraseña debe tener al menos 8 caracteres." });
        return;
      }
      if (formData.nuevaPassword !== formData.confirmarPassword) {
        setFeedback({ type: "error", message: "Las contraseñas no coinciden. Por favor revísalas antes de continuar." });
        return;
      }
    }

    startTransition(async () => {
      const payload: UpdatePerfilInput = {
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        dni: formData.dni,
        telefono: formData.telefono,
        correoRecuperacion: formData.correoRecuperacion,
        nuevaPassword: formData.nuevaPassword || undefined,
        confirmarPassword: formData.confirmarPassword || undefined,
      };

      const res = await updatePerfilAction(payload);
      if (res.success) {
        setFeedback({ type: "success", message: res.message || "Datos de perfil actualizados exitosamente." });
        // Limpiar campos de contraseña tras éxito
        setFormData(prev => ({ ...prev, nuevaPassword: "", confirmarPassword: "" }));
      } else {
        setFeedback({ type: "error", message: res.message || "Ocurrió un error al guardar los cambios." });
      }
    });
  };

  // Formato amigable de fecha de último acceso
  const formattedLastAccess = React.useMemo(() => {
    if (!initialData.lastSignIn) return "Hoy, sesión activa";
    try {
      const date = new Date(initialData.lastSignIn);
      return new Intl.DateTimeFormat("es-PE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(date);
    } catch {
      return "Hoy, sesión activa";
    }
  }, [initialData.lastSignIn]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* 1. CABECERA INSTITUCIONAL EJECUTIVA CON IDENTIDAD (STITCH STANDARD) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        {/* Adorno superior sutil */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#c4121a] via-rose-600 to-amber-500" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar / Iniciales */}
            <div className="relative group">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-[#c4121a] to-[#800a10] text-white font-extrabold text-2xl sm:text-3xl flex items-center justify-center shadow-md ring-4 ring-rose-50 overflow-hidden shrink-0 select-none">
                {initialData.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={initialData.photoUrl} 
                    alt={currentFullName} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <span>{getInitials(formData.nombres, formData.apellidos)}</span>
                )}
              </div>
              <div 
                className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm"
                title="Usuario en línea y verificado"
              >
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
            </div>

            {/* Datos Principales */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 tracking-tight">
                  {currentFullName}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-[#c4121a] border border-red-200 shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#c4121a]" />
                  Superadministrador
                </span>
                {initialData.isProtected && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 shadow-xs">
                    <BadgeCheck className="w-3.5 h-3.5 text-slate-500" />
                    Cuenta Raíz Protegida
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {initialData.email}
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1.5 text-blue-700 font-semibold bg-blue-50/80 px-2 py-0.5 rounded border border-blue-200/80">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  Sede Central - Tumbes
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Estado: Activo
                </span>
              </div>
            </div>
          </div>

          {/* Tarjeta de Resumen Rápido Lateral */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 text-xs space-y-1.5 min-w-[240px]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Resumen de Acceso Institucional
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-500">Último acceso:</span>
              <span className="font-semibold text-slate-800">{formattedLastAccess}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-500">Autenticación:</span>
              <span className="font-medium text-slate-800 flex items-center gap-1">
                <Globe2 className="w-3 h-3 text-slate-500" /> Google Workspace
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-500">Doble Factor:</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Habilitado (2FA)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* NOTIFICACIÓN DE ESTADO / FEEDBACK */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 transition-all duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-50/90 border-emerald-200 text-emerald-800"
              : "bg-rose-50/90 border-rose-200 text-rose-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-sm font-medium">{feedback.message}</div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. FORMULARIO EN DOS SECCIONES LIMPIAS */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* SECCIÓN 1: DATOS PERSONALES Y DE CONTACTO (7 COLUMNAS) */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2.5 rounded-xl bg-red-50 text-[#c4121a] border border-red-100">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Datos Personales y de Contacto</h2>
                <p className="text-xs text-slate-500">
                  Información oficial de identidad, comunicación institucional y sede física fija.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Nombres y Apellidos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Nombres <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombres}
                    onChange={(e) => handleInputChange("nombres", e.target.value)}
                    placeholder="Ej. Loana"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#c4121a] focus:ring-1 focus:ring-[#c4121a] text-slate-800 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Apellidos <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.apellidos}
                    onChange={(e) => handleInputChange("apellidos", e.target.value)}
                    placeholder="Ej. Avila Neyra"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#c4121a] focus:ring-1 focus:ring-[#c4121a] text-slate-800 transition"
                  />
                </div>
              </div>

              {/* DNI y Teléfono / WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Fingerprint className="w-3.5 h-3.5 text-slate-400" />
                    <span>DNI / Documento de Identidad</span>
                  </label>
                  <input
                    type="text"
                    maxLength={12}
                    value={formData.dni}
                    onChange={(e) => handleInputChange("dni", e.target.value)}
                    placeholder="Ej. 72849102"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#c4121a] focus:ring-1 focus:ring-[#c4121a] text-slate-800 transition"
                  />
                  <p className="text-[11px] text-slate-400">Documento nacional de identidad oficial.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Teléfono / WhatsApp Operativo</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => handleInputChange("telefono", e.target.value)}
                    placeholder="Ej. +51 972 849 102"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#c4121a] focus:ring-1 focus:ring-[#c4121a] text-slate-800 transition"
                  />
                  <p className="text-[11px] text-slate-400">Línea directa para avisos operacionales y alertas.</p>
                </div>
              </div>

              {/* Correo Principal y Correo de Recuperación */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Correo Institucional (Raíz)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      readOnly
                      disabled
                      value={initialData.email}
                      className="w-full px-3.5 py-2 text-sm bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed select-none"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400">Identificador raíz inmutable en Supabase Auth.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Correo de Recuperación</span>
                  </label>
                  <input
                    type="email"
                    value={formData.correoRecuperacion}
                    onChange={(e) => handleInputChange("correoRecuperacion", e.target.value)}
                    placeholder="loanaavila.la@gmail.com"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#c4121a] focus:ring-1 focus:ring-[#c4121a] text-slate-800 transition"
                  />
                  <p className="text-[11px] text-slate-400">Dirección para restablecimiento de acceso y seguridad.</p>
                </div>
              </div>

              {/* Sede Institucional: Estrictamente fija en Sede Central - Tumbes */}
              <div className="pt-2 border-t border-slate-100">
                <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-100/70 text-blue-700 mt-0.5 shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">Sede Institucional Asignada</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          Sede Única Autorizada
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium mt-0.5">
                        Sede Central - Tumbes
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Asignación predeterminada fija de acuerdo al estándar institucional de Brusben.
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Fija e inmutable</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: SEGURIDAD, ACCESOS Y CONTRASEÑA (5 COLUMNAS) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Tarjeta de Estado de Sesión y Seguridad */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Seguridad y Accesos</h2>
                  <p className="text-xs text-slate-500">
                    Monitoreo de sesión activa, factores de autenticación y privilegios.
                  </p>
                </div>
              </div>

              {/* Lista de indicadores de seguridad */}
              <div className="space-y-3 text-xs">
                {/* Sesión Activa */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <Laptop className="w-4 h-4 text-slate-500" />
                    <div>
                      <div className="font-semibold text-slate-800">Sesión Actual de Trabajo</div>
                      <div className="text-[11px] text-slate-400">Navegador Web / Windows Desktop</div>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Activa
                  </span>
                </div>

                {/* 2FA */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <Lock className="w-4 h-4 text-slate-500" />
                    <div>
                      <div className="font-semibold text-slate-800">Verificación en Dos Pasos</div>
                      <div className="text-[11px] text-slate-400">Google Workspace Authenticator</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    Protegido
                  </span>
                </div>

                {/* Rol RBAC */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <BadgeCheck className="w-4 h-4 text-[#c4121a]" />
                    <div>
                      <div className="font-semibold text-slate-800">Nivel de Privilegios</div>
                      <div className="text-[11px] text-slate-400">Acceso Irrestricto a Toda la Plataforma</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[#c4121a] bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    Nivel 1
                  </span>
                </div>
              </div>

              {/* Formulario de Cambio de Contraseña */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-slate-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Actualización de Contraseña
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Configura o actualiza una contraseña de acceso directo de respaldo para tu cuenta:
                </p>

                <div className="space-y-3">
                  {/* Nueva Contraseña */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Nueva contraseña</label>
                    <div className="relative">
                      <input
                        type={showNuevaPassword ? "text" : "password"}
                        value={formData.nuevaPassword}
                        onChange={(e) => handleInputChange("nuevaPassword", e.target.value)}
                        placeholder="Mínimo 8 caracteres"
                        className="w-full pl-3.5 pr-10 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#c4121a] focus:ring-1 focus:ring-[#c4121a] text-slate-800 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNuevaPassword(!showNuevaPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-xs"
                      >
                        {showNuevaPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirmar Contraseña */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Confirmar contraseña</label>
                    <div className="relative">
                      <input
                        type={showConfirmarPassword ? "text" : "password"}
                        value={formData.confirmarPassword}
                        onChange={(e) => handleInputChange("confirmarPassword", e.target.value)}
                        placeholder="Repite la contraseña"
                        className="w-full pl-3.5 pr-10 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#c4121a] focus:ring-1 focus:ring-[#c4121a] text-slate-800 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmarPassword(!showConfirmarPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-xs"
                      >
                        {showConfirmarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Requisitos mínimos */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 space-y-1">
                    <div className="font-semibold text-slate-700">Directiva de Seguridad:</div>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-500">
                      <li>Mínimo 8 caracteres alfanuméricos.</li>
                      <li>Ambos campos deben coincidir con exactitud.</li>
                      <li>Dejar en blanco si no deseas cambiar la clave actual.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* 3. BARRA DE ACCIÓN INFERIOR / BOTÓN GUARDAR CAMBIOS */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 flex items-center gap-2 text-center sm:text-left">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Los cambios guardados se aplican de forma inmediata en las sesiones institucionales.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleReset}
              disabled={isPending}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition disabled:opacity-50"
            >
              Restablecer
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2.5 text-xs font-bold text-white bg-[#c4121a] hover:bg-[#a50f15] active:bg-[#850b10] rounded-lg shadow-sm hover:shadow transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Guardando cambios...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

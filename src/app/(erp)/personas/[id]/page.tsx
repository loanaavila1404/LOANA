import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getPersonaById } from "@/app/actions/personas";
import { hasPermission } from "@/lib/auth/permissions";
import Link from "next/link";
import { ChevronLeft, ShieldAlert, History, MapPin, Mail, Phone, Calendar } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { notFound } from "next/navigation";
import { ConvertirEstudianteForm } from "@/components/features/personas/ConvertirEstudianteForm";
import { PersonaFormModal } from "@/components/features/personas/PersonaFormModal";
import { TogglePersonaStatusButton } from "@/components/features/personas/TogglePersonaStatusButton";

export default async function PersonaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const canEdit = await hasPermission(["ESTUDIANTES.EDITAR", "SISTEMA.ADMINISTRAR"]);
  
  let persona;
  try {
    persona = await getPersonaById(id);
  } catch { 
    notFound();
  }

  const estudiante = persona.estudiantes; // One-to-many relationship mapping from DB (though conceptually 1-1)
  const isEstudiante = !!estudiante;

  // Semáforo Documental basico
  const requiredFields = [persona.nombres, persona.apellido_paterno, persona.tipo_documento, persona.numero_documento];
  const missingCritical = requiredFields.some(f => !f);
  
  let semaphoreColor = "bg-emerald-500";
  let semaphoreText = "Documentación Completa";
  
  if (missingCritical) {
    semaphoreColor = "bg-red-500";
    semaphoreText = "Documentación Incompleta";
  } else if (!persona.email || !persona.telefono || !persona.direccion) {
    semaphoreColor = "bg-amber-500";
    semaphoreText = "Faltan datos de contacto";
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <Link href="/personas">
        <Button variant="ghost" className="text-slate-600 hover:text-slate-900 -ml-2 mb-2">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Volver al directorio
        </Button>
      </Link>
      
      {/* Header Profile */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-canvas border border-slate-200 rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#c4121a]/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-3xl font-bold text-[#c4121a]">
            {getInitials(persona.nombres || "", persona.apellido_paterno || "")}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-slate-900 font-heading">
                {persona.nombres} {persona.apellido_paterno} {persona.apellido_materno || ""}
              </h1>
              <Badge variant={persona.status === 'ACTIVO' ? 'default' : 'danger'} 
                  className={persona.status === 'ACTIVO' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : ''}>
                {persona.status}
              </Badge>
              {isEstudiante && (
                <Badge variant="default" className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Estudiante
                </Badge>
              )}
            </div>
            <p className="text-slate-600 flex items-center gap-2">
              <span className="text-slate-500 font-medium">{persona.tipo_documento}:</span> {persona.numero_documento}
              <span className="text-slate-700">|</span>
              <span className="text-sm">Registrado: {persona.created_at ? new Date(persona.created_at).toLocaleDateString() : "No registrado"}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto relative z-10">
          {!isEstudiante && canEdit && (
            <ConvertirEstudianteForm personaId={persona.id} />
          )}
          {canEdit && <PersonaFormModal initialData={{...persona, es_estudiante: isEstudiante, codigo_estudiante: estudiante?.codigo_estudiante || ""}} />}
          {canEdit && <TogglePersonaStatusButton personaId={persona.id} currentStatus={persona.status || "ACTIVO"} />}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Info */}
        <div className="md:col-span-1 space-y-6">
          
          {/* Semáforo Documental */}
          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-slate-500" />
                Semáforo Documental
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${semaphoreColor} shadow-[0_0_10px_rgba(0,0,0,0.1)] shadow-${semaphoreColor}`}></div>
                <span className="text-slate-900 font-medium text-sm">{semaphoreText}</span>
              </div>
            </CardContent>
          </Card>

          {/* Contacto y Ubicación */}
          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100 mb-3">
              <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
                Contacto y Ubicación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Correo Electrónico</p>
                  <p className="text-sm text-slate-500 break-all">{persona.email || "No registrado"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Teléfono</p>
                  <p className="text-sm text-slate-500">{persona.telefono || "No registrado"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Dirección</p>
                  <p className="text-sm text-slate-500">{persona.direccion || "No registrada"}</p>
                  {(persona.distrito || persona.provincia || persona.departamento) && (
                    <p className="text-xs text-slate-600 mt-0.5">
                      {[persona.distrito, persona.provincia, persona.departamento].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Fecha de Nacimiento</p>
                  <p className="text-sm text-slate-500">{persona.fecha_nacimiento ? new Date(persona.fecha_nacimiento).toLocaleDateString() : "No registrado"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información Institucional */}
          {isEstudiante && (
            <Card className="bg-white border-slate-200 bg-gradient-to-br from-slate-50 to-white">
              <CardHeader className="pb-3 border-b border-slate-100 mb-3">
                <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
                  Información Institucional
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500">Código de Estudiante</p>
                  <p className="text-lg font-bold text-[#c4121a]">{estudiante?.codigo_estudiante || "Generación Pendiente"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Fecha de Ingreso</p>
                  <p className="text-sm text-slate-500">{estudiante?.fecha_ingreso ? new Date(estudiante.fecha_ingreso).toLocaleDateString() : (estudiante?.created_at ? new Date(estudiante.created_at).toLocaleDateString() : "No registrado")}</p>
                </div>
                {estudiante?.observaciones && (
                  <div>
                    <p className="text-xs text-slate-500">Observaciones</p>
                    <p className="text-sm text-slate-500 whitespace-pre-wrap">{estudiante?.observaciones}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Historial y Actividad */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-white border-slate-200">
            <CardHeader className="border-b border-slate-200">
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#c4121a]" />
                Matrículas y Pagos (Fase Posterior)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-10 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <History className="w-8 h-8 text-slate-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Historial en desarrollo</h3>
              <p className="text-slate-600 text-sm max-w-sm">
                Las vinculaciones con matrículas y pagos se activarán una vez que el módulo respectivo (Fase 4 y 5) esté implementado.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}



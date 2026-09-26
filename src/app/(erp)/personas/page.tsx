import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Search, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { getPersonas, getPersonasMetrics, PersonaSearchParams } from "@/app/actions/personas";
import { hasPermission } from "@/lib/auth/permissions";
import { PersonaFormModal } from "@/components/features/personas/PersonaFormModal";
import Link from "next/link";
import { getInitials } from "@/lib/utils";

export default async function PersonasPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  
  const canEdit = await hasPermission(["ESTUDIANTES.EDITAR", "SISTEMA.ADMINISTRAR"]);
  
  const q = typeof resolvedParams.q === "string" ? resolvedParams.q : undefined;
  const status = typeof resolvedParams.status === "string" ? resolvedParams.status : "TODOS";
  const es_estudiante = typeof resolvedParams.es_estudiante === "string" ? resolvedParams.es_estudiante : "TODOS";
  const page = typeof resolvedParams.page === "string" ? parseInt(resolvedParams.page, 10) : 1;

  const params: PersonaSearchParams = {
    q,
    status,
    es_estudiante,
    page,
    limit: 10,
  };

  const { data: personas, count, totalPages } = await getPersonas(params);
  const metrics = await getPersonasMetrics();

  // Generate pagination links
  const createPageUrl = (newPage: number) => {
    const urlParams = new URLSearchParams();
    if (q) urlParams.set("q", q);
    if (status !== "TODOS") urlParams.set("status", status);
    if (es_estudiante !== "TODOS") urlParams.set("es_estudiante", es_estudiante);
    urlParams.set("page", newPage.toString());
    return `/personas?${urlParams.toString()}`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header and KPIs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900">Personas y estudiantes</h1>
          <p className="text-slate-600 text-sm mt-1">
            Gesti&oacute;n de directorio institucional, perfiles y matr&iacute;culas.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* <Button variant="outline" className="flex-1 sm:flex-none justify-center">
            <FileText className="w-4 h-4 mr-2" />
            Exportar
          </Button> */}
          <div className="flex-1 sm:flex-none">
            {canEdit && <PersonaFormModal />}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200">
          <CardContent className="p-5 flex flex-col justify-center">
            <p className="text-sm font-medium text-slate-500">Total registrados</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{metrics.totalPersonas}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="p-5 flex flex-col justify-center">
            <p className="text-sm font-medium text-slate-500">Estudiantes activos</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{metrics.estudiantesActivos}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="p-5 flex flex-col justify-center">
            <p className="text-sm font-medium text-slate-500">Nuevos (30 días)</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{metrics.estudiantesNuevos}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="p-5 flex flex-col justify-center">
            <p className="text-sm font-medium text-slate-500">Expedientes incompletos</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{metrics.expedientesIncompletos}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-canvas border-slate-200">
        <CardContent className="p-4 sm:p-5">
          <form className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="w-full sm:w-96 space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase">Buscar</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <Input 
                  name="q" 
                  defaultValue={q} 
                  placeholder="Nombre, documento..." 
                  className="pl-9 bg-white border-slate-200 text-slate-900" 
                />
              </div>
            </div>
            <div className="w-full sm:w-48 space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase">Estado</label>
              <Select name="status" defaultValue={status} className="bg-white border-slate-200 text-slate-900">
                <option value="TODOS">Todos</option>
                <option value="ACTIVO">Activos</option>
                <option value="INACTIVO">Inactivos</option>
              </Select>
            </div>
            <div className="w-full sm:w-48 space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase">Rol</label>
              <Select name="es_estudiante" defaultValue={es_estudiante} className="bg-white border-slate-200 text-slate-900">
                <option value="TODOS">Todos</option>
                <option value="true">Solo Estudiantes</option>
                <option value="false">Solo Personas</option>
              </Select>
            </div>
            <Button type="submit" className="w-full sm:w-auto">Filtrar</Button>
            {(q || status !== "TODOS" || es_estudiante !== "TODOS") && (
              <Link href="/personas" className="w-full sm:w-auto">
                <Button type="button" variant="ghost" className="w-full text-slate-600 hover:text-slate-900">
                  Limpiar
                </Button>
              </Link>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="bg-canvas border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[300px] text-slate-600 font-medium">Persona</TableHead>
                <TableHead className="text-slate-600 font-medium">Documento</TableHead>
                <TableHead className="text-slate-600 font-medium">Contacto</TableHead>
                <TableHead className="text-slate-600 font-medium">Rol Institucional</TableHead>
                <TableHead className="text-slate-600 font-medium">Estado</TableHead>
                <TableHead className="text-right text-slate-600 font-medium">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-800">
              {personas?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-600">
                    No se encontraron resultados.
                  </TableCell>
                </TableRow>
              ) : (
                personas?.map((persona) => {
                  const estudiante = persona.estudiantes; // Because it's an array for one-to-many joined from supabase standard
                  const isEstudiante = !!estudiante;
                  
                  return (
                    <TableRow key={persona.id} className="hover:bg-slate-800/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-[#c4121a] font-bold text-xs shrink-0 border border-slate-700">
                            {getInitials(persona.nombres || "", persona.apellido_paterno || "")}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate">
                              {persona.apellido_paterno} {persona.apellido_materno || ''}, {persona.nombres}
                            </p>
                            <p className="text-xs text-slate-600 truncate">ID: {persona.id.split('-')[0]}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-slate-500 font-medium">{persona.numero_documento}</p>
                        <p className="text-xs text-slate-500">{persona.tipo_documento}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-slate-500 truncate max-w-[180px]">{persona.email || 'Sin correo'}</p>
                        <p className="text-xs text-slate-500">{persona.telefono || 'Sin telfono'}</p>
                      </TableCell>
                      <TableCell>
                        {isEstudiante ? (
                          <div>
                            <Badge variant="default" className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Estudiante
                            </Badge>
                            <p className="text-xs text-slate-600 mt-1">{estudiante.codigo_estudiante || 'Sin cdigo'}</p>
                          </div>
                        ) : (
                          <Badge variant="default" className="bg-slate-800 text-slate-500">
                            Persona
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={persona.status === 'ACTIVO' ? 'default' : 'danger'} 
                          className={persona.status === 'ACTIVO' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : ''}>
                          {persona.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/personas/${persona.id}`}>
                          <Button variant="ghost" className="text-[#c4121a] hover:text-[#a00e15] hover:bg-[#c4121a]/10 h-8">
                            Ver Perfil
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-600">
            <p>Mostrando p&aacute;gina {page} de {totalPages}</p>
            <div className="flex gap-2">
              <Link href={page > 1 ? createPageUrl(page - 1) : "#"} className={page <= 1 ? "pointer-events-none opacity-50" : ""}>
                <Button variant="outline" className="h-8 border-slate-200 bg-white" disabled={page <= 1}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
                </Button>
              </Link>
              <Link href={page < totalPages ? createPageUrl(page + 1) : "#"} className={page >= totalPages ? "pointer-events-none opacity-50" : ""}>
                <Button variant="outline" className="h-8 border-slate-200 bg-white" disabled={page >= totalPages}>
                  Siguiente <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}


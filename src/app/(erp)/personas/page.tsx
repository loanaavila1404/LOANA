import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { UserCheck, PlusCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PersonaFormModal } from "@/components/features/personas/PersonaFormModal";

export default async function PersonasPage() {
  const supabase = await createClient();

  const { data: personas, error } = await supabase
    .from("personas")
    .select(`
      *,
      estudiantes (id, codigo_estudiante, status)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching personas:", error);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-heading">Estudiantes y Personas</h1>
        <PersonaFormModal />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Directorio de Personas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {personas && personas.length > 0 ? (
                personas.map((persona) => {
                  const isEstudiante = persona.estudiantes !== null;
                  return (
                    <TableRow key={persona.id}>
                      <TableCell className="font-medium">
                        {persona.nombres} {persona.apellido_paterno} {persona.apellido_materno || ''}
                      </TableCell>
                      <TableCell>{persona.numero_documento || '-'}</TableCell>
                      <TableCell>{persona.email || '-'}</TableCell>
                      <TableCell>{persona.telefono || '-'}</TableCell>
                      <TableCell>
                        {isEstudiante ? (
                          <Badge variant="success">Estudiante</Badge>
                        ) : (
                          <Badge variant="default">Persona</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={persona.status === 'activo' ? 'success' : 'default'}>
                          {persona.status || 'Activo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost">Ver perfil</Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    No se encontraron personas.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

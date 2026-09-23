import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { CreditCard, PlusCircle } from "lucide-react"
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils/currency'

export default async function MatriculasPage() {
  const supabase = await createClient()

  const { data: matriculas } = await supabase
    .from('matriculas')
    .select(`
      id,
      codigo_matricula,
      fecha_matricula,
      importe_matricula,
      status,
      estudiantes (
        codigo_estudiante,
        personas (
          nombres,
          apellido_paterno
        )
      )
    `)
    .order('fecha_matricula', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-graphite-900 font-heading flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            Matrículas y Pagos
          </h1>
          <p className="text-graphite-600 mt-1">Gestión de inscripciones, reservas y pagos de cuotas</p>
        </div>
        <Button className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Nueva Matrícula
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimas Matrículas</CardTitle>
        </CardHeader>
        <CardContent>
          {matriculas && matriculas.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Importe</TableHead>
                  <TableHead className="text-right">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matriculas.map((mat) => {
                  const persona = mat.estudiantes?.personas;
                  const nombreCompleto = persona ? `${persona.nombres} ${persona.apellido_paterno}` : 'Desconocido';
                  return (
                    <TableRow key={mat.id}>
                      <TableCell className="font-mono text-xs">{mat.codigo_matricula}</TableCell>
                      <TableCell className="font-medium text-graphite-900">{nombreCompleto}</TableCell>
                      <TableCell>{mat.fecha_matricula ? new Date(mat.fecha_matricula).toLocaleDateString('es-PE') : '-'}</TableCell>
                      <TableCell>{formatCurrency(mat.importe_matricula || 0)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={mat.status === 'CONFIRMADA' ? 'success' : 'default'}>
                          {mat.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-graphite-500">
              <CreditCard className="h-12 w-12 mb-4 text-graphite-300" />
              <p>No se encontraron matrículas en el sistema.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

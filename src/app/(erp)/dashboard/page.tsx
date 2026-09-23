import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Users, BookOpen, GraduationCap, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // Real count fetches
  const { count: estudiantesActivos } = await supabase
    .from('estudiantes')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'ACTIVO') // Default active state

  const { count: prematriculas } = await supabase
    .from('matriculas')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'PRE_MATRICULADO')

  const { count: prospectosActivos } = await supabase
    .from('prospectos')
    .select('*', { count: 'exact', head: true })
    .in('status', ['NUEVO', 'CONTACTADO', 'INTERESADO'])

  const { count: tareasPendientes } = await supabase
    .from('tareas_comerciales')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'PENDIENTE')

  const metrics = [
    { title: 'Estudiantes activos', value: estudiantesActivos || '0', icon: GraduationCap, color: 'text-primary' },
    { title: 'Prematrículas', value: prematriculas || '0', icon: BookOpen, color: 'text-warning' },
    { title: 'Prospectos activos', value: prospectosActivos || '0', icon: Users, color: 'text-success' },
    { title: 'Tareas pendientes', value: tareasPendientes || '0', icon: Clock, color: 'text-graphite-600' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-graphite-900 font-heading">Panel de Gestión</h1>
        <p className="text-graphite-600 mt-1">Resumen de los principales indicadores del ERP</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-graphite-600">
                {metric.title}
              </CardTitle>
              <metric.icon className={`h-5 w-5 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-graphite-900">{metric.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Últimos registros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-40 items-center justify-center text-graphite-500 bg-canvas rounded-md border border-dashed border-border">
              Sin datos recientes
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Alertas operativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-40 items-center justify-center text-graphite-500 bg-canvas rounded-md border border-dashed border-border">
              No hay alertas pendientes
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

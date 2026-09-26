# Migraciones Pendientes (Para Fases Siguientes)

## Permisos Específicos para Reportes

Antes de implementar el módulo de Reportes en su respectiva fase, se debe ejecutar una migración para agregar permisos específicos para reportes.

**Permisos a agregar:**
- `REPORTES.VER`: Acceso general al módulo de reportes.
- `REPORTES.EXPORTAR`: Capacidad de exportar reportes a Excel/CSV.
- `REPORTES.FINANCIEROS_VER`: Capacidad de ver los indicadores financieros específicos.

```sql
-- Ejemplo de la migración aditiva a generar en la fase de reportes:
INSERT INTO permissions (code, description, module) VALUES 
('REPORTES.VER', 'Ver reportes generales y estadisticas', 'Reportes'),
('REPORTES.EXPORTAR', 'Exportar reportes del sistema', 'Reportes'),
('REPORTES.FINANCIEROS_VER', 'Ver reportes e indicadores financieros', 'Reportes');

-- Luego se asignarán estos permisos a los roles DIRECTIVO, COORDINACION, etc.
```

**Estado Actual:**
El menú lateral solo muestra la sección de Reportes si el usuario posee `SISTEMA.ADMINISTRAR`, de acuerdo con las condiciones temporales de seguridad para la Fase 2 y Fase 3.

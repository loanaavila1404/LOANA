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

## Generación institucional del código de estudiante

La generación del código de estudiante será completamente automática y controlada desde el backend/base de datos.

**Reglas de implementación:**
- **Momento de generación:** Se genera únicamente al confirmarse la PRIMERA matrícula de un estudiante. Registrar la persona o convertirla en estudiante NO genera el código.
- **Formato:** `BRU-AAAA-NNNNNN` (ej. `BRU-2026-000001`), donde `AAAA` es el año de la primera matrícula confirmada y `NNNNNN` es un correlativo anual de seis dígitos.
- **Correlativo anual:** Cada año el contador se reinicia. La generación debe ser transaccional y segura ante concurrencia.
- **Generación transaccional en Supabase:** Se requiere crear una función/RPC segura que maneje el bloqueo e incremento atómico de una tabla de secuencias/correlativos por año.
- **Restricción UNIQUE:** El código de estudiante debe ser único en toda la base de datos.
- **Idempotencia:** Si un estudiante ya posee un código, confirmar matrículas subsecuentes no alterará ni generará un nuevo código.
- **Independencia de sede:** El código no incluye información de sede y no cambiará si el estudiante es trasladado.
- **Restricciones técnicas:** Está estrictamente prohibido usar funciones como `Date.now()`, `Math.random()`, timestamps o generadores expuestos en el frontend. El código solo puede originarse en una transacción controlada en la base de datos.
- **Históricos:** Los códigos previos al sistema se migrarán a través de un flujo administrativo controlado o importación, no desde el formulario normal.

**IMPORTANTE:**
Todavía NO debe ejecutarse ninguna migración relacionada. Esta lógica se implementará íntegramente durante la Fase de Matrículas.

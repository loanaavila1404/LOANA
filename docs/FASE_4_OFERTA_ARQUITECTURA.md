# Arquitectura Fase 4: Oferta Académica

Este documento consolida la auditoría, análisis técnico y decisiones propuestas para la oferta académica.

## 1. Estado y Estructura Recomendada (Riesgos de Despliegue)
La migración actual (`00010_sedes_oferta.sql`) **está pendiente de ejecución**. Debe coordinarse debido al impacto en toda la aplicación:

- **Sedes y RLS (Migración 00010)**: Implementa `sedes`, `usuario_sedes`, funciones de predicado y adición de `sede_id` a `ediciones` y `prospectos` (con backfill histórico a `TUM`).
- **Despliegue Coordinado**: *RIESGO ALTO.* Al hacer `sede_id` NOT NULL en `prospectos`, cualquier intento del frontend actual de crear un prospecto (por ejemplo, Server Actions en producción) fallará si no envía ese campo. Es obligatorio desplegar backend y frontend simultáneamente.
- **Riesgo Financiero Abierto (Fase Futura)**: **No** se implementa la lógica financiera en esta fase. El `INSERT` directo en `pagos` carece de protección por sede en esta migración (debido a que carece de aplicaciones al nacer), y el sistema aún es vulnerable a manipulación arbitraria de cuotas. **Queda expresamente prohibido temporalmente** habilitar una segunda sede operativa hasta que se implementen los RPC atómicos de registro y anulación transaccionales.

## 2. Decisiones Aprobadas
- **Sedes Obligatorias**: Implementación de `public.sedes` y `public.usuario_sedes`. Todo registro histórico recibe la sede central `TUM`.
- **Ausencia de Borrado Físico**: El `DELETE` queda denegado por defecto en la inmensa mayoría de tablas por omisión deliberada de `FOR DELETE`. Únicamente `usuario_sedes` admite eliminación para retirar accesos.
- **Validación Estricta**: La migración contiene chequeos sobre catálogos de base de datos (`pg_class`, `pg_constraint`, `information_schema`) e incluso colisiones normalizadas (`HAVING count(*) > 1`) abortando activamente en lugar de aplicar sobrescrituras destructivas.

## 3. SECURITY DEFINER y Evaluación por Padre
La evaluación de RLS vía `USING (EXISTS (JOIN ...))` produce falsos negativos y no sirve en un contexto `INSERT` si el ID aún no puede ser encontrado por el join.
Para solucionar esto, se emplean predicados `SECURITY DEFINER` evaluados mediante el identificador **padre**:

- `check_edicion_sede_access(edicion_id)` -> Usado por `horarios`, `matriculas`.
- `check_matricula_sede_access(matricula_id)` -> Usado por `cuotas`.
- `check_pago_sede_access(pago_id)` -> Usado por `pagos` (para UPDATE/SELECT).
- `check_prospecto_sede_access(prospecto_id)` -> Usado por `seguimientos`, `tareas_comerciales`, `transferencias_prospectos`.
- `user_has_sede_access(sede_id)` -> Usado de manera nativa por `sedes`, `ediciones`, `prospectos`.

### Especificaciones de Seguridad
Estas funciones aseguran que no haya escalada de privilegios ni manipulación de `search_path`:
- Tienen `SET search_path = public, pg_temp;`.
- Empiezan con `IF auth.uid() IS NULL THEN RETURN false; END IF;`.
- Usan objetos enteramente calificados con `public.`.
- Tienen `REVOKE ALL FROM PUBLIC, anon; GRANT EXECUTE TO authenticated;`.

## 4. Diferenciación de Políticas y Protección de UPDATE (WITH CHECK)
Todas las tablas han reemplazado `FOR ALL` por políticas especializadas (`FOR SELECT`, `FOR INSERT`, `FOR UPDATE`).

La política de `UPDATE` usa estrictamente:
- **USING (...)**: Para evaluar el registro padre *actual*. Si el usuario intenta mover un horario de una edición que no controla, la política deniega encontrar la fila.
- **WITH CHECK (...)**: Para evaluar el registro padre *nuevo*. Si el usuario intenta asignar un nuevo `edicion_id` de una sede foránea, la política aborta la transacción.

### Matriz Comparativa (Sedes)

| Tabla | SELECT | INSERT (`WITH CHECK`) | UPDATE (`USING` + `WITH CHECK`) |
|---|---|---|---|
| `horarios` | `check_edicion_sede_access(edicion_id)` | `check_edicion_sede_access(edicion_id)` | `check_edicion_sede_access(edicion_id)` |
| `matriculas` | `check_edicion_sede_access(edicion_id)` | `check_edicion_sede_access(edicion_id)` | `check_edicion_sede_access(edicion_id)` |
| `cuotas` | `check_matricula_sede_access(matricula_id)` | `check_matricula_sede_access(matricula_id)` | `check_matricula_sede_access(matricula_id)` |
| `pagos` | `check_pago_sede_access(id)` | **Sin filtro sede** (Permiso origin. `PAGOS.REGISTRAR`) | `check_pago_sede_access(id)` |
| `prospectos` | `user_has_sede_access(sede_id)` | `user_has_sede_access(sede_id)` | `user_has_sede_access(sede_id)` |
| `seguimientos` | `check_prospecto_sede_access(prospecto_id)` | `check_prospecto_sede_access(prospecto_id)` | `check_prospecto_sede_access(prospecto_id)` |
| `tareas_comer.` | `check_prospecto_sede_access(prospecto_id)` | `check_prospecto_sede_access(prospecto_id)` | `check_prospecto_sede_access(prospecto_id)` |
| `transferencias` | `check_prospecto_sede_access(prospecto_id)` | `check_prospecto_sede_access(prospecto_id)` | `check_prospecto_sede_access(prospecto_id)` |

*Las políticas preservan en su interior las verificaciones funcionales previas (`has_permission(...)`).*

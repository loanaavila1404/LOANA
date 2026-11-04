-- migrate:up
-- Migración 00013: Asignar permisos exclusivos y políticas RLS para ASESOR_COMERCIAL
-- 1. Acceso completo al CRM Comercial (CRM.VER, CRM.GESTIONAR, CRM.ADMINISTRAR, CRM.CONVERSION_SOLICITAR)
-- 2. Modo consulta estricto para Matrículas (MATRICULAS.VER) y visualización de Programas Académicos (PROGRAMAS.VER)
-- 3. Acceso a perfil propio (PERFIL_PROPIO.VER)
-- Bloqueo total de escritura financiera y académica directa (MATRICULAS.GESTIONAR, PAGOS.REGISTRAR, etc.)

-- Asignar permisos en role_permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'ASESOR_COMERCIAL'
  AND p.code IN (
    'CRM.VER',
    'CRM.GESTIONAR',
    'CRM.ADMINISTRAR',
    'CRM.CONVERSION_SOLICITAR',
    'MATRICULAS.VER',
    'PROGRAMAS.VER',
    'PERFIL_PROPIO.VER'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Políticas RLS complementarias para permitir a Asesores:
-- a) Visualizar información básica de personas y estudiantes en el padrón de matrículas y CRM
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'personas' AND policyname = 'Personas - Read by CRM and Matriculas'
    ) THEN
        CREATE POLICY "Personas - Read by CRM and Matriculas" ON personas 
        FOR SELECT USING (has_permission('CRM.VER') OR has_permission('MATRICULAS.VER'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'estudiantes' AND policyname = 'Estudiantes - Read by CRM and Matriculas'
    ) THEN
        CREATE POLICY "Estudiantes - Read by CRM and Matriculas" ON estudiantes 
        FOR SELECT USING (has_permission('CRM.VER') OR has_permission('MATRICULAS.VER'));
    END IF;

    -- b) Permitir inserción controlada de persona y estudiante durante la conversión de prospectos en CRM
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'personas' AND policyname = 'Personas - Insert by CRM Conversion'
    ) THEN
        CREATE POLICY "Personas - Insert by CRM Conversion" ON personas 
        FOR INSERT WITH CHECK (has_permission('CRM.CONVERSION_SOLICITAR') OR has_permission('CRM.GESTIONAR'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'estudiantes' AND policyname = 'Estudiantes - Insert by CRM Conversion'
    ) THEN
        CREATE POLICY "Estudiantes - Insert by CRM Conversion" ON estudiantes 
        FOR INSERT WITH CHECK (has_permission('CRM.CONVERSION_SOLICITAR') OR has_permission('CRM.GESTIONAR'));
    END IF;

    -- c) Permitir consulta de cuotas y pagos asociados a la matrícula para expedientes en solo lectura
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'cuotas' AND policyname = 'Cuotas - Read by Matriculas'
    ) THEN
        CREATE POLICY "Cuotas - Read by Matriculas" ON cuotas 
        FOR SELECT USING (has_permission('MATRICULAS.VER'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'pagos' AND policyname = 'Pagos - Read by Matriculas'
    ) THEN
        CREATE POLICY "Pagos - Read by Matriculas" ON pagos 
        FOR SELECT USING (has_permission('MATRICULAS.VER'));
    END IF;

    -- d) Permitir lectura de aplicaciones de pago para cobranza y visualización de matrículas
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'pago_aplicaciones' AND policyname = 'PagoAplicaciones - Read All'
    ) THEN
        CREATE POLICY "PagoAplicaciones - Read All" ON pago_aplicaciones 
        FOR SELECT USING (has_permission('COBRANZA.VER') OR has_permission('MATRICULAS.VER'));
    END IF;
END $$;

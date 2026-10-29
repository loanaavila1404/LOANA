-- migrate:up

-- ==========================================
-- 1. CORRECCIÓN DE LA FUNCIÓN HAS_PERMISSION
-- ==========================================
ALTER FUNCTION public.has_permission(text) SET search_path = public, pg_temp;

-- ==========================================
-- 2. RESTRICCIONES ADITIVAS (CÓDIGOS) Y VALIDACIÓN DE DATOS PREEXISTENTES
-- ==========================================
DO $$
DECLARE
    t text;
    r record;
    v_def text;
BEGIN
    FOR t IN SELECT unnest(ARRAY['programas', 'planes_estudio', 'periodos', 'ediciones']) LOOP
        EXECUTE format('SELECT id FROM public.%I WHERE codigo IS NULL OR codigo = '''' OR codigo != upper(trim(codigo)) LIMIT 1', t) INTO r;
        IF r IS NOT NULL THEN
            RAISE EXCEPTION 'Restricción fallida: Existen códigos inválidos (nulos, vacíos o sin normalizar) en la tabla %', t;
        END IF;
        
        EXECUTE format('SELECT upper(trim(codigo)) as cod, count(*) FROM public.%I GROUP BY upper(trim(codigo)) HAVING count(*) > 1 LIMIT 1', t) INTO r;
        IF r IS NOT NULL THEN
            RAISE EXCEPTION 'Restricción fallida: Existen colisiones de códigos normalizados en la tabla %', t;
        END IF;
    END LOOP;
    
    FOR t IN SELECT unnest(ARRAY['programas', 'planes_estudio', 'periodos', 'ediciones']) LOOP
        SELECT pg_get_constraintdef(c.oid) INTO v_def 
        FROM pg_constraint c 
        JOIN pg_namespace n ON n.oid = c.connamespace 
        JOIN pg_class cls ON cls.oid = c.conrelid 
        WHERE n.nspname = 'public' 
        AND cls.relname = t 
        AND c.conname = (CASE 
            WHEN t = 'programas' THEN 'chk_programas_codigo_norm'
            WHEN t = 'planes_estudio' THEN 'chk_planes_codigo_norm'
            WHEN t = 'periodos' THEN 'chk_periodos_codigo_norm'
            WHEN t = 'ediciones' THEN 'chk_ediciones_codigo_norm'
        END);
        
        IF v_def IS NOT NULL AND v_def NOT ILIKE '%upper(trim(codigo))%' THEN 
            RAISE EXCEPTION 'Definición incompatible de check de código en %: %', t, v_def; 
        END IF;
    END LOOP;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace JOIN pg_class cls ON cls.oid = c.conrelid WHERE n.nspname = 'public' AND cls.relname = 'programas' AND c.conname = 'chk_programas_codigo_norm') THEN
        ALTER TABLE public.programas ADD CONSTRAINT chk_programas_codigo_norm CHECK (codigo = upper(trim(codigo)));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace JOIN pg_class cls ON cls.oid = c.conrelid WHERE n.nspname = 'public' AND cls.relname = 'planes_estudio' AND c.conname = 'chk_planes_codigo_norm') THEN
        ALTER TABLE public.planes_estudio ADD CONSTRAINT chk_planes_codigo_norm CHECK (codigo = upper(trim(codigo)));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace JOIN pg_class cls ON cls.oid = c.conrelid WHERE n.nspname = 'public' AND cls.relname = 'periodos' AND c.conname = 'chk_periodos_codigo_norm') THEN
        ALTER TABLE public.periodos ADD CONSTRAINT chk_periodos_codigo_norm CHECK (codigo = upper(trim(codigo)));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace JOIN pg_class cls ON cls.oid = c.conrelid WHERE n.nspname = 'public' AND cls.relname = 'ediciones' AND c.conname = 'chk_ediciones_codigo_norm') THEN
        ALTER TABLE public.ediciones ADD CONSTRAINT chk_ediciones_codigo_norm CHECK (codigo = upper(trim(codigo)));
    END IF;
END $$;

-- ==========================================
-- 3. CREACIÓN DE LA TABLA SEDES Y VALIDACIÓN PREEXISTENTE
-- ==========================================
DO $$
DECLARE v_type text;
BEGIN
    SELECT data_type INTO v_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sedes' AND column_name = 'codigo';
    IF v_type IS NOT NULL AND v_type != 'text' THEN RAISE EXCEPTION 'Columna sedes.codigo incompatible'; END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.sedes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo text NOT NULL CHECK (codigo = upper(trim(codigo))),
    nombre text NOT NULL,
    departamento text,
    provincia text,
    distrito text,
    direccion text,
    status text NOT NULL DEFAULT 'ACTIVO' CHECK (status IN ('ACTIVO', 'INACTIVO')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (codigo)
);

DO $$
DECLARE v_func text;
BEGIN
    SELECT p.proname INTO v_func FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid JOIN pg_namespace n ON n.oid = c.relnamespace JOIN pg_proc p ON p.oid = t.tgfoid WHERE n.nspname = 'public' AND c.relname = 'sedes' AND t.tgname = 'update_sedes_updated_at';
    IF v_func IS NOT NULL THEN
        IF v_func != 'update_updated_at_column' THEN RAISE EXCEPTION 'Trigger update_sedes_updated_at existe con función diferente: %', v_func; END IF;
    ELSE
        CREATE TRIGGER update_sedes_updated_at BEFORE UPDATE ON public.sedes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

INSERT INTO public.sedes (codigo, nombre, departamento, provincia, distrito, direccion)
VALUES ('TUM', 'Sede Central · Tumbes', 'TUMBES', 'TUMBES', 'TUMBES', NULL)
ON CONFLICT (codigo) DO NOTHING;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.sedes WHERE codigo = 'TUM') THEN RAISE EXCEPTION 'Migración fallida: Sede base TUM no existe'; END IF;
END $$;

-- ==========================================
-- 4. RELACIÓN USUARIO - SEDES
-- ==========================================
DO $$
DECLARE v_type text;
BEGIN
    SELECT data_type INTO v_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'usuario_sedes' AND column_name = 'sede_id';
    IF v_type IS NOT NULL AND v_type != 'uuid' THEN RAISE EXCEPTION 'Columna usuario_sedes.sede_id incompatible'; END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.usuario_sedes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sede_id uuid NOT NULL REFERENCES public.sedes(id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (usuario_id, sede_id)
);

DO $$
DECLARE v_sede_id uuid;
BEGIN
    SELECT id INTO v_sede_id FROM public.sedes WHERE codigo = 'TUM';
    INSERT INTO public.usuario_sedes (usuario_id, sede_id)
    SELECT id, v_sede_id FROM public.profiles WHERE status IN ('ACTIVO', 'INVITADO')
    ON CONFLICT DO NOTHING;
END $$;

-- ==========================================
-- 5. PERMISOS Y ROLES
-- ==========================================
INSERT INTO public.permissions (code, name, module, description)
VALUES ('SEDES.VER_TODAS', 'Ver Todas las Sedes', 'Configuración', 'Permite visualizar todas las sedes')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p WHERE r.code = 'DIRECCION' AND p.code = 'SEDES.VER_TODAS'
ON CONFLICT DO NOTHING;

-- ==========================================
-- 6. PREDICADOS DE SEGURIDAD POR SEDE (SECURITY DEFINER SEGÚN PADRE)
-- ==========================================
CREATE OR REPLACE FUNCTION public.user_has_sede_access(p_sede_id uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_has_access boolean;
BEGIN
    IF auth.uid() IS NULL THEN RETURN false; END IF;
    SELECT EXISTS (SELECT 1 FROM public.usuario_sedes us WHERE us.sede_id = p_sede_id AND us.usuario_id = auth.uid()) OR public.has_permission('SEDES.VER_TODAS') INTO v_has_access;
    RETURN v_has_access;
END;
$$;
REVOKE ALL ON FUNCTION public.user_has_sede_access(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_has_sede_access(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.check_edicion_sede_access(p_edicion_id uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_has_access boolean;
BEGIN
    IF auth.uid() IS NULL THEN RETURN false; END IF;
    SELECT EXISTS (
        SELECT 1 FROM public.ediciones e
        LEFT JOIN public.usuario_sedes us ON us.sede_id = e.sede_id AND us.usuario_id = auth.uid()
        WHERE e.id = p_edicion_id AND (us.id IS NOT NULL OR public.has_permission('SEDES.VER_TODAS'))
    ) INTO v_has_access;
    RETURN v_has_access;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_matricula_sede_access(p_matricula_id uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_has_access boolean;
BEGIN
    IF auth.uid() IS NULL THEN RETURN false; END IF;
    SELECT EXISTS (
        SELECT 1 FROM public.matriculas m
        JOIN public.ediciones e ON m.edicion_id = e.id
        LEFT JOIN public.usuario_sedes us ON us.sede_id = e.sede_id AND us.usuario_id = auth.uid()
        WHERE m.id = p_matricula_id AND (us.id IS NOT NULL OR public.has_permission('SEDES.VER_TODAS'))
    ) INTO v_has_access;
    RETURN v_has_access;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_pago_sede_access(p_pago_id uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_has_access boolean;
BEGIN
    IF auth.uid() IS NULL THEN RETURN false; END IF;
    SELECT EXISTS (
        SELECT 1 FROM public.pago_aplicaciones pa
        JOIN public.cuotas c ON pa.cuota_id = c.id
        JOIN public.matriculas m ON c.matricula_id = m.id
        JOIN public.ediciones e ON m.edicion_id = e.id
        LEFT JOIN public.usuario_sedes us ON us.sede_id = e.sede_id AND us.usuario_id = auth.uid()
        WHERE pa.pago_id = p_pago_id AND (us.id IS NOT NULL OR public.has_permission('SEDES.VER_TODAS'))
    ) INTO v_has_access;
    RETURN v_has_access;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_prospecto_sede_access(p_prospecto_id uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_has_access boolean;
BEGIN
    IF auth.uid() IS NULL THEN RETURN false; END IF;
    SELECT EXISTS (
        SELECT 1 FROM public.prospectos p
        LEFT JOIN public.usuario_sedes us ON us.sede_id = p.sede_id AND us.usuario_id = auth.uid()
        WHERE p.id = p_prospecto_id AND (us.id IS NOT NULL OR public.has_permission('SEDES.VER_TODAS'))
    ) INTO v_has_access;
    RETURN v_has_access;
END;
$$;

DO $$
DECLARE f text;
BEGIN
    FOR f IN SELECT unnest(ARRAY['check_edicion_sede_access', 'check_matricula_sede_access', 'check_pago_sede_access', 'check_prospecto_sede_access']) LOOP
        EXECUTE format('REVOKE ALL ON FUNCTION public.%I(uuid) FROM PUBLIC, anon;', f);
        EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(uuid) TO authenticated;', f);
    END LOOP;
END $$;

-- ==========================================
-- 7. SEDES EN OFERTA Y CRM (COLUMNAS, FKs E ÍNDICES)
-- ==========================================
DO $$
DECLARE
    v_type text;
    v_fk_conf_del text;
BEGIN
    SELECT data_type INTO v_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ediciones' AND column_name = 'sede_id';
    IF v_type IS NOT NULL AND v_type != 'uuid' THEN RAISE EXCEPTION 'Columna ediciones.sede_id ya existe con tipo incompatible'; END IF;
    
    SELECT data_type INTO v_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'prospectos' AND column_name = 'sede_id';
    IF v_type IS NOT NULL AND v_type != 'uuid' THEN RAISE EXCEPTION 'Columna prospectos.sede_id ya existe con tipo incompatible'; END IF;
    
    SELECT confdeltype::text INTO v_fk_conf_del FROM pg_constraint WHERE conname = 'fk_ediciones_sede_id';
    IF v_fk_conf_del IS NOT NULL AND v_fk_conf_del != 'r' THEN RAISE EXCEPTION 'FK fk_ediciones_sede_id existe pero no es ON DELETE RESTRICT'; END IF;
    
    SELECT confdeltype::text INTO v_fk_conf_del FROM pg_constraint WHERE conname = 'fk_prospectos_sede_id';
    IF v_fk_conf_del IS NOT NULL AND v_fk_conf_del != 'r' THEN RAISE EXCEPTION 'FK fk_prospectos_sede_id existe pero no es ON DELETE RESTRICT'; END IF;
END $$;

ALTER TABLE public.ediciones ADD COLUMN IF NOT EXISTS sede_id uuid;
ALTER TABLE public.prospectos ADD COLUMN IF NOT EXISTS sede_id uuid;

DO $$
DECLARE v_sede_id uuid;
BEGIN
    SELECT id INTO v_sede_id FROM public.sedes WHERE codigo = 'TUM';
    UPDATE public.ediciones SET sede_id = v_sede_id WHERE sede_id IS NULL;
    UPDATE public.prospectos SET sede_id = v_sede_id WHERE sede_id IS NULL;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.ediciones WHERE sede_id IS NULL) THEN RAISE EXCEPTION 'Migración abortada: Quedan ediciones sin sede asignada'; END IF;
    IF EXISTS (SELECT 1 FROM public.prospectos WHERE sede_id IS NULL) THEN RAISE EXCEPTION 'Migración abortada: Quedan prospectos sin sede asignada'; END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_ediciones_sede_id') THEN
        ALTER TABLE public.ediciones ADD CONSTRAINT fk_ediciones_sede_id FOREIGN KEY (sede_id) REFERENCES public.sedes(id) ON DELETE RESTRICT;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c JOIN pg_index i ON c.oid = i.indrelid JOIN pg_class ic ON ic.oid = i.indexrelid JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY(i.indkey)
        WHERE c.relname = 'ediciones' AND ic.relname = 'idx_ediciones_sede_id' AND a.attname = 'sede_id'
    ) THEN
        CREATE INDEX idx_ediciones_sede_id ON public.ediciones(sede_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_prospectos_sede_id') THEN
        ALTER TABLE public.prospectos ADD CONSTRAINT fk_prospectos_sede_id FOREIGN KEY (sede_id) REFERENCES public.sedes(id) ON DELETE RESTRICT;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c JOIN pg_index i ON c.oid = i.indrelid JOIN pg_class ic ON ic.oid = i.indexrelid JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY(i.indkey)
        WHERE c.relname = 'prospectos' AND ic.relname = 'idx_prospectos_sede_id' AND a.attname = 'sede_id'
    ) THEN
        CREATE INDEX idx_prospectos_sede_id ON public.prospectos(sede_id);
    END IF;
END $$;

ALTER TABLE public.ediciones ALTER COLUMN sede_id SET NOT NULL;
ALTER TABLE public.prospectos ALTER COLUMN sede_id SET NOT NULL;

-- ==========================================
-- 8. ELIMINACIÓN EXPLÍCITA DE POLÍTICAS EXISTENTES
-- ==========================================
DROP POLICY IF EXISTS "Sedes - Read" ON public.sedes;
DROP POLICY IF EXISTS "Sedes - Insert" ON public.sedes;
DROP POLICY IF EXISTS "Sedes - Update" ON public.sedes;

DROP POLICY IF EXISTS "UsuarioSedes - Read" ON public.usuario_sedes;
DROP POLICY IF EXISTS "UsuarioSedes - Insert" ON public.usuario_sedes;
DROP POLICY IF EXISTS "UsuarioSedes - Update" ON public.usuario_sedes;
DROP POLICY IF EXISTS "UsuarioSedes - Delete" ON public.usuario_sedes;

DROP POLICY IF EXISTS "Horarios - Read" ON public.horarios;
DROP POLICY IF EXISTS "Horarios - Edit" ON public.horarios;
DROP POLICY IF EXISTS "Horarios - Insert" ON public.horarios;
DROP POLICY IF EXISTS "Horarios - Update" ON public.horarios;

DROP POLICY IF EXISTS "Matriculas - Read" ON public.matriculas;
DROP POLICY IF EXISTS "Matriculas - Edit" ON public.matriculas;
DROP POLICY IF EXISTS "Matriculas - Insert" ON public.matriculas;
DROP POLICY IF EXISTS "Matriculas - Update" ON public.matriculas;

DROP POLICY IF EXISTS "Cuotas - Read" ON public.cuotas;
DROP POLICY IF EXISTS "Cuotas - Edit" ON public.cuotas;
DROP POLICY IF EXISTS "Cuotas - Insert" ON public.cuotas;
DROP POLICY IF EXISTS "Cuotas - Update" ON public.cuotas;

DROP POLICY IF EXISTS "Pagos - Read" ON public.pagos;
DROP POLICY IF EXISTS "Pagos - Insert" ON public.pagos;
DROP POLICY IF EXISTS "Pagos - Update" ON public.pagos;

DROP POLICY IF EXISTS "Prospectos - Read" ON public.prospectos;
DROP POLICY IF EXISTS "Prospectos - Edit" ON public.prospectos;
DROP POLICY IF EXISTS "Prospectos - Insert" ON public.prospectos;
DROP POLICY IF EXISTS "Prospectos - Update" ON public.prospectos;

DROP POLICY IF EXISTS "Seguimientos - Read" ON public.seguimientos;
DROP POLICY IF EXISTS "Seguimientos - Edit" ON public.seguimientos;
DROP POLICY IF EXISTS "Seguimientos - Insert" ON public.seguimientos;
DROP POLICY IF EXISTS "Seguimientos - Update" ON public.seguimientos;

DROP POLICY IF EXISTS "Tareas - Read" ON public.tareas_comerciales;
DROP POLICY IF EXISTS "Tareas - Edit" ON public.tareas_comerciales;
DROP POLICY IF EXISTS "Tareas - Insert" ON public.tareas_comerciales;
DROP POLICY IF EXISTS "Tareas - Update" ON public.tareas_comerciales;

DROP POLICY IF EXISTS "Transferencias - Read" ON public.transferencias_prospectos;
DROP POLICY IF EXISTS "Transferencias - Edit" ON public.transferencias_prospectos;
DROP POLICY IF EXISTS "Transferencias - Insert" ON public.transferencias_prospectos;
DROP POLICY IF EXISTS "Transferencias - Update" ON public.transferencias_prospectos;

-- ==========================================
-- 9. RECREACIÓN DE POLÍTICAS RLS INDEPENDIENTES (SELECT, INSERT, UPDATE)
-- ==========================================
ALTER TABLE public.sedes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sedes - Read" ON public.sedes FOR SELECT USING (public.user_has_sede_access(id));
CREATE POLICY "Sedes - Insert" ON public.sedes FOR INSERT WITH CHECK (public.has_permission('CONFIGURACION.EDITAR'));
CREATE POLICY "Sedes - Update" ON public.sedes FOR UPDATE USING (public.has_permission('CONFIGURACION.EDITAR')) WITH CHECK (public.has_permission('CONFIGURACION.EDITAR'));

ALTER TABLE public.usuario_sedes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "UsuarioSedes - Read" ON public.usuario_sedes FOR SELECT USING (usuario_id = auth.uid() OR public.has_permission('SISTEMA.ADMINISTRAR'));
CREATE POLICY "UsuarioSedes - Insert" ON public.usuario_sedes FOR INSERT WITH CHECK (public.has_permission('SISTEMA.ADMINISTRAR'));
CREATE POLICY "UsuarioSedes - Update" ON public.usuario_sedes FOR UPDATE USING (public.has_permission('SISTEMA.ADMINISTRAR')) WITH CHECK (public.has_permission('SISTEMA.ADMINISTRAR'));
CREATE POLICY "UsuarioSedes - Delete" ON public.usuario_sedes FOR DELETE USING (public.has_permission('SISTEMA.ADMINISTRAR'));

ALTER TABLE public.horarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Horarios - Read" ON public.horarios FOR SELECT USING (public.has_permission('PROGRAMAS.VER') AND public.check_edicion_sede_access(edicion_id));
CREATE POLICY "Horarios - Insert" ON public.horarios FOR INSERT WITH CHECK (public.has_permission('PROGRAMAS.EDITAR') AND public.check_edicion_sede_access(edicion_id));
CREATE POLICY "Horarios - Update" ON public.horarios FOR UPDATE USING (public.has_permission('PROGRAMAS.EDITAR') AND public.check_edicion_sede_access(edicion_id)) WITH CHECK (public.has_permission('PROGRAMAS.EDITAR') AND public.check_edicion_sede_access(edicion_id));

ALTER TABLE public.matriculas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Matriculas - Read" ON public.matriculas FOR SELECT USING (public.has_permission('MATRICULAS.VER') AND public.check_edicion_sede_access(edicion_id));
CREATE POLICY "Matriculas - Insert" ON public.matriculas FOR INSERT WITH CHECK (public.has_permission('MATRICULAS.GESTIONAR') AND public.check_edicion_sede_access(edicion_id));
CREATE POLICY "Matriculas - Update" ON public.matriculas FOR UPDATE USING (public.has_permission('MATRICULAS.GESTIONAR') AND public.check_edicion_sede_access(edicion_id)) WITH CHECK (public.has_permission('MATRICULAS.GESTIONAR') AND public.check_edicion_sede_access(edicion_id));

ALTER TABLE public.cuotas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cuotas - Read" ON public.cuotas FOR SELECT USING (public.has_permission('COBRANZA.VER') AND public.check_matricula_sede_access(matricula_id));
CREATE POLICY "Cuotas - Insert" ON public.cuotas FOR INSERT WITH CHECK ((public.has_permission('PAGOS.REGISTRAR') OR public.has_permission('PAGOS.ANULAR')) AND public.check_matricula_sede_access(matricula_id));
CREATE POLICY "Cuotas - Update" ON public.cuotas FOR UPDATE USING ((public.has_permission('PAGOS.REGISTRAR') OR public.has_permission('PAGOS.ANULAR')) AND public.check_matricula_sede_access(matricula_id)) WITH CHECK ((public.has_permission('PAGOS.REGISTRAR') OR public.has_permission('PAGOS.ANULAR')) AND public.check_matricula_sede_access(matricula_id));

ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pagos - Read" ON public.pagos FOR SELECT USING (public.has_permission('COBRANZA.VER') AND (public.check_pago_sede_access(id) OR public.has_permission('SEDES.VER_TODAS')));
-- INSERT original sin protección por sede ya que un pago carece de aplicaciones al nacer
CREATE POLICY "Pagos - Insert" ON public.pagos FOR INSERT WITH CHECK (public.has_permission('PAGOS.REGISTRAR'));
CREATE POLICY "Pagos - Update" ON public.pagos FOR UPDATE USING (public.has_permission('PAGOS.ANULAR') AND (public.check_pago_sede_access(id) OR public.has_permission('SEDES.VER_TODAS'))) WITH CHECK (public.has_permission('PAGOS.ANULAR') AND (public.check_pago_sede_access(id) OR public.has_permission('SEDES.VER_TODAS')));

ALTER TABLE public.prospectos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Prospectos - Read" ON public.prospectos FOR SELECT USING (public.has_permission('CRM.VER') AND public.user_has_sede_access(sede_id));
CREATE POLICY "Prospectos - Insert" ON public.prospectos FOR INSERT WITH CHECK (public.has_permission('CRM.GESTIONAR') AND public.user_has_sede_access(sede_id));
CREATE POLICY "Prospectos - Update" ON public.prospectos FOR UPDATE USING (public.has_permission('CRM.GESTIONAR') AND public.user_has_sede_access(sede_id)) WITH CHECK (public.has_permission('CRM.GESTIONAR') AND public.user_has_sede_access(sede_id));

ALTER TABLE public.seguimientos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Seguimientos - Read" ON public.seguimientos FOR SELECT USING (public.has_permission('CRM.VER') AND public.check_prospecto_sede_access(prospecto_id));
CREATE POLICY "Seguimientos - Insert" ON public.seguimientos FOR INSERT WITH CHECK (public.has_permission('CRM.GESTIONAR') AND public.check_prospecto_sede_access(prospecto_id));
CREATE POLICY "Seguimientos - Update" ON public.seguimientos FOR UPDATE USING (public.has_permission('CRM.GESTIONAR') AND public.check_prospecto_sede_access(prospecto_id)) WITH CHECK (public.has_permission('CRM.GESTIONAR') AND public.check_prospecto_sede_access(prospecto_id));

ALTER TABLE public.tareas_comerciales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tareas - Read" ON public.tareas_comerciales FOR SELECT USING (public.has_permission('CRM.VER') AND public.check_prospecto_sede_access(prospecto_id));
CREATE POLICY "Tareas - Insert" ON public.tareas_comerciales FOR INSERT WITH CHECK (public.has_permission('CRM.GESTIONAR') AND public.check_prospecto_sede_access(prospecto_id));
CREATE POLICY "Tareas - Update" ON public.tareas_comerciales FOR UPDATE USING (public.has_permission('CRM.GESTIONAR') AND public.check_prospecto_sede_access(prospecto_id)) WITH CHECK (public.has_permission('CRM.GESTIONAR') AND public.check_prospecto_sede_access(prospecto_id));

ALTER TABLE public.transferencias_prospectos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Transferencias - Read" ON public.transferencias_prospectos FOR SELECT USING (public.has_permission('CRM.VER') AND public.check_prospecto_sede_access(prospecto_id));
CREATE POLICY "Transferencias - Insert" ON public.transferencias_prospectos FOR INSERT WITH CHECK (public.has_permission('CRM.GESTIONAR') AND public.check_prospecto_sede_access(prospecto_id));
CREATE POLICY "Transferencias - Update" ON public.transferencias_prospectos FOR UPDATE USING (public.has_permission('CRM.GESTIONAR') AND public.check_prospecto_sede_access(prospecto_id)) WITH CHECK (public.has_permission('CRM.GESTIONAR') AND public.check_prospecto_sede_access(prospecto_id));

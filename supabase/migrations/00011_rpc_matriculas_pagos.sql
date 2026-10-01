-- migrate:up

-- 1. Restricciones y Columnas Aditivas
DO $$
BEGIN
    -- Añadir idempotency_key a pagos si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pagos' AND column_name = 'idempotency_key') THEN
        ALTER TABLE pagos ADD COLUMN idempotency_key uuid;
    END IF;
    -- Restricción UNIQUE para idempotency_key
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_pagos_idempotency_key') THEN
        ALTER TABLE pagos ADD CONSTRAINT uq_pagos_idempotency_key UNIQUE (idempotency_key);
    END IF;

    -- Restricción UNIQUE para codigo_estudiante
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_estudiantes_codigo') THEN
        ALTER TABLE estudiantes ADD CONSTRAINT uq_estudiantes_codigo UNIQUE (codigo_estudiante);
    END IF;
END $$;


-- 2. Secuencia y RPC para Código Estudiantil (BRU-YYYY-NNNNNN)
CREATE SEQUENCE IF NOT EXISTS seq_codigo_estudiante START 1;
-- No concedemos USAGE directo. Se accederá vía SECURITY DEFINER.

CREATE OR REPLACE FUNCTION generar_codigo_estudiante()
RETURNS text AS $$
DECLARE
    nuevo_codigo text;
    anio text;
    num integer;
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Usuario no autenticado'; END IF;
    IF NOT (has_permission('MATRICULAS.GESTIONAR') OR has_permission('SISTEMA.ADMINISTRAR')) THEN
        RAISE EXCEPTION 'No tienes permiso para generar código estudiantil';
    END IF;

    anio := to_char(now(), 'YYYY');
    num := nextval('seq_codigo_estudiante');
    nuevo_codigo := 'BRU-' || anio || '-' || lpad(num::text, 6, '0');
    RETURN nuevo_codigo;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public;
REVOKE ALL ON FUNCTION generar_codigo_estudiante() FROM PUBLIC;
REVOKE ALL ON FUNCTION generar_codigo_estudiante() FROM anon;
GRANT EXECUTE ON FUNCTION generar_codigo_estudiante() TO authenticated;


-- 3. Secuencia y RPC para Código de Matrícula (MAT-YYYY-NNNNNN)
CREATE SEQUENCE IF NOT EXISTS seq_codigo_matricula START 1;

CREATE OR REPLACE FUNCTION generar_codigo_matricula()
RETURNS text AS $$
DECLARE
    nuevo_codigo text;
    anio text;
    num integer;
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Usuario no autenticado'; END IF;
    IF NOT (has_permission('MATRICULAS.GESTIONAR') OR has_permission('SISTEMA.ADMINISTRAR')) THEN
        RAISE EXCEPTION 'No tienes permiso para generar código de matrícula';
    END IF;

    anio := to_char(now(), 'YYYY');
    num := nextval('seq_codigo_matricula');
    nuevo_codigo := 'MAT-' || anio || '-' || lpad(num::text, 6, '0');
    RETURN nuevo_codigo;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public;
REVOKE ALL ON FUNCTION generar_codigo_matricula() FROM PUBLIC;
REVOKE ALL ON FUNCTION generar_codigo_matricula() FROM anon;
GRANT EXECUTE ON FUNCTION generar_codigo_matricula() TO authenticated;


-- 4. Función atómica para Confirmar Matrícula (Idempotente)
CREATE OR REPLACE FUNCTION confirmar_matricula_atomica(
    p_estudiante_id uuid,
    p_edicion_id uuid,
    p_ciclo_id uuid,
    p_prospecto_id uuid,
    p_asesor_id uuid,
    p_importe_matricula numeric,
    p_importe_pension numeric,
    p_numero_pensiones int,
    p_descuento_total numeric,
    p_descuento_motivo text,
    p_primer_vencimiento date,
    p_frecuencia_meses int
) RETURNS uuid AS $$
DECLARE
    v_matricula_id uuid;
    v_estudiante_record record;
    v_edicion_record record;
    v_ciclo_record record;
    v_prospecto_record record;
    v_codigo_matricula text;
    v_codigo_estudiante text;
    v_vacantes_ocupadas int;
    i int;
    v_fecha_vencimiento date;
    v_uid uuid;
    v_total_bruto numeric;
    v_total_neto numeric;
    v_descuento_restante numeric;
    v_descuento_cuota numeric;
    v_cuota_importe_bruto numeric;
    v_cuota_importe_neto numeric;
    v_total_cuotas int;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN RAISE EXCEPTION 'Usuario no autenticado'; END IF;
    IF NOT (has_permission('MATRICULAS.GESTIONAR') OR has_permission('SISTEMA.ADMINISTRAR')) THEN
        RAISE EXCEPTION 'No tienes permiso para gestionar matrículas';
    END IF;

    -- Validaciones financieras iniciales
    IF p_importe_matricula < 0 THEN RAISE EXCEPTION 'Importe de matrícula no puede ser negativo'; END IF;
    IF p_importe_pension < 0 THEN RAISE EXCEPTION 'Importe de pensión no puede ser negativo'; END IF;
    IF p_numero_pensiones < 0 THEN RAISE EXCEPTION 'Número de pensiones no puede ser negativo'; END IF;
    IF p_descuento_total < 0 THEN RAISE EXCEPTION 'El descuento no puede ser negativo'; END IF;
    IF p_numero_pensiones > 0 AND (p_frecuencia_meses <= 0 OR p_frecuencia_meses IS NULL) THEN
        RAISE EXCEPTION 'Frecuencia de meses inválida';
    END IF;
    IF p_numero_pensiones > 0 AND p_primer_vencimiento IS NULL THEN
        RAISE EXCEPTION 'El primer vencimiento es obligatorio cuando hay pensiones';
    END IF;

    v_total_bruto := p_importe_matricula + (p_importe_pension * p_numero_pensiones);
    IF p_descuento_total > v_total_bruto THEN
        RAISE EXCEPTION 'El descuento supera el total bruto';
    END IF;
    v_total_neto := v_total_bruto - p_descuento_total;
    v_total_cuotas := p_numero_pensiones + CASE WHEN p_importe_matricula > 0 THEN 1 ELSE 0 END;

    -- Bloqueo de la edición (prevención de concurrencia de vacantes)
    SELECT * INTO v_edicion_record FROM ediciones WHERE id = p_edicion_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Edición no encontrada'; END IF;
    IF v_edicion_record.status <> 'ACTIVO' THEN RAISE EXCEPTION 'La edición no está activa'; END IF;

    -- Verificar idempotencia DESPUÉS de bloquear la edición
    SELECT id INTO v_matricula_id FROM matriculas 
    WHERE estudiante_id = p_estudiante_id AND edicion_id = p_edicion_id AND status NOT IN ('ANULADA', 'VENCIDA', 'RETIRADA');
    
    IF v_matricula_id IS NOT NULL THEN
        RETURN v_matricula_id;
    END IF;

    -- Validar Vacantes
    SELECT count(*) INTO v_vacantes_ocupadas FROM matriculas 
    WHERE edicion_id = p_edicion_id AND status IN ('RESERVADA', 'ACTIVA', 'FINALIZADA');
    
    IF v_edicion_record.vacantes IS NOT NULL AND v_vacantes_ocupadas >= v_edicion_record.vacantes THEN
        RAISE EXCEPTION 'No hay vacantes disponibles en esta edición';
    END IF;

    -- Validar Ciclo si existe
    IF p_ciclo_id IS NOT NULL THEN
        SELECT * INTO v_ciclo_record FROM ciclos WHERE id = p_ciclo_id;
        IF NOT FOUND THEN RAISE EXCEPTION 'Ciclo no encontrado'; END IF;
        IF v_ciclo_record.programa_id <> v_edicion_record.programa_id THEN
            RAISE EXCEPTION 'El ciclo no corresponde al programa de la edición';
        END IF;
    END IF;

    -- Validar Estudiante
    SELECT * INTO v_estudiante_record FROM estudiantes WHERE id = p_estudiante_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Estudiante no encontrado'; END IF;
    IF v_estudiante_record.status <> 'ACTIVO' THEN RAISE EXCEPTION 'El estudiante no está activo'; END IF;

    -- Validar Prospecto
    IF p_prospecto_id IS NOT NULL THEN
        SELECT * INTO v_prospecto_record FROM prospectos WHERE id = p_prospecto_id FOR UPDATE;
        IF NOT FOUND THEN RAISE EXCEPTION 'Prospecto no encontrado'; END IF;
        IF v_prospecto_record.status = 'PERDIDO' THEN RAISE EXCEPTION 'El prospecto está perdido'; END IF;
        IF v_prospecto_record.matricula_id IS NOT NULL THEN 
            RAISE EXCEPTION 'El prospecto ya tiene una matrícula vinculada'; 
        END IF;
    END IF;

    -- Asignar código de estudiante si no tiene
    IF v_estudiante_record.codigo_estudiante IS NULL THEN
        v_codigo_estudiante := generar_codigo_estudiante();
        UPDATE estudiantes SET codigo_estudiante = v_codigo_estudiante, updated_by = v_uid, updated_at = now() WHERE id = p_estudiante_id;
    END IF;

    -- Insertar Matrícula (Manejando posible unique_violation por concurrencia extrema)
    v_codigo_matricula := generar_codigo_matricula();
    BEGIN
        INSERT INTO matriculas (
            estudiante_id, edicion_id, ciclo_id, prospecto_id, asesor_comercial_id,
            codigo_matricula, fecha_matricula, status, importe_matricula,
            importe_pension, numero_pensiones, descuento_total, descuento_motivo,
            primer_vencimiento, frecuencia_meses, activada_en, cuotas_generadas_en,
            created_by, updated_by
        ) VALUES (
            p_estudiante_id, p_edicion_id, p_ciclo_id, p_prospecto_id, p_asesor_id,
            v_codigo_matricula, CURRENT_DATE, 'ACTIVA', p_importe_matricula,
            p_importe_pension, p_numero_pensiones, p_descuento_total, p_descuento_motivo,
            p_primer_vencimiento, p_frecuencia_meses, now(), now(),
            v_uid, v_uid
        ) RETURNING id INTO v_matricula_id;
    EXCEPTION WHEN unique_violation THEN
        SELECT id INTO v_matricula_id FROM matriculas 
        WHERE estudiante_id = p_estudiante_id AND edicion_id = p_edicion_id AND status NOT IN ('ANULADA', 'VENCIDA', 'RETIRADA');
        RETURN v_matricula_id;
    END;

    -- Distribución de Descuento (Equitativo con ajuste en la última cuota)
    v_descuento_restante := p_descuento_total;
    
    -- Cuota de Matrícula (Si aplica)
    IF p_importe_matricula > 0 THEN
        v_cuota_importe_bruto := p_importe_matricula;
        IF v_total_cuotas = 1 THEN
            v_descuento_cuota := v_descuento_restante;
        ELSE
            -- Distribuir equitativamente truncando a 2 decimales
            v_descuento_cuota := trunc((p_descuento_total / v_total_cuotas)::numeric, 2);
            -- Asegurar no tener cuotas negativas
            IF v_descuento_cuota > v_cuota_importe_bruto THEN v_descuento_cuota := v_cuota_importe_bruto; END IF;
        END IF;
        
        v_cuota_importe_neto := v_cuota_importe_bruto - v_descuento_cuota;
        v_descuento_restante := v_descuento_restante - v_descuento_cuota;

        INSERT INTO cuotas (
            matricula_id, tipo_cuota, numero_cuota, concepto,
            fecha_emision, fecha_vencimiento, importe_original, descuento, importe_neto, saldo, status
        ) VALUES (
            v_matricula_id, 'MATRICULA', 0, 'Matrícula',
            CURRENT_DATE, CURRENT_DATE, v_cuota_importe_bruto, v_descuento_cuota, v_cuota_importe_neto, v_cuota_importe_neto, CASE WHEN v_cuota_importe_neto = 0 THEN 'PAGADA' ELSE 'PENDIENTE' END
        );
    END IF;

    -- Generar Cuotas de Pensión
    v_fecha_vencimiento := p_primer_vencimiento;
    FOR i IN 1..p_numero_pensiones LOOP
        v_cuota_importe_bruto := p_importe_pension;
        
        -- Si es la última cuota, asignar todo el descuento restante
        IF i = p_numero_pensiones THEN
            v_descuento_cuota := v_descuento_restante;
        ELSE
            v_descuento_cuota := trunc((p_descuento_total / v_total_cuotas)::numeric, 2);
            IF v_descuento_cuota > v_cuota_importe_bruto THEN v_descuento_cuota := v_cuota_importe_bruto; END IF;
        END IF;

        v_cuota_importe_neto := v_cuota_importe_bruto - v_descuento_cuota;
        v_descuento_restante := v_descuento_restante - v_descuento_cuota;

        INSERT INTO cuotas (
            matricula_id, tipo_cuota, numero_cuota, concepto,
            fecha_emision, fecha_vencimiento, importe_original, descuento, importe_neto, saldo, status
        ) VALUES (
            v_matricula_id, 'PENSION', i, 'Pensión ' || i,
            CURRENT_DATE, v_fecha_vencimiento, v_cuota_importe_bruto, v_descuento_cuota, v_cuota_importe_neto, v_cuota_importe_neto, CASE WHEN v_cuota_importe_neto = 0 THEN 'PAGADA' ELSE 'PENDIENTE' END
        );
        v_fecha_vencimiento := v_fecha_vencimiento + (p_frecuencia_meses || ' months')::interval;
    END LOOP;

    -- Actualizar Prospecto si aplica
    IF p_prospecto_id IS NOT NULL THEN
        UPDATE prospectos SET 
            matricula_id = v_matricula_id,
            status = 'MATRICULADO',
            updated_by = v_uid,
            updated_at = now()
        WHERE id = p_prospecto_id;
    END IF;

    RETURN v_matricula_id;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public;
REVOKE ALL ON FUNCTION confirmar_matricula_atomica(uuid, uuid, uuid, uuid, uuid, numeric, numeric, int, numeric, text, date, int) FROM PUBLIC;
REVOKE ALL ON FUNCTION confirmar_matricula_atomica(uuid, uuid, uuid, uuid, uuid, numeric, numeric, int, numeric, text, date, int) FROM anon;
GRANT EXECUTE ON FUNCTION confirmar_matricula_atomica(uuid, uuid, uuid, uuid, uuid, numeric, numeric, int, numeric, text, date, int) TO authenticated;


-- 5. Función atómica para Registrar Pago (Idempotente)
CREATE OR REPLACE FUNCTION registrar_pago_atomico(
    p_idempotency_key uuid,
    p_estudiante_id uuid,
    p_importe numeric,
    p_medio_pago text,
    p_numero_operacion text,
    p_comprobante_tipo text,
    p_comprobante_numero text,
    p_observaciones text,
    p_cuotas_aplicadas jsonb
) RETURNS uuid AS $$
DECLARE
    v_pago_id uuid;
    v_cuota record;
    v_item jsonb;
    v_importe_aplicado numeric;
    v_total_aplicado numeric := 0;
    v_cuota_saldo numeric;
    v_uid uuid;
    v_cuotas_procesadas uuid[] := ARRAY[]::uuid[];
    v_matricula record;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN RAISE EXCEPTION 'Usuario no autenticado'; END IF;
    IF NOT (has_permission('PAGOS.REGISTRAR') OR has_permission('SISTEMA.ADMINISTRAR')) THEN
        RAISE EXCEPTION 'No tienes permiso para registrar pagos';
    END IF;

    IF p_importe <= 0 THEN RAISE EXCEPTION 'El importe debe ser mayor a cero'; END IF;

    -- Validar Idempotencia real
    SELECT id INTO v_pago_id FROM pagos WHERE idempotency_key = p_idempotency_key;
    IF v_pago_id IS NOT NULL THEN
        RETURN v_pago_id;
    END IF;

    -- Validar Array de Cuotas
    IF jsonb_array_length(p_cuotas_aplicadas) = 0 THEN
        RAISE EXCEPTION 'Debe proporcionar al menos una cuota';
    END IF;

    -- Insertar el pago primero para referenciarlo
    INSERT INTO pagos (
        idempotency_key, estudiante_id, fecha_pago, importe, medio_pago, numero_operacion,
        comprobante_tipo, comprobante_numero, observaciones, registrado_por
    ) VALUES (
        p_idempotency_key, p_estudiante_id, CURRENT_DATE, p_importe, p_medio_pago, p_numero_operacion,
        p_comprobante_tipo, p_comprobante_numero, p_observaciones, v_uid
    ) RETURNING id INTO v_pago_id;

    -- Aplicar a cuotas
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_cuotas_aplicadas)
    LOOP
        v_importe_aplicado := (v_item->>'importe')::numeric;
        
        IF v_importe_aplicado <= 0 THEN RAISE EXCEPTION 'El importe aplicado a la cuota debe ser mayor a cero'; END IF;

        -- Evitar duplicados en el array JSON
        IF (v_item->>'cuota_id')::uuid = ANY(v_cuotas_procesadas) THEN
            RAISE EXCEPTION 'Cuota duplicada en la aplicación';
        END IF;
        v_cuotas_procesadas := array_append(v_cuotas_procesadas, (v_item->>'cuota_id')::uuid);

        -- Obtener cuota con FOR UPDATE
        SELECT c.* INTO v_cuota FROM cuotas c WHERE c.id = (v_item->>'cuota_id')::uuid FOR UPDATE;
        IF NOT FOUND THEN RAISE EXCEPTION 'Cuota % no encontrada', (v_item->>'cuota_id'); END IF;

        -- Validar pertenencia al estudiante
        SELECT m.estudiante_id INTO v_matricula FROM matriculas m WHERE m.id = v_cuota.matricula_id;
        IF v_matricula.estudiante_id <> p_estudiante_id THEN
            RAISE EXCEPTION 'La cuota no pertenece al estudiante';
        END IF;

        -- Validar estado
        IF v_cuota.status IN ('ANULADA', 'PAGADA') THEN
            RAISE EXCEPTION 'No se puede aplicar pago a una cuota %', v_cuota.status;
        END IF;

        -- Validar saldo
        v_cuota_saldo := COALESCE(v_cuota.saldo, v_cuota.importe_neto);
        IF v_cuota_saldo <= 0 THEN RAISE EXCEPTION 'La cuota no tiene saldo pendiente'; END IF;
        IF v_importe_aplicado > v_cuota_saldo THEN
            RAISE EXCEPTION 'El importe aplicado supera el saldo de la cuota';
        END IF;

        -- Registrar aplicación
        INSERT INTO pago_aplicaciones (pago_id, cuota_id, importe_aplicado, created_by)
        VALUES (v_pago_id, v_cuota.id, v_importe_aplicado, v_uid);

        -- Actualizar saldo de cuota
        v_cuota_saldo := v_cuota_saldo - v_importe_aplicado;
        
        UPDATE cuotas SET 
            saldo = v_cuota_saldo,
            status = CASE WHEN v_cuota_saldo <= 0 THEN 'PAGADA' ELSE 'PARCIAL' END,
            updated_at = now()
        WHERE id = v_cuota.id;

        v_total_aplicado := v_total_aplicado + v_importe_aplicado;
    END LOOP;

    -- Exigir igualdad exacta (no hay saldo a favor en esquema actual)
    IF v_total_aplicado <> p_importe THEN
        RAISE EXCEPTION 'La suma de las aplicaciones no coincide exactamente con el importe del pago';
    END IF;

    RETURN v_pago_id;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public;
REVOKE ALL ON FUNCTION registrar_pago_atomico(uuid, uuid, numeric, text, text, text, text, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION registrar_pago_atomico(uuid, uuid, numeric, text, text, text, text, text, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION registrar_pago_atomico(uuid, uuid, numeric, text, text, text, text, text, jsonb) TO authenticated;


-- 6. Función atómica para Anular Pago (Idempotente)
CREATE OR REPLACE FUNCTION anular_pago_atomico(
    p_pago_id uuid,
    p_motivo text
) RETURNS boolean AS $$
DECLARE
    v_uid uuid;
    v_pago record;
    v_app record;
    v_cuota record;
    v_nuevo_saldo numeric;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN RAISE EXCEPTION 'Usuario no autenticado'; END IF;
    IF NOT (has_permission('PAGOS.ANULAR') OR has_permission('SISTEMA.ADMINISTRAR')) THEN
        RAISE EXCEPTION 'No tienes permiso para anular pagos';
    END IF;

    -- Bloquear Pago
    SELECT * INTO v_pago FROM pagos WHERE id = p_pago_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Pago no encontrado'; END IF;

    -- Idempotencia
    IF v_pago.status = 'ANULADO' THEN
        RETURN TRUE;
    END IF;

    -- Bloquear y revertir aplicaciones
    FOR v_app IN SELECT * FROM pago_aplicaciones WHERE pago_id = p_pago_id FOR UPDATE LOOP
        -- Bloquear Cuota
        SELECT * INTO v_cuota FROM cuotas WHERE id = v_app.cuota_id FOR UPDATE;
        
        v_nuevo_saldo := COALESCE(v_cuota.saldo, v_cuota.importe_neto) + v_app.importe_aplicado;
        
        -- Si superara el neto (raro pero posible por inconsistencias previas) lo limitamos
        IF v_nuevo_saldo > v_cuota.importe_neto THEN v_nuevo_saldo := v_cuota.importe_neto; END IF;

        UPDATE cuotas SET
            saldo = v_nuevo_saldo,
            status = CASE WHEN v_nuevo_saldo >= v_cuota.importe_neto THEN 'PENDIENTE' ELSE 'PARCIAL' END,
            updated_at = now()
        WHERE id = v_cuota.id;
    END LOOP;

    -- Actualizar el Pago
    UPDATE pagos SET
        status = 'ANULADO',
        motivo_anulacion = p_motivo,
        anulado_por = v_uid,
        anulado_en = now()
    WHERE id = p_pago_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public;
REVOKE ALL ON FUNCTION anular_pago_atomico(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION anular_pago_atomico(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION anular_pago_atomico(uuid, text) TO authenticated;

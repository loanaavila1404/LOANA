-- migrate:up

-- 1. Secuencia y RPC para Código Estudiantil (BRU-YYYY-NNNNNN)
CREATE SEQUENCE IF NOT EXISTS seq_codigo_estudiante START 1;
GRANT USAGE ON SEQUENCE seq_codigo_estudiante TO authenticated;

CREATE OR REPLACE FUNCTION generar_codigo_estudiante()
RETURNS text AS $$
DECLARE
    nuevo_codigo text;
    anio text;
    num integer;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;

    IF NOT (has_permission('MATRICULAS.GESTIONAR') OR has_permission('SISTEMA.ADMINISTRAR')) THEN
        RAISE EXCEPTION 'No tienes permiso para generar código estudiantil';
    END IF;

    anio := to_char(now(), 'YYYY');
    num := nextval('seq_codigo_estudiante');
    nuevo_codigo := 'BRU-' || anio || '-' || lpad(num::text, 6, '0');
    RETURN nuevo_codigo;
END;
$$ LANGUAGE plpgsql VOLATILE SET search_path = public;
REVOKE ALL ON FUNCTION generar_codigo_estudiante() FROM PUBLIC;
REVOKE ALL ON FUNCTION generar_codigo_estudiante() FROM anon;
GRANT EXECUTE ON FUNCTION generar_codigo_estudiante() TO authenticated;


-- 2. Secuencia y RPC para Código de Matrícula (MAT-YYYY-NNNNNN)
CREATE SEQUENCE IF NOT EXISTS seq_codigo_matricula START 1;
GRANT USAGE ON SEQUENCE seq_codigo_matricula TO authenticated;

CREATE OR REPLACE FUNCTION generar_codigo_matricula()
RETURNS text AS $$
DECLARE
    nuevo_codigo text;
    anio text;
    num integer;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;

    IF NOT (has_permission('MATRICULAS.GESTIONAR') OR has_permission('SISTEMA.ADMINISTRAR')) THEN
        RAISE EXCEPTION 'No tienes permiso para generar código de matrícula';
    END IF;

    anio := to_char(now(), 'YYYY');
    num := nextval('seq_codigo_matricula');
    nuevo_codigo := 'MAT-' || anio || '-' || lpad(num::text, 6, '0');
    RETURN nuevo_codigo;
END;
$$ LANGUAGE plpgsql VOLATILE SET search_path = public;
REVOKE ALL ON FUNCTION generar_codigo_matricula() FROM PUBLIC;
REVOKE ALL ON FUNCTION generar_codigo_matricula() FROM anon;
GRANT EXECUTE ON FUNCTION generar_codigo_matricula() TO authenticated;


-- 3. Función atómica para Confirmar Matrícula (Idempotente)
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
    v_codigo_matricula text;
    v_codigo_estudiante text;
    v_vacantes_ocupadas int;
    i int;
    v_fecha_vencimiento date;
    v_uid uuid;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;

    IF NOT (has_permission('MATRICULAS.GESTIONAR') OR has_permission('SISTEMA.ADMINISTRAR')) THEN
        RAISE EXCEPTION 'No tienes permiso para gestionar matrículas';
    END IF;

    -- Verificar si ya existe una matrícula para este estudiante y edición (Idempotencia)
    -- Usamos FOR UPDATE para bloquear concurrencia en la lectura de existencia si fuera posible, 
    -- pero como insertaremos, dependemos del UNIQUE(estudiante_id, edicion_id) también.
    SELECT id INTO v_matricula_id FROM matriculas 
    WHERE estudiante_id = p_estudiante_id AND edicion_id = p_edicion_id AND status NOT IN ('ANULADA', 'VENCIDA', 'RETIRADA');
    
    IF v_matricula_id IS NOT NULL THEN
        RETURN v_matricula_id;
    END IF;

    -- Validar vacantes con FOR UPDATE para bloquear la edición concurrente
    SELECT * INTO v_edicion_record FROM ediciones WHERE id = p_edicion_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Edición no encontrada';
    END IF;
    
    SELECT count(*) INTO v_vacantes_ocupadas FROM matriculas 
    WHERE edicion_id = p_edicion_id AND status IN ('RESERVADA', 'ACTIVA', 'FINALIZADA');
    
    IF v_edicion_record.vacantes IS NOT NULL AND v_vacantes_ocupadas >= v_edicion_record.vacantes THEN
        RAISE EXCEPTION 'No hay vacantes disponibles en esta edición';
    END IF;

    -- Validar estudiante y asignar código si no tiene (FOR UPDATE)
    SELECT * INTO v_estudiante_record FROM estudiantes WHERE id = p_estudiante_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Estudiante no encontrado';
    END IF;

    IF v_estudiante_record.codigo_estudiante IS NULL THEN
        v_codigo_estudiante := generar_codigo_estudiante();
        UPDATE estudiantes SET codigo_estudiante = v_codigo_estudiante, updated_by = v_uid, updated_at = now() WHERE id = p_estudiante_id;
    END IF;

    -- Generar código matrícula e insertar
    v_codigo_matricula := generar_codigo_matricula();
    
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

    -- Generar Cuota de Matrícula
    IF p_importe_matricula > 0 THEN
        INSERT INTO cuotas (
            matricula_id, tipo_cuota, numero_cuota, concepto,
            fecha_emision, fecha_vencimiento, importe_original, importe_neto, status
        ) VALUES (
            v_matricula_id, 'MATRICULA', 0, 'Matrícula',
            CURRENT_DATE, CURRENT_DATE, p_importe_matricula, p_importe_matricula, 'PENDIENTE'
        );
    END IF;

    -- Generar Cuotas de Pensión
    v_fecha_vencimiento := p_primer_vencimiento;
    FOR i IN 1..p_numero_pensiones LOOP
        INSERT INTO cuotas (
            matricula_id, tipo_cuota, numero_cuota, concepto,
            fecha_emision, fecha_vencimiento, importe_original, importe_neto, status
        ) VALUES (
            v_matricula_id, 'PENSION', i, 'Pensión ' || i,
            CURRENT_DATE, v_fecha_vencimiento, p_importe_pension, p_importe_pension, 'PENDIENTE'
        );
        v_fecha_vencimiento := v_fecha_vencimiento + (p_frecuencia_meses || ' months')::interval;
    END LOOP;

    -- Actualizar prospecto si aplica
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
$$ LANGUAGE plpgsql VOLATILE SET search_path = public;
REVOKE ALL ON FUNCTION confirmar_matricula_atomica(uuid, uuid, uuid, uuid, uuid, numeric, numeric, int, numeric, text, date, int) FROM PUBLIC;
REVOKE ALL ON FUNCTION confirmar_matricula_atomica(uuid, uuid, uuid, uuid, uuid, numeric, numeric, int, numeric, text, date, int) FROM anon;
GRANT EXECUTE ON FUNCTION confirmar_matricula_atomica(uuid, uuid, uuid, uuid, uuid, numeric, numeric, int, numeric, text, date, int) TO authenticated;


-- 4. Función atómica para Registrar Pago (Idempotente)
CREATE OR REPLACE FUNCTION registrar_pago_atomico(
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
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;

    IF NOT (has_permission('PAGOS.REGISTRAR') OR has_permission('SISTEMA.ADMINISTRAR')) THEN
        RAISE EXCEPTION 'No tienes permiso para registrar pagos';
    END IF;

    IF p_importe <= 0 THEN
        RAISE EXCEPTION 'El importe debe ser mayor a cero';
    END IF;

    -- Validar si el pago con este numero_operacion y medio_pago ya existe (Idempotencia)
    IF p_numero_operacion IS NOT NULL AND p_numero_operacion <> '' THEN
        SELECT id INTO v_pago_id FROM pagos 
        WHERE medio_pago = p_medio_pago AND numero_operacion = p_numero_operacion AND status = 'REGISTRADO';
        
        IF v_pago_id IS NOT NULL THEN
            RETURN v_pago_id;
        END IF;
    END IF;

    -- Insertar el pago
    INSERT INTO pagos (
        estudiante_id, fecha_pago, importe, medio_pago, numero_operacion,
        comprobante_tipo, comprobante_numero, observaciones, registrado_por
    ) VALUES (
        p_estudiante_id, CURRENT_DATE, p_importe, p_medio_pago, p_numero_operacion,
        p_comprobante_tipo, p_comprobante_numero, p_observaciones, v_uid
    ) RETURNING id INTO v_pago_id;

    -- Aplicar a cuotas
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_cuotas_aplicadas)
    LOOP
        v_importe_aplicado := (v_item->>'importe')::numeric;
        
        IF v_importe_aplicado <= 0 THEN
            RAISE EXCEPTION 'El importe aplicado a la cuota debe ser mayor a cero';
        END IF;

        -- Obtener cuota con FOR UPDATE para bloquear concurrencia
        SELECT * INTO v_cuota FROM cuotas WHERE id = (v_item->>'cuota_id')::uuid FOR UPDATE;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Cuota % no encontrada', (v_item->>'cuota_id');
        END IF;

        -- Registrar aplicación
        INSERT INTO pago_aplicaciones (pago_id, cuota_id, importe_aplicado, created_by)
        VALUES (v_pago_id, v_cuota.id, v_importe_aplicado, v_uid);

        -- Actualizar saldo de cuota
        v_cuota_saldo := COALESCE(v_cuota.saldo, v_cuota.importe_neto) - v_importe_aplicado;
        
        IF v_cuota_saldo < 0 THEN
            RAISE EXCEPTION 'El importe aplicado supera el saldo de la cuota %', v_cuota.id;
        END IF;

        UPDATE cuotas SET 
            saldo = v_cuota_saldo,
            status = CASE WHEN v_cuota_saldo <= 0 THEN 'PAGADA' ELSE 'PARCIAL' END,
            updated_at = now()
        WHERE id = v_cuota.id;

        v_total_aplicado := v_total_aplicado + v_importe_aplicado;
    END LOOP;

    -- Validar que no se haya aplicado más del importe del pago
    IF v_total_aplicado > p_importe THEN
        RAISE EXCEPTION 'El importe total aplicado a cuotas supera el importe del pago';
    END IF;

    RETURN v_pago_id;
END;
$$ LANGUAGE plpgsql VOLATILE SET search_path = public;
REVOKE ALL ON FUNCTION registrar_pago_atomico(uuid, numeric, text, text, text, text, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION registrar_pago_atomico(uuid, numeric, text, text, text, text, text, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION registrar_pago_atomico(uuid, numeric, text, text, text, text, text, jsonb) TO authenticated;

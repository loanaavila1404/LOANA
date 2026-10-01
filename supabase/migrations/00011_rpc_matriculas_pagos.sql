-- migrate:up

-- 1. Restricciones y Columnas Aditivas
DO $$
DECLARE
    v_cname text;
BEGIN
    -- Añadir idempotency_key a pagos si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pagos' AND column_name = 'idempotency_key') THEN
        ALTER TABLE pagos ADD COLUMN idempotency_key uuid;
    END IF;

    -- Verificar duplicados de idempotency_key
    IF EXISTS (SELECT idempotency_key FROM pagos WHERE idempotency_key IS NOT NULL GROUP BY idempotency_key HAVING COUNT(*) > 1) THEN
        RAISE EXCEPTION 'Existen duplicados en pagos.idempotency_key. Limpie los datos antes de aplicar la migración.';
    END IF;
    -- Restricción UNIQUE para idempotency_key
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_pagos_idempotency_key') THEN
        ALTER TABLE pagos ADD CONSTRAINT uq_pagos_idempotency_key UNIQUE (idempotency_key);
    END IF;

    -- Verificar duplicados de codigo_estudiante
    IF EXISTS (SELECT codigo_estudiante FROM estudiantes WHERE codigo_estudiante IS NOT NULL GROUP BY codigo_estudiante HAVING COUNT(*) > 1) THEN
        RAISE EXCEPTION 'Existen duplicados en estudiantes.codigo_estudiante. Limpie los datos antes de aplicar la migración.';
    END IF;
    -- Restricción UNIQUE para codigo_estudiante
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_estudiantes_codigo') THEN
        ALTER TABLE estudiantes ADD CONSTRAINT uq_estudiantes_codigo UNIQUE (codigo_estudiante);
    END IF;

    -- Verificar duplicados de codigo_matricula
    IF EXISTS (SELECT codigo_matricula FROM matriculas WHERE codigo_matricula IS NOT NULL GROUP BY codigo_matricula HAVING COUNT(*) > 1) THEN
        RAISE EXCEPTION 'Existen duplicados en matriculas.codigo_matricula. Limpie los datos antes de aplicar la migración.';
    END IF;
    -- Restricción UNIQUE para codigo_matricula
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_matriculas_codigo') THEN
        ALTER TABLE matriculas ADD CONSTRAINT uq_matriculas_codigo UNIQUE (codigo_matricula);
    END IF;

    -- Renombrar restricción matriculas_estudiante_id_edicion_id_key si existe para que sea manejable de forma predecible
    SELECT conname INTO v_cname FROM pg_constraint
    WHERE conrelid = 'matriculas'::regclass AND contype = 'u'
    AND pg_get_constraintdef(oid) LIKE '%(estudiante_id, edicion_id)%';

    IF v_cname IS NOT NULL AND v_cname <> 'uq_matriculas_estudiante_edicion' THEN
        EXECUTE 'ALTER TABLE matriculas RENAME CONSTRAINT "' || v_cname || '" TO uq_matriculas_estudiante_edicion';
    END IF;
END $$;


-- 2. Secuencia y RPC para Código Estudiantil (BRU-YYYY-NNNNNN)
CREATE SEQUENCE IF NOT EXISTS seq_codigo_estudiante START 1;

DO $$
DECLARE
    v_max_num int;
    v_anio text := to_char(now(), 'YYYY');
BEGIN
    SELECT COALESCE(MAX(SUBSTRING(codigo_estudiante FROM 10 FOR 6)::int), 0) INTO v_max_num
    FROM estudiantes
    WHERE codigo_estudiante LIKE 'BRU-' || v_anio || '-%' AND codigo_estudiante ~ '^BRU-\d{4}-\d{6}$';

    IF v_max_num > 0 THEN
        PERFORM setval('seq_codigo_estudiante', v_max_num);
    END IF;
END $$;

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

DO $$
DECLARE
    v_max_num int;
    v_anio text := to_char(now(), 'YYYY');
BEGIN
    SELECT COALESCE(MAX(SUBSTRING(codigo_matricula FROM 10 FOR 6)::int), 0) INTO v_max_num
    FROM matriculas
    WHERE codigo_matricula LIKE 'MAT-' || v_anio || '-%' AND codigo_matricula ~ '^MAT-\d{4}-\d{6}$';

    IF v_max_num > 0 THEN
        PERFORM setval('seq_codigo_matricula', v_max_num);
    END IF;
END $$;

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
    v_bruto_restante numeric;
    v_descuento_cuota numeric;
    v_cuota_importe_bruto numeric;
    v_cuota_importe_neto numeric;
    v_prospecto_actualizado int;
    v_constraint text;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN RAISE EXCEPTION 'Usuario no autenticado'; END IF;
    IF NOT (has_permission('MATRICULAS.GESTIONAR') OR has_permission('SISTEMA.ADMINISTRAR')) THEN
        RAISE EXCEPTION 'No tienes permiso para gestionar matrículas';
    END IF;

    -- Validaciones financieras
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

    -- Bloqueo de la edición
    SELECT * INTO v_edicion_record FROM ediciones WHERE id = p_edicion_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Edición no encontrada'; END IF;
    IF v_edicion_record.status <> 'ACTIVO' THEN RAISE EXCEPTION 'La edición no está activa'; END IF;

    -- Idempotencia segura inicial
    SELECT id INTO v_matricula_id FROM matriculas
    WHERE estudiante_id = p_estudiante_id AND edicion_id = p_edicion_id AND status NOT IN ('ANULADA', 'VENCIDA', 'RETIRADA');

    IF v_matricula_id IS NOT NULL THEN
        RETURN v_matricula_id;
    END IF;

    -- Vacantes
    SELECT count(*) INTO v_vacantes_ocupadas FROM matriculas
    WHERE edicion_id = p_edicion_id AND status IN ('RESERVADA', 'ACTIVA', 'FINALIZADA');

    IF v_edicion_record.vacantes IS NOT NULL AND v_vacantes_ocupadas >= v_edicion_record.vacantes THEN
        RAISE EXCEPTION 'No hay vacantes disponibles en esta edición';
    END IF;

    -- Validar Ciclo contra el esquema real (relación ciclos.plan_id = ediciones.plan_id)
    IF p_ciclo_id IS NOT NULL THEN
        SELECT * INTO v_ciclo_record FROM ciclos WHERE id = p_ciclo_id;
        IF NOT FOUND THEN RAISE EXCEPTION 'Ciclo no encontrado'; END IF;
        IF v_ciclo_record.plan_id <> v_edicion_record.plan_id THEN
            RAISE EXCEPTION 'El ciclo no corresponde al plan de estudios de la edición';
        END IF;
        IF v_ciclo_record.status <> 'ACTIVO' THEN RAISE EXCEPTION 'El ciclo no está activo'; END IF;
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
        IF v_prospecto_record.estudiante_id IS NOT NULL AND v_prospecto_record.estudiante_id <> p_estudiante_id THEN
            RAISE EXCEPTION 'El prospecto pertenece a otro estudiante';
        END IF;
        IF v_prospecto_record.persona_id IS NOT NULL AND v_prospecto_record.persona_id <> v_estudiante_record.persona_id THEN
            RAISE EXCEPTION 'El prospecto pertenece a otra persona';
        END IF;
    END IF;

    -- Código estudiante
    IF v_estudiante_record.codigo_estudiante IS NULL THEN
        v_codigo_estudiante := generar_codigo_estudiante();
        UPDATE estudiantes SET codigo_estudiante = v_codigo_estudiante, updated_by = v_uid, updated_at = now() WHERE id = p_estudiante_id;
    END IF;

    -- Insertar Matrícula capturando unique_violation concurrente
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
        GET STACKED DIAGNOSTICS v_constraint = CONSTRAINT_NAME;
        IF v_constraint IN ('matriculas_estudiante_id_edicion_id_key', 'uq_matriculas_estudiante_edicion') THEN
            SELECT id INTO v_matricula_id FROM matriculas
            WHERE estudiante_id = p_estudiante_id AND edicion_id = p_edicion_id AND status NOT IN ('ANULADA', 'VENCIDA', 'RETIRADA');

            IF v_matricula_id IS NULL THEN
                -- El registro existe por la restricción UNIQUE, pero su estado está anulado/vencido/retirado.
                -- La restricción UNIQUE impone que solo haya UNA matrícula por estudiante+edición sin importar el estado.
                RAISE EXCEPTION 'El estudiante ya tiene una matrícula anulada, vencida o retirada en esta edición. La restricción de unicidad impide re-matricularlo en la misma edición.';
            END IF;
            RETURN v_matricula_id;
        ELSE
            RAISE;
        END IF;
    END;

    -- Distribución proporcional del descuento con remanentes
    v_descuento_restante := p_descuento_total;
    v_bruto_restante := v_total_bruto;

    -- Cuota de Matrícula (Si aplica)
    IF p_importe_matricula > 0 THEN
        v_cuota_importe_bruto := p_importe_matricula;

        IF p_numero_pensiones = 0 THEN
            v_descuento_cuota := v_descuento_restante;
        ELSE
            -- Proporción truncada a 2 decimales
            v_descuento_cuota := trunc((v_cuota_importe_bruto / v_bruto_restante) * v_descuento_restante, 2);
            v_descuento_cuota := LEAST(v_cuota_importe_bruto, v_descuento_cuota);
        END IF;

        v_cuota_importe_neto := v_cuota_importe_bruto - v_descuento_cuota;

        IF v_descuento_cuota < 0 OR v_descuento_cuota > v_cuota_importe_bruto OR v_cuota_importe_neto < 0 THEN
            RAISE EXCEPTION 'Inconsistencia en la distribución del descuento de la matrícula';
        END IF;

        v_descuento_restante := v_descuento_restante - v_descuento_cuota;
        v_bruto_restante := v_bruto_restante - v_cuota_importe_bruto;

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

        -- Si es la última cuota general, absorbe TODO el descuento restante
        IF i = p_numero_pensiones THEN
            v_descuento_cuota := v_descuento_restante;
            IF v_descuento_cuota > v_cuota_importe_bruto THEN
                RAISE EXCEPTION 'El descuento para la última cuota superó el importe bruto. Revisar configuración de importes.';
            END IF;
        ELSE
            v_descuento_cuota := trunc((v_cuota_importe_bruto / v_bruto_restante) * v_descuento_restante, 2);
            v_descuento_cuota := LEAST(v_cuota_importe_bruto, v_descuento_cuota);
        END IF;

        v_cuota_importe_neto := v_cuota_importe_bruto - v_descuento_cuota;

        IF v_descuento_cuota < 0 OR v_descuento_cuota > v_cuota_importe_bruto OR v_cuota_importe_neto < 0 THEN
            RAISE EXCEPTION 'Inconsistencia en la distribución del descuento de la pensión %', i;
        END IF;

        v_descuento_restante := v_descuento_restante - v_descuento_cuota;
        v_bruto_restante := v_bruto_restante - v_cuota_importe_bruto;

        INSERT INTO cuotas (
            matricula_id, tipo_cuota, numero_cuota, concepto,
            fecha_emision, fecha_vencimiento, importe_original, descuento, importe_neto, saldo, status
        ) VALUES (
            v_matricula_id, 'PENSION', i, 'Pensión ' || i,
            CURRENT_DATE, v_fecha_vencimiento, v_cuota_importe_bruto, v_descuento_cuota, v_cuota_importe_neto, v_cuota_importe_neto, CASE WHEN v_cuota_importe_neto = 0 THEN 'PAGADA' ELSE 'PENDIENTE' END
        );
        v_fecha_vencimiento := v_fecha_vencimiento + (p_frecuencia_meses || ' months')::interval;
    END LOOP;

    -- Verificación final
    IF v_descuento_restante <> 0 THEN
        RAISE EXCEPTION 'El descuento no pudo ser completamente asignado sin generar valores negativos';
    END IF;

    -- Actualizar Prospecto asegurando actualización
    IF p_prospecto_id IS NOT NULL THEN
        UPDATE prospectos SET
            matricula_id = v_matricula_id,
            status = 'MATRICULADO',
            updated_by = v_uid,
            updated_at = now()
        WHERE id = p_prospecto_id;

        GET DIAGNOSTICS v_prospecto_actualizado = ROW_COUNT;
        IF v_prospecto_actualizado = 0 THEN
            RAISE EXCEPTION 'Error al actualizar el estado del prospecto';
        END IF;
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
    v_constraint text;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN RAISE EXCEPTION 'Usuario no autenticado'; END IF;
    IF NOT (has_permission('PAGOS.REGISTRAR') OR has_permission('SISTEMA.ADMINISTRAR')) THEN
        RAISE EXCEPTION 'No tienes permiso para registrar pagos';
    END IF;

    IF p_idempotency_key IS NULL THEN RAISE EXCEPTION 'La clave de idempotencia es obligatoria'; END IF;
    IF p_importe <= 0 THEN RAISE EXCEPTION 'El importe debe ser mayor a cero'; END IF;

    -- Validar jsonb
    IF jsonb_typeof(p_cuotas_aplicadas) <> 'array' OR jsonb_array_length(p_cuotas_aplicadas) = 0 THEN
        RAISE EXCEPTION 'Debe proporcionar un arreglo JSON válido con al menos una cuota';
    END IF;

    -- Validar estudiante
    IF NOT EXISTS (SELECT 1 FROM estudiantes WHERE id = p_estudiante_id) THEN
        RAISE EXCEPTION 'Estudiante no encontrado';
    END IF;

    -- Validar Idempotencia real previa
    SELECT id INTO v_pago_id FROM pagos WHERE idempotency_key = p_idempotency_key;
    IF v_pago_id IS NOT NULL THEN
        RETURN v_pago_id;
    END IF;

    -- Insertar el pago capturando unique_violation concurrente
    BEGIN
        INSERT INTO pagos (
            idempotency_key, estudiante_id, fecha_pago, importe, medio_pago, numero_operacion,
            comprobante_tipo, comprobante_numero, observaciones, registrado_por
        ) VALUES (
            p_idempotency_key, p_estudiante_id, CURRENT_DATE, p_importe, p_medio_pago, p_numero_operacion,
            p_comprobante_tipo, p_comprobante_numero, p_observaciones, v_uid
        ) RETURNING id INTO v_pago_id;
    EXCEPTION WHEN unique_violation THEN
        GET STACKED DIAGNOSTICS v_constraint = CONSTRAINT_NAME;
        IF v_constraint = 'uq_pagos_idempotency_key' THEN
            SELECT id INTO v_pago_id FROM pagos WHERE idempotency_key = p_idempotency_key;
            IF v_pago_id IS NULL THEN
                RAISE EXCEPTION 'No se recuperó el pago por idempotencia tras conflicto concurrente';
            END IF;
            RETURN v_pago_id;
        ELSE
            RAISE;
        END IF;
    END;

    -- Procesar en orden de cuota_id para evitar deadlocks
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_cuotas_aplicadas) ORDER BY (value->>'cuota_id')::uuid
    LOOP
        v_importe_aplicado := (v_item->>'importe')::numeric;
        IF v_importe_aplicado <= 0 THEN RAISE EXCEPTION 'El importe aplicado a la cuota debe ser mayor a cero'; END IF;

        IF (v_item->>'cuota_id')::uuid = ANY(v_cuotas_procesadas) THEN
            RAISE EXCEPTION 'Cuota duplicada en la aplicación';
        END IF;
        v_cuotas_procesadas := array_append(v_cuotas_procesadas, (v_item->>'cuota_id')::uuid);

        -- Obtener cuota con FOR UPDATE
        SELECT c.* INTO v_cuota FROM cuotas c WHERE c.id = (v_item->>'cuota_id')::uuid FOR UPDATE;
        IF NOT FOUND THEN RAISE EXCEPTION 'Cuota % no encontrada', (v_item->>'cuota_id'); END IF;

        -- Validar pertenencia al estudiante
        SELECT m.estudiante_id INTO v_matricula FROM matriculas m WHERE m.id = v_cuota.matricula_id;
        IF v_matricula IS NULL THEN RAISE EXCEPTION 'Matrícula de la cuota % inválida', v_cuota.id; END IF;
        IF v_matricula.estudiante_id <> p_estudiante_id THEN
            RAISE EXCEPTION 'La cuota no pertenece al estudiante indicado';
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

    -- Exigir igualdad exacta
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

    IF p_motivo IS NULL OR length(trim(p_motivo)) = 0 THEN
        RAISE EXCEPTION 'El motivo de anulación es obligatorio';
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

        -- Si superara el neto lo limitamos
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

-- migrate:up

CREATE TABLE IF NOT EXISTS audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp timestamptz DEFAULT now(),
    user_id uuid,
    user_role text,
    action text NOT NULL,
    module text,
    entity text,
    entity_id text,
    data_before jsonb,
    data_after jsonb,
    correlation_id text,
    result text DEFAULT 'EXITOSO',
    detail text,
    ip_address text,
    user_agent text
);

COMMENT ON TABLE audit_logs IS 'Registro de auditoría del sistema';

CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity, entity_id);
CREATE INDEX idx_audit_logs_correlation ON audit_logs(correlation_id);

CREATE OR REPLACE FUNCTION log_audit_entry(
    p_user_id uuid,
    p_user_role text,
    p_action text,
    p_module text,
    p_entity text,
    p_entity_id text,
    p_data_before jsonb DEFAULT NULL,
    p_data_after jsonb DEFAULT NULL,
    p_correlation_id text DEFAULT NULL,
    p_result text DEFAULT 'EXITOSO',
    p_detail text DEFAULT NULL,
    p_ip_address text DEFAULT NULL,
    p_user_agent text DEFAULT NULL
) RETURNS void AS $$
BEGIN
    INSERT INTO audit_logs (
        user_id, user_role, action, module, entity, entity_id,
        data_before, data_after, correlation_id, result, detail, ip_address, user_agent
    ) VALUES (
        p_user_id, p_user_role, p_action, p_module, p_entity, p_entity_id,
        p_data_before, p_data_after, p_correlation_id, p_result, p_detail, p_ip_address, p_user_agent
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

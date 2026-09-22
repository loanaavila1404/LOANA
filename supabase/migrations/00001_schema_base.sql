-- migrate:up

-- Habilitar extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Función para actualizar el timestamp updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función genérica de log de auditoría (para ser usada desde triggers o llamadas directas si es necesario)
CREATE OR REPLACE FUNCTION log_audit_action()
RETURNS TRIGGER AS $$
BEGIN
    -- Implementación básica de auditoría
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tabla de configuración institucional (Key-Value)
CREATE TABLE IF NOT EXISTS institutional_config (
    key text PRIMARY KEY,
    value text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Comentarios de tabla y columnas
COMMENT ON TABLE institutional_config IS 'Configuración institucional del sistema';
COMMENT ON COLUMN institutional_config.key IS 'Clave única de configuración';
COMMENT ON COLUMN institutional_config.value IS 'Valor de la configuración';

-- Disparador para actualizar updated_at
CREATE TRIGGER update_institutional_config_updated_at
BEFORE UPDATE ON institutional_config
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

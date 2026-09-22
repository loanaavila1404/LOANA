-- migrate:up

INSERT INTO institutional_config (key, value, description) VALUES
('APP_NAME', 'ERP Brusben', 'Nombre de la aplicación'),
('INSTITUTION_NAME', 'Centro de Capacitaciones Brusben', 'Nombre de la institución'),
('VERSION', '1.0.0', 'Versión del sistema'),
('TIME_ZONE', 'America/Lima', 'Zona horaria por defecto'),
('CURRENCY', 'PEN', 'Moneda por defecto'),
('CURRENCY_SYMBOL', 'S/', 'Símbolo de la moneda'),
('LOCATION', 'Tumbes, Peru', 'Ubicación principal'),
('ESTUDIANTE_CODIGO_PREFIJO', 'BRU', 'Prefijo para códigos de estudiante')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

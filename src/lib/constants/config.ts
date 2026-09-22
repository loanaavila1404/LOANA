export const APP_CONFIG = {
  APP_NAME: 'ERP Brusben',
  INSTITUTION_NAME: 'Centro de Capacitaciones Brusben',
  VERSION: '1.0.0',
  TIMEZONE: 'America/Lima',
  LOCALE: 'es-PE',
  CURRENCY: 'PEN',
  CURRENCY_SYMBOL: 'S/',
  LOCATION: 'Tumbes, Perú',
  DATE_FORMAT: 'dd/MM/yyyy',
  DATE_FORMAT_ISO: 'yyyy-MM-dd',
  DATETIME_FORMAT: 'dd/MM/yyyy HH:mm',
  STUDENT_CODE_PREFIX: 'BRU',
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'application/pdf'],
  PAGINATION_DEFAULT_SIZE: 10,
  PAGINATION_MAX_SIZE: 50,
} as const;

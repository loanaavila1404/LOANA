/**
 * Utilidad para resolver dinámicamente la URL base de la aplicación.
 *
 * Resuelve automáticamente el dominio actual en Vercel, entornos de producción
 * con proxy inverso, dominios personalizados y desarrollo local:
 *
 * 1. NEXT_PUBLIC_SITE_URL / SITE_URL (si está configurada manualmente en Vercel).
 * 2. Headers de proxy inverso: 'x-forwarded-host' y 'x-forwarded-proto' (estándar en Vercel Edge y Lambda).
 * 3. Variables de entorno automáticas de Vercel (VERCEL_PROJECT_PRODUCTION_URL / VERCEL_URL).
 * 4. window.location.origin (en el navegador).
 * 5. request.url origin / fallback a 'http://localhost:3000'.
 */

export function getSiteUrl(request?: Request): string {
  // 1. Variable de entorno explícita configurada en Vercel o .env
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (siteUrl && siteUrl.trim() !== '') {
    return siteUrl.trim().replace(/\/+$/, '');
  }

  // 2. Si se proporciona el objeto Request en un Route Handler o Middleware
  if (request) {
    const forwardedHost = request.headers.get('x-forwarded-host');
    const forwardedProto = request.headers.get('x-forwarded-proto');
    const host = forwardedHost || request.headers.get('host');

    if (host) {
      // Determinar protocolo seguro (en producción o Vercel siempre https a menos que sea local)
      const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
      const proto = forwardedProto || (isLocal ? 'http' : 'https');
      return `${proto}://${host}`.replace(/\/+$/, '');
    }

    // Si no hay headers de host pero hay URL de request
    try {
      const parsed = new URL(request.url);
      if (!parsed.hostname.includes('localhost') && !parsed.hostname.includes('127.0.0.1')) {
        return parsed.origin;
      }
    } catch {
      // Ignorar error de parsing
    }
  }

  // 3. Entorno de navegador (Client Components)
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  // 4. Variables de entorno inyectadas automáticamente por Vercel en build/servidor
  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercelUrl && vercelUrl.trim() !== '') {
    const cleanUrl = vercelUrl.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
    return `https://${cleanUrl}`;
  }

  // 5. Fallback final para entorno de desarrollo local sin red
  return 'http://localhost:3000';
}

/**
 * Genera una URL absoluta a partir de una ruta relativa usando la base dinámica.
 */
export function getAbsoluteUrl(path: string, request?: Request): string {
  const base = getSiteUrl(request);
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

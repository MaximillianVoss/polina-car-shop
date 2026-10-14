export const DEFAULT_BASE = 'https://car-rest-service-carshop.2.rahtiapp.fi/';

export function backendBase(raw: string = DEFAULT_BASE): string {
  const url = new URL(raw.endsWith('/') ? raw : `${raw}/`);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error('API base must be an HTTP or HTTPS address without credentials, query or fragment.');
  }
  return url.href;
}

export function browserApiBase(backend: string, pageUrl?: string): string {
  if (pageUrl) {
    const page = new URL(pageUrl);
    if (['localhost', '127.0.0.1', '[::1]'].includes(page.hostname)) return new URL('/api/', page.origin).href;
  }
  return backendBase(backend);
}

export function proxyPath(path: string, backend: string): string {
  return new URL(backend).pathname.replace(/\/$/, '') + path.replace(/^\/api(?=\/|\?|$)/, '');
}

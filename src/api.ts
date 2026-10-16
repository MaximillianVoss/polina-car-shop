import { ApiUnavailableError, createAutoFallbackApi } from './fallback';
import { fields, type Car, type CarInput } from './cars';
import { DEFAULT_BASE, backendBase, browserApiBase } from './api-config';
export { DEFAULT_BASE };
export const BACKEND_BASE = backendBase(import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE);
export const API_BASE = browserApiBase(BACKEND_BASE, typeof location === 'undefined' ? undefined : location.href);
export const REQUEST_TIMEOUT_MS = 30000;
class ApiRequestError extends Error {}
export function createApi(base: string, transport: typeof fetch = fetch, readTimeoutMs = REQUEST_TIMEOUT_MS) {
  const root = new URL(backendBase(base));
  const endpoint = (id?: string) => new URL(`cars${id ? `/${encodeURIComponent(id)}` : ''}`, root).href;
  async function request(url: string, init?: RequestInit, json = false): Promise<unknown> {
    const controller = new AbortController();
    const timeoutMs = !init?.method || init.method === 'GET' ? readTimeoutMs : REQUEST_TIMEOUT_MS;
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const warning = init?.method && init.method !== 'GET' ? ' A timed-out change may have reached the server: refresh before retrying.' : '';
    try {
      const response = await transport(url, { ...init, signal: controller.signal, headers: { Accept: 'application/hal+json, application/json', ...(init?.body ? { 'Content-Type': 'application/json' } : {}) } });
      if (!response.ok) {
        if (response.status === 502 && response.headers.get('content-type')?.includes('application/json')) {
          const detail = await response.json().catch(() => null) as { code?: string; reason?: string } | null;
          if (detail?.code === 'API_UNREACHABLE') throw new ApiUnavailableError(`Cannot reach the course API from the local server (${detail.reason || 'network error'}). Check internet access or VPN and try again.${warning}`);
        }
        if (response.status >= 500) throw new ApiUnavailableError(`The API is unavailable (HTTP ${response.status}).${warning}`);
        throw new ApiRequestError(`Server returned ${response.status}. ${response.status === 404 ? 'The car may have been removed. Refresh the list.' : 'Please try again.'}`);
      }
      return json ? await response.json() : undefined;
    } catch (error) {
      if (error instanceof ApiRequestError || error instanceof ApiUnavailableError) throw error;
      if (controller.signal.aborted) throw new ApiUnavailableError(`The API did not respond within ${timeoutMs / 1000} seconds. Try again.${warning}`);
      if (error instanceof SyntaxError) throw new Error('The API returned invalid JSON. Check the API base URL.');
      throw new ApiUnavailableError(`Cannot reach the API at ${root.origin}. Check the connection and API base URL.${warning}`);
    } finally {
      clearTimeout(timer);
    }
  }
  function parse(raw: unknown): Car {
    if (!raw || typeof raw !== 'object') throw new Error('Invalid car response.');
    const item = raw as Record<string, unknown>;
    const links = item._links as { self?: { href?: string }; car?: { href?: string } } | undefined;
    const href = links?.self?.href || links?.car?.href;
    const match = href ? new URL(href, root).pathname.match(/\/cars\/(\d+)\/?$/) : null;
    const id = match?.[1] ?? (typeof item.id === 'number' && Number.isSafeInteger(item.id) && item.id >= 0 ? String(item.id) : undefined);
    if (!id || fields.some(key => key === 'modelYear' || key === 'price' ? typeof item[key] !== 'number' || !Number.isFinite(item[key]) : typeof item[key] !== 'string')) throw new Error('Invalid car fields or missing stable ID in API response.');
    return { id, brand: item.brand as string, model: item.model as string, color: item.color as string, fuel: item.fuel as string, modelYear: item.modelYear as number, price: item.price as number };
  }
  return {
    async list(): Promise<Car[]> {
      const cars: Car[] = [];
      let next: string | undefined = endpoint();
      const seen = new Set<string>();
      while (next) {
        if (seen.has(next) || seen.size >= 100) throw new Error('Invalid API pagination.');
        seen.add(next);
        const data = await request(next, undefined, true) as { _embedded?: { cars?: unknown[] }; _links?: { next?: { href?: string } } } | null;
        if (!Array.isArray(data?._embedded?.cars)) throw new Error('Invalid API response: expected _embedded.cars.');
        cars.push(...data._embedded.cars.map(parse));
        const href: string | undefined = data?._links?.next?.href;
        // Preserve configured host even when HAL links contain an old deployment host.
        next = href ? new URL(`cars${new URL(href, root).search}`, root).href : undefined;
      }
      if (new Set(cars.map(car => car.id)).size !== cars.length) throw new Error('Duplicate car IDs in API response.');
      return cars;
    },
    async save(value: CarInput, id?: string): Promise<void> {
      await request(endpoint(id), { method: id ? 'PUT' : 'POST', body: JSON.stringify(value) });
    },
    async remove(id: string): Promise<void> {
      await request(endpoint(id), { method: 'DELETE' });
    },
  };
}
export const api = createAutoFallbackApi(createApi(API_BASE, fetch, 8000));

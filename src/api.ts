import { fields, type Car, type CarInput } from './cars';
export const DEFAULT_BASE = 'https://car-rest-service-carshop.2.rahtiapp.fi/';
export const API_BASE = import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE;
export function createApi(base: string, transport: typeof fetch = fetch) {
  const root = new URL(base.endsWith('/') ? base : `${base}/`);
  if (!['http:', 'https:'].includes(root.protocol)) throw new Error('API base must use HTTP or HTTPS.');
  const endpoint = (id?: string) => new URL(`cars${id ? `/${encodeURIComponent(id)}` : ''}`, root).href;
  async function request(url: string, init?: RequestInit) {
    try {
      const response = await transport(url, { ...init, signal: AbortSignal.timeout(15000), headers: { Accept: 'application/hal+json, application/json', ...(init?.body ? { 'Content-Type': 'application/json' } : {}) } });
      if (!response.ok) throw new Error(`Server returned ${response.status}. ${response.status === 404 ? 'The car may have been removed. Refresh the list.' : 'Please try again.'}`);
      return response;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Server returned')) throw error;
      throw new Error('Cannot reach the API. Check the connection and API base URL. A timed-out change may have reached the server: refresh before retrying.');
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
        const data = await (await request(next)).json();
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
export const api = createApi(API_BASE);

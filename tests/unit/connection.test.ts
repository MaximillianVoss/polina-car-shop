import { afterEach, describe, expect, it, vi } from 'vitest';
import { backendBase, browserApiBase, DEFAULT_BASE, proxyPath } from '../../src/api-config';
import { createApi, REQUEST_TIMEOUT_MS } from '../../src/api';

afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

describe('local API connection', () => {
  it.each(['http://127.0.0.1:4173/', 'http://localhost:5173/', 'http://[::1]:4173/'])('uses the current local origin for %s', page => {
    expect(browserApiBase(DEFAULT_BASE, page)).toBe(new URL('/api/', page).href);
  });
  it('preserves the configured backend for static hosting and nonbrowser tools', () => {
    expect(browserApiBase('https://backend.example/v1/', 'https://student.example/shop/')).toBe('https://backend.example/v1/');
    expect(browserApiBase(DEFAULT_BASE)).toBe(DEFAULT_BASE);
  });
  it('preserves custom target prefix, car ID and pagination query when proxying', () => {
    expect(proxyPath('/api/cars/42', 'https://backend.example/v1/')).toBe('/v1/cars/42');
    expect(proxyPath('/api/cars?page=2&size=10', DEFAULT_BASE)).toBe('/cars?page=2&size=10');
  });
  it.each(['file:///tmp/db', 'https://user:password@backend.example/', 'https://backend.example/?token=x'])('rejects invalid backend configuration %s', value => {
    expect(() => backendBase(value)).toThrow('API base');
  });
  it('does not depend on AbortSignal.timeout browser support', async () => {
    vi.spyOn(AbortSignal, 'timeout').mockImplementation(() => { throw new TypeError('Not supported'); });
    const transport = vi.fn<typeof fetch>().mockResolvedValue(new Response('{"_embedded":{"cars":[]}}'));
    expect(await createApi('https://backend.example/', transport).list()).toEqual([]);
  });
  it('shows the local server network reason instead of a generic status 502', async () => {
    const transport = vi.fn<typeof fetch>().mockResolvedValue(new Response('{"code":"API_UNREACHABLE","reason":"ENOTFOUND"}', { status: 502, headers: { 'Content-Type': 'application/json' } }));
    await expect(createApi('http://localhost:4173/api/', transport).list()).rejects.toThrow('ENOTFOUND');
  });
  it('distinguishes invalid JSON from failure to connect', async () => {
    const transport = vi.fn<typeof fetch>().mockResolvedValue(new Response('<html>Wrong server</html>'));
    await expect(createApi('https://backend.example/', transport).list()).rejects.toThrow('invalid JSON');
  });
  it('does not show mutation uncertainty for a failed read', async () => {
    const transport = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(createApi('https://backend.example/', transport).list()).rejects.not.toThrow('change may');
    await expect(createApi('https://backend.example/', transport).remove('42')).rejects.toThrow('change may');
  });
  it('aborts slow mutations once and reports uncertainty without retrying', async () => {
    vi.useFakeTimers();
    const transport = vi.fn<typeof fetch>().mockImplementation((_url, options) => new Promise((_resolve, reject) => {
      options?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    }));
    const result = expect(createApi('https://backend.example/', transport).remove('42')).rejects.toThrow('30 seconds');
    await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS);
    await result;
    expect(transport).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('keeps the timeout active while reading the response body', async () => {
    vi.useFakeTimers();
    const transport = vi.fn<typeof fetch>().mockImplementation(async (_url, options) => {
      const response = new Response('{}');
      response.json = () => new Promise((_resolve, reject) => options?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))));
      return response;
    });
    const result = expect(createApi('https://backend.example/', transport).list()).rejects.toThrow('30 seconds');
    await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS);
    await result;
    expect(vi.getTimerCount()).toBe(0);
  });
});

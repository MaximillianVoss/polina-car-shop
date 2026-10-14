import { describe, expect, it, vi } from 'vitest';
import { createApi } from '../../src/api';
const value = { brand: 'Volvo', model: 'XC60', color: 'Black', fuel: 'Hybrid', modelYear: 2023, price: 59000 };
const hal = (id = '42') => ({ ...value, _links: { self: { href: `https://old.example/cars/${id}` } } });
const response = (data: unknown, status = 200) => new Response(status === 204 ? null : JSON.stringify(data), { status });
describe('HAL and CRUD contracts', () => {
  it('extracts stable ID and keeps configured host for PUT and DELETE, handling 204', async () => {
    const transport = vi.fn<typeof fetch>().mockResolvedValueOnce(response({ _embedded: { cars: [hal()] } })).mockResolvedValue(response(null, 204));
    const api = createApi('https://current.example/', transport);
    expect((await api.list())[0].id).toBe('42');
    await api.save(value, '42'); await api.remove('42');
    expect(transport.mock.calls[1][0]).toBe('https://current.example/cars/42');
    expect(transport.mock.calls[1][1]?.method).toBe('PUT');
    expect(JSON.parse(transport.mock.calls[1][1]?.body as string)).toEqual(value);
    expect(transport.mock.calls[2][1]?.method).toBe('DELETE');
  });
  it('POST sends exactly six fields as numbers/strings and JSON headers', async () => {
    const transport = vi.fn<typeof fetch>().mockResolvedValue(response({}, 201));
    await createApi('https://current.example', transport).save(value);
    const [url, options] = transport.mock.calls[0];
    expect(url).toBe('https://current.example/cars'); expect(options?.method).toBe('POST');
    expect(JSON.parse(options?.body as string)).toEqual(value);
    expect(options?.headers).toHaveProperty('Content-Type', 'application/json');
  });
  it('accepts car link fallback and paginated responses without changing configured origin', async () => {
    const transport = vi.fn<typeof fetch>().mockResolvedValueOnce(response({ _embedded: { cars: [hal('1')] }, _links: { next: { href: 'https://old.example/cars?page=1' } } })).mockResolvedValueOnce(response({ _embedded: { cars: [{ ...value, _links: { car: { href: '/cars/2' } } }] } }));
    expect((await createApi('https://current.example/', transport).list()).map(car => car.id)).toEqual(['1', '2']);
    expect(transport.mock.calls[1][0]).toBe('https://current.example/cars?page=1');
  });
  it.each([{}, { _embedded: { cars: [{ ...value }] } }, { _embedded: { cars: [hal(), hal()] } }, { _embedded: { cars: [{ ...hal(), price: '59000' }] } }])('rejects malformed or ambiguous responses', async data => {
    await expect(createApi('https://current.example/', vi.fn().mockResolvedValue(response(data))).list()).rejects.toThrow();
  });
  it('supports empty list', async () => { expect(await createApi('https://current.example/', vi.fn().mockResolvedValue(response({ _embedded: { cars: [] } }))).list()).toEqual([]); });
  it.each([404, 500])('reports HTTP %i rather than false success', async status => {
    await expect(createApi('https://current.example/', vi.fn().mockResolvedValue(response({}, status))).remove('42')).rejects.toThrow(String(status));
  });
  it('reports network failure', async () => { await expect(createApi('https://current.example/', vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))).list()).rejects.toThrow('Cannot reach'); });
  it('rejects pagination loops', async () => { await expect(createApi('https://current.example/', vi.fn().mockResolvedValue(response({ _embedded: { cars: [] }, _links: { next: { href: '/cars' } } }))).list()).rejects.toThrow('pagination'); });
});

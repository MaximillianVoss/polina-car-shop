import { describe, expect, it, vi } from 'vitest';
import { createAutoFallbackApi, createLocalMock, ApiUnavailableError } from '../../src/fallback';
import { createApi } from '../../src/api';
import type { CarInput } from '../../src/cars';

const input: CarInput = { brand: 'Practice', model: 'Test', color: 'Blue', fuel: 'Electric', modelYear: 2024, price: 9 };
function remote() {
  return { list: vi.fn().mockResolvedValue([{ ...input, id: '42' }]), save: vi.fn().mockResolvedValue(undefined), remove: vi.fn().mockResolvedValue(undefined) };
}
describe('automatic per-tab local demo', () => {
  it('uses the real repository while available', async () => {
    const server = remote(), api = createAutoFallbackApi(server);
    expect((await api.list())[0].id).toBe('42');
    await api.save(input); await api.remove('42');
    expect(api.isDemo).toBe(false); expect(server.save).toHaveBeenCalledWith(input, undefined); expect(server.remove).toHaveBeenCalledWith('42');
  });
  it('switches on read network failure and completes local CRUD with no later remote calls', async () => {
    const server = remote(); server.list.mockRejectedValue(new ApiUnavailableError('Offline'));
    const api = createAutoFallbackApi(server);
    expect(await api.list()).toHaveLength(2); expect(api.isDemo).toBe(true); expect(api.fallbackReason).toBe('Offline');
    await api.save(input);
    const added = (await api.list()).find(car => car.brand === 'Practice')!;
    expect(added.id).toBe('demo-3');
    await api.save({ ...input, model: 'Changed' }, added.id);
    expect((await api.list()).find(car => car.id === added.id)?.model).toBe('Changed');
    await api.remove(added.id); expect(await api.list()).toHaveLength(2);
    expect(server.list).toHaveBeenCalledTimes(1); expect(server.save).not.toHaveBeenCalled(); expect(server.remove).not.toHaveBeenCalled();
  });
  it('switches for server 503 and real fetch network exceptions', async () => {
    for (const transport of [vi.fn().mockResolvedValue(new Response('{}', { status: 503 })), vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))]) {
      const api = createAutoFallbackApi(createApi('https://offline.example/', transport));
      expect(await api.list()).toHaveLength(2); expect(api.isDemo).toBe(true);
    }
  });
  it('does not hide authentication or invalid/schema responses', async () => {
    for (const response of [new Response('{}', {status:403}), new Response('<html>wrong</html>'), new Response('{"_embedded":{"cars":[{}]}}')]) {
      const api = createAutoFallbackApi(createApi('https://backend.example/', vi.fn().mockResolvedValue(response)));
      await expect(api.list()).rejects.toThrow(); expect(api.isDemo).toBe(false);
    }
  });
  it('never retries or redirects an uncertain mutation', async () => {
    const server = remote(), api = createAutoFallbackApi(server);
    await api.list();
    server.save.mockRejectedValue(new ApiUnavailableError('Lost response'));
    server.remove.mockRejectedValue(new ApiUnavailableError('Lost response'));
    await expect(api.save(input, '42')).rejects.toThrow('Lost response');
    await expect(api.remove('42')).rejects.toThrow('Lost response');
    expect(api.isDemo).toBe(false); expect(server.save).toHaveBeenCalledTimes(1); expect(server.remove).toHaveBeenCalledTimes(1);
  });
  it('replaces cached remote rows and refuses remote IDs in the demo', async () => {
    const server = remote(), api = createAutoFallbackApi(server);
    await api.list(); server.list.mockRejectedValue(new ApiUnavailableError('Offline'));
    const cars = await api.list(); expect(cars.every(car => car.id.startsWith('demo-'))).toBe(true);
    await expect(api.save(input, '42')).rejects.toThrow('not in the local demo');
    await expect(api.remove('42')).rejects.toThrow('not in the local demo');
  });
  it('isolates stores and returned arrays; reload starts with two examples', async () => {
    const first = createLocalMock(), second = createLocalMock();
    (await first.list())[0].brand = 'Corrupt';
    expect((await first.list())[0].brand).toBe('Volvo');
    await first.save(input); expect(await first.list()).toHaveLength(3); expect(await second.list()).toHaveLength(2);
  });
  it('cannot return late remote rows after another concurrent read activated demo', async () => {
    let resolveLate!: (cars: (CarInput & {id:string})[]) => void;
    const server = remote();
    server.list.mockRejectedValueOnce(new ApiUnavailableError('Offline')).mockImplementationOnce(() => new Promise(resolve => { resolveLate = resolve; }));
    const api = createAutoFallbackApi(server);
    const first = api.list(), late = api.list();
    await first;
    resolveLate([{ ...input, id:'42' }]);
    expect((await late).every(car => car.id.startsWith('demo-'))).toBe(true);
    expect(api.isDemo).toBe(true);
  });
});

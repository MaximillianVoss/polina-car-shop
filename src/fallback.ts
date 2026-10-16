import type { Car, CarInput } from './cars';

/** A read failed because the API cannot currently serve requests. */
export class ApiUnavailableError extends Error {}
export type CarRepository = {
  list(): Promise<Car[]>;
  save(value: CarInput, id?: string): Promise<void>;
  remove(id: string): Promise<void>;
};

/** Isolated per-tab demo store: no network, no sync to the course database. */
export function createLocalMock(): CarRepository {
  let nextId = 3;
  const cars: Car[] = [
    { id: 'demo-1', brand: 'Volvo', model: 'XC60', color: 'Black', fuel: 'Hybrid', modelYear: 2023, price: 59000 },
    { id: 'demo-2', brand: 'Nissan', model: 'Micra', color: 'Silver', fuel: 'E95', modelYear: 2012, price: 9000 },
  ];
  const indexOf = (id: string) => {
    const index = cars.findIndex(car => car.id === id);
    if (index < 0) throw new Error('This car is not in the local demo. Refresh the list before changing it.');
    return index;
  };
  return {
    async list() { return cars.map(car => ({ ...car })); },
    async save(value, id) {
      if (id !== undefined) cars[indexOf(id)] = { ...value, id };
      else cars.push({ ...value, id: `demo-${nextId++}` });
    },
    async remove(id) { cars.splice(indexOf(id), 1); },
  };
}

export function createAutoFallbackApi(remote: CarRepository) {
  const local = createLocalMock();
  let demo = false;
  let reason = '';
  return {
    get isDemo() { return demo; },
    get fallbackReason() { return reason; },
    async list(): Promise<Car[]> {
      if (demo) return local.list();
      try {
        const cars = await remote.list();
        // Another read may have enabled demo while this request was in flight.
        return demo ? local.list() : cars;
      }
      catch (error) {
        if (demo) return local.list();
        // Authentication, malformed JSON and schema failures remain visible.
        if (!(error instanceof ApiUnavailableError)) throw error;
        reason = error.message;
        demo = true;
        return local.list();
      }
    },
    async save(value: CarInput, id?: string) {
      // Never replay a failed remote mutation against another store.
      return (demo ? local : remote).save(value, id);
    },
    async remove(id: string) { return (demo ? local : remote).remove(id); },
  };
}

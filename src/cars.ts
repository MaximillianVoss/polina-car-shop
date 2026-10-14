export const fields = ['brand', 'model', 'color', 'fuel', 'modelYear', 'price'] as const;
export type Field = typeof fields[number];
export type CarInput = { brand: string; model: string; color: string; fuel: string; modelYear: number; price: number };
export type Car = CarInput & { id: string };
export type Draft = Record<Field, string>;
export const labels: Record<Field, string> = { brand: 'Brand', model: 'Model', color: 'Color', fuel: 'Fuel', modelYear: 'Year', price: 'Price' };
export function draftOf(car?: Car): Draft {
  return Object.fromEntries(fields.map(key => [key, car ? String(car[key]) : ''])) as Draft;
}
export function validate(draft: Draft): { errors: Partial<Record<Field, string>>; value: CarInput } {
  const errors: Partial<Record<Field, string>> = {};
  for (const key of ['brand', 'model', 'color', 'fuel'] as const) {
    if (!draft[key].trim()) errors[key] = `${labels[key]} is required.`;
    else if (draft[key].trim().length > 100) errors[key] = 'Use at most 100 characters.';
  }
  const modelYear = Number(draft.modelYear);
  const price = Number(draft.price);
  if (!draft.modelYear.trim() || !Number.isInteger(modelYear) || modelYear < 1886 || modelYear > new Date().getFullYear() + 1) errors.modelYear = `Enter a whole year from 1886 to ${new Date().getFullYear() + 1}.`;
  if (!draft.price.trim() || !Number.isFinite(price) || price < 0 || price > 1e12) errors.price = 'Enter a price from 0 to 1,000,000,000,000.';
  return { errors, value: { brand: draft.brand.trim(), model: draft.model.trim(), color: draft.color.trim(), fuel: draft.fuel.trim(), modelYear, price } };
}
export function selectCars(cars: Car[], query: string, field: Field, direction: 'asc' | 'desc'): Car[] {
  const needle = query.trim().toLocaleLowerCase();
  return cars.filter(car => fields.some(key => String(car[key]).toLocaleLowerCase().includes(needle))).sort((a, b) => {
    const left = a[field], right = b[field];
    const order = typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: 'base' });
    return (direction === 'asc' ? order : -order) || a.id.localeCompare(b.id);
  });
}

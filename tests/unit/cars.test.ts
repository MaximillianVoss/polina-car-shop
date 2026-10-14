import { expect, it } from 'vitest';
import { draftOf, selectCars, validate, type Car } from '../../src/cars';
const cars: Car[] = [ { id:'1', brand:'Volvo', model:'XC60', color:'Black', fuel:'Hybrid', modelYear:2023, price:100 }, { id:'2', brand:'Audi', model:'A3', color:'Blue', fuel:'E95', modelYear:2012, price:9 } ];
it('searches text case-insensitively and numeric fields', () => {
  expect(selectCars(cars, ' HYBRID ', 'brand', 'asc').map(c => c.id)).toEqual(['1']);
  expect(selectCars(cars, '2012', 'brand', 'asc').map(c => c.id)).toEqual(['2']);
  expect(selectCars(cars, 'missing', 'brand', 'asc')).toEqual([]);
});
it('sorts numbers numerically, strings by label, and leaves source array intact', () => {
  expect(selectCars(cars, '', 'price', 'asc').map(c => c.price)).toEqual([9,100]);
  expect(selectCars(cars, '', 'modelYear', 'desc').map(c => c.modelYear)).toEqual([2023,2012]);
  expect(selectCars(cars, '', 'brand', 'asc').map(c => c.brand)).toEqual(['Audi','Volvo']);
  expect(cars[0].id).toBe('1');
});
it('normalizes strings and accepts zero and decimal price', () => {
  const draft = { ...draftOf(cars[0]), brand: ' Volvo ', price:'0' };
  expect(validate(draft).errors).toEqual({}); expect(validate(draft).value.price).toBe(0);
  expect(validate({ ...draft, price:'12.50' }).value.price).toBe(12.5);
  expect(validate(draft).value.brand).toBe('Volvo');
});
it('rejects blank fields, negative/nonfinite price, fractional and impossible year', () => {
  expect(Object.keys(validate(draftOf()).errors)).toHaveLength(6);
  for (const price of ['-1','Infinity','NaN','1000000000001']) expect(validate({ ...draftOf(cars[0]), price }).errors.price).toBeTruthy();
  for (const modelYear of ['1800','2020.5','9999']) expect(validate({ ...draftOf(cars[0]), modelYear }).errors.modelYear).toBeTruthy();
});

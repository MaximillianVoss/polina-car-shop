import http from 'node:http';
let nextId = 3;
let cars = [
  { id: '1', brand: 'Volvo', model: 'XC60', color: 'Black', fuel: 'Hybrid', modelYear: 2023, price: 59000 },
  { id: '2', brand: 'Nissan', model: 'Micra', color: 'Silver', fuel: 'E95', modelYear: 2012, price: 9000 },
];
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') { res.writeHead(204).end(); return; }
  const url = new URL(req.url, 'http://127.0.0.1:4174');
  const match = url.pathname.match(/^\/cars(?:\/(\d+))?$/);
  if (!match) { res.writeHead(404).end('{}'); return; }
  const id = match[1];
  const index = cars.findIndex(car => car.id === id);
  const hal = car => ({ ...car, id: undefined, _links: { self: { href: `https://old.example/cars/${car.id}` } } });
  if (req.method === 'GET' && !id) { res.end(JSON.stringify({ _embedded: { cars: cars.map(hal) } })); return; }
  if (req.method === 'GET') { if (index < 0) res.writeHead(404).end('{}'); else res.end(JSON.stringify(hal(cars[index]))); return; }
  if (req.method === 'DELETE') { if (index < 0) res.writeHead(404).end('{}'); else { cars.splice(index, 1); res.writeHead(204).end(); } return; }
  if (!['POST', 'PUT'].includes(req.method) || (req.method === 'POST' && id) || (req.method === 'PUT' && !id)) { res.writeHead(405).end('{}'); return; }
  try {
    let body = ''; for await (const chunk of req) body += chunk;
    const data = JSON.parse(body);
    const keys = ['brand', 'model', 'color', 'fuel', 'modelYear', 'price'];
    if (Object.keys(data).length !== 6 || keys.some(key => !Object.hasOwn(data, key)) || ['brand', 'model', 'color', 'fuel'].some(key => typeof data[key] !== 'string' || !data[key].trim()) || !Number.isInteger(data.modelYear) || typeof data.price !== 'number' || data.price < 0) { res.writeHead(400).end('{}'); return; }
    if (req.method === 'POST') { const car = { ...data, id: String(nextId++) }; cars.push(car); res.writeHead(201, { Location: `/cars/${car.id}` }).end(JSON.stringify(hal(car))); }
    else if (index < 0) res.writeHead(404).end('{}');
    else { cars[index] = { ...data, id }; res.writeHead(204).end(); }
  } catch { res.writeHead(400).end('{}'); }
});
server.listen(4174, '127.0.0.1', () => console.log('In-memory practice API: http://127.0.0.1:4174/cars (restart to restore sample data)'));

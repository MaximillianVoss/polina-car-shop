import { readdir, mkdir, copyFile, readFile, writeFile, rm } from 'node:fs/promises';
import { resolve, relative, join } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
const root = process.cwd();
if (process.platform !== 'win32') throw new Error('Packaging uses Windows PowerShell; app execution works on macOS.');
const payload = resolve(root, 'delivery/payload/Car Shop');
const expected = resolve(root, 'delivery');
if (!payload.startsWith(expected + '\\')) throw new Error('Unexpected package path');
await rm(resolve(root, 'delivery/payload'), { recursive: true, force: true });
const excluded = new Set(['node_modules', 'dist', '.git', 'delivery', 'verification-copy', 'test-results', 'playwright-report']);
const manifest = [];
async function copy(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (excluded.has(entry.name) || entry.name.startsWith('.env') && entry.name !== '.env.example' || entry.name.endsWith('.tsbuildinfo') || entry.name === 'e2e-results.json') continue;
    const source = join(dir, entry.name), rel = relative(root, source), dest = join(payload, rel);
    if (entry.isSymbolicLink()) throw new Error('Symlinks are excluded from portable delivery');
    if (entry.isDirectory()) { await mkdir(dest, { recursive: true }); await copy(source); }
    else { await mkdir(resolve(dest, '..'), { recursive: true }); await copyFile(source, dest); manifest.push({ file: rel.replaceAll('\\', '/'), sha256: createHash('sha256').update(await readFile(source)).digest('hex') }); }
  }
}
await copy(root);
await mkdir(join(payload, 'evidence'), { recursive: true });
await writeFile(join(payload, 'evidence/package-manifest.json'), JSON.stringify(manifest, null, 2));
const zip = resolve(root, 'delivery/Car Shop — проект.zip');
const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', 'Compress-Archive -LiteralPath $env:CARSHOP_PAYLOAD -DestinationPath $env:CARSHOP_ZIP -Force'], { env: { ...process.env, CARSHOP_PAYLOAD: payload, CARSHOP_ZIP: zip }, encoding: 'utf8' });
if (result.status !== 0) throw new Error(result.stderr);
const receipt = { archive: 'Car Shop — проект.zip', sha256: createHash('sha256').update(await readFile(zip)).digest('hex'), fileCount: manifest.length + 1, builtAt: new Date().toISOString() };
await writeFile(resolve(root, 'delivery/receipt.json'), JSON.stringify(receipt, null, 2));
console.log(JSON.stringify(receipt));

import { readFile, writeFile } from 'node:fs/promises';
const intro = await readFile('docs/MANUAL-INTRO.md', 'utf8');
const files = ['package.json','build-and-run.sh','.env.example','.gitignore','index.html','public/favicon.svg','tsconfig.json','vite.config.ts','playwright.config.ts','src/cars.ts','src/api-config.ts','src/api.ts','src/fallback.ts','src/main.tsx','src/App.tsx','src/styles.css','scripts/mock-server.mjs','scripts/check-live.mjs','scripts/check-live-browser.mjs','scripts/package.mjs','scripts/prepare-manual.mjs','tests/unit/api.test.ts','tests/unit/fallback.test.ts','tests/unit/connection.test.ts','tests/unit/cars.test.ts','tests/e2e/inventory.spec.ts'];
let result = intro + '\n\n## Полные авторские листинги\n\nЛистинги ниже взяты из файлов этой версии автоматически. Зависимости из node_modules и машинный package-lock.json не перепечатываются; lockfile находится в архиве и фиксирует установку. Изменили код — обновите руководство командой `node scripts/prepare-manual.mjs`.\n';
for (const file of files) {
  const language = file.endsWith('.tsx') ? 'tsx' : file.endsWith('.ts') ? 'ts' : file.endsWith('.mjs') ? 'js' : file.endsWith('.json') ? 'json' : file.endsWith('.css') ? 'css' : file.endsWith('.html') ? 'html' : 'text';
  result += `\n### ${file}\n\n\`\`\`${language}\n${(await readFile(file, 'utf8')).trimEnd()}\n\`\`\`\n`;
}
await writeFile('docs/MANUAL.md', result);
console.log(`Manual generated: ${files.length} complete listings`);

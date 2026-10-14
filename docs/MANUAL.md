# Car Shop — пошаговая инструкция и полное решение

## 1. Что мы создаём

Front end магазина автомобилей подключается к готовому REST API. Приложение показывает шесть полей машины, позволяет Add/Edit/Delete, ищет и сортирует записи. На большом экране показана таблица; на телефоне та же таблица визуально превращается в карточки. Для добавления и редактирования используется одна форма в нативном диалоге. Удаление требует отдельного подтверждения.

Маршрут: установить Node → открыть проект → установить зависимости → запустить локальный mock и интерфейс → проверить действия → изучить типы/API/React → подключить общий backend только для разрешённой работы → собрать проект. Условие находится в ASSIGNMENT.md без решения; PRACTICE.md содержит самостоятельные задания, SOLUTIONS.md — отдельные ответы.

## 2. Запуск на macOS с нуля

1. Установите Node.js 24 LTS с официального сайта https://nodejs.org/. Допустимый минимум проекта — 22.12. Откройте Terminal и выполните `node --version` и `npm --version`. Если Terminal был открыт до установки, закройте его и откройте снова.
2. Распакуйте «Car Shop — проект.zip». Внутри будет папка «Car Shop». Сохраните её в удобном локальном каталоге.
3. Введите в Terminal `cd ` с пробелом, перетащите папку «Car Shop» из Finder и нажмите Enter. Проверьте `pwd` и `ls`: здесь должен лежать package.json. Путь с пробелами также можно писать в кавычках: `cd "$HOME/Downloads/Car Shop"`.
4. Выполните `npm ci`. Эта команда использует package-lock.json, а не выбирает произвольные версии. Глобально устанавливать React или Vite не требуется.
5. Запустите локальный сервер: `npm run mock`. Terminal должен оставаться открытым. Это безопасная учебная среда в памяти, а не замена готовому backend задания.
6. Откройте второй Terminal и снова перейдите в «Car Shop». Выполните:

```sh
VITE_API_BASE_URL=http://127.0.0.1:4174/ npm run dev
```

7. Откройте адрес, напечатанный Vite (по умолчанию http://127.0.0.1:5173). Баннер должен сообщать Local practice backend. Должны появиться Volvo XC60 и Nissan Micra.
8. Для завершения нажмите Ctrl+C в обоих Terminal. После перезапуска mock две исходные машины восстановятся; ваши тестовые изменения не сохраняются на диск.

На Windows первый Terminal тот же. Во втором PowerShell задайте переменную отдельной командой `$env:VITE_API_BASE_URL='http://127.0.0.1:4174/'`, затем `npm run dev`. Для удаления переменной используйте `Remove-Item Env:VITE_API_BASE_URL`.

## 3. Основной пользовательский путь

1. Нажмите + Add car. Введите Brand=Practice, Model=Roadster, Color=Blue, Fuel=Electric, Year=2024, Price=12500.5. Сохраните. Появится Car added и новая машина. Цена не получает выдуманный символ валюты: backend не документирует валюту.
2. В Search cars введите practice. Останется только нужная запись. Поиск также работает по топливу, цвету, году и цене; нет совпадения — появится No matching cars с Clear search.
3. Нажмите Edit у машины. Измените модель на Tourer, нажмите Save car. Список загрузится заново. Если текущий поиск больше не совпадает с изменёнными полями, запись исчезнет из отфильтрованного вида; очистите поиск.
4. Выберите Sort by=Price. Ascending сортирует число по возрастанию, Descending — по убыванию. Year также сортируется численно. Brand/Model/Color/Fuel используют сравнение строк. При равных значениях id даёт устойчивый порядок.
5. Нажмите Delete. Проверьте марку, модель, год и цвет в подтверждении; одинаковые названия в таблице могут принадлежать разным id. Cancel/Escape отменяют действие. Delete car отправляет запрос и убирает запись после успешной повторной загрузки.
6. Откройте Add car и нажмите Save car без ввода. Увидите ошибки, фокус перейдёт к первому неправильному полю. Нажмите Cancel. Это не отправляет запрос.

## 4. Подключение к настоящему API

Документация: https://juhahinkula.github.io/carshopdocs/cars/. Текущий base: https://car-rest-service-carshop.2.rahtiapp.fi/. В JSON-примерах документации есть старый hostname; в проекте используется текущий base, а из HAL извлекается только id.

Для подключения закройте Vite. В новом Terminal, где не задана VITE_API_BASE_URL, выполните `npm run dev`. Либо `cp .env.example .env`, укажите нужный адрес и перезапустите. Переменная окружения Terminal имеет приоритет над .env. Адрес меняется на этапе запуска/сборки Vite, не через редактирование уже собранного dist.

| Действие | Запрос | Тело |
|---|---|---|
| Прочитать список | GET /cars | отсутствует |
| Создать | POST /cars | шесть полей JSON |
| Изменить | PUT /cars/{id} | все шесть полей JSON |
| Удалить | DELETE /cars/{id} | отсутствует; успех может иметь пустое тело 204 |

Общий сервер принадлежит курсу и содержит общие данные. Автоматические тесты не меняют его. При ручной работе выполняйте только разрешённые операции со своими учебными записями. В проекте нет функции reset. GET-проверка живого API подтверждает чтение, но не доказывает работу реальной записи. Такой статус честно сохранён в VERIFICATION.md.

## 5. Как устроены файлы и функции

### Модель, валидация, поиск: src/cars.ts

`CarInput` описывает шесть полей для запроса; `Car` добавляет стабильный id. `Field` выводится из массива fields, поэтому сортировка не может случайно получить постороннее имя. `Draft` хранит все поля строками, как HTML input. Числа преобразуются только после проверки.

`draftOf(car?)` превращает выбранную машину в форму или создаёт пустую форму. `validate(draft)` проверяет обязательность, длину строк, целый год, конечную неотрицательную цену. Возвращает ошибки по полям и нормализованные данные. Целый год 1886…текущий год+1 и цена до 10^12 — клиентская политика, не дополнительный пункт исходного задания. Нулевая цена разрешена. Десятичный разделитель для программного ввода — точка.

`selectCars(cars, query, field, direction)` сначала фильтрует по всем шести полям, затем сортирует новую коллекцию. Number сравнивается вычитанием; текст — localeCompare. Возврат нового массива сохраняет исходный кеш React Query. id используется и для разрешения равенства, и для React key, а не индекс строки.

### Сеть: src/api.ts

`createApi(base, transport)` принимает адрес и необязательный fetch. Такая зависимость позволяет проверять запросы без обращения к общему серверу. `endpoint(id?)` строит URL на выбранном base; id кодируется в сегмент пути. HAL-ссылки старого сервера не заставляют приложение менять host.

`request` ставит Accept, а при JSON-теле — Content-Type. AbortController и таймер ограничивают ожидание 30 секундами, включая чтение JSON; поддержка AbortSignal.timeout не требуется. Проверка response.ok превращает HTTP-ошибку в исключение. Тайм-аут, неверный JSON и ошибка подключения имеют разные сообщения. Запросы изменения не повторяются автоматически: при потере ответа данные могли уже измениться на сервере.

На localhost браузер обращается к `/api/cars` своего приложения. Proxy в `vite.config.ts` пересылает запрос в настоящий учебный backend: работает и `npm run dev`, и `npm run preview`/общий build-and-run.sh. Это устраняет прямой междоменный запрос из браузера, не подменяет данные и не отключает проверку TLS. Адрес внешнего сервера остаётся VITE_API_BASE_URL; custom API-prefix и параметры pagination сохраняются. При сбое сервер возвращает код ENOTFOUND/ECONNREFUSED и т.п., который показывается в интерфейсе. Для статического хостинга без Vite нужен собственный `/api` proxy либо обычный прямой HTTPS API; при нелокальном адресе приложение по умолчанию использует прямой backend.

`parse(raw)` проверяет типы полей и извлекает id из self.href, затем car.href, затем числового id. Чужие служебные поля не попадут в запрос. Некорректная машина или повторяющиеся id отклоняются, чтобы нельзя было молча отредактировать чужую запись.

`list()` читает _embedded.cars и при наличии next загружает следующие страницы. Следующие запросы также используют выбранный base, копируется только query string. Набор seen защищает от цикла, предел 100 страниц — от бесконечной загрузки. В текущем сервере GET возвращает полный массив без pagination.

`save(value, id?)` выбирает POST для новой машины и PUT для существующей. Тело содержит только CarInput. `remove(id)` выполняет DELETE. Ни одна из этих функций не требует JSON в успешном ответе: 204 No Content обрабатывается корректно.

### Точка входа: src/main.tsx

`QueryClient` хранит серверные данные и результаты загрузки. QueryClientProvider передаёт его компонентам. Для queries отключены повторные попытки и refetch при переключении окна; для mutations retry также отключён. StrictMode помогает выявлять ошибки жизненного цикла в разработке. Он не создаёт дополнительные POST/PUT/DELETE сам по себе.

### Компоненты: src/App.tsx

`Modal` использует dialog.showModal(), поэтому браузер удерживает фокус в диалоге и возвращает его при закрытии. onCancel перехватывает Escape: в обычном режиме отменяет, во время запроса не закрывает форму. Эффект закрывает dialog при размонтировании.

`CarEditor` хранит локальный draft и errors. `submit` предотвращает перезагрузку страницы, валидирует, ставит фокус на первое ошибочное поле или вызывает save. aria-invalid и aria-describedby связывают ошибку с полем. При серверной ошибке draft остаётся, поэтому не нужно вводить всё заново. busy отключает ввод и повторное сохранение. Редактирование и создание различаются только исходным car и наличием id.

`App` использует useQuery для списка, useMutation для записи/удаления. `refresh` инвалидирует кеш после успешной мутации. `openEditor` и `openDelete` сбрасывают старые ошибки и уведомления. Состояния query/sort/direction относятся к представлению, а не backend. `notice` сообщает подтверждённый успех мутации; отдельная ошибка загрузки показывает, если новый список получить не удалось. Старая таблица при таком отказе может оставаться в кеше — нажмите Refresh.

Состояния списка: первая загрузка → результат; результат без машин → The showroom is empty; фильтр без совпадений → No matching cars; отказ API → сообщение и Try again. Последняя успешная коллекция не очищается при отказе повторной загрузки. Создание доступно и в пустой коллекции.

### Стили: src/styles.css

Сетка формы содержит два столбца на широком экране, один ниже 700px. На телефоне каждой ячейке показывается подпись data-label. Табличные заголовки визуально скрываются, оставаясь в разметке. Диалог ограничен шириной и высотой viewport, содержимое прокручивается. Контролы имеют подписи, видимую рамку фокуса и минимальную высоту 44px. Внешние шрифты и изображения не требуются.

### Локальная проверка и упаковка

`mock-server.mjs` реализует HTTP GET/POST/PUT/DELETE и OPTIONS/CORS на 127.0.0.1:4174. Два примера в памяти и ссылки со старым тестовым host позволяют проверить, что клиент сохраняет выбранный адрес. Это маленький test double: без авторизации, persistence и полного набора производственных ограничений.

`check-live-browser.mjs` — отдельная проверка чтения живого API в Chromium. Для её запуска нужен Vite на порту 4176 (`npm run dev -- --port 4176 --strictPort`), затем в другом Terminal `node scripts/check-live-browser.mjs`. Скрипт запрещает remote методы кроме GET, проверяет список и поиск, записывает JSON и скриншот. Это дополнительный smoke-check исполнителя, а не изменение общего сервера.

`check-live.mjs` выполняет один GET, проверяет HAL-поля/ссылки и записывает только статус, время и количество, без копирования списка автомобилей. `CARSHOP_CHECK_BASE` позволяет сменить адрес проверки. Скрипт не отправляет mutation.

`prepare-manual.mjs` собирает руководство из этого вводного текста и полных исходников, чтобы листинги соответствовали версии. `package.mjs` копирует переносимый состав, исключает зависимости/сборку/.git/.env/результаты временных тестов и распакованные копии, пишет SHA-256 каждого файла и создаёт ZIP штатным Windows PowerShell. receipt.json с хешем ZIP хранится рядом с архивом. Упаковка ориентирована на рабочую Windows-среду; ученице на macOS этот скрипт не нужен.

## 6. Тесты и сборка

```sh
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Unit-тесты подменяют transport и проверяют фактические URL, методы, JSON-тело, 204, HAL-идентификацию, pagination, malformed/duplicate responses, ошибки HTTP/сети, числовую сортировку и валидацию. Это проверка клиентского контракта.

E2E использует Chromium и автоматически запускает mock 4174 и Vite 4175. В конфигурации используется полный путь текущего Node (process.execPath), чтобы внутренний запуск не зависел от разрешения имени node через PATH в папке с пробелами. Прогон сохраняет скриншоты в evidence и полный машинный отчёт; локальные маршруты ошибок моделируются внутри браузера. CRUD проходит через настоящий локальный HTTP test double. Если ваш mock уже работает на 4174, завершите его перед тестом. Тесты намеренно не переиспользуют существующий сервер, чтобы не попасть в чужие данные.

`npm run build` проверяет TypeScript и создаёт dist. `npm run preview` показывает сборку локально. dist не входит в исходный ZIP и воспроизводится командой сборки. `npm ci` нужен после распаковки, потому что node_modules не переносится между Windows и macOS.

## 7. Частые проблемы

| Симптом | Действие |
|---|---|
| npm: command not found | Установить Node, открыть новый Terminal, проверить node/npm версии |
| package.json не найден | Перейти в распакованную папку Car Shop, проверить pwd/ls |
| Порт 4174 занят | Завершить собственный mock перед e2e; не завершать чужие процессы |
| Cannot reach the API | Проверить выбранный base, сеть и запущенный mock; использовать Refresh |
| .env изменён, адрес прежний | Перезапустить Vite; проверить переменную текущего Terminal |
| Сохранение долго ждёт/тайм-аут | После восстановления связи обновить список, затем решать, повторять ли действие |
| Машина исчезла после Edit | Очистить поиск: изменённые поля могли перестать совпадать |
| Mock потерял изменения | Он хранит данные в памяти и сбрасывается при перезапуске |
| E2E не находит browser executable | Выполнить npx playwright install chromium |

## 8. Подготовка к объяснению решения

Умейте показать весь путь: кнопка → draft → validate → mutation → HTTP → invalidateQueries → свежий список. Объясните разницу Car и CarInput, назначение id и HAL-ссылки, почему 204 нельзя безусловно читать как JSON, почему числа сортируются иначе строк и почему сбой ответа после POST не означает, что сервер ничего не сохранил.

Проверенные результаты и ограничения описаны в VERIFICATION.md. Запуск на Windows и Chromium не является проверкой на MacBook ученицы. Полные листинги ниже позволяют разобрать и восстановить решение без обращения к этому чату.



## Полные авторские листинги

Листинги ниже взяты из файлов этой версии автоматически. Зависимости из node_modules и машинный package-lock.json не перепечатываются; lockfile находится в архиве и фиксирует установку. Изменили код — обновите руководство командой `node scripts/prepare-manual.mjs`.

### package.json

```json
{"name":"web-car-shop","version":"1.0.0","private":true,"type":"module","engines":{"node":">=22.12.0"},"scripts":{"dev":"vite --host 127.0.0.1","build":"tsc -b && vite build","typecheck":"tsc -b","preview":"vite preview --host 127.0.0.1","test":"vitest run","test:e2e":"playwright test","mock":"node scripts/mock-server.mjs","check:live":"node scripts/check-live.mjs","package":"node scripts/package.mjs"},"dependencies":{"@tanstack/react-query":"^5.90.0","react":"^19.2.0","react-dom":"^19.2.0"},"devDependencies":{"@playwright/test":"^1.56.0","@types/react":"^19.2.0","@types/react-dom":"^19.2.0","@vitejs/plugin-react":"^5.0.0","typescript":"~5.9.3","vite":"^7.1.0","vitest":"^5.0.4"}}
```

### .env.example

```text
VITE_API_BASE_URL=https://car-rest-service-carshop.2.rahtiapp.fi/
# On localhost, Vite dev/preview forwards same-origin /api/ requests here.
# For safe local practice instead: http://127.0.0.1:4174/
```

### .gitignore

```text
node_modules/
dist/
.env
.env.local
test-results/
playwright-report/
delivery/
verification-copy/

# Generated reports may include local machine paths
evidence/
*.tsbuildinfo
.env.*
!.env.example
```

### index.html

```html
<!doctype html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><meta name="theme-color" content="#123d33"/><link rel="icon" href="/favicon.svg" type="image/svg+xml"/><title>Car Shop — Inventory</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>
```

### public/favicon.svg

```text
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#123d33"/><text x="32" y="40" text-anchor="middle" fill="#e2e8c9" font-family="sans-serif" font-size="25" font-weight="bold">CS</text></svg>
```

### tsconfig.json

```json
{"compilerOptions":{"target":"ES2022","lib":["ES2022","DOM","DOM.Iterable"],"module":"ESNext","moduleResolution":"Bundler","jsx":"react-jsx","strict":true,"skipLibCheck":true,"noEmit":true,"types":["vite/client"]},"include":["src"]}
```

### vite.config.ts

```ts
import { defineConfig } from 'vitest/config';
import { loadEnv, type ProxyOptions } from 'vite';
import react from '@vitejs/plugin-react';
import { backendBase, proxyPath } from './src/api-config';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const target = backendBase(process.env.VITE_API_BASE_URL || env.VITE_API_BASE_URL);
  const proxy: Record<string, ProxyOptions> = {
    '^/api(?:/|\\?|$)': {
      target: new URL(target).origin,
      changeOrigin: true,
      proxyTimeout: 25000,
      timeout: 28000,
      rewrite: path => proxyPath(path, target),
      configure(instance) {
        // The original direct fetch did not send cross-origin cookies. Keep
        // local application cookies away from the shared course backend.
        instance.on('proxyReq', request => request.removeHeader('cookie'));
        instance.on('proxyRes', response => { delete response.headers['set-cookie']; });
        instance.on('error', (error, _request, response) => {
          if ('writeHead' in response && !response.headersSent && !response.writableEnded) {
            const reason = (error as NodeJS.ErrnoException).code || 'NETWORK_ERROR';
            response.writeHead(502, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
            response.end(JSON.stringify({ code: 'API_UNREACHABLE', reason }));
          }
        });
      },
    },
  };
  return { plugins: [react()], server: { proxy }, preview: { proxy }, test: { include: ['tests/unit/**/*.test.ts'] } };
});
```

### playwright.config.ts

```ts
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', fullyParallel: false, workers: 1,
  reporter: [['list'], ['json', { outputFile: 'evidence/e2e-results.json' }]],
  use: { baseURL: 'http://127.0.0.1:4175', browserName: 'chromium', trace: 'retain-on-failure' },
  webServer: [
    { command: `"${process.execPath}" scripts/mock-server.mjs`, url: 'http://127.0.0.1:4174/cars', reuseExistingServer: false },
    { command: `"${process.execPath}" node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4175 --strictPort`, url: 'http://127.0.0.1:4175', reuseExistingServer: false, env: { VITE_API_BASE_URL: 'http://127.0.0.1:4174/' } },
  ],
});
```

### src/cars.ts

```ts
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
```

### src/api-config.ts

```ts
export const DEFAULT_BASE = 'https://car-rest-service-carshop.2.rahtiapp.fi/';

export function backendBase(raw: string = DEFAULT_BASE): string {
  const url = new URL(raw.endsWith('/') ? raw : `${raw}/`);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error('API base must be an HTTP or HTTPS address without credentials, query or fragment.');
  }
  return url.href;
}

export function browserApiBase(backend: string, pageUrl?: string): string {
  if (pageUrl) {
    const page = new URL(pageUrl);
    if (['localhost', '127.0.0.1', '[::1]'].includes(page.hostname)) return new URL('/api/', page.origin).href;
  }
  return backendBase(backend);
}

export function proxyPath(path: string, backend: string): string {
  return new URL(backend).pathname.replace(/\/$/, '') + path.replace(/^\/api(?=\/|\?|$)/, '');
}
```

### src/api.ts

```ts
import { fields, type Car, type CarInput } from './cars';
import { DEFAULT_BASE, backendBase, browserApiBase } from './api-config';
export { DEFAULT_BASE };
export const BACKEND_BASE = backendBase(import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE);
export const API_BASE = browserApiBase(BACKEND_BASE, typeof location === 'undefined' ? undefined : location.href);
export const REQUEST_TIMEOUT_MS = 30000;
class ApiRequestError extends Error {}
export function createApi(base: string, transport: typeof fetch = fetch) {
  const root = new URL(backendBase(base));
  const endpoint = (id?: string) => new URL(`cars${id ? `/${encodeURIComponent(id)}` : ''}`, root).href;
  async function request(url: string, init?: RequestInit, json = false): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const warning = init?.method && init.method !== 'GET' ? ' A timed-out change may have reached the server: refresh before retrying.' : '';
    try {
      const response = await transport(url, { ...init, signal: controller.signal, headers: { Accept: 'application/hal+json, application/json', ...(init?.body ? { 'Content-Type': 'application/json' } : {}) } });
      if (!response.ok) {
        if (response.status === 502 && response.headers.get('content-type')?.includes('application/json')) {
          const detail = await response.json().catch(() => null) as { code?: string; reason?: string } | null;
          if (detail?.code === 'API_UNREACHABLE') throw new ApiRequestError(`Cannot reach the course API from the local server (${detail.reason || 'network error'}). Check internet access or VPN and try again.${warning}`);
        }
        throw new ApiRequestError(`Server returned ${response.status}. ${response.status === 404 ? 'The car may have been removed. Refresh the list.' : 'Please try again.'}`);
      }
      return json ? await response.json() : undefined;
    } catch (error) {
      if (error instanceof ApiRequestError) throw error;
      if (controller.signal.aborted) throw new Error(`The API did not respond within ${REQUEST_TIMEOUT_MS / 1000} seconds. Try again.${warning}`);
      if (error instanceof SyntaxError) throw new Error('The API returned invalid JSON. Check the API base URL.');
      throw new Error(`Cannot reach the API at ${root.origin}. Check the connection and API base URL.${warning}`);
    } finally {
      clearTimeout(timer);
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
        const data = await request(next, undefined, true) as { _embedded?: { cars?: unknown[] }; _links?: { next?: { href?: string } } } | null;
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
```

### src/main.tsx

```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './styles.css';
const client = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false }, mutations: { retry: false } } });
createRoot(document.getElementById('root')!).render(<React.StrictMode><QueryClientProvider client={client}><App /></QueryClientProvider></React.StrictMode>);
```

### src/App.tsx

```tsx
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, BACKEND_BASE } from './api';
import { draftOf, fields, labels, selectCars, validate, type Car, type CarInput, type Field } from './cars';

function Modal({ title, busy, close, children }: { title: string; busy: boolean; close: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current!; const opener = document.activeElement as HTMLElement | null; dialog.showModal(); return () => { dialog.close(); if (opener?.isConnected) opener.focus(); }; }, []);
  return <dialog ref={ref} aria-labelledby="dialog-title" onCancel={event => { event.preventDefault(); if (!busy) close(); }}>
    <h2 id="dialog-title">{title}</h2>{children}
  </dialog>;
}

function CarEditor({ car, busy, error, save, close }: { car?: Car; busy: boolean; error: string; save: (value: CarInput) => void; close: () => void }) {
  const [draft, setDraft] = useState(draftOf(car));
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = validate(draft); setErrors(result.errors);
    if (Object.keys(result.errors).length) { document.getElementById(`field-${Object.keys(result.errors)[0]}`)?.focus(); return; }
    save(result.value);
  };
  return <Modal title={car ? 'Edit car' : 'Add car'} busy={busy} close={close}>
    <p className="muted">All six fields are required. Prices use the backend's currency.</p>
    <form onSubmit={submit} noValidate aria-busy={busy}>
      <div className="form-grid">{fields.map(key => <div key={key}>
        <label htmlFor={`field-${key}`}>{labels[key]}</label>
        <input id={`field-${key}`} required maxLength={key === 'modelYear' || key === 'price' ? undefined : 100} type={key === 'modelYear' || key === 'price' ? 'number' : 'text'} step={key === 'modelYear' ? '1' : 'any'} value={draft[key]} disabled={busy} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `error-${key}` : undefined} onChange={event => setDraft({ ...draft, [key]: event.target.value })}/>
        {errors[key] && <p className="field-error" id={`error-${key}`}>{errors[key]}</p>}
      </div>)}</div>
      {error && <p role="alert" className="error">{error}</p>}
      <div className="dialog-actions"><button type="button" disabled={busy} onClick={close}>Cancel</button><button className="primary" disabled={busy} type="submit">{busy ? 'Saving…' : 'Save car'}</button></div>
    </form>
  </Modal>;
}

export default function App() {
  const client = useQueryClient();
  const list = useQuery({ queryKey: ['cars'], queryFn: () => api.list() });
  const [editor, setEditor] = useState<{ car?: Car } | null>(null);
  const [deleting, setDeleting] = useState<Car | null>(null);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Field>('brand');
  const [direction, setDirection] = useState<'asc' | 'desc'>('asc');
  const [notice, setNotice] = useState('');
  const refresh = () => client.invalidateQueries({ queryKey: ['cars'] });
  const saving = useMutation({ mutationFn: ({ value, id }: { value: CarInput; id?: string }) => api.save(value, id), onSuccess: async (_, input) => { setEditor(null); setNotice(input.id ? 'Car updated.' : 'Car added.'); await refresh(); } });
  const removing = useMutation({ mutationFn: (id: string) => api.remove(id), onSuccess: async () => { setDeleting(null); setNotice('Car deleted.'); await refresh(); } });
  const busy = saving.isPending || removing.isPending;
  const cars = selectCars(list.data || [], query, sort, direction);
  const openEditor = (car?: Car) => { saving.reset(); setNotice(''); setEditor({ car }); };
  const openDelete = (car: Car) => { removing.reset(); setNotice(''); setDeleting(car); };
  return <>
    <header><div className="header-inner"><span className="logo" aria-hidden="true">CS</span><div><p className="eyebrow">THE SHOWROOM</p><h1>Car Shop</h1></div><span className="header-tag">Inventory workspace</span></div></header>
    <main>
      <section className="heading"><div><p className="eyebrow">STOCK MANAGEMENT</p><h2>Your next drive starts here.</h2><p className="muted">Browse the collection. Keep every detail up to date.</p></div><button className="primary" disabled={busy} onClick={() => openEditor()}>+ Add car</button></section>
      <p className="environment">{BACKEND_BASE.startsWith('http://127.0.0.1') || BACKEND_BASE.startsWith('http://localhost') ? 'Local practice backend' : `${list.isSuccess ? 'Connected to' : 'Using'} shared course backend — saved changes affect its inventory.`}</p>
      <section className="inventory" aria-label="Car inventory">
        <div className="toolbar"><div className="search"><label htmlFor="search">Search cars</label><input id="search" type="search" placeholder="Brand, model, color, fuel, year or price" value={query} onChange={event => setQuery(event.target.value)}/></div><div><label htmlFor="sort">Sort by</label><select id="sort" value={sort} onChange={event => setSort(event.target.value as Field)}>{fields.map(key => <option key={key} value={key}>{labels[key]}</option>)}</select></div><button aria-label={`Sort ${direction === 'asc' ? 'descending' : 'ascending'}`} onClick={() => setDirection(direction === 'asc' ? 'desc' : 'asc')}>{direction === 'asc' ? '↑ Ascending' : '↓ Descending'}</button><button disabled={list.isFetching || busy} onClick={() => { setNotice(''); void list.refetch(); }}>Refresh</button></div>
        <div className="list-status" aria-live="polite">{list.isFetching ? 'Loading inventory…' : `${cars.length} of ${list.data?.length ?? 0} cars`}{notice && <span className="success">{notice}</span>}</div>
        {list.isError && <div className="error" role="alert"><strong>Inventory could not be refreshed.</strong><p>{list.error.message}</p><button disabled={list.isFetching} onClick={() => void list.refetch()}>Try again</button></div>}
        {list.data && !cars.length && <div className="empty"><h3>{list.data.length ? 'No matching cars' : 'The showroom is empty'}</h3><p>{list.data.length ? 'Try another search or clear the filter.' : 'Add the first car to begin.'}</p>{query && <button onClick={() => setQuery('')}>Clear search</button>}</div>}
        {!!cars.length && <div className="table-wrap"><table><caption className="sr-only">Cars in stock. Use the sort controls above to change order.</caption><thead><tr>{fields.map(key => <th scope="col" key={key} aria-sort={sort === key ? direction === 'asc' ? 'ascending' : 'descending' : 'none'}>{labels[key]}{sort === key ? direction === 'asc' ? ' ↑' : ' ↓' : ''}</th>)}<th scope="col">Actions</th></tr></thead><tbody>{cars.map(car => <tr key={car.id}>{fields.map(key => <td key={key} data-label={labels[key]}>{key === 'price' ? car.price.toLocaleString('en-GB', { maximumFractionDigits: 2 }) : car[key]}</td>)}<td data-label="Actions"><div className="row-actions"><button disabled={busy} aria-label={`Edit ${car.brand} ${car.model}`} onClick={() => openEditor(car)}>Edit</button><button className="danger-text" disabled={busy} aria-label={`Delete ${car.brand} ${car.model}`} onClick={() => openDelete(car)}>Delete</button></div></td></tr>)}</tbody></table></div>}
      </section>
      <footer>Car Shop / React + TypeScript<span>Search covers all six car fields.</span></footer>
    </main>
    {editor && <CarEditor car={editor.car} busy={saving.isPending} error={saving.error?.message || ''} close={() => setEditor(null)} save={value => saving.mutate({ value, id: editor.car?.id })}/>}
    {deleting && <Modal title="Delete car?" busy={removing.isPending} close={() => setDeleting(null)}><p>Remove <strong>{deleting.brand} {deleting.model}</strong> ({deleting.modelYear}, {deleting.color}) from inventory?</p><p className="muted">This action cannot be undone.</p>{removing.error && <p className="error" role="alert">{removing.error.message}</p>}<div className="dialog-actions"><button disabled={removing.isPending} onClick={() => setDeleting(null)}>Cancel</button><button className="danger" disabled={removing.isPending} onClick={() => removing.mutate(deleting.id)}>{removing.isPending ? 'Deleting…' : 'Delete car'}</button></div></Modal>}
  </>;
}
```

### src/styles.css

```css

:root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#172e28;background:#f5f6f2;font-synthesis:none}*{box-sizing:border-box}body{margin:0}button,input,select{font:inherit}button{cursor:pointer;border:1px solid #cad5ce;background:white;border-radius:8px;padding:10px 14px;min-height:44px;color:#25473d;font-weight:600}button:hover{background:#edf4ef}button:disabled{opacity:.55;cursor:wait}button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #bf8b32;outline-offset:3px}.primary{background:#174b3e;border-color:#174b3e;color:white}.primary:hover{background:#256351}.danger{background:#a12d37;color:white;border-color:#a12d37}.danger:hover{background:#7a1f27}.danger-text{color:#9b2933}header{background:#123d33;color:#fff}.header-inner{max-width:1220px;margin:auto;display:flex;align-items:center;gap:16px;padding:26px 32px}.logo{display:grid;place-items:center;width:48px;height:48px;border:1px solid #91b6a3;border-radius:12px;color:#e2e8c9;font-weight:800}h1{font-size:27px;margin:3px 0 0}h2{font-size:clamp(25px,3vw,35px);letter-spacing:-.8px;margin:10px 0}h3{margin-top:0}.eyebrow{font-size:11px;font-weight:700;letter-spacing:2px;margin:0}.header-tag{margin-left:auto;font-size:13px;color:#c8dece}.muted{color:#60736b;line-height:1.6}.heading{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:38px 0 16px}.heading>div>p:last-child{margin-bottom:0}main{max-width:1220px;padding:0 32px;margin:auto}.environment{font-size:12px;color:#637369;margin:12px 0 24px}.inventory{background:white;border:1px solid #dfe5de;border-radius:14px;overflow:hidden;box-shadow:0 8px 32px #183f2910}.toolbar{display:flex;align-items:flex-end;gap:14px;padding:24px;border-bottom:1px solid #e5ebe5}.search{flex:1}label{display:block;font-size:12px;font-weight:700;margin-bottom:8px}input,select{width:100%;padding:11px 12px;min-height:44px;border:1px solid #c9d4cd;border-radius:8px;background:#fff;color:#172e28}.search input{background:#f8faf7}.list-status{padding:16px 24px;font-size:12px;display:flex;gap:20px;min-height:48px}.success{color:#206444;font-weight:700}.table-wrap{overflow-x:auto}table{width:100%;border-collapse:collapse;text-align:left;font-size:14px}th{font-size:11px;text-transform:uppercase;letter-spacing:.7px;background:#f4f7f2;color:#546a5f}th,td{padding:15px 20px;border-bottom:1px solid #e9eee7}td:first-child{font-weight:700}tbody tr:hover{background:#fafbf8}.row-actions{display:flex;gap:8px}.row-actions button{padding:6px 12px;font-size:12px}footer{display:flex;justify-content:space-between;gap:15px;font-size:11px;color:#6c7e71;padding:26px 0}.empty{text-align:center;padding:54px 20px;color:#60736b}.error{color:#8c242b;background:#fff1f1;border:1px solid #ecc4c7;border-radius:8px;padding:14px;margin:16px 24px;overflow-wrap:anywhere}.field-error{color:#a02730;font-size:12px;margin:6px 0}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}dialog{width:min(560px,calc(100% - 32px));max-height:calc(100dvh - 32px);border:0;border-radius:16px;padding:28px;box-shadow:0 24px 80px #092f3544;color:#172e28}dialog::backdrop{background:#102b26aa}dialog h2{font-size:25px}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.dialog-actions{display:flex;justify-content:flex-end;gap:12px;margin-top:26px}dialog .error{margin:18px 0 0}[aria-invalid="true"]{border-color:#a02730}@media(max-width:700px){main{padding:0 16px}.header-inner{padding:20px 16px}.header-tag{display:none}.heading{align-items:flex-start;flex-direction:column;padding-top:26px}.toolbar{padding:18px;display:grid;grid-template-columns:1fr 1fr}.search{grid-column:1/-1}.toolbar>button:last-child{grid-column:1/-1}.list-status{padding:16px 18px;flex-wrap:wrap}thead{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}table,tbody{display:block}tr{display:block;padding:12px 18px;border-top:1px solid #e2e9df}td{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:8px 0;border:0;overflow-wrap:anywhere}td:before{content:attr(data-label);font-size:12px;font-weight:500;color:#60736b;min-width:55px}td:first-child{font-size:18px}footer{flex-direction:column}.error{margin:16px}.form-grid{grid-template-columns:1fr}dialog{padding:22px}.dialog-actions{position:sticky;bottom:-22px;background:white;padding:14px 0;margin-top:12px}}
```

### scripts/mock-server.mjs

```js
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
```

### scripts/check-live.mjs

```js
import { writeFile, mkdir } from 'node:fs/promises';
const base = process.env.CARSHOP_CHECK_BASE || 'https://car-rest-service-carshop.2.rahtiapp.fi/';
const url = new URL('cars', base.endsWith('/') ? base : `${base}/`);
const response = await fetch(url, { headers: { Accept: 'application/hal+json, application/json', Origin: 'http://127.0.0.1:5173' }, signal: AbortSignal.timeout(30000) });
if (!response.ok) throw new Error(`GET failed: ${response.status}`);
const data = await response.json();
if (!Array.isArray(data?._embedded?.cars)) throw new Error('Expected HAL cars array');
const valid = data._embedded.cars.every(car => ['brand','model','color','fuel'].every(k => typeof car[k] === 'string') && ['price','modelYear'].every(k => typeof car[k] === 'number') && /\/cars\/\d+\/?$/.test(new URL(car._links?.self?.href || car._links?.car?.href).pathname));
if (!valid) throw new Error('Unexpected car fields or ID links');
const evidence = { checkedAt: new Date().toISOString(), method: 'GET', url: url.href, status: response.status, count: data._embedded.cars.length, fieldsAndLinksValid: valid, allowOrigin: response.headers.get('access-control-allow-origin'), remoteMutationsTested: false };
await mkdir('evidence', { recursive: true });
await writeFile('evidence/live-read-only.json', JSON.stringify(evidence, null, 2));
console.log(JSON.stringify(evidence));
```

### scripts/check-live-browser.mjs

```js
import { chromium } from '@playwright/test';
import { writeFile, mkdir } from 'node:fs/promises';
const pageUrl = process.env.CARSHOP_CHECK_PAGE || 'http://127.0.0.1:4176/';
const origin = new URL(pageUrl).origin;
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const requests = [], errors = [], failures = [];
  page.on('request', request => {
    if (request.url().startsWith(`${origin}/api/`)) {
      requests.push({ method: request.method(), url: request.url() });
      if (request.method() !== 'GET') errors.push('Read-only check forbids mutations');
    }
  });
  page.on('requestfailed', request => failures.push({ url: request.url(), error: request.failure()?.errorText }));
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.route('https://car-rest-service-carshop.2.rahtiapp.fi/**', async route => {
    errors.push('The local app attempted a direct browser request to the remote API.');
    await route.abort('blockedbyclient');
  });
  await page.goto(pageUrl);
  await page.locator('tbody tr').first().waitFor({ timeout: 35000 });
  const count = await page.locator('tbody tr').count();
  await page.getByLabel('Search cars').fill('volvo');
  const filteredCount = await page.locator('tbody tr').count();
  if (!filteredCount || filteredCount > count || !requests.length || errors.length || failures.length) throw new Error(`Live UI failure: ${JSON.stringify({ count, filteredCount, errors, failures })}`);
  await mkdir('evidence', { recursive: true });
  await page.screenshot({ path: 'evidence/live-browser.png', fullPage: true });
  const evidence = { checkedAt: new Date().toISOString(), mode: 'read-only through same-origin local proxy', count, filteredCount, requests, errors, failures, directBrowserApiBlocked: true, remoteMutationsTested: false };
  await writeFile('evidence/live-browser.json', JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence));
} finally { await browser.close(); }
```

### scripts/package.mjs

```js
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
```

### scripts/prepare-manual.mjs

```js
import { readFile, writeFile } from 'node:fs/promises';
const intro = await readFile('docs/MANUAL-INTRO.md', 'utf8');
const files = ['package.json','.env.example','.gitignore','index.html','public/favicon.svg','tsconfig.json','vite.config.ts','playwright.config.ts','src/cars.ts','src/api-config.ts','src/api.ts','src/main.tsx','src/App.tsx','src/styles.css','scripts/mock-server.mjs','scripts/check-live.mjs','scripts/check-live-browser.mjs','scripts/package.mjs','scripts/prepare-manual.mjs','tests/unit/api.test.ts','tests/unit/connection.test.ts','tests/unit/cars.test.ts','tests/e2e/inventory.spec.ts'];
let result = intro + '\n\n## Полные авторские листинги\n\nЛистинги ниже взяты из файлов этой версии автоматически. Зависимости из node_modules и машинный package-lock.json не перепечатываются; lockfile находится в архиве и фиксирует установку. Изменили код — обновите руководство командой `node scripts/prepare-manual.mjs`.\n';
for (const file of files) {
  const language = file.endsWith('.tsx') ? 'tsx' : file.endsWith('.ts') ? 'ts' : file.endsWith('.mjs') ? 'js' : file.endsWith('.json') ? 'json' : file.endsWith('.css') ? 'css' : file.endsWith('.html') ? 'html' : 'text';
  result += `\n### ${file}\n\n\`\`\`${language}\n${(await readFile(file, 'utf8')).trimEnd()}\n\`\`\`\n`;
}
await writeFile('docs/MANUAL.md', result);
console.log(`Manual generated: ${files.length} complete listings`);
```

### tests/unit/api.test.ts

```ts
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
```

### tests/unit/connection.test.ts

```ts
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
```

### tests/unit/cars.test.ts

```ts
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
```

### tests/e2e/inventory.spec.ts

```ts
import { test, expect, type Page } from '@playwright/test';
const local = 'http://127.0.0.1:4175/api/cars';
async function fill(page: Page) {
  for (const [name,value] of Object.entries({Brand:'Practice',Model:'Roadster',Color:'Blue',Fuel:'Electric',Year:'2024',Price:'12500.5'})) await page.getByRole('dialog').getByLabel(name, {exact:true}).fill(value);
}
test('CRUD, validation, numeric sort, search, cancel and keyboard focus on local HTTP backend', async ({page}) => {
  const remote: string[] = [], errors: string[] = [];
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:') && !request.url().startsWith('data:')) remote.push(request.url()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/'); await expect(page.getByText('2 of 2 cars')).toBeVisible();
  await page.getByLabel('Sort by').selectOption('price');
  await expect(page.locator('tbody tr').first()).toContainText('Nissan');
  await page.getByRole('button',{name:'Sort descending'}).click();
  await expect(page.locator('tbody tr').first()).toContainText('Volvo');
  await page.screenshot({path:'evidence/desktop.png',fullPage:true});
  await page.getByRole('button',{name:'+ Add car',exact:true}).click();
  await page.getByRole('button',{name:'Save car',exact:true}).click();
  await expect(page.getByText('Brand is required.')).toBeVisible();
  await fill(page); await page.getByRole('button',{name:'Save car',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0); await expect(page.getByText('Car added.',{exact:true})).toBeVisible();
  await page.getByLabel('Search cars').fill('practice'); await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.getByRole('button',{name:'Edit Practice Roadster',exact:true}).click();
  await expect(page.getByRole('dialog').getByLabel('Price',{exact:true})).toHaveValue('12500.5');
  await page.getByRole('dialog').getByLabel('Model',{exact:true}).fill('Tourer');
  await page.getByRole('button',{name:'Save car',exact:true}).click();
  await expect(page.getByRole('button',{name:'Edit Practice Tourer',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Delete Practice Tourer',exact:true}).click();
  await page.getByRole('button',{name:'Cancel',exact:true}).click(); await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.getByRole('button',{name:'Delete Practice Tourer',exact:true}).click();
  await page.getByRole('button',{name:'Delete car',exact:true}).click();
  await expect(page.getByText('No matching cars',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Clear search',exact:true}).click();
  await page.getByRole('button',{name:'+ Add car',exact:true}).click(); await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0); await expect(page.getByRole('button',{name:'+ Add car',exact:true})).toBeFocused();
  expect(remote).toEqual([]); expect(errors).toEqual([]);
});
test('mobile cards and dialog fit viewport; keyboard can cancel', async ({page}) => {
  await page.setViewportSize({width:390,height:844}); await page.goto('/');
  await expect(page.getByText('2 of 2 cars')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({path:'evidence/mobile.png',fullPage:true});
  await page.getByRole('button',{name:'+ Add car',exact:true}).click(); await fill(page);
  await page.screenshot({path:'evidence/mobile-form.png',fullPage:true});
  expect(await page.getByRole('dialog').evaluate(el => el.getBoundingClientRect().width <= innerWidth)).toBe(true);
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
});
test('loading, empty list and read error with recovery', async ({page}) => {
  let mode = 'loading';
  await page.route(local, async route => {
    if (mode === 'loading') await new Promise(resolve => setTimeout(resolve,500));
    if (mode === 'error') await route.fulfill({status:500,body:'{}'});
    else await route.fulfill({contentType:'application/json',body:JSON.stringify({_embedded:{cars:[]}})});
  });
  await page.goto('/'); await expect(page.getByText('Loading inventory…')).toBeVisible();
  await expect(page.getByText('The showroom is empty',{exact:true})).toBeVisible();
  mode='error'; await page.getByRole('button',{name:'Refresh',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('500');
  mode='empty'; await page.getByRole('button',{name:'Try again',exact:true}).click(); await expect(page.getByRole('alert')).toHaveCount(0);
});
test('failed POST keeps form values; failed DELETE keeps car; busy prevents duplicate submit', async ({page}) => {
  await page.goto('/'); await expect(page.getByText('2 of 2 cars')).toBeVisible();
  let posts=0;
  await page.route(`${local}**`, async route => {
    if (route.request().method()==='POST') { posts++; await new Promise(resolve=>setTimeout(resolve,500)); await route.fulfill({status:500,body:'{}'}); }
    else if (route.request().method()==='DELETE') await route.fulfill({status:404,body:'{}'});
    else await route.continue();
  });
  await page.getByRole('button',{name:'+ Add car',exact:true}).click(); await fill(page);
  await page.getByRole('button',{name:'Save car',exact:true}).click(); await expect(page.getByRole('button',{name:'Saving…',exact:true})).toBeDisabled();
  await expect(page.getByRole('alert')).toContainText('500'); expect(posts).toBe(1);
  await expect(page.getByRole('dialog').getByLabel('Brand',{exact:true})).toHaveValue('Practice');
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  await page.getByRole('button',{name:'Delete Volvo XC60',exact:true}).click(); await page.getByRole('button',{name:'Delete car',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('404'); await expect(page.locator('tbody tr')).toHaveCount(2);
});
test('failed PUT preserves edit form and success followed by read failure is distinct', async ({page}) => {
  await page.goto('/'); await expect(page.getByText('2 of 2 cars')).toBeVisible();
  await page.route(`${local}/*`, async route => {
    if (route.request().method() === 'PUT') await route.fulfill({status:500,body:'{}'});
    else await route.continue();
  });
  await page.getByRole('button',{name:'Edit Volvo XC60',exact:true}).click();
  await page.getByRole('dialog').getByLabel('Model',{exact:true}).fill('Changed');
  await page.getByRole('button',{name:'Save car',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('500');
  await expect(page.getByRole('dialog').getByLabel('Model',{exact:true})).toHaveValue('Changed');
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  await page.unroute(`${local}/*`);
  let saved = false;
  await page.route(local, async route => {
    if (route.request().method() === 'POST') { saved=true; await route.fulfill({status:201,body:'{}'}); }
    else if (saved) await route.fulfill({status:500,body:'{}'});
    else await route.continue();
  });
  await page.getByRole('button',{name:'+ Add car',exact:true}).click(); await fill(page);
  await page.getByRole('button',{name:'Save car',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('Car added.',{exact:true})).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('Inventory could not be refreshed.');
});
```

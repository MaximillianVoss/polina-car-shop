# Car Shop — пошаговая инструкция и полное решение

## 1. Что мы создаём

Front end магазина автомобилей подключается к готовому REST API. Приложение показывает шесть полей машины, позволяет Add/Edit/Delete, ищет и сортирует записи. На большом экране показана таблица; на телефоне та же таблица визуально превращается в карточки. Для добавления и редактирования используется одна форма в нативном диалоге. Удаление требует отдельного подтверждения.

Маршрут: установить Node → открыть проект → установить зависимости → запустить интерфейс с автоматическим локальным резервом (либо отдельный HTTP mock для упражнений) → проверить действия → изучить типы/API/React → подключить общий backend только для разрешённой работы → собрать проект. Условие находится в ASSIGNMENT.md без решения; PRACTICE.md содержит самостоятельные задания, SOLUTIONS.md — отдельные ответы.

## 2. Запуск на macOS с нуля

1. Установите Node.js 24 LTS с официального сайта https://nodejs.org/. Допустимый минимум проекта — 22.12. Откройте Terminal и выполните `node --version` и `npm --version`. Если Terminal был открыт до установки, закройте его и откройте снова.
2. Распакуйте «Car Shop — проект.zip». Внутри будет папка «Car Shop». Сохраните её в удобном локальном каталоге.
3. Введите в Terminal `cd ` с пробелом, перетащите папку «Car Shop» из Finder и нажмите Enter. Проверьте `pwd` и `ls`: здесь должен лежать package.json. Путь с пробелами также можно писать в кавычках: `cd "$HOME/Downloads/Car Shop"`.
4. Выполните `npm ci`. Эта команда использует package-lock.json, а не выбирает произвольные версии. Глобально устанавливать React или Vite не требуется.
Для обычного запуска достаточно `bash ./build-and-run.sh` или `npm run dev`; при недоступном API локальный mock в памяти вкладки включится сам. Ниже описан дополнительный отдельный HTTP mock для управляемых упражнений.

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

`request` ставит Accept, а при JSON-теле — Content-Type. AbortController и таймер ограничивают ожидание: список в приложении — 8 секунд, изменения — 30 секунд, включая чтение JSON; поддержка AbortSignal.timeout не требуется. Проверка response.ok превращает HTTP-ошибку в исключение. Тайм-аут, неверный JSON и ошибка подключения имеют разные сообщения. Запросы изменения не повторяются автоматически: при потере ответа данные могли уже измениться на сервере.

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


## Автоматический локальный режим — версия 1.1

При сетевом отказе, тайм-ауте загрузки списка (8 секунд) или HTTP 5xx приложение автоматически создаёт две тестовые машины в памяти вкладки. Запускать npm run mock дополнительно не нужно. Вверху появляется жёлтое сообщение LOCAL DEMO. Поиск, сортировка и Add/Edit/Delete работают в этом режиме полностью локально.

`src/fallback.ts`: `createLocalMock` создаёт отдельный набор Car с id demo-1/demo-2. `list` отдаёт копии объектов, `save` создаёт или заменяет запись, `remove` удаляет только локальный id. `indexOf` отклоняет id настоящего API, чтобы после переключения нельзя было случайно применить старую команду к чужой записи.

`createAutoFallbackApi` оборачивает настоящий API. Пока чтение успешно, все вызовы идут туда. `list` переключает режим только при ApiUnavailableError; 4xx, неверный JSON и нарушения схемы остаются явными ошибками. После переключения режим закрепляется на время жизни страницы. Refresh обновляет локальный список. Для новой попытки подключения к API перезагрузите страницу: демо-изменения сбросятся. Новая вкладка имеет отдельный набор данных; локальные изменения никогда не отправляются во внешний API.

`save` и `remove` используют уже выбранный режим. Ошибка remote mutation не включает резерв и не повторяет действие автоматически. Сервер мог сохранить изменение до обрыва ответа; пользователь сначала должен обновить список. Начальная кнопка Add car заблокирована, пока первая загрузка не определит источник данных.

Резерв реализован как встроенный mock в браузере, поэтому отдельный Node-процесс и дополнительный порт не требуются. Отдельный scripts/mock-server.mjs сохраняется для обучения HTTP и тестирования контракта. При работающем API приложение использует настоящий backend задания.

Тесты fallback.test.ts проверяют выбор режима, локальный CRUD, отсутствие remote mutations из локального режима, изоляцию вкладок и отказ для посторонних id. Дополнительные браузерные сценарии проверяют HTTP 503, обрыв сети, тайм-аут, сохранение/изменение/удаление в резерве и возврат к доступному API после перезагрузки страницы. Архив имеет собственный launcher build-and-run.sh: он устанавливает зависимости при отсутствии node_modules, собирает проект и запускает Vite preview с тем же proxy, что и dev.

## Версия в футере — выпуск 1.1.1

App импортирует поле version из package.json и выводит его в footer рядом с названием. resolveJsonModule в tsconfig разрешает этот импорт TypeScript. Номер входит в собранное приложение; старая вкладка показывает номер своей сборки. После обновления остановите прежний запуск и откройте адрес нового процесса. Для нового выпуска изменяют версию package.json и lockfile, затем пересобирают проект. Текущий ожидаемый номер: v1.1.1.



## Полные авторские листинги

Листинги ниже взяты из файлов этой версии автоматически. Зависимости из node_modules и машинный package-lock.json не перепечатываются; lockfile находится в архиве и фиксирует установку. Изменили код — обновите руководство командой `node scripts/prepare-manual.mjs`.

### package.json

```json
{
  "name": "web-car-shop",
  "version": "1.1.1",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=22.12.0"
  },
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc -b && vite build",
    "typecheck": "tsc -b",
    "preview": "vite preview --host 127.0.0.1",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "mock": "node scripts/mock-server.mjs",
    "check:live": "node scripts/check-live.mjs",
    "package": "node scripts/package.mjs"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.90.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.56.0",
    "@types/react": "^19.2.0",
    "@types/react-dom": "^19.2.0",
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "~5.9.3",
    "vite": "^7.1.0",
    "vitest": "^5.0.4"
  }
}
```

### build-and-run.sh

```text
#!/usr/bin/env bash


# Находит вложенные Vite, Expo и Spring Boot проекты, проверяет и собирает
# их, а затем запускает выбранные приложения на свободных портах.
# Совместим со стандартным Bash 3.2 в macOS.

set -eo pipefail

launcher_version="2026-10-14.4"

print_usage() {
  cat <<'USAGE'
Использование:
  bash build-and-run.sh
  bash build-and-run.sh --list
  bash build-and-run.sh --all [--build-only] [--no-open]
  bash build-and-run.sh --select "1,5 9" [--build-only] [--no-open]
  bash build-and-run.sh --project "путь/к/проекту" [--project "ещё/один"]

Параметры:
  --list             Только показать найденные проекты.
  --all              Выбрать все найденные проекты.
  --select СПИСОК    Выбрать номера через пробел и/или запятую.
  --project ПУТЬ     Выбрать проект по пути; параметр можно повторять.
  --build-only       Проверить и собрать, но не запускать серверы.
  --no-open          Не открывать браузер/эмулятор (только сервер).
  --expo-platform P  Режим Expo: ios, android или web; иначе спросить.
  --install-web-deps Разрешить установку недостающих web-зависимостей Expo.
  --smoke-test       Проверить HTTP-готовность и сразу остановить серверы.
  --ready-timeout N  Предел ожидания HTTP-готовности (секунды; по умолчанию 90).
  --spring-ready-path ПУТЬ  Явный публичный endpoint Spring (например /login).
  --skip-tests       Не запускать автоматические тесты.
  --strict-checks    Останавливать запуск при замечаниях Expo Doctor (для сдачи).
  --root ПАПКА       Искать проекты в другой корневой папке.
  --dry-run          Показать план команд без их выполнения.
  --platform-menu    Показать общее меню платформ и выйти.
  -h, --help         Показать эту справку.

Без --all, --select и --project скрипт предложит интерактивный выбор.
Вложенные папки и проекты без номера в названии поддерживаются.
Один каталог приложения показывается один раз. Этапы выбирайте через --project stages/ИМЯ.
Для остановки всех запущенных им серверов нажмите Control + C.
USAGE
}

die() {
  echo "Ошибка: $*" >&2
  exit 1
}

warn() {
  echo "Предупреждение: $*" >&2
}

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
root_dir="$script_dir"
list_only=0
select_all=0
selection_spec=""
build_only=0
no_open=0
skip_tests=0
strict_checks=0
dry_run=0
smoke_test=0
ready_timeout=90
spring_ready_path=""
project_requests=()
expo_platform=""
install_web_deps=0
project_expo_platforms=()
platform_menu_only=0

print_expo_menu() {
  echo "Где запустить мобильный проект?"
  echo "1) iOS Simulator (Mac + Xcode)"
  echo "2) Android Emulator (Android Studio / SDK)"
  echo "3) Web (браузер, НЕ эмулятор телефона)"
  echo "0) Отмена"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --strict-checks) strict_checks=1; shift ;;
    --platform-menu) platform_menu_only=1; shift ;;
    --smoke-test) smoke_test=1; shift ;;
    --ready-timeout)
      [[ $# -ge 2 && "$2" =~ ^[1-9][0-9]*$ && ${#2} -le 4 ]] || die "--ready-timeout: целое число 1–9999."
      ready_timeout="$2"; shift 2 ;;
    --spring-ready-path)
      [[ $# -ge 2 && "$2" == /* && "$2" != //* && "$2" != *$'\n'* ]] || die "публичный endpoint должен начинаться с /."
      spring_ready_path="$2"; shift 2 ;;
    --expo-platform)
      [[ $# -ge 2 ]] || die "после --expo-platform нужно ios, android или web."
      case "$2" in ios|android|web) expo_platform="$2" ;; *) die "режим Expo: ios, android или web." ;; esac
      shift 2
      ;;
    --install-web-deps)
      install_web_deps=1
      shift
      ;;
    --list)
      list_only=1
      shift
      ;;
    --all)
      select_all=1
      shift
      ;;
    --select)
      [[ $# -ge 2 ]] || die "после --select нужен список номеров."
      selection_spec="$2"
      shift 2
      ;;
    --project)
      [[ $# -ge 2 ]] || die "после --project нужен путь."
      project_requests+=("$2")
      shift 2
      ;;
    --build-only)
      build_only=1
      shift
      ;;
    --no-open)
      no_open=1
      shift
      ;;
    --skip-tests)
      skip_tests=1
      shift
      ;;
    --root)
      [[ $# -ge 2 ]] || die "после --root нужен путь к папке."
      root_dir="$2"
      shift 2
      ;;
    --dry-run)
      dry_run=1
      shift
      ;;
    -h|--help)
      print_usage
      exit 0
      ;;
    *)
      die "неизвестный параметр '$1'. Запустите с --help."
      ;;
  esac
done

if [[ $platform_menu_only -eq 1 ]]; then print_expo_menu; exit 0; fi

selection_modes=0
[[ $select_all -eq 1 ]] && selection_modes=$((selection_modes + 1))
[[ -n "$selection_spec" ]] && selection_modes=$((selection_modes + 1))
[[ ${#project_requests[@]} -gt 0 ]] && selection_modes=$((selection_modes + 1))
[[ $selection_modes -le 1 ]] || die "используйте только один способ выбора: --all, --select или --project."

[[ -d "$root_dir" ]] || die "корневая папка не существует: $root_dir"
root_dir="$(cd -- "$root_dir" && pwd)"

package_type() {
  local package_file="$1"

  # Vite имеет приоритет: в учебный web-репозиторий может случайно попасть
  # зависимость expo, хотя его scripts dev/build/preview остаются Vite-командами.
  if grep -Eq '"vite"[[:space:]]*:' "$package_file"; then
    echo "vite"
  elif grep -Eq '"expo"[[:space:]]*:' "$package_file"; then
    echo "expo"
  else
    echo "npm"
  fi
}

human_type() {
  case "$1" in
    expo) echo "Expo" ;;
    vite) echo "Vite" ;;
    spring) echo "Spring Boot" ;;
    npm) echo "npm (неизвестный тип)" ;;
    maven) echo "Maven (не Spring Boot)" ;;
    *) echo "$1" ;;
  esac
}

project_dirs=()
project_types=()
project_labels=()
project_markers=()
project_task_numbers=()

task_number_for_project() {
  local label="$1"
  local type="$2"
  local number

  local task_pattern="/0*([0-9]+)[[:space:]_-]"
  if [[ "/$label" =~ $task_pattern ]]; then
    number=$((10#${BASH_REMATCH[1]}))
    echo "$number"
  elif [[ "$type" == "spring" && "$label" == "projects/spring-boot/bookstore" ]]; then
    # В комплекте общий Spring-проект хранится как projects/spring-boot/bookstore.
    echo "3"
  else
    echo "0"
  fi
}

is_supported_type() {
  case "$1" in
    vite|expo|spring) return 0 ;;
    *) return 1 ;;
  esac
}

has_supported_ancestor() {
  local project_dir="$1"
  local ancestor
  local ancestor_type

  ancestor="$(dirname -- "$project_dir")"
  while [[ "$ancestor" == "$root_dir" || "$ancestor" == "$root_dir/"* ]]; do
    ancestor_type=""
    if [[ -f "$ancestor/package.json" ]]; then
      ancestor_type="$(package_type "$ancestor/package.json")"
    elif [[ -f "$ancestor/pom.xml" ]] && grep -Eq 'spring-boot' "$ancestor/pom.xml"; then
      ancestor_type="spring"
    fi

    if [[ -n "$ancestor_type" ]] && is_supported_type "$ancestor_type"; then
      return 0
    fi

    [[ "$ancestor" != "$root_dir" ]] || break
    ancestor="$(dirname -- "$ancestor")"
  done
  return 1
}

while IFS= read -r marker; do
  [[ -n "$marker" ]] || continue

  project_dir="$(dirname -- "$marker")"
  relative_path="${project_dir#"$root_dir"/}"
  if [[ "$relative_path" == "$project_dir" ]]; then
    relative_path="$(basename -- "$project_dir")"
  fi

  if [[ "$(basename -- "$marker")" == "package.json" ]]; then
    detected_type="$(package_type "$marker")"
  elif grep -Eq 'spring-boot' "$marker"; then
    detected_type="spring"
  else
    detected_type="maven"
  fi

  # Не показываем неподдерживаемый npm/Maven-проект как запускаемое приложение.
  is_supported_type "$detected_type" || continue

  # Если проект уже имеет запускаемый корень, вложенные package.json/pom.xml
  # считаются его внутренними частями, а не отдельными приложениями.
  has_supported_ancestor "$project_dir" && continue

  task_number="$(task_number_for_project "$relative_path" "$detected_type")"

  project_dirs+=("$project_dir")
  project_types+=("$detected_type")
  project_labels+=("$relative_path")
  project_markers+=("$marker")
  project_task_numbers+=("$task_number")
done < <(
  find "$root_dir" \
    \( -type d \( \
      -name .git -o \
      -name node_modules -o \
      -name .expo -o \
      -name dist -o \
      -name build -o \
      -name target -o \
      -name coverage \
    \) -prune \) -o \
    \( -type f \( -name package.json -o -name pom.xml \) -print \) \
    | LC_ALL=C sort
)

[[ ${#project_dirs[@]} -gt 0 ]] || die "в '$root_dir' не найдено ни одного package.json или pom.xml."

# Один физический каталог — одно приложение: этапы не дублируются.

project_sort_key() {
  local task_number="$1"
  local label="$2"
  if ((task_number <= 0)); then
    task_number=99999999
  fi
  printf '%08d|%s' "$task_number" "$label"
}

# Сортируем по логическому номеру работы: 01-09.
for ((left = 0; left < ${#project_dirs[@]}; left++)); do
  for ((right = left + 1; right < ${#project_dirs[@]}; right++)); do
    left_key="$(project_sort_key "${project_task_numbers[$left]}" "${project_labels[$left]}")"
    right_key="$(project_sort_key "${project_task_numbers[$right]}" "${project_labels[$right]}")"
    if [[ "$left_key" > "$right_key" ]]; then
      temporary="${project_dirs[$left]}"
      project_dirs[$left]="${project_dirs[$right]}"
      project_dirs[$right]="$temporary"

      temporary="${project_types[$left]}"
      project_types[$left]="${project_types[$right]}"
      project_types[$right]="$temporary"

      temporary="${project_labels[$left]}"
      project_labels[$left]="${project_labels[$right]}"
      project_labels[$right]="$temporary"

      temporary="${project_markers[$left]}"
      project_markers[$left]="${project_markers[$right]}"
      project_markers[$right]="$temporary"

      temporary="${project_task_numbers[$left]}"
      project_task_numbers[$left]="${project_task_numbers[$right]}"
      project_task_numbers[$right]="$temporary"
    fi
  done
done

print_projects() {
  local index

  echo "Найденные проекты:"
  echo
  for ((index = 0; index < ${#project_dirs[@]}; index++)); do
    printf '%2d) %-24s %s\n' \
      "$((index + 1))" \
      "[$(human_type "${project_types[$index]}")]" \
      "${project_labels[$index]}"
  done
}

if [[ $list_only -eq 1 ]]; then
  print_projects
  exit 0
fi

selected_indices=()

add_selected_index() {
  local candidate="$1"
  local existing

  for existing in "${selected_indices[@]}"; do
    [[ "$existing" != "$candidate" ]] || return 0
  done
  selected_indices+=("$candidate")
}

select_from_numbers() {
  local input="${1//,/ }"
  local token
  local number

  for token in $input; do
    if [[ "$token" == "all" || "$token" == "все" ]]; then
      for ((number = 0; number < ${#project_dirs[@]}; number++)); do
        add_selected_index "$number"
      done
    elif [[ "$token" =~ ^[0-9]+$ ]]; then
      number=$((10#$token))
      if ((number < 1 || number > ${#project_dirs[@]})); then
        die "номера проекта $token нет; допустимы номера от 1 до ${#project_dirs[@]}."
      fi
      add_selected_index "$((number - 1))"
    else
      die "'$token' не является номером проекта."
    fi
  done
}

select_from_path() {
  local requested="$1"
  local requested_dir
  local index
  local match=-1
  local match_count=0
  local explicit_marker
  local explicit_type

  if [[ -d "$requested" ]]; then
    requested_dir="$(cd -- "$requested" && pwd)"
  elif [[ -d "$root_dir/$requested" ]]; then
    requested_dir="$(cd -- "$root_dir/$requested" && pwd)"
  else
    die "папка проекта не существует: $requested"
  fi

  for ((index = 0; index < ${#project_dirs[@]}; index++)); do
    if [[ "${project_dirs[$index]}" == "$requested_dir" || "${project_dirs[$index]}" == "$requested_dir/"* ]]; then
      match="$index"
      match_count=$((match_count + 1))
    fi
  done

  # Явно выбранный вложенный stage разрешён, даже если primary уже найден.
  if [[ $match_count -eq 0 && ( "$requested_dir" == "$root_dir" || "$requested_dir" == "$root_dir/"* ) ]]; then
    explicit_marker=""
    explicit_type=""
    if [[ -f "$requested_dir/package.json" ]]; then
      explicit_marker="$requested_dir/package.json"
      explicit_type="$(package_type "$explicit_marker")"
    elif [[ -f "$requested_dir/pom.xml" ]] && grep -Eq 'spring-boot' "$requested_dir/pom.xml"; then
      explicit_marker="$requested_dir/pom.xml"
      explicit_type="spring"
    fi
    if is_supported_type "$explicit_type"; then
      match="${#project_dirs[@]}"
      project_dirs+=("$requested_dir")
      project_types+=("$explicit_type")
      project_labels+=("${requested_dir#"$root_dir"/}")
      project_markers+=("$explicit_marker")
      project_task_numbers+=("0")
      match_count=1
    fi
  fi

  if [[ $match_count -eq 0 ]]; then
    die "в '$requested' нет поддерживаемого файла проекта."
  elif [[ $match_count -gt 1 ]]; then
    die "в '$requested' найдено несколько проектов; укажите точнее или выберите их по номерам."
  fi

  add_selected_index "$match"
}

if [[ $select_all -eq 1 ]]; then
  for ((index = 0; index < ${#project_dirs[@]}; index++)); do
    add_selected_index "$index"
  done
elif [[ -n "$selection_spec" ]]; then
  select_from_numbers "$selection_spec"
elif [[ ${#project_requests[@]} -gt 0 ]]; then
  for requested_project in "${project_requests[@]}"; do
    select_from_path "$requested_project"
  done
else
  [[ -t 0 ]] || die "нет интерактивного ввода; используйте --all, --select или --project."
  print_projects
  echo
  echo "Введите номера через пробел/запятую, 'all' для всех или 0 для отмены."
  read -r -p "Ваш выбор: " selection_spec
  if [[ "$selection_spec" == "0" ]]; then
    echo "Запуск отменён."
    exit 0
  fi
  select_from_numbers "$selection_spec"
fi

[[ ${#selected_indices[@]} -gt 0 ]] || die "не выбран ни один проект."

echo "Выбрано работ: ${#selected_indices[@]}"
echo "Версия запуска: $launcher_version; автоматическое восстановление зависимостей включено."
for selected_index in "${selected_indices[@]}"; do
  echo "  - ${project_labels[$selected_index]} ($(human_type "${project_types[$selected_index]}"))"
done

# Для каждого Expo-проекта выбираем платформу ДО сборки и запуска.
for selected_index in "${selected_indices[@]}"; do
  [[ "${project_types[$selected_index]}" == "expo" ]] || continue
  selected_platform="$expo_platform"
  if [[ -z "$selected_platform" ]]; then
    if [[ $dry_run -eq 1 ]]; then
      selected_platform="<ios|android|web>"
    elif [[ $build_only -eq 1 ]]; then
      selected_platform="android"
    elif [[ -t 0 ]]; then
      echo
      print_expo_menu
      while true; do
        read -r -p "Режим: " platform_choice || die "ввод прерван."
        case "$platform_choice" in
          1|ios) selected_platform=ios; break ;;
          2|android) selected_platform=android; break ;;
          3|web) selected_platform=web; break ;;
          0) echo "Запуск отменён."; exit 0 ;;
          *) echo "Введите 1, 2, 3 или 0." ;;
        esac
      done
    else
      die "для Expo укажите --expo-platform ios, android или web."
    fi
  fi
  project_expo_platforms[$selected_index]="$selected_platform"
done

print_dry_run_plan() {
  local index="$1"
  local type="${project_types[$index]}"

  echo
  echo "План: ${project_labels[$index]}"
  case "$type" in
    vite)
      echo "  зависимости: npm ci --engine-strict (или npm install --engine-strict без lock)"
      echo "  проверка:     typecheck при наличии; test:run или CI=1 npm test"
      echo "  сборка:       npm run build"
      echo "  запуск:       npm exec -- vite preview --host 127.0.0.1 --port <свободный> --strictPort"
      ;;
    expo)
      echo "  зависимости: npm ci --engine-strict (или npm install --engine-strict без lock)"
      echo "  проверка:     typecheck при наличии; test:run или CI=1 npm test; Expo Doctor"
      echo "  сборка:       expo export --platform ${project_expo_platforms[$index]} --output-dir dist"
      echo "  запуск:       expo start --${project_expo_platforms[$index]} --localhost --port <свободный>"
      echo "  используется локальный Expo CLI; --no-open отключает открытие среды."
      ;;
    spring)
      echo "  сборка:       bash ./mvnw clean verify"
      echo "  запуск:       java -jar target/<приложение>.jar --server.port=<свободный>"
      ;;
    *)
      echo "  ошибка: тип проекта не поддерживается"
      ;;
  esac
}

if [[ $dry_run -eq 1 ]]; then
  for selected_index in "${selected_indices[@]}"; do
    print_dry_run_plan "$selected_index"
  done
  if [[ $build_only -eq 1 ]]; then
    echo
    echo "Режим --build-only: команды запуска были бы пропущены."
  fi
  exit 0
fi

need_node=0
need_java=0
for selected_index in "${selected_indices[@]}"; do
  case "${project_types[$selected_index]}" in
    vite|expo|npm) need_node=1 ;;
    spring|maven) need_java=1 ;;
  esac
done

if [[ $need_node -eq 1 ]] && { ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; }; then
  export NVM_DIR="${NVM_DIR:-${HOME:-}/.nvm}"
  if [[ -s "$NVM_DIR/nvm.sh" ]]; then
    # shellcheck source=/dev/null
    . "$NVM_DIR/nvm.sh"
  fi
fi

# Не включаем `set -u`: стандартный macOS Bash 3.2 считает пустые массивы
# (например, список уже занятых нами портов до первого запуска) необъявленными.

if [[ $need_node -eq 1 ]]; then
  command -v node >/dev/null 2>&1 || die "Node.js не найден. Установите актуальную LTS-версию Node.js."
  command -v npm >/dev/null 2>&1 || die "npm не найден. Переустановите Node.js вместе с npm."

  if ! node -e '
const [major, minor, patch] = process.versions.node.split(".").map(Number);
const supported =
  major > 22 ||
  (major === 22 && minor >= 12) ||
  (major === 20 && (minor > 19 || (minor === 19 && patch >= 4)));
if (!supported) {
  console.error(`Требуется Node.js 20.19.4+ или 22.12+; установлена ${process.versions.node}.`);
  process.exit(1);
}
'; then
    echo "Если используется NVM: nvm install 22 && nvm use 22" >&2
    exit 1
  fi
fi

if [[ $need_java -eq 1 ]]; then
  command -v java >/dev/null 2>&1 || die "Java не найдена; для Spring Boot установите JDK 17 или новее."
  java_major="$(java -XshowSettings:properties -version 2>&1 | awk '/java.version =/ { split($3, parts, "."); if (parts[1] == 1) print parts[2]; else print parts[1]; exit }')"
  [[ "$java_major" =~ ^[0-9]+$ ]] || die "не удалось определить версию Java."
  ((java_major >= 17)) || die "для Spring Boot требуется JDK 17 или новее; найдена Java $java_major."
fi

validate_package_json() {
  local package_file="$1"
  node -e '
const fs = require("fs");
const file = process.argv[1];
const value = JSON.parse(fs.readFileSync(file, "utf8"));
if (!value || typeof value !== "object" || Array.isArray(value)) {
  throw new Error("корень package.json должен быть объектом");
}
' "$package_file" >/dev/null
}

has_npm_script() {
  local package_file="$1"
  local script_name="$2"
  node -e '
const value = require(process.argv[1]);
process.exit(value.scripts && typeof value.scripts[process.argv[2]] === "string" ? 0 : 1);
' "$package_file" "$script_name"
}

validate_selected_projects() {
  local index
  local type
  local marker
  local dir

  for index in "${selected_indices[@]}"; do
    type="${project_types[$index]}"
    marker="${project_markers[$index]}"
    dir="${project_dirs[$index]}"

    [[ -f "$marker" ]] || die "файл проекта исчез: $marker"

    case "$type" in
      vite|expo|npm)
        if ! validate_package_json "$marker"; then
          die "некорректный JSON в $marker"
        fi
        if [[ "$type" == "vite" ]] && ! has_npm_script "$marker" "build"; then
          die "в $marker отсутствует script 'build'."
        fi
        # Expo вызывается напрямую: scripts start/web не обязательны.
        if [[ "$type" == "npm" ]]; then
          die "не удалось определить Vite или Expo в $dir; этот npm-проект не запускается автоматически."
        fi
        ;;
      spring)
        if [[ ! -f "$dir/mvnw" ]] && ! command -v mvn >/dev/null 2>&1; then
          die "для $dir не найден Maven Wrapper (mvnw) и команда mvn."
        fi
        ;;
      maven)
        die "$dir является Maven-проектом, но не распознан как Spring Boot."
        ;;
    esac
  done
}

validate_selected_projects
if [[ $build_only -eq 0 ]]; then
  command -v curl >/dev/null 2>&1 || die "curl нужен для проверки HTTP-готовности серверов."
fi

expo_cli_for() {
  node -e '
const path = require("path");
const p = require.resolve("expo/package.json", {paths:[process.argv[1]]});
const pkg = require(p);
const bin = typeof pkg.bin === "string" ? pkg.bin : pkg.bin.expo;
process.stdout.write(path.resolve(path.dirname(p), bin));
' "$1"
}

validate_expo_device() {
  local platform="$1"
  local sdk="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
  local devices
  local avds
  [[ $build_only -eq 0 && $no_open -eq 0 ]] || return 0
  case "$platform" in
    ios)
      [[ "$(uname -s)" == "Darwin" ]] || die "iOS Simulator доступен только в macOS. Выберите android или web."
      command -v xcodebuild >/dev/null 2>&1 && xcodebuild -version >/dev/null 2>&1 || die "нужен полный Xcode (не только Command Line Tools). Откройте Xcode и завершите первичную настройку."
      if ! devices="$(xcrun simctl list devices available --json)"; then
        die "не удалось получить симуляторы Xcode; проверьте выбранный Xcode и установленную платформу iOS."
      fi
      if ! printf '%s' "$devices" | node -e '
let s=""; process.stdin.on("data",c=>s+=c); process.stdin.on("end",()=>{
const d=JSON.parse(s).devices || {};
process.exit(Object.keys(d).some(k=>k.includes(".iOS-") && d[k].some(v=>v.isAvailable!==false))?0:1);
});'; then
        die "нет доступного iOS Simulator. Xcode → Settings → Components/Platforms → установите iOS и создайте симулятор."
      fi
      ;;
    android)
      if [[ -z "$sdk" ]]; then
        if [[ -d "${HOME:-}/Library/Android/sdk" ]]; then sdk="${HOME:-}/Library/Android/sdk"
        elif [[ -d "${HOME:-}/Android/Sdk" ]]; then sdk="${HOME:-}/Android/Sdk"
        elif [[ -n "${LOCALAPPDATA:-}" && -d "${LOCALAPPDATA//\\//}/Android/Sdk" ]]; then sdk="${LOCALAPPDATA//\\//}/Android/Sdk"; fi
      fi
      if [[ -n "$sdk" && -d "$sdk" ]]; then
        export ANDROID_HOME="$sdk"
        export PATH="$sdk/platform-tools:$sdk/emulator:$PATH"
      fi
      command -v adb >/dev/null 2>&1 || die "Android SDK: adb не найден. Для Android установите Android Studio + SDK Platform-Tools. На Mac для iOS повторите запуск и выберите 1; Android всегда пункт 2."
      devices="$(adb devices)" || die "Android: adb не отвечает."
      if ! printf '%s\n' "$devices" | grep -Eq '^emulator-[0-9]+[[:space:]]+device'; then
        command -v emulator >/dev/null 2>&1 || die "Android Emulator не найден. Установите его через SDK Manager."
        avds="$(emulator -list-avds)" || die "не удалось прочитать Android AVD."
        [[ -n "$avds" ]] || die "нет Android AVD. Android Studio → Device Manager → Create Virtual Device."
      fi
      echo "Expo откроет доступное Android-устройство/AVD. Если подключён телефон, отключите его для запуска именно эмулятора."
      ;;
  esac
}

# Проверяем среду раньше длительной сборки. Ничего не устанавливаем глобально.
for selected_index in "${selected_indices[@]}"; do
  [[ "${project_types[$selected_index]}" == "expo" ]] || continue
  validate_expo_device "${project_expo_platforms[$selected_index]}"
done

prepare_expo_platform() {
  local dir="$1"
  local platform="$2"
  local cli
  local missing
  local answer
  local config
  cli="$(expo_cli_for "$dir")" || die "локальный Expo CLI не найден в $dir."
  if [[ "$platform" == "web" ]]; then
    missing="$(node -e '
const p=require(process.argv[1]); const d={...p.dependencies,...p.devDependencies};
console.log(["react-dom","react-native-web","@expo/metro-runtime"].filter(n=>!d[n]).join(" "));
' "$dir/package.json")"
    if [[ -n "$missing" ]]; then
      echo "Для Web отсутствуют зависимости: $missing"
      if [[ $install_web_deps -ne 1 ]]; then
        if [[ -t 0 ]]; then
          read -r -p "Установить совместимые с Expo версии в этот проект? [y/N]: " answer || die "ввод прерван."
          case "$answer" in y|Y|yes|да|Да) ;; *) die "выберите native-режим или установите зависимости: npx expo install $missing" ;; esac
        else
          die "повторите с --install-web-deps либо выполните в проекте: npx expo install $missing"
        fi
      fi
      # Список фиксированный, пользовательский ввод в shell-команду не подставляется.
      node "$cli" install react-dom react-native-web @expo/metro-runtime
    fi
  fi
  config="$(node "$cli" config --type public --json)" || die "не удалось прочитать конфигурацию Expo: $dir"
  if ! printf '%s' "$config" | node -e '
let s=""; process.stdin.on("data",c=>s+=c); process.stdin.on("end",()=>{
const c=JSON.parse(s); const p=c.platforms || (c.expo && c.expo.platforms);
process.exit(!Array.isArray(p) || p.includes(process.argv[1]) ? 0 : 1);
});' "$platform"; then
    die "платформа $platform исключена настройкой platforms в app.json/app.config.*. Добавьте её в список platforms или выберите другой режим. Конфигурация не изменена."
  fi
}

install_node_dependencies() {
  local dir="$1" recovery

  cd "$dir"
  if [[ ! -f package-lock.json ]]; then
    echo "package-lock.json отсутствует — выполняю npm install."
    npm install --engine-strict --no-audit --no-fund
  elif [[ "${force_clean_install:-0}" == 1 ]] || ! install_fingerprint "$dir" check; then
    echo "Устанавливаю точные версии зависимостей командой npm ci."
    if ! npm ci --engine-strict --no-audit --no-fund; then
      recovery="${dependency_reports:-$(mktemp -d "${TMPDIR:-/tmp}/homework-deps.XXXXXXXX")}/ci-recovery"
      mkdir -p "$recovery/before" "$recovery/fresh"
      cp -- package.json package-lock.json "$recovery/before/"
      cp -- package.json "$recovery/fresh/"
      echo "Восстанавливаю lock из текущих настроек проекта и повторяю чистую установку..."
      if (cd "$recovery/fresh" && npm install --package-lock-only --ignore-scripts --no-force --engine-strict --no-fund --no-audit --fetch-retries=0 --fetch-timeout=20000) > "$recovery/repair.log" 2>&1 && dependency_json guard "$recovery/before" "$recovery/fresh" && cp -- "$recovery/fresh/package-lock.json" "$dir/package-lock.json" && npm ci --engine-strict --no-audit --no-fund; then
        echo "Зависимости автоматически восстановлены."
      else
        cp -- "$recovery/before/package.json" "$recovery/before/package-lock.json" "$dir/"
        cat "$recovery/repair.log" >&2
        die "установка не восстановилась; настройки сохранены. Отчёт: $recovery"
      fi
    fi
  else
    echo "Зависимости уже установлены и актуальны."
  fi
  install_fingerprint "$dir" write
}

# Lock-only npm operations can rewrite timestamps without installing packages.
# Use content and runtime fingerprints, never mtimes, to trust node_modules.
install_fingerprint() {
  node - "$1" "$2" <<'INSTALL_FINGERPRINT'
const fs=require('fs'), path=require('path'), crypto=require('crypto');
const [dir,mode]=process.argv.slice(2), file=path.join(dir,'node_modules','.homework-install.json');
const hash=n=>fs.existsSync(path.join(dir,n))?crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,n))).digest('hex'):null;
const value={package:hash('package.json'),lock:hash('package-lock.json'),installedLock:hash('node_modules/.package-lock.json'),node:process.versions.node,platform:process.platform,arch:process.arch};
if(mode==='write') fs.writeFileSync(file,JSON.stringify(value)+'\n');
else { try { if(JSON.stringify(JSON.parse(fs.readFileSync(file,'utf8')))!==JSON.stringify(value)) process.exit(1); } catch { process.exit(1); } }
INSTALL_FINGERPRINT
}

# Keep audit reports/backups outside the project; never force a new Expo SDK.
dependency_json() {
  node - "$@" <<'DEPENDENCY_JSON'
const fs = require('fs'), path = require('path');
const [mode, ...args] = process.argv.slice(2);
const read = p => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
// Frozen delivery SDK profiles; only these known coursework apps are restored.
const knownExpoBaselines = {"homework-08-find-address":{"dependencies":{"expo":"~57.0.24","react":"19.2.3","react-native":"0.86.3","react-native-safe-area-context":"~5.7.0","expo-location":"~57.0.19","react-native-maps":"1.27.2"},"devDependencies":{"@types/react":"~19.2.2","typescript":"~6.0.3"}},"fullstack-homework-calculator-pages":{"dependencies":{"expo":"~54.0.36","expo-status-bar":"~3.0.9","react":"19.1.0","react-native":"0.81.5","react-dom":"19.1.0","react-native-web":"^0.21.0","@react-navigation/native":"^7.1.22","@react-navigation/native-stack":"^7.8.2","react-native-safe-area-context":"~5.6.2","react-native-screens":"~4.16.0"},"devDependencies":{"@testing-library/react-native":"13.3.3","jest":"29.7.0","jest-expo":"~54.0.18","react-test-renderer":"19.1.0","@types/jest":"^29.5.14","@types/react":"~19.1.0","typescript":"~5.9.2"}},"assignment13-contacts":{"dependencies":{"@expo/metro-runtime":"~57.0.16","expo":"~57.0.24","expo-contacts":"~57.0.5","react":"19.2.3","react-dom":"19.2.3","react-native":"0.86.3","react-native-safe-area-context":"~5.7.0","react-native-web":"~0.21.0"},"devDependencies":{"@types/node":"~24.0.0","@types/react":"~19.2.2","typescript":"~6.0.3"}},"fullstack-homework-euro-converter":{"dependencies":{"expo":"~54.0.36","expo-status-bar":"~3.0.9","react":"19.1.0","react-native":"0.81.5","@react-native-picker/picker":"2.11.1","react-dom":"19.1.0","react-native-web":"^0.21.0"},"devDependencies":{"@testing-library/react-native":"13.3.3","jest":"29.7.0","jest-expo":"~54.0.18","react-test-renderer":"19.1.0","@types/jest":"29.5.14","@types/node":"22.15.3","@types/react":"~19.1.10","typescript":"~5.9.2"}},"homework-12-firebase-shopping":{"dependencies":{"expo":"~57.0.24","react":"19.2.3","react-native":"0.86.3","react-native-safe-area-context":"~5.7.0","firebase":"12.19.0","@react-native-async-storage/async-storage":"2.2.0"},"devDependencies":{"@types/react":"~19.2.2","typescript":"~6.0.3"}},"react-native-homework-number-guessing-game":{"dependencies":{"expo":"~54.0.36","expo-status-bar":"~3.0.9","react":"19.1.0","react-native":"0.81.5"},"devDependencies":{"@testing-library/react-native":"13.3.3","jest":"29.7.0","jest-expo":"~54.0.18","react-test-renderer":"19.1.0"}},"my-places":{"dependencies":{"expo":"~54.0.37","react":"19.1.0","react-native":"0.81.5","react-dom":"19.1.0","react-native-web":"~0.21.0","expo-sqlite":"~16.0.10","react-native-maps":"1.20.1","react-native-paper":"5.15.3","react-native-safe-area-context":"~5.6.0","react-native-screens":"~4.16.0","@react-navigation/native":"^7.1.9","@react-navigation/native-stack":"^7.3.0","@expo/vector-icons":"^15.0.3"},"devDependencies":{"typescript":"~5.9.2","@types/react":"~19.1.10","@types/node":"^24.0.0"}},"fullstack-homework-recipe-finder":{"dependencies":{"expo":"~54.0.36","expo-status-bar":"~3.0.9","react":"19.1.0","react-native":"0.81.5","react-dom":"19.1.0","react-native-web":"^0.21.0"},"devDependencies":{"@testing-library/react-native":"13.3.3","jest":"29.7.0","jest-expo":"~54.0.18","react-test-renderer":"19.1.0","@types/jest":"^29.5.14","@types/react":"~19.1.0","typescript":"~5.9.2"}},"shopping-list-paper":{"dependencies":{"expo":"~54.0.37","expo-sqlite":"~16.0.10","react":"19.1.0","react-dom":"19.1.0","react-native":"0.81.5","react-native-paper":"5.15.3","react-native-safe-area-context":"~5.6.0","react-native-web":"~0.21.0"},"devDependencies":{"@types/react":"~19.1.10","typescript":"~5.9.2"}},"soundshades":{"dependencies":{"@expo/metro-runtime":"~57.0.16","@react-native-async-storage/async-storage":"2.2.0","@react-navigation/native":"^7.1.0","@react-navigation/native-stack":"^7.3.0","expo":"~57.0.24","expo-asset":"~57.0.18","expo-audio":"~57.0.5","expo-crypto":"~57.0.3","firebase":"^12.0.0","react":"19.2.3","react-dom":"19.2.3","react-native":"0.86.3","react-native-safe-area-context":"~5.7.0","react-native-screens":"~4.26.0","react-native-web":"~0.21.0"},"devDependencies":{"@firebase/rules-unit-testing":"^5.0.0","@types/node":"~24.0.0","@types/react":"~19.2.2","typescript":"~6.0.3"}},"assignment-14-text-to-speech":{"dependencies":{"@expo/metro-runtime":"~57.0.16","@react-native-segmented-control/segmented-control":"2.5.7","expo":"~57.0.24","expo-speech":"~57.0.3","react":"19.2.3","react-dom":"19.2.3","react-native":"0.86.3","react-native-safe-area-context":"~5.7.0","react-native-web":"~0.21.0"},"devDependencies":{"@types/node":"~24.0.0","@types/react":"~19.2.2","typescript":"~6.0.3"}},"homework-09-weather-forecast":{"dependencies":{"expo":"~57.0.24","react":"19.2.3","react-native":"0.86.3","react-native-safe-area-context":"~5.7.0","expo-location":"~57.0.19"},"devDependencies":{"@types/react":"~19.2.2","typescript":"~6.0.3"}}};
if (mode === 'restore-baseline') {
  const [dir, reports] = args, filename = path.join(dir,'package.json'), pkg = read(filename), baseline = knownExpoBaselines[pkg.name];
  if (!baseline) { console.log('unchanged'); process.exit(0); }
  const lockFile = path.join(dir,'package-lock.json'), lock = fs.existsSync(lockFile) ? read(lockFile) : null;
  const core = ['expo','react','react-native'];
  let broken = core.some(n => pkg.dependencies?.[n] !== baseline.dependencies[n]);
  if (lock) for (const n of core) {
    const installed = lock.packages?.['node_modules/'+n]?.version || lock.dependencies?.[n]?.version;
    const expected = baseline.dependencies[n].match(/\d+\.\d+/)?.[0];
    if (installed && !installed.startsWith(expected+'.')) broken = true;
  }
  if (!broken) { console.log('unchanged'); process.exit(0); }
  const backup = path.join(reports,'before-sdk-restore'); fs.mkdirSync(backup);
  fs.copyFileSync(filename,path.join(backup,'package.json'));
  if (lock) fs.copyFileSync(lockFile,path.join(backup,'package-lock.json'));
  pkg.dependencies ||= {};
  for (const [n,v] of Object.entries(baseline.dependencies)) {
    if (n === 'expo' || n.startsWith('expo-') || ['react','react-dom','react-native','react-native-web','react-native-safe-area-context','react-native-screens','@expo/metro-runtime'].includes(n)) pkg.dependencies[n]=v;
  }
  for (const n of ['@types/react','typescript']) if (baseline.devDependencies[n]) { pkg.devDependencies ||= {}; pkg.devDependencies[n]=baseline.devDependencies[n]; }
  fs.writeFileSync(filename,JSON.stringify(pkg,null,2)+'\n');
  console.log('restored');
} else if (mode === 'clean-rn-types') {
  const [dir,reports]=args, filename=path.join(dir,'package.json'), pkg=read(filename);
  const sections=['dependencies','devDependencies','optionalDependencies','peerDependencies'];
  if(!sections.some(s=>Object.hasOwn(pkg[s]||{},'@types/react-native'))) { console.log('unchanged'); process.exit(0); }
  let ownsTypes=!!knownExpoBaselines[pkg.name];
  const native=path.join(dir,'node_modules/react-native'), nativeFile=path.join(native,'package.json');
  if(!ownsTypes && fs.existsSync(nativeFile)) {
    const info=read(nativeFile), types=info.types||info.typings;
    if(typeof types==='string') {
      const target=path.resolve(native,types);
      ownsTypes=target.startsWith(native+path.sep)&&fs.existsSync(target);
    }
  }
  if(!ownsTypes) { console.log('unchanged'); process.exit(0); }
  const backup=path.join(reports,'before-rn-types-cleanup'); fs.mkdirSync(backup);
  fs.copyFileSync(filename,path.join(backup,'package.json'));
  const lock=path.join(dir,'package-lock.json'); if(fs.existsSync(lock)) fs.copyFileSync(lock,path.join(backup,'package-lock.json'));
  for(const section of sections) if(pkg[section]) delete pkg[section]['@types/react-native'];
  if(pkg.peerDependenciesMeta) delete pkg.peerDependenciesMeta['@types/react-native'];
  fs.writeFileSync(filename,JSON.stringify(pkg,null,2)+'\n'); console.log('removed');
} else if (mode === 'audit-count') {
  const r = read(args[0]);
  if (r.error || !r.metadata || !r.metadata.vulnerabilities || !Number.isInteger(r.metadata.vulnerabilities.total)) process.exit(2);
  console.log(r.metadata.vulnerabilities.total);
} else if (mode === 'fix-result') {
  if (read(args[0]).error) process.exit(1);
} else if (mode === 'guard') {
  const before = read(path.join(args[0], 'package-lock.json'));
  const after = read(path.join(args[1], 'package-lock.json'));
  const pkg = read(path.join(args[0], 'package.json'));
  const names = Object.keys({...pkg.dependencies, ...pkg.devDependencies, ...pkg.optionalDependencies});
  const version = (lock, n) => lock.packages?.['node_modules/' + n]?.version || lock.dependencies?.[n]?.version;
  for (const n of names) {
    const a = version(before,n), b = version(after,n);
    if (!a && !b) continue;
    const av = String(a).match(/^(\d+)\.(\d+)\./), bv = String(b).match(/^(\d+)\.(\d+)\./);
    if (!av || !bv || av[1] !== bv[1] || (av[1] === '0' && av[2] !== bv[2])) {
      console.error('Отклонена смена несовместимой ветки зависимости: ' + n); process.exit(1);
    }
  }
} else if (mode === 'pending-actions') {
  const [reportFile, dir] = args, report = read(reportFile), pkg = read(path.join(dir,'package.json'));
  const lock = read(path.join(dir,'package-lock.json'));
  if (!Array.isArray(report.allowScripts)) process.exit(1);
  const policy = pkg.allowScripts || {};
  for (const item of report.allowScripts) {
    const name = item.name;
    if (!['fsevents','esbuild'].includes(name)) continue;
    if (Object.keys(policy).some(k => k === name || k.startsWith(name+'@'))) continue;
    const folder = path.join(dir,'node_modules',name), infoFile = path.join(folder,'package.json');
    if (!fs.existsSync(infoFile)) continue;
    const info = read(infoFile), entry = lock.packages?.['node_modules/'+name];
    if (!entry || entry.version !== info.version || !String(entry.resolved).startsWith('https://registry.npmjs.org/'+name+'/') || !String(entry.integrity).startsWith('sha512-')) continue;
    if (name === 'fsevents' && info.version === '2.3.3' && fs.existsSync(path.join(folder,'fsevents.node')) && !info.scripts?.install && !fs.existsSync(path.join(folder,'binding.gyp'))) {
      if (process.platform === 'darwin') require(folder);
      console.log('deny\tfsevents');
    } else if (name === 'esbuild' && info.scripts?.postinstall === 'node install.js') {
      console.log('approve\tesbuild@'+info.version);
    }
  }
}
DEPENDENCY_JSON
}

repair_dependency_lock() {
  local dir="$1" before after code=0 restored cleaned backup
  dependency_reports="$(mktemp -d "${TMPDIR:-/tmp}/homework-deps.XXXXXXXX")"
  force_clean_install=0
  restored="$(dependency_json restore-baseline "$dir" "$dependency_reports")" || die "не удалось проверить SDK-профиль приложения."
  cleaned="$(dependency_json clean-rn-types "$dir" "$dependency_reports")" || die "не удалось проверить встроенные типы React Native."
  if [[ "$restored" == restored ]]; then
    echo "Восстанавливаю согласованные версии Expo/React/React Native из учебного комплекта. Резервная копия: $dependency_reports/before-sdk-restore"
  fi
  if [[ "$cleaned" == removed ]]; then
    echo "Убираю лишний @types/react-native: React Native содержит собственные типы. Резервная копия: $dependency_reports/before-rn-types-cleanup"
  fi
  if [[ "$restored" == restored || "$cleaned" == removed ]]; then
    force_clean_install=1
    if [[ "$restored" == restored ]]; then backup="$dependency_reports/before-sdk-restore"; else backup="$dependency_reports/before-rn-types-cleanup"; fi
    mkdir "$dependency_reports/fresh-lock"
    cp -- "$dir/package.json" "$dependency_reports/fresh-lock/"
    if (cd "$dependency_reports/fresh-lock" && npm install --package-lock-only --ignore-scripts --no-force --engine-strict --no-fund --no-audit --fetch-retries=0 --fetch-timeout=20000) > "$dependency_reports/sdk-restore.log" 2>&1; then
      cp -- "$dependency_reports/fresh-lock/package-lock.json" "$dir/package-lock.json"
    else
      cp -- "$backup/package.json" "$dir/package.json"
      cat "$dependency_reports/sdk-restore.log" >&2
      die "не удалось получить согласованный lock; исходный package.json восстановлен."
    fi
  fi
  [[ -f "$dir/package-lock.json" ]] || return 0
  echo "Проверяю уязвимости зависимостей; отчёты: $dependency_reports"
  (cd "$dir" && npm audit --json --fetch-retries=0 --fetch-timeout=20000) > "$dependency_reports/audit-before.json" 2> "$dependency_reports/audit-before.log" || true
  if ! before="$(dependency_json audit-count "$dependency_reports/audit-before.json")"; then
    warn "npm audit не получил достоверный отчёт. Проверка уязвимостей не завершена; журнал: $dependency_reports"
    return 0
  fi
  if [[ "$before" == 0 ]]; then echo "npm audit: известных уязвимостей не найдено."; return 0; fi
  mkdir "$dependency_reports/before"
  cp -- "$dir/package.json" "$dir/package-lock.json" "$dependency_reports/before/"
  echo "Найдено: $before. Применяю исправления в пределах совместимых веток зависимостей..."
  (cd "$dir" && npm audit fix --package-lock-only --ignore-scripts --no-force --engine-strict --no-fund --json --fetch-retries=0 --fetch-timeout=20000) > "$dependency_reports/audit-fix.json" 2> "$dependency_reports/audit-fix.log" || code=$?
  if [[ $code -gt 1 ]] || ! dependency_json fix-result "$dependency_reports/audit-fix.json" || ! dependency_json guard "$dependency_reports/before" "$dir"; then
    cp -- "$dependency_reports/before/package.json" "$dependency_reports/before/package-lock.json" "$dir/"
    warn "Исправление audit отклонено; исходные package.json и lock восстановлены. Журнал: $dependency_reports"
  fi
  if ! cmp -s "$dependency_reports/before/package-lock.json" "$dir/package-lock.json"; then force_clean_install=1; fi
  (cd "$dir" && npm audit --json --fetch-retries=0 --fetch-timeout=20000) > "$dependency_reports/audit-after.json" 2> "$dependency_reports/audit-after.log" || true
  if after="$(dependency_json audit-count "$dependency_reports/audit-after.json")"; then
    echo "npm audit: до исправления $before, после $after."
    if [[ "$after" != 0 ]]; then warn "Осталось $after уязвимостей. Обновление SDK/несовместимых зависимостей автоматически не применяется. Подробности: $dependency_reports/audit-after.json"; fi
  else
    warn "Повторный npm audit недоступен; итоговый статус уязвимостей неизвестен. Журнал: $dependency_reports"
  fi
}

resolve_install_scripts() {
  local dir="$1" action spec remaining
  [[ -f "$dir/package-lock.json" ]] || return 0
  if (cd "$dir" && npm approve-scripts --allow-scripts-pending --json) > "$dependency_reports/pending.json" 2> "$dependency_reports/pending.log"; then
    if ! dependency_json pending-actions "$dependency_reports/pending.json" "$dir" > "$dependency_reports/actions.tsv"; then
      warn "Не удалось разобрать install scripts; автоматические разрешения не выданы. Журнал: $dependency_reports"
      return 0
    fi
    while IFS=$'\t' read -r action spec; do
      [[ -n "$action" ]] || continue
      if [[ "$action" == deny && "$spec" == fsevents ]]; then
        echo "fsevents 2.3.3: готовый native-модуль проверен; ненужная повторная компиляция отключена."
        (cd "$dir" && npm deny-scripts fsevents) || die "не удалось сохранить политику fsevents."
      elif [[ "$action" == approve && "$spec" == esbuild@* ]]; then
        echo "Разрешаю только установленную версию $spec из npm registry."
        (cd "$dir" && npm approve-scripts "$spec" && npm rebuild "$spec" --no-audit) || die "не удалось подготовить $spec."
      fi
    done < "$dependency_reports/actions.tsv"
    (cd "$dir" && npm approve-scripts --allow-scripts-pending --json) > "$dependency_reports/pending-after.json" 2>/dev/null || return 0
    remaining="$(node -e 'const p=require(process.argv[1]); console.log((p.allowScripts||[]).map(x=>x.name).join(", "))' "$dependency_reports/pending-after.json")"
    if [[ -n "$remaining" ]]; then warn "Install scripts требуют отдельного решения: $remaining. Отчёт: $dependency_reports/pending-after.json"; fi
  fi
}

check_expo_dependencies() {
  local dir="$1" cli backup
  cli="$(expo_cli_for "$dir")" || return 1
  echo "Проверяю версии пакетов для установленного Expo SDK..."
  if (cd "$dir" && CI=1 node "$cli" install --check) > "$dependency_reports/expo-versions.log" 2>&1; then
    cat "$dependency_reports/expo-versions.log"; return 0
  fi
  cat "$dependency_reports/expo-versions.log"
  if ! grep -Eq 'should be updated|expected version|Expected package' "$dependency_reports/expo-versions.log"; then
    die "Проверка версий Expo не завершилась. Подробности: $dependency_reports/expo-versions.log"
  fi
  backup="$dependency_reports/before-expo-fix"
  mkdir "$backup"; cp -- "$dir/package.json" "$dir/package-lock.json" "$backup/"
  echo "Исправляю версии пакетов под текущий Expo SDK..."
  if (cd "$dir" && CI=1 npm_config_audit=false npm_config_fund=false node "$cli" install --fix --npm) && dependency_json guard "$backup" "$dir" && cli="$(expo_cli_for "$dir")" && (cd "$dir" && CI=1 node "$cli" install --check); then
    return 0
  else
    cp -- "$backup/package.json" "$backup/package-lock.json" "$dir/"
    (cd "$dir" && npm ci --engine-strict --no-audit) || true
    die "Исправление Expo не подтверждено; исходные manifests восстановлены. Журнал: $dependency_reports"
  fi
}

run_expo_doctor() {
  local dir="$1"
  echo "Проверяю совместимость Expo..."
  if (cd "$dir" && npm_config_fetch_retries=0 npm_config_fetch_timeout=20000 npx --yes expo-doctor@latest) > "$dependency_reports/expo-doctor.log" 2>&1; then
    cat "$dependency_reports/expo-doctor.log"; return 0
  fi
  cat "$dependency_reports/expo-doctor.log"
  if grep -Fq 'Directory check failed with unexpected server response' "$dependency_reports/expo-doctor.log"; then
    warn "Внешний React Native Directory не ответил. Повторяю остальные проверки; проверка совместимости SDK сохраняется."
    if (cd "$dir" && EXPO_DOCTOR_ENABLE_DIRECTORY_CHECK=0 npm_config_fetch_retries=0 npm_config_fetch_timeout=20000 npx --yes expo-doctor@latest) > "$dependency_reports/expo-doctor-retry.log" 2>&1; then
      cat "$dependency_reports/expo-doctor-retry.log"
      echo "Проверки Expo пройдены; внешний Directory недоступен и не подтверждён."
      return 0
    fi
    cat "$dependency_reports/expo-doctor-retry.log"
  fi
  if [[ "${strict_checks:-0}" == 1 ]]; then
    die "Expo Doctor обнаружил нерешённую проблему. Журнал: $dependency_reports"
  fi
  warn "Замечания Expo Doctor сохранены: $dependency_reports. Продолжаю сборку и проверку запуска. Для строгой проверки используйте --strict-checks."
  return 0
}

ensure_expo_go_compatible() {
  local dir="$1" platform="$2"
  [[ $build_only -eq 0 && $no_open -eq 0 && "$platform" == ios ]] || return 0
  echo "Проверяю Expo Go в iOS Simulator для SDK проекта..."
  # Use the project's own Expo CLI to select the same simulator and download
  # its SDK-specific Expo Go. Install in place; never uninstall/erase app data.
  node - "$dir" <<'EXPO_GO_COMPATIBILITY'
const fs=require('fs'), path=require('path'), {spawnSync}=require('child_process');
(async()=>{
  const dir=process.argv[2];
  const expoFile=require.resolve('expo/package.json',{paths:[dir]});
  const sdk=JSON.parse(fs.readFileSync(expoFile,'utf8')).version.split('.')[0]+'.0.0';
  const cli=path.dirname(require.resolve('@expo/cli/package.json',{paths:[path.dirname(expoFile)]}));
  const load=p=>require(path.join(cli,'build/src',p));
  const {getVersionsAsync}=load('api/getVersions.js');
  const versions=await getVersionsAsync();
  const expected=versions.sdkVersions?.[sdk]?.iosClientVersion;
  if(!expected) throw new Error('Expo API не вернул версию Expo Go для SDK '+sdk+'. Выберите эту версию на https://expo.dev/go и установите в Simulator.');
  const {AppleDeviceManager}=load('start/platforms/ios/AppleDeviceManager.js');
  const device=await AppleDeviceManager.resolveAsync({shouldPrompt:false});
  const appId='host.exp.Exponent';
  const container=await device.isAppInstalledAndIfSoReturnContainerPathForIOSAsync(appId);
  let installed=container?await device.getAppVersionAsync(appId,{containerPath:typeof container==='string'?container:undefined}):null;
  if(installed===expected) { console.log('Expo Go '+expected+' соответствует SDK '+sdk+'.'); return; }
  console.log('SDK '+sdk+': установлен Expo Go '+(installed||'не установлен')+', нужен '+expected+'. Устанавливаю совместимую версию в '+device.name+'...');
  const {downloadExpoGoAsync}=load('utils/downloadExpoGoAsync.js');
  const binary=await downloadExpoGoAsync('ios',{sdkVersion:sdk});
  // Stop the old running binary without uninstalling its data container.
  spawnSync('xcrun',['simctl','terminate',device.identifier,appId],{stdio:'ignore'});
  await device.installAppAsync(binary);
  const newContainer=await device.isAppInstalledAndIfSoReturnContainerPathForIOSAsync(appId);
  installed=await device.getAppVersionAsync(appId,{containerPath:typeof newContainer==='string'?newContainer:undefined});
  if(installed!==expected) throw new Error('После установки версия Expo Go '+installed+' не совпала с '+expected+'. Запуск остановлен.');
  console.log('Expo Go '+expected+' установлен и проверен для SDK '+sdk+'.');
})().catch(error=>{console.error('Ошибка совместимости Expo Go: '+error.message); process.exitCode=1;});
EXPO_GO_COMPATIBILITY
}

has_typescript_sources() {
  local dir="$1"
  local source_file

  source_file="$(
    find "$dir" \
      \( -type d \( -name node_modules -o -name .expo -o -name dist -o -name coverage \) -prune \) -o \
      \( -type f \( -name '*.ts' -o -name '*.tsx' \) -print \) \
      | sed -n '1p'
  )"
  [[ -n "$source_file" ]]
}

run_node_checks() {
  local dir="$1"
  local type="$2"
  local package_file="$dir/package.json"

  cd "$dir"
  if has_npm_script "$package_file" "typecheck"; then
    echo "Проверяю TypeScript..."
    npm run typecheck
  elif [[ -f tsconfig.json && -x node_modules/.bin/tsc ]]; then
    echo "Проверяю TypeScript..."
    npm exec -- tsc --noEmit
  elif has_typescript_sources "$dir"; then
    warn "в ${project_labels[$3]} есть TypeScript, но не настроена команда typecheck."
  fi

  if [[ $skip_tests -eq 1 ]]; then
    echo "Тесты пропущены по параметру --skip-tests."
  elif has_npm_script "$package_file" "test:run"; then
    echo "Запускаю тесты..."
    npm run test:run
  elif has_npm_script "$package_file" "test"; then
    echo "Запускаю тесты..."
    # Honor the configured runner. Jest flags break Node --test, while
    # --run is not a universal option. CI also disables default watch mode.
    CI=1 npm test
  else
    warn "для ${project_labels[$3]} не настроены автоматические тесты."
  fi
}

build_node_project() {
  local index="$1"
  local dir="${project_dirs[$index]}"
  local type="${project_types[$index]}"

  echo
  echo "============================================================"
  echo "Проверяю и собираю: ${project_labels[$index]}"
  echo "============================================================"

  repair_dependency_lock "$dir"
  install_node_dependencies "$dir"
  if [[ "$type" == "expo" ]]; then
    prepare_expo_platform "$dir" "${project_expo_platforms[$index]}"
    check_expo_dependencies "$dir"
  fi
  resolve_install_scripts "$dir"
  install_fingerprint "$dir" write
  run_node_checks "$dir" "$type" "$index"

  cd "$dir"
  if [[ "$type" == "vite" ]]; then
    echo "Собираю Vite production-версию..."
    npm run build
    [[ -s dist/index.html ]] || die "Vite не создал $dir/dist/index.html"
  else
    run_expo_doctor "$dir"
    echo "Собираю Expo bundle: ${project_expo_platforms[$index]}..."
    node "$(expo_cli_for "$dir")" export --platform "${project_expo_platforms[$index]}" --output-dir dist
    [[ -n "$(find dist -type f -print | sed -n '1p')" ]] || die "Expo не создал файлы в $dir/dist"
    ensure_expo_go_compatible "$dir" "${project_expo_platforms[$index]}" || die "не удалось установить Expo Go под SDK проекта."
  fi
}

validate_mysql_profile() {
  local dir="$1"
  local profile="$dir/src/main/resources/application-mysql.properties"

  [[ -f "$profile" ]] || die "для работы 09 отсутствует $profile"
  grep -F '${BOOKSTORE_MYSQL_URL}' "$profile" >/dev/null || die "MySQL URL должен приходить из BOOKSTORE_MYSQL_URL."
  grep -F '${BOOKSTORE_MYSQL_USERNAME}' "$profile" >/dev/null || die "MySQL username должен приходить из BOOKSTORE_MYSQL_USERNAME."
  grep -F '${BOOKSTORE_DB_PASSWORD}' "$profile" >/dev/null || die "MySQL password должен приходить из BOOKSTORE_DB_PASSWORD."
}

run_maven() {
  local dir="$1"
  shift

  cd "$dir"
  if [[ -f mvnw ]]; then
    bash ./mvnw "$@"
  else
    mvn "$@"
  fi
}

build_spring_project() {
  local index="$1"
  local dir="${project_dirs[$index]}"

  echo
  echo "============================================================"
  echo "Проверяю и собираю: ${project_labels[$index]}"
  echo "============================================================"

  if [[ $skip_tests -eq 1 ]]; then
    run_maven "$dir" -DskipTests clean verify
  else
    run_maven "$dir" clean verify
  fi
}

processed_build_dirs=()

build_dir_was_processed() {
  local candidate="$1"
  local existing
  for existing in "${processed_build_dirs[@]}"; do
    [[ "$existing" != "$candidate" ]] || return 0
  done
  return 1
}

for selected_index in "${selected_indices[@]}"; do
  if [[ "${project_labels[$selected_index]}" == *"[MySQL Optional]" ]]; then
    validate_mysql_profile "${project_dirs[$selected_index]}"
  fi

  if build_dir_was_processed "${project_dirs[$selected_index]}"; then
    echo "Пропускаю повторную сборку общего каталога: ${project_labels[$selected_index]}"
    continue
  fi
  processed_build_dirs+=("${project_dirs[$selected_index]}")

  case "${project_types[$selected_index]}" in
    vite|expo) build_node_project "$selected_index" ;;
    spring) build_spring_project "$selected_index" ;;
  esac
done

echo
echo "Сборки завершены; отсутствующие или пропущенные тесты указаны выше."

if [[ $build_only -eq 1 ]]; then
  exit 0
fi

reserved_ports=()

port_is_reserved() {
  local candidate="$1"
  local reserved
  for reserved in "${reserved_ports[@]}"; do
    [[ "$reserved" != "$candidate" ]] || return 0
  done
  return 1
}

port_is_free() {
  local port="$1"

  if command -v lsof >/dev/null 2>&1; then
    ! lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
  elif command -v nc >/dev/null 2>&1; then
    ! nc -z 127.0.0.1 "$port" >/dev/null 2>&1
  else
    ! (echo >/dev/tcp/127.0.0.1/"$port") >/dev/null 2>&1
  fi
}

choose_port() {
  local candidate="$1"
  local limit=$((candidate + 200))

  while ((candidate <= limit)); do
    if ! port_is_reserved "$candidate" && port_is_free "$candidate"; then
      reserved_ports+=("$candidate")
      chosen_port="$candidate"
      return 0
    fi
    candidate=$((candidate + 1))
  done

  die "не найден свободный порт в диапазоне $1-$limit."
}

spring_jar() {
  local dir="$1"
  local jar
  local selected=""
  local count=0

  for jar in "$dir"/target/*.jar; do
    [[ -f "$jar" ]] || continue
    case "$(basename -- "$jar")" in
      original-*|*-sources.jar|*-javadoc.jar|*-tests.jar|*-test.jar|*-plain.jar) continue ;;
    esac
    selected="$jar"
    count=$((count + 1))
  done
  if [[ $count -eq 0 ]]; then
    echo "В $dir/target нет JAR приложения после сборки." >&2
    return 1
  fi
  if [[ $count -ne 1 ]]; then
    echo "В $dir/target найдено несколько JAR приложения. Запуск отменён: выбирать первый небезопасно." >&2
    echo "Проверьте настройки Maven/classifier: после clean verify должен остаться один запускаемый JAR." >&2
    return 1
  fi
  printf '%s\n' "$selected"
}

spring_url_path() {
  local dir="$1"
  local login_path
  if [[ -n "$spring_ready_path" ]]; then
    echo "$spring_ready_path"
    return
  fi
  # A literal endpoint, never shell code. CLI override has higher priority.
  if [[ -f "$dir/.spring-ready-path" ]]; then
    login_path="$(cat "$dir/.spring-ready-path")"
    if [[ "$login_path" == /* && "$login_path" != //* && "$login_path" != *$'\n'* && "$login_path" != *$'\r'* && ${#login_path} -le 4096 ]]; then
      printf '%s\n' "$login_path"
      return
    fi
    echo "Некорректный .spring-ready-path: нужен один относительный URL, начинающийся с /." >&2
    return 1
  fi
  # Use a declared form-login page. A JWT/API SecurityFilterChain alone does
  # not imply a /login endpoint. Custom endpoints can be supplied explicitly.
  if [[ -d "$dir/src/main" ]]; then
    login_path="$(find "$dir/src/main" -type f -name '*.java' -exec sed -nE 's/.*[.]loginPage[[:space:]]*\([[:space:]]*"(\/[^"[:space:]]*)".*/\1/p' {} \; | LC_ALL=C sort -u)"
    if [[ -n "$login_path" && "$login_path" != *$'\n'* && "$login_path" != //* ]]; then
      printf '%s\n' "$login_path"
      return
    elif [[ -n "$login_path" ]]; then
      echo "Объявлено несколько loginPage; укажите --spring-ready-path." >&2
      return 1
    fi
  fi
  if [[ -d "$dir/src/main" ]] && grep -R -Eq '[.]formLogin[[:space:]]*\(' "$dir/src/main" 2>/dev/null; then
    echo "/login"
  elif [[ -d "$dir/src/main" ]] && grep -R -q '@GetMapping("/booklist")' "$dir/src/main" 2>/dev/null; then
    echo "/booklist"
  else
    echo "/"
  fi
}

launch_ports=()
launch_urls=()
launch_pids=()
launch_logs=()
launch_indices=()
launch_modes=()
started_dirs=()
logs_dir="$(mktemp -d "${TMPDIR:-/tmp}/homework-runner.XXXXXX")"

dir_was_started() {
  local candidate="$1"
  local existing
  for existing in "${started_dirs[@]}"; do
    [[ "$existing" != "$candidate" ]] || return 0
  done
  return 1
}

start_project() {
  local index="$1"
  local port="$2"
  local log_file="$3"
  local dir="${project_dirs[$index]}"
  local type="${project_types[$index]}"
  local jar
  local cli
  local args=()

  case "$type" in
    vite)
      (
        cd "$dir"
        exec npm exec -- vite preview --host 127.0.0.1 --port "$port" --strictPort
      ) >"$log_file" 2>&1 &
      ;;
    expo)
      cli="$(expo_cli_for "$dir")" || die "не найден Expo CLI."
      args=(start --localhost --port "$port")
      if [[ "${project_expo_platforms[$index]}" == "web" ]]; then
        args+=(--web)
      else
        args+=(--go)
        if [[ $no_open -eq 0 ]]; then args+=("--${project_expo_platforms[$index]}"); fi
      fi
      (
        cd "$dir"
        export BROWSER=none
        exec node "$cli" "${args[@]}"
      ) < /dev/null >"$log_file" 2>&1 &
      ;;
    spring)
      jar="$(spring_jar "$dir")" || die "не удалось однозначно выбрать JAR для $dir."
      echo "Запускаю JAR: $jar"
      (
        cd "$dir"
        exec java -jar "$jar" --server.port="$port"
      ) >"$log_file" 2>&1 &
      ;;
  esac

  launch_pids+=("$!")
}

# Bash job control даёт каждому запущенному серверу СОБСТВЕННУЮ группу.
# Завершаем только эти группы: без pkill node, удаления файлов и убийства по порту.
set -m
cleanup_servers() {
  local exit_status=$?
  local pid
  local attempt=0
  local alive
  trap - EXIT
  trap '' INT TERM
  for pid in "${launch_pids[@]}"; do
    kill -TERM -- "-$pid" >/dev/null 2>&1 || true
  done
  while ((attempt < 5)); do
    alive=0
    for pid in "${launch_pids[@]}"; do
      if kill -0 -- "-$pid" >/dev/null 2>&1; then alive=1; fi
    done
    [[ $alive -eq 1 ]] || break
    sleep 1
    attempt=$((attempt + 1))
  done
  for pid in "${launch_pids[@]}"; do
    kill -KILL -- "-$pid" >/dev/null 2>&1 || true
    wait "$pid" >/dev/null 2>&1 || true
  done
  echo "Серверы этого запуска остановлены. Файлы проектов сохранены."
  exit "$exit_status"
}
trap cleanup_servers EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

for selected_index in "${selected_indices[@]}"; do
  if dir_was_started "${project_dirs[$selected_index]}"; then
    echo "Один сервер уже представляет общий каталог: ${project_labels[$selected_index]}"
    continue
  fi
  started_dirs+=("${project_dirs[$selected_index]}")

  case "${project_types[$selected_index]}" in
    vite)
      choose_port 4173
      port="$chosen_port"
      url="http://127.0.0.1:$port/"
      ;;
    expo)
      choose_port 8081
      port="$chosen_port"
      url="http://127.0.0.1:$port/"
      ;;
    spring)
      choose_port 8080
      port="$chosen_port"
      url="http://127.0.0.1:$port$(spring_url_path "${project_dirs[$selected_index]}")"
      ;;
  esac

  log_file="$logs_dir/project-$((selected_index + 1)).log"
  launch_ports+=("$port")
  launch_urls+=("$url")
  launch_logs+=("$log_file")
  launch_indices+=("$selected_index")
  launch_modes+=("${project_expo_platforms[$selected_index]:-web}")
  start_project "$selected_index" "$port" "$log_file"
done

wait_until_ready() {
  local pid="$1"
  local url="$2"
  local log_file="$3"
  local mode="$4"
  local type="${5:-node}"
  local attempt=0
  local body
  local status
  local ready_url="$url"

  if [[ "$mode" != "web" ]]; then ready_url="${url}status"; fi

  while ((attempt < ready_timeout)); do
    if ! kill -0 "$pid" >/dev/null 2>&1; then
      echo "Сервер завершился до запуска. Последние строки журнала:" >&2
      tail -n 30 "$log_file" >&2 || true
      return 1
    fi
    if [[ "$type" == "spring" ]]; then
      # Публичный /login обязан отвечать 2xx. Защищённый 401/403 не подтверждает готовность.
      if status="$(curl -sS --max-time 2 --output /dev/null --write-out '%{http_code}' "$ready_url" 2>/dev/null)"; then
        case "$status" in
          2??) return 0 ;;
        esac
      fi
    elif body="$(curl -fsS --max-time 2 "$ready_url" 2>/dev/null)"; then
      if [[ "$mode" == "web" ]]; then return 0; fi
      if [[ "$body" == "packager-status:running" ]]; then
        # В SDK 54 эта строка печатается после попытки открытия среды.
        # Один HTTP-ответ Metro ещё не означает завершение установки Expo Go.
        if [[ $no_open -eq 1 ]] || grep -q 'Waiting on ' "$log_file"; then return 0; fi
      fi
    fi
    attempt=$((attempt + 1))
    sleep 1
  done

  echo "Сервер не подтвердил HTTP-готовность за $ready_timeout секунд: $ready_url" >&2
  tail -n 30 "$log_file" >&2 || true
  if [[ "$type" == "expo" ]]; then
    echo "Если Expo Go требует подтверждения установки/смены версии, запустите один раз вручную в папке проекта: npx expo start --$mode" >&2
  fi
  return 1
}

open_url() {
  local url="$1"

  if [[ $no_open -eq 1 ]]; then
    return 0
  elif command -v open >/dev/null 2>&1; then
    open "$url" >/dev/null 2>&1 || warn "не удалось открыть браузер: $url"
  elif command -v cygstart >/dev/null 2>&1; then
    cygstart "$url" >/dev/null 2>&1 || warn "не удалось открыть браузер: $url"
  elif command -v rundll32.exe >/dev/null 2>&1; then
    rundll32.exe url.dll,FileProtocolHandler "$url" >/dev/null 2>&1 || warn "не удалось открыть браузер: $url"
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$url" >/dev/null 2>&1 || warn "не удалось открыть браузер: $url"
  else
    warn "команда открытия браузера не найдена; откройте вручную: $url"
  fi
}

echo
echo "Жду готовности серверов..."
for ((position = 0; position < ${#launch_pids[@]}; position++)); do
  selected_index="${launch_indices[$position]}"
  echo "Проверяю адрес: ${launch_urls[$position]}"
  echo "Журнал запуска: ${launch_logs[$position]}"
  wait_until_ready \
    "${launch_pids[$position]}" \
    "${launch_urls[$position]}" \
    "${launch_logs[$position]}" \
    "${launch_modes[$position]}" \
    "${project_types[$selected_index]}"
  if [[ "${launch_modes[$position]}" == "web" ]]; then
    open_url "${launch_urls[$position]}"
  else
    echo "Expo ${launch_modes[$position]}: Metro готов. Адрес ниже — сервер, НЕ страница приложения."
    [[ $no_open -eq 0 ]] || echo "Открытие эмулятора отключено (--no-open)."
  fi
done

echo
printf '%-4s %-18s %-9s %-7s %s\n' "№" "Тип" "Режим" "Порт" "Адрес сервера"
printf '%-4s %-18s %-9s %-7s %s\n' "--" "------------------" "---------" "-------" "--------------"
for ((position = 0; position < ${#launch_pids[@]}; position++)); do
  selected_index="${launch_indices[$position]}"
  printf '%-4d %-18s %-9s %-7s %s\n' \
    "$((selected_index + 1))" \
    "$(human_type "${project_types[$selected_index]}")" \
    "${launch_modes[$position]}" \
    "${launch_ports[$position]}" \
    "${launch_urls[$position]}"
done

echo
echo "HTTP-готовность серверов подтверждена. Журналы: $logs_dir"
if [[ $smoke_test -eq 1 ]]; then
  echo "Smoke-проверка завершена; серверы будут остановлены."
  exit 0
fi
echo "Для остановки нажмите Control + C."

while true; do
  for ((position = 0; position < ${#launch_pids[@]}; position++)); do
    pid="${launch_pids[$position]}"
    if ! kill -0 "$pid" >/dev/null 2>&1; then
      echo "Сервер ${project_labels[${launch_indices[$position]}]} неожиданно завершился." >&2
      tail -n 30 "${launch_logs[$position]}" >&2 || true
      exit 1
    fi
  done
  sleep 2
done
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
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": [
      "ES2022",
      "DOM",
      "DOM.Iterable"
    ],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": [
      "vite/client"
    ],
    "resolveJsonModule": true
  },
  "include": [
    "src"
  ]
}
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
import { ApiUnavailableError, createAutoFallbackApi } from './fallback';
import { fields, type Car, type CarInput } from './cars';
import { DEFAULT_BASE, backendBase, browserApiBase } from './api-config';
export { DEFAULT_BASE };
export const BACKEND_BASE = backendBase(import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE);
export const API_BASE = browserApiBase(BACKEND_BASE, typeof location === 'undefined' ? undefined : location.href);
export const REQUEST_TIMEOUT_MS = 30000;
class ApiRequestError extends Error {}
export function createApi(base: string, transport: typeof fetch = fetch, readTimeoutMs = REQUEST_TIMEOUT_MS) {
  const root = new URL(backendBase(base));
  const endpoint = (id?: string) => new URL(`cars${id ? `/${encodeURIComponent(id)}` : ''}`, root).href;
  async function request(url: string, init?: RequestInit, json = false): Promise<unknown> {
    const controller = new AbortController();
    const timeoutMs = !init?.method || init.method === 'GET' ? readTimeoutMs : REQUEST_TIMEOUT_MS;
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const warning = init?.method && init.method !== 'GET' ? ' A timed-out change may have reached the server: refresh before retrying.' : '';
    try {
      const response = await transport(url, { ...init, signal: controller.signal, headers: { Accept: 'application/hal+json, application/json', ...(init?.body ? { 'Content-Type': 'application/json' } : {}) } });
      if (!response.ok) {
        if (response.status === 502 && response.headers.get('content-type')?.includes('application/json')) {
          const detail = await response.json().catch(() => null) as { code?: string; reason?: string } | null;
          if (detail?.code === 'API_UNREACHABLE') throw new ApiUnavailableError(`Cannot reach the course API from the local server (${detail.reason || 'network error'}). Check internet access or VPN and try again.${warning}`);
        }
        if (response.status >= 500) throw new ApiUnavailableError(`The API is unavailable (HTTP ${response.status}).${warning}`);
        throw new ApiRequestError(`Server returned ${response.status}. ${response.status === 404 ? 'The car may have been removed. Refresh the list.' : 'Please try again.'}`);
      }
      return json ? await response.json() : undefined;
    } catch (error) {
      if (error instanceof ApiRequestError || error instanceof ApiUnavailableError) throw error;
      if (controller.signal.aborted) throw new ApiUnavailableError(`The API did not respond within ${timeoutMs / 1000} seconds. Try again.${warning}`);
      if (error instanceof SyntaxError) throw new Error('The API returned invalid JSON. Check the API base URL.');
      throw new ApiUnavailableError(`Cannot reach the API at ${root.origin}. Check the connection and API base URL.${warning}`);
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
export const api = createAutoFallbackApi(createApi(API_BASE, fetch, 8000));
```

### src/fallback.ts

```ts
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
import { version } from '../package.json';
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
  const busy = saving.isPending || removing.isPending || list.isFetching;
  const cars = selectCars(list.data || [], query, sort, direction);
  const openEditor = (car?: Car) => { saving.reset(); setNotice(''); setEditor({ car }); };
  const openDelete = (car: Car) => { removing.reset(); setNotice(''); setDeleting(car); };
  return <>
    <header><div className="header-inner"><span className="logo" aria-hidden="true">CS</span><div><p className="eyebrow">THE SHOWROOM</p><h1>Car Shop</h1></div><span className="header-tag">Inventory workspace</span></div></header>
    <main>
      <section className="heading"><div><p className="eyebrow">STOCK MANAGEMENT</p><h2>Your next drive starts here.</h2><p className="muted">Browse the collection. Keep every detail up to date.</p></div><button className="primary" disabled={busy || !list.data} onClick={() => openEditor()}>+ Add car</button></section>
      <p className={api.isDemo ? 'environment demo-mode' : 'environment'} role="status">{api.isDemo ? 'LOCAL DEMO — course API unavailable. Changes stay in this tab and are never uploaded. Reload the page to retry the API; demo edits will reset.' : BACKEND_BASE.startsWith('http://127.0.0.1') || BACKEND_BASE.startsWith('http://localhost') ? 'Local practice backend' : `${list.isSuccess ? 'Connected to' : 'Using'} shared course backend — saved changes affect its inventory.`}</p>
      <section className="inventory" aria-label="Car inventory">
        <div className="toolbar"><div className="search"><label htmlFor="search">Search cars</label><input id="search" type="search" placeholder="Brand, model, color, fuel, year or price" value={query} onChange={event => setQuery(event.target.value)}/></div><div><label htmlFor="sort">Sort by</label><select id="sort" value={sort} onChange={event => setSort(event.target.value as Field)}>{fields.map(key => <option key={key} value={key}>{labels[key]}</option>)}</select></div><button aria-label={`Sort ${direction === 'asc' ? 'descending' : 'ascending'}`} onClick={() => setDirection(direction === 'asc' ? 'desc' : 'asc')}>{direction === 'asc' ? '↑ Ascending' : '↓ Descending'}</button><button disabled={list.isFetching || busy} onClick={() => { setNotice(''); void list.refetch(); }}>Refresh</button></div>
        <div className="list-status" aria-live="polite">{list.isFetching ? 'Loading inventory…' : `${cars.length} of ${list.data?.length ?? 0} cars`}{notice && <span className="success">{notice}</span>}</div>
        {list.isError && <div className="error" role="alert"><strong>Inventory could not be refreshed.</strong><p>{list.error.message}</p><button disabled={list.isFetching} onClick={() => void list.refetch()}>Try again</button></div>}
        {list.data && !cars.length && <div className="empty"><h3>{list.data.length ? 'No matching cars' : 'The showroom is empty'}</h3><p>{list.data.length ? 'Try another search or clear the filter.' : 'Add the first car to begin.'}</p>{query && <button onClick={() => setQuery('')}>Clear search</button>}</div>}
        {!!cars.length && <div className="table-wrap"><table><caption className="sr-only">Cars in stock. Use the sort controls above to change order.</caption><thead><tr>{fields.map(key => <th scope="col" key={key} aria-sort={sort === key ? direction === 'asc' ? 'ascending' : 'descending' : 'none'}>{labels[key]}{sort === key ? direction === 'asc' ? ' ↑' : ' ↓' : ''}</th>)}<th scope="col">Actions</th></tr></thead><tbody>{cars.map(car => <tr key={car.id}>{fields.map(key => <td key={key} data-label={labels[key]}>{key === 'price' ? car.price.toLocaleString('en-GB', { maximumFractionDigits: 2 }) : car[key]}</td>)}<td data-label="Actions"><div className="row-actions"><button disabled={busy} aria-label={`Edit ${car.brand} ${car.model}`} onClick={() => openEditor(car)}>Edit</button><button className="danger-text" disabled={busy} aria-label={`Delete ${car.brand} ${car.model}`} onClick={() => openDelete(car)}>Delete</button></div></td></tr>)}</tbody></table></div>}
      </section>
      <footer>Car Shop / React + TypeScript · v{version}<span>Search covers all six car fields.</span></footer>
    </main>
    {editor && <CarEditor car={editor.car} busy={saving.isPending} error={saving.error?.message || ''} close={() => setEditor(null)} save={value => saving.mutate({ value, id: editor.car?.id })}/>}
    {deleting && <Modal title="Delete car?" busy={removing.isPending} close={() => setDeleting(null)}><p>Remove <strong>{deleting.brand} {deleting.model}</strong> ({deleting.modelYear}, {deleting.color}) from inventory?</p><p className="muted">This action cannot be undone.</p>{removing.error && <p className="error" role="alert">{removing.error.message}</p>}<div className="dialog-actions"><button disabled={removing.isPending} onClick={() => setDeleting(null)}>Cancel</button><button className="danger" disabled={removing.isPending} onClick={() => removing.mutate(deleting.id)}>{removing.isPending ? 'Deleting…' : 'Delete car'}</button></div></Modal>}
  </>;
}
```

### src/styles.css

```css

:root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#172e28;background:#f5f6f2;font-synthesis:none}*{box-sizing:border-box}body{margin:0}button,input,select{font:inherit}button{cursor:pointer;border:1px solid #cad5ce;background:white;border-radius:8px;padding:10px 14px;min-height:44px;color:#25473d;font-weight:600}button:hover{background:#edf4ef}button:disabled{opacity:.55;cursor:wait}button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #bf8b32;outline-offset:3px}.primary{background:#174b3e;border-color:#174b3e;color:white}.primary:hover{background:#256351}.danger{background:#a12d37;color:white;border-color:#a12d37}.danger:hover{background:#7a1f27}.danger-text{color:#9b2933}header{background:#123d33;color:#fff}.header-inner{max-width:1220px;margin:auto;display:flex;align-items:center;gap:16px;padding:26px 32px}.logo{display:grid;place-items:center;width:48px;height:48px;border:1px solid #91b6a3;border-radius:12px;color:#e2e8c9;font-weight:800}h1{font-size:27px;margin:3px 0 0}h2{font-size:clamp(25px,3vw,35px);letter-spacing:-.8px;margin:10px 0}h3{margin-top:0}.eyebrow{font-size:11px;font-weight:700;letter-spacing:2px;margin:0}.header-tag{margin-left:auto;font-size:13px;color:#c8dece}.muted{color:#60736b;line-height:1.6}.heading{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:38px 0 16px}.heading>div>p:last-child{margin-bottom:0}main{max-width:1220px;padding:0 32px;margin:auto}.environment{font-size:12px;color:#637369;margin:12px 0 24px}.inventory{background:white;border:1px solid #dfe5de;border-radius:14px;overflow:hidden;box-shadow:0 8px 32px #183f2910}.toolbar{display:flex;align-items:flex-end;gap:14px;padding:24px;border-bottom:1px solid #e5ebe5}.search{flex:1}label{display:block;font-size:12px;font-weight:700;margin-bottom:8px}input,select{width:100%;padding:11px 12px;min-height:44px;border:1px solid #c9d4cd;border-radius:8px;background:#fff;color:#172e28}.search input{background:#f8faf7}.list-status{padding:16px 24px;font-size:12px;display:flex;gap:20px;min-height:48px}.success{color:#206444;font-weight:700}.table-wrap{overflow-x:auto}table{width:100%;border-collapse:collapse;text-align:left;font-size:14px}th{font-size:11px;text-transform:uppercase;letter-spacing:.7px;background:#f4f7f2;color:#546a5f}th,td{padding:15px 20px;border-bottom:1px solid #e9eee7}td:first-child{font-weight:700}tbody tr:hover{background:#fafbf8}.row-actions{display:flex;gap:8px}.row-actions button{padding:6px 12px;font-size:12px}footer{display:flex;justify-content:space-between;gap:15px;font-size:11px;color:#6c7e71;padding:26px 0}.empty{text-align:center;padding:54px 20px;color:#60736b}.error{color:#8c242b;background:#fff1f1;border:1px solid #ecc4c7;border-radius:8px;padding:14px;margin:16px 24px;overflow-wrap:anywhere}.field-error{color:#a02730;font-size:12px;margin:6px 0}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}dialog{width:min(560px,calc(100% - 32px));max-height:calc(100dvh - 32px);border:0;border-radius:16px;padding:28px;box-shadow:0 24px 80px #092f3544;color:#172e28}dialog::backdrop{background:#102b26aa}dialog h2{font-size:25px}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.dialog-actions{display:flex;justify-content:flex-end;gap:12px;margin-top:26px}dialog .error{margin:18px 0 0}[aria-invalid="true"]{border-color:#a02730}@media(max-width:700px){main{padding:0 16px}.header-inner{padding:20px 16px}.header-tag{display:none}.heading{align-items:flex-start;flex-direction:column;padding-top:26px}.toolbar{padding:18px;display:grid;grid-template-columns:1fr 1fr}.search{grid-column:1/-1}.toolbar>button:last-child{grid-column:1/-1}.list-status{padding:16px 18px;flex-wrap:wrap}thead{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}table,tbody{display:block}tr{display:block;padding:12px 18px;border-top:1px solid #e2e9df}td{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:8px 0;border:0;overflow-wrap:anywhere}td:before{content:attr(data-label);font-size:12px;font-weight:500;color:#60736b;min-width:55px}td:first-child{font-size:18px}footer{flex-direction:column}.error{margin:16px}.form-grid{grid-template-columns:1fr}dialog{padding:22px}.dialog-actions{position:sticky;bottom:-22px;background:white;padding:14px 0;margin-top:12px}}

.environment:has(+.inventory) { line-height: 1.65; }
.demo-mode { color:#573c0b; background:#fff1c7; border:1px solid #d9ad4c; padding:14px 16px; border-radius:8px; font-size:13px; font-weight:600; }
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
await writeFile(join(payload, 'evidence/package-manifest.json'), JSON.stringify(manifest, null, 2));
const archiveName = `Car Shop — v${JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8')).version}.zip`;
const zip = resolve(root, 'delivery', archiveName);
await rm(zip, { force: true });
const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', 'Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory($env:CARSHOP_PAYLOAD, $env:CARSHOP_ZIP, [System.IO.Compression.CompressionLevel]::Optimal, $true)'], { env: { ...process.env, CARSHOP_PAYLOAD: payload, CARSHOP_ZIP: zip }, encoding: 'utf8' });
if (result.status !== 0) throw new Error(result.stderr);
const receipt = { archive: archiveName, sha256: createHash('sha256').update(await readFile(zip)).digest('hex'), fileCount: manifest.length + 1, builtAt: new Date().toISOString() };
await writeFile(resolve(root, 'delivery/receipt.json'), JSON.stringify(receipt, null, 2));
console.log(JSON.stringify(receipt));
```

### scripts/prepare-manual.mjs

```js
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

### tests/unit/fallback.test.ts

```ts
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
import { readFileSync } from 'node:fs';
const { version } = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
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
  await expect(page.locator('footer')).toContainText('v' + version);
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
    if (mode === 'error') await route.fulfill({status:403,body:'{}'});
    else await route.fulfill({contentType:'application/json',body:JSON.stringify({_embedded:{cars:[]}})});
  });
  await page.goto('/'); await expect(page.getByText('Loading inventory…')).toBeVisible();
  await expect(page.getByText('The showroom is empty',{exact:true})).toBeVisible();
  mode='error'; await page.getByRole('button',{name:'Refresh',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('403');
  mode='empty'; await page.getByRole('button',{name:'Try again',exact:true}).click(); await expect(page.getByRole('alert')).toHaveCount(0);
});
test('failed POST keeps form values; failed DELETE keeps car; busy prevents duplicate submit', async ({page}) => {
  await page.goto('/'); await expect(page.getByText('2 of 2 cars')).toBeVisible();
  await expect(page.locator('footer')).toContainText('v' + version);
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
  await expect(page.locator('footer')).toContainText('v' + version);
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
    else if (saved) await route.fulfill({status:403,body:'{}'});
    else await route.continue();
  });
  await page.getByRole('button',{name:'+ Add car',exact:true}).click(); await fill(page);
  await page.getByRole('button',{name:'Save car',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('Car added.',{exact:true})).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('Inventory could not be refreshed.');
});
test('unavailable API automatically enables local demo CRUD, stays local, resets on reload', async ({page}) => {
  const apiCalls: string[] = [];
  await page.route(`${local}**`, async route => {
    apiCalls.push(route.request().method());
    await route.fulfill({status:503,body:'{}'});
  });
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await expect(page.getByRole('status').filter({hasText:'LOCAL DEMO'})).toBeVisible();
  await expect(page.getByText('2 of 2 cars')).toBeVisible();
  await page.getByRole('button',{name:'+ Add car',exact:true}).click(); await fill(page);
  await page.getByRole('button',{name:'Save car',exact:true}).click();
  await expect(page.getByText('3 of 3 cars')).toBeVisible();
  await page.getByRole('button',{name:'Edit Practice Roadster',exact:true}).click();
  await page.getByRole('dialog').getByLabel('Model',{exact:true}).fill('Local Tourer');
  await page.getByRole('button',{name:'Save car',exact:true}).click();
  await expect(page.getByRole('button',{name:'Edit Practice Local Tourer',exact:true})).toBeVisible();
  await page.screenshot({path:'evidence/auto-fallback-mobile.png',fullPage:true});
  await page.getByRole('button',{name:'Delete Practice Local Tourer',exact:true}).click();
  await page.getByRole('button',{name:'Delete car',exact:true}).click();
  await expect(page.getByText('2 of 2 cars')).toBeVisible();
  await page.getByRole('button',{name:'Refresh',exact:true}).click();
  expect(apiCalls).toEqual(['GET']);
  await page.reload(); await expect(page.getByText('2 of 2 cars')).toBeVisible();
  expect(apiCalls).toEqual(['GET','GET']);
});
test('network abort and slow read enable fallback; healthy reload returns to real API', async ({page}) => {
  await page.route(`${local}**`, route => route.abort('failed'));
  await page.goto('/'); await expect(page.getByRole('status').filter({hasText:'LOCAL DEMO'})).toBeVisible();
  await page.unroute(`${local}**`);
  await page.reload(); await expect(page.getByText('2 of 2 cars')).toBeVisible();
  await expect(page.getByText('LOCAL DEMO',{exact:false})).toHaveCount(0);
  await page.route(`${local}**`, async route => {
    await new Promise(resolve => setTimeout(resolve,10000));
    await route.fulfill({status:503,body:'{}'}).catch(() => {});
  });
  await page.reload();
  await expect(page.getByRole('status').filter({hasText:'LOCAL DEMO'})).toBeVisible({timeout:12000});
  await expect(page.getByText('2 of 2 cars')).toBeVisible();
});
```

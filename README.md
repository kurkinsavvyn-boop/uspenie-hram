# Храм Успения Пресвятой Богородицы в Челюскинском — сайт

Статический сайт прихода на [Astro](https://astro.build) с лёгкой админкой [Decap CMS](https://decapcms.org). Дизайн — в тёплой «иконной» эстетике (тёмный фон, золото, кремовый свет), шрифты Forum + Onest размещены локально (без внешнего CDN).

## Структура

- `src/pages/` — страницы сайта (`.astro`)
- `src/content/news/` — новости (Markdown, правятся через админку)
- `src/data/site.json` — контакты и общие настройки (правятся через админку)
- `src/data/schedule.json` — расписание богослужений (правится через админку)
- `src/layouts/Base.astro` — общий каркас (шапка, меню, подвал)
- `src/styles/global.css` — дизайн-система
- `public/admin/` — админка Decap CMS (`/admin/`)
- `public/images/` — изображения

## Локальный запуск

```sh
npm install
npm run dev
```

Сайт откроется на `http://localhost:4321`.

## Сборка

```sh
npm run build      # результат в dist/
npm run preview    # предпросмотр собранного сайта
```

## Админка

Админка доступна по адресу `/admin/` (например, `https://uspenie-hram.org/admin/`).

### Разово: подключить вход

1. Зарегистрируйтесь на [Decap Turbo](https://turbo.decapcms.org/signup) — Free-план (1 сайт, 1 редактор) бесплатен.
2. Создайте организацию → подключите GitHub → создайте сайт (укажите этот репозиторий).
3. На вкладке **Overview** скопируйте **Site ID** (UUID) и вставьте его в `public/admin/config.yml` в поле `turbo_site_id`.
4. В списке **admin interface URLs** укажите адрес админки, например `https://uspenie-hram.org/admin/`.

После этого в админке появится кнопка **Login with Turbo**.

### Локальная проверка админки без Turbo

```sh
npx decap-server
npm run dev
```

Откройте `http://localhost:4321/admin/`.

## Деплой на GitHub Pages

1. Создайте репозиторий на GitHub и запушьте этот проект.
2. В настройках репозитория: **Settings → Pages → Source = GitHub Actions**.
3. Пуш в ветку `main` запускает сборку и публикацию (см. `.github/workflows/deploy.yml`).

### Кастомный домен

Подключите `uspenie-hram.org` в **Settings → Pages → Custom domain**. Так как в `astro.config.mjs` задан `base: '/'`, сайт корректно соберётся под корневой домен.

> Если временно публикуете на подпапке `username.github.io/uspenie-hram/`, задайте в `astro.config.mjs` `base: '/uspenie-hram/'`.

## Подключение оплаты треб (ЮKassa)

Сейчас форма «Заказать требу» (`src/pages/treby.astro`) отправляет заявку на email храма. Когда будете готовы подключить онлайн-оплату ЮKassa, сюда добавляется платёжный шаг — структура это предусматривает.

## Полезные ссылки

- [Документация Astro](https://docs.astro.build)
- [Документация Decap CMS](https://decapcms.org/docs/)
- [Decap Turbo](https://decapcms.org/turbo/)

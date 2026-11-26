# Бэкенд «Подать записку» (Cloudflare Worker)

Принимает записку с сайта, отправляет её в Telegram прихода и создаёт платёж в **ЮKassa**. После оплаты возвращает на `/spasibo/`.

## Что нужно

- Аккаунт [Cloudflare](https://dash.cloudflare.com) (бесплатный).
- Магазин в **ЮKassa** с доступом к API (shopId + секретный ключ).
- Telegram-бот и чат, куда приходят записки (токен + chat_id).

## Деплой

```sh
npm i -g wrangler
cd worker
wrangler login
wrangler secret put YOOKASSA_SHOP_ID
wrangler secret put YOOKASSA_SECRET_KEY
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put TELEGRAM_CHAT_ID
wrangler deploy
```

После деплоя получите URL вида `https://uspenie-zapiski.<ваш>.workers.dev`.

## Подключить к сайту

При сборке сайта задайте адрес воркера:

```sh
PUBLIC_API_BASE="https://uspenie-zapiski.<ваш>.workers.dev" npm run build
```

(в GitHub Actions — через `env: PUBLIC_API_BASE: ...` в `.github/workflows/deploy.yml`).

## Вебхук ЮKassa (для оповещения об оплате)

В личном кабинете ЮKassa → Интеграция → HTTP-уведомления укажите:

```
https://uspenie-zapiski.<ваш>.workers.dev/yookassa/webhook
```

Событие: `payment.succeeded`.

## Локальная проверка без оплаты

```sh
node server/dev.mjs   # из корня проекта
npm run dev           # сайт проксирует /api на dev-сервер
```

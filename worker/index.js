// Cloudflare Worker: приём записок + оплата через ЮKassa + уведомление в Telegram.
// Деплой: см. worker/README.md
//
// Переменные окружения (секреты):
//   YOOKASSA_SHOP_ID      — shopId из личного кабинета ЮKassa
//   YOOKASSA_SECRET_KEY   — секретный ключ ЮKassa
//   TELEGRAM_BOT_TOKEN    — токен бота, куда приходят записки
//   TELEGRAM_CHAT_ID      — chat_id получателя (приходской чат/канал)
//   SITE_URL              — адрес сайта (для возврата после оплаты)
//   ALLOWED_ORIGIN        — домен сайта для CORS (по умолчанию *)

const PRICES = {
  'Простая записка': 50,
  'Проскомидия': 100,
  'Молебен': 150,
  'Сорокоуст': 300,
  'Годовое поминовение': 1000,
};

const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra },
  });

const cors = (env) => ({
  'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
});

async function notifyTelegram(env, text) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return;
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text, parse_mode: 'HTML', disable_web_page_preview: true }),
  });
}

function normalizeVid(vid, type) {
  if (vid === 'Молебен о здравии' || vid === 'Молебен' || vid === 'Панихида') return 'Молебен';
  return String(vid || '');
}

async function createPayment(env, amountRub, description) {
  const auth = btoa(`${env.YOOKASSA_SHOP_ID}:${env.YOOKASSA_SECRET_KEY}`);
  const body = {
    amount: { value: amountRub.toFixed(2), currency: 'RUB' },
    capture: true,
    confirmation: { type: 'redirect', return_url: `${env.SITE_URL || 'https://uspenie-hram.org'}/spasibo/` },
    description: description.slice(0, 128),
    metadata: { kind: 'zapiska' },
  };
  const res = await fetch('https://api.yookassa.ru/v3/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotence-Key': crypto.randomUUID(),
      Authorization: 'Basic ' + auth,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`YooKassa ${res.status}: ${t}`);
  }
  return res.json();
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const c = cors(env);
    if (request.method === 'OPTIONS') return new Response(null, { headers: c });

    const path = url.pathname.replace(/^\/api/, '');

    if (path === '/health') return json({ ok: true }, 200, c);

    if (path === '/note' && request.method === 'POST') {
      let data;
      try { data = await request.json(); } catch { return json({ error: 'Некорректный запрос' }, 400, c); }

      const names = Array.isArray(data.names)
        ? data.names.map((n) => String(n).trim()).filter(Boolean).slice(0, 10)
        : [];
      if (!names.length) return json({ error: 'Впишите хотя бы одно имя' }, 400, c);

      const vid = normalizeVid(data.vid, data.type);
      const price = PRICES[vid];
      if (!price) return json({ error: 'Неизвестный вид записки' }, 400, c);

      const type = data.type === 'upk' ? 'Об упокоении' : 'О здравии';
      const label = data.type === 'upk' && vid === 'Молебен' ? 'Панихида' : vid;
      const text = `📝 <b>Новая записка</b>\n<b>${type}</b> · ${label}\n${names.map((n) => '• ' + n).join('\n')}\nК оплате: ${price} ₽`;
      await notifyTelegram(env, text);

      // Оплата включается, когда заданы ключи ЮKassa; иначе — просто приём заявки
      if (env.YOOKASSA_SHOP_ID && env.YOOKASSA_SECRET_KEY) {
        try {
          const pay = await createPayment(env, price, `${type} — ${label}: ${names.join(', ')}`);
          return json({ ok: true, confirmation_url: pay.confirmation?.confirmation_url || null, payment_id: pay.id }, 200, c);
        } catch (e) {
          return json({ error: 'Оплата временно недоступна. Подайте записку в храме.' }, 502, c);
        }
      }
      return json({ ok: true, message: 'Записка отправлена. Спасибо!' }, 200, c);
    }

    if (path === '/yookassa/webhook' && request.method === 'POST') {
      let evt;
      try { evt = await request.json(); } catch { return json({ ok: true }, 200, c); }
      const obj = evt.object || {};
      if (evt.event === 'payment.succeeded') {
        await notifyTelegram(env, `✅ <b>Оплачено</b>: ${obj.description || ''}\nСумма: ${obj.amount?.value} ${obj.amount?.currency}`);
      }
      return json({ ok: true }, 200, c);
    }

    return json({ error: 'Not found' }, 404, c);
  },
};

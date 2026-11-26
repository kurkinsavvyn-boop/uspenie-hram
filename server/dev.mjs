// Локальный демо-API для проверки формы «Подать записку» без реальной оплаты.
// Запуск: node server/dev.mjs
// Сайт в dev берёт адрес из .env.development (PUBLIC_API_BASE=http://127.0.0.1:8787).
import http from 'node:http';

const PRICES = {
  'Простая записка': 50,
  'Проскомидия': 100,
  'Молебен': 150,
  'Сорокоуст': 300,
  'Годовое поминовение': 1000,
};

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); res.end(); return; }

  const pathname = new URL(req.url, 'http://x').pathname.replace(/^\/api/, '').replace(/\/$/, '');
  if (pathname === '/note' && req.method === 'POST') {
    let body = '';
    for await (const chunk of req) body += chunk;
    let d = {};
    try { d = JSON.parse(body); } catch {}
    const names = Array.isArray(d.names) ? d.names.filter(Boolean) : [];
    const price = PRICES[d.vid] ?? 0;
    if (!names.length) {
      res.writeHead(400, cors);
      res.end(JSON.stringify({ error: 'Впишите хотя бы одно имя' }));
      return;
    }
    console.log('\n📝 Демо-записка:', JSON.stringify({ ...d, price }, null, 2));
    res.writeHead(200, cors);
    res.end(JSON.stringify({ ok: true, message: `Демо-режим: записка принята (${price} ₽, оплата не подключена).` }));
    return;
  }

  res.writeHead(404, cors);
  res.end('{}');
});

server.listen(8787, '127.0.0.1', () => {
  console.log('Dev API: http://127.0.0.1:8787  (POST /note)');
});

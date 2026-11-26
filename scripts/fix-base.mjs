// Пост-обработка сборки для GitHub Pages в подпапке:
// Astro/Base сам префиксит только CSS/JS-ассеты, а «сырые» src/href (public-изображения,
// внутренние ссылки) — нет. Этот скрипт добавляет base ко всем корневым путям в HTML.
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE_PATH || '/';
if (BASE === '/') {
  console.log('fix-base: base = "/", пропускаю');
  process.exit(0);
}
const slug = BASE.replace(/^\/+|\/+$/g, '');
const dist = 'dist';
const skip = new RegExp(`^/(?:/|${slug}/)`);

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const attrRe = /\b(href|src|data-img|poster|content)="([^"]*)"/g;
let files = 0;
for (const file of walk(dist, [])) {
  let h = fs.readFileSync(file, 'utf8');
  h = h.replace(attrRe, (m, attr, val) => {
    if (!val.startsWith('/') || val.startsWith('//')) return m;
    if (skip.test(val)) return m;
    return `${attr}="${BASE}${val.slice(1)}"`;
  });
  fs.writeFileSync(file, h);
  files++;
}
console.log(`fix-base: ${BASE} проставлен в ${files} html`);

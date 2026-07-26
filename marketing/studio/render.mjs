// ─────────────────────────────────────────────────────────────────────────────
// Карусель-студия Tournable.
//
// Превращает JSON-описание поста в готовую пачку PNG для Instagram / Threads /
// Telegram и в текст подписи с хештегами. Правишь JSON — получаешь карусель;
// ничего не двигаешь мышкой, ничего не платишь.
//
// ── Запуск ───────────────────────────────────────────────────────────────────
//   node marketing/studio/render.mjs                 отрисовать все посты
//   node marketing/studio/render.mjs kz-3-oshibki    отрисовать один пост
//   node marketing/studio/render.mjs --html          только HTML, без PNG
//
// Результат: marketing/out/<slug>/01.png … + caption.txt
//
// ── Зависимость ──────────────────────────────────────────────────────────────
// Для PNG нужен Playwright (бесплатный, ставится один раз):
//   npm i -D playwright && npx playwright install chromium
// Без него скрипт всё равно соберёт HTML — их можно открыть в браузере
// и снять скриншот вручную.
// ─────────────────────────────────────────────────────────────────────────────

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, resolve, basename } from 'node:path'
import { pathToFileURL } from 'node:url'

const ROOT = process.cwd()
const POSTS_DIR = join(ROOT, 'marketing', 'studio', 'posts')
const OUT_DIR = join(ROOT, 'marketing', 'out')
const LOGO = join(ROOT, 'public', 'logo-white.png')

const args = process.argv.slice(2)
const HTML_ONLY = args.includes('--html')
const only = args.filter(a => !a.startsWith('--'))

// ── Палитра ──────────────────────────────────────────────────────────────────
// Взята из src/lib/sports.ts, чтобы карточки в ленте и продукт на скринах
// читались как одна система, а не как два разных бренда.
const ACCENTS = {
  green:  { c: '#059669', d: '#047857', soft: '#10b981', deep: 'linear-gradient(150deg,#062e23 0%,#0f5132 48%,#04231b 100%)' },
  blue:   { c: '#2563eb', d: '#1d4ed8', soft: '#3b82f6', deep: 'linear-gradient(150deg,#0a1733 0%,#1e3a8a 48%,#0b1024 100%)' },
  orange: { c: '#ea580c', d: '#c2410c', soft: '#f97316', deep: 'linear-gradient(150deg,#2c1108 0%,#7c2d12 48%,#2a1004 100%)' },
  violet: { c: '#7c3aed', d: '#6d28d9', soft: '#8b5cf6', deep: 'linear-gradient(150deg,#1e0f42 0%,#5b21b6 48%,#25084a 100%)' },
  black:  { c: '#1f2937', d: '#0b0f17', soft: '#4b5563', deep: 'linear-gradient(150deg,#05070c 0%,#111827 48%,#03050a 100%)' },
}

const SIZES = {
  post:   { w: 1080, h: 1350 },   // Instagram / Threads, лента 4:5
  story:  { w: 1080, h: 1920 },   // Stories, Reels-обложка
  square: { w: 1080, h: 1080 },   // Telegram, VK
}

// ── Иконки (инлайн SVG вместо эмодзи — правило проекта) ──────────────────────
const ICONS = {
  trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M6 4h12v5a6 6 0 0 1-12 0V4ZM10 20h4M12 15v5"/>',
  check:  '<path d="m20 6-11 11-5-5"/>',
  x:      '<path d="M18 6 6 18M6 6l12 12"/>',
  zap:    '<path d="M13 2 3 14h8l-1 8 10-12h-8l1-8Z"/>',
  clock:  '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  users:  '<path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 20v-2a4 4 0 0 0-3-3.9"/>',
  chart:  '<path d="M3 3v17a1 1 0 0 0 1 1h17"/><path d="m7 15 4-5 3 3 5-7"/>',
  arrow:  '<path d="M5 12h14M13 6l6 6-6 6"/>',
}

const icon = (name, size = 44, stroke = 'currentColor') =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] ?? ICONS.check}</svg>`

const esc = (s = '') => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Заголовки задаются текстом, а не подбором кегля вручную: длинная фраза
// сама садится на меньший размер и не вылезает за край слайда.
function fit(text, base, steps) {
  const len = String(text ?? '').length
  let size = base
  for (const [limit, px] of steps) if (len > limit) size = px
  return ` style="font-size:${size}px"`
}
const fitH1 = (t) => fit(t, 112, [[45, 96], [62, 82], [80, 70], [104, 60]])
const fitH2 = (t) => fit(t, 76, [[34, 66], [48, 58], [64, 50]])

// ── Базовый CSS ──────────────────────────────────────────────────────────────
function css(a, size) {
  return `
  @font-face { font-family: 'GeistLocal'; src: url('${pathToFileURL(join(ROOT, 'assets', 'Geist-Regular.ttf')).href}'); font-weight: 100 900; }
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { width:${size.w}px; height:${size.h}px; }
  body {
    font-family: 'Inter', 'GeistLocal', 'Segoe UI', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    color: #fff;
    background: ${a.deep};
    position: relative;
    overflow: hidden;
  }
  /* Мягкое световое пятно — глубина без картинок и без стоков. */
  body::before {
    content:''; position:absolute; inset:-20%;
    background: radial-gradient(60% 40% at 78% 8%, ${a.c}55 0%, transparent 62%),
                radial-gradient(50% 35% at 12% 92%, ${a.soft}33 0%, transparent 60%);
    pointer-events:none;
  }
  .slide { position:relative; width:100%; height:100%; padding:96px 88px; display:flex; flex-direction:column; }
  .kicker { display:flex; align-items:center; gap:20px; font-size:30px; letter-spacing:.16em;
            text-transform:uppercase; color:${a.soft}; font-weight:600; }
  .kicker::after { content:''; flex:1; height:2px; background:linear-gradient(90deg, ${a.soft}88, transparent); }
  .num { font-variant-numeric: tabular-nums; font-weight:700; }
  h1 { font-size:112px; line-height:1.02; font-weight:800; letter-spacing:-.035em; }
  h2 { font-size:76px;  line-height:1.08; font-weight:750; letter-spacing:-.03em; }
  .sub { font-size:40px; line-height:1.35; color:#ffffffb0; font-weight:400; }
  .body { font-size:44px; line-height:1.4; color:#ffffffd8; font-weight:400; }
  .grow { flex:1; }
  /* Смысловой блок слайда центрируется по вертикали: короткий список не
     прилипает к верхнему краю, длинный — не упирается в низ. */
  .mid { flex:1; display:flex; flex-direction:column; justify-content:center; }
  .stack > * + * { margin-top:36px; }
  .brand { display:flex; align-items:center; gap:20px; }
  .brand img { height:52px; width:auto; opacity:.95; }
  .brand .url { font-size:30px; color:#ffffff9a; letter-spacing:.02em; }
  .pageno { position:absolute; right:88px; bottom:96px; font-size:28px; color:#ffffff70;
            font-variant-numeric: tabular-nums; }

  /* Крупная цифра */
  .stat { font-size:260px; font-weight:850; letter-spacing:-.05em; line-height:.92;
          background:linear-gradient(180deg,#fff 30%, ${a.soft} 140%);
          -webkit-background-clip:text; background-clip:text; color:transparent; }

  /* Список пунктов */
  .list { display:flex; flex-direction:column; gap:34px; }
  .item { display:flex; gap:28px; align-items:flex-start; }
  .bullet { flex:0 0 66px; height:66px; border-radius:20px; display:flex; align-items:center;
            justify-content:center; background:${a.c}2e; border:2px solid ${a.c}66; color:${a.soft}; }
  .item .t { font-size:40px; line-height:1.3; font-weight:500; color:#fff; padding-top:6px; }
  .item .t small { display:block; font-size:32px; font-weight:400; color:#ffffff9e; margin-top:10px; line-height:1.35; }

  /* Скрин продукта в рамке */
  .frame { border-radius:34px; overflow:hidden; background:#0b0f17;
           border:2px solid #ffffff1f; box-shadow:0 50px 120px -30px #000000cc; }
  .frame .bar { height:60px; display:flex; align-items:center; gap:12px; padding:0 26px; background:#111827; }
  .frame .dot { width:14px; height:14px; border-radius:50%; background:#ffffff26; }
  .frame img { display:block; width:100%; height:auto; }
  .shotcap { font-size:32px; color:#ffffffa8; margin-top:28px; line-height:1.35; }
  /* Заглушка вместо неснятого скрина: слайд остаётся собранным, а в консоли
     печатается список того, что осталось доснять. */
  .shot-missing { height:520px; display:flex; align-items:center; justify-content:center;
                  text-align:center; padding:0 60px; color:#ffffff5c; font-size:32px; line-height:1.4; }

  /* Цитата */
  .quote { font-size:58px; line-height:1.24; font-weight:600; letter-spacing:-.02em; }
  .quote::before { content:'«'; color:${a.soft}; }
  .quote::after { content:'»'; color:${a.soft}; }
  .who { font-size:32px; color:#ffffff9e; margin-top:36px; }

  /* Финальный призыв */
  .cta { display:inline-flex; align-items:center; gap:20px; align-self:flex-start;
         background:#fff; color:#0b0f17; font-size:38px; font-weight:650;
         padding:30px 46px; border-radius:22px; }
  .free { font-size:32px; color:#ffffffa8; margin-top:28px; }
  `
}

// ── Рендер одного слайда в HTML ──────────────────────────────────────────────
function renderSlide(slide, ctx) {
  const { accent: a, index, total, brandUrl } = ctx
  const kicker = slide.kicker
    ? `<div class="kicker"><span class="num">${esc(slide.kicker)}</span></div>` : ''
  const pageno = total > 1 && slide.type !== 'cover'
    ? `<div class="pageno">${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}</div>` : ''
  const brand = `<div class="brand"><img src="${pathToFileURL(LOGO).href}" alt=""><span class="url">${esc(brandUrl)}</span></div>`

  let inner = ''

  switch (slide.type) {
    case 'cover':
      inner = `
        ${kicker}
        <div class="mid">
          <div class="stack">
            <h1${fitH1(slide.title)}>${esc(slide.title)}</h1>
            ${slide.subtitle ? `<div class="sub">${esc(slide.subtitle)}</div>` : ''}
          </div>
        </div>
        ${brand}`
      break

    case 'text':
      inner = `
        ${kicker}
        <div class="mid">
          <div class="stack">
            <h2${fitH2(slide.title)}>${esc(slide.title)}</h2>
            ${slide.body ? `<div class="body">${esc(slide.body)}</div>` : ''}
          </div>
        </div>
        ${pageno}`
      break

    case 'list':
      inner = `
        ${kicker}
        <div class="mid">
          <h2${fitH2(slide.title)}>${esc(slide.title)}</h2>
          <div class="list" style="margin-top:60px">
            ${(slide.items ?? []).map(it => {
              const [t, s] = Array.isArray(it) ? it : [it, null]
              return `<div class="item">
                <div class="bullet">${icon(slide.icon ?? 'check', 34)}</div>
                <div class="t">${esc(t)}${s ? `<small>${esc(s)}</small>` : ''}</div>
              </div>`
            }).join('')}
          </div>
        </div>
        ${pageno}`
      break

    case 'stat':
      inner = `
        ${kicker}
        <div class="mid">
          <div class="stat">${esc(slide.value)}</div>
          <div class="stack" style="margin-top:40px">
            <h2 style="font-size:60px">${esc(slide.title)}</h2>
            ${slide.body ? `<div class="sub">${esc(slide.body)}</div>` : ''}
          </div>
        </div>
        ${pageno}`
      break

    case 'screenshot': {
      const src = slide.src ? pathToFileURL(resolve(ROOT, slide.src)).href : ''
      const missing = !src || !existsSync(resolve(ROOT, slide.src ?? ''))
      inner = `
        ${kicker}
        <div class="mid">
          <h2${fitH2(slide.title)}>${esc(slide.title)}</h2>
          <div style="margin-top:56px">
            <div class="frame">
              <div class="bar"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>
              ${missing
                ? `<div class="shot-missing">нет скрина: ${esc(slide.src ?? 'поле "src" не задано')}</div>`
                : `<img src="${src}" alt="">`}
            </div>
            ${slide.caption ? `<div class="shotcap">${esc(slide.caption)}</div>` : ''}
          </div>
        </div>
        ${pageno}`
      break
    }

    case 'quote':
      inner = `
        ${kicker}
        <div class="mid">
          <div class="quote">${esc(slide.text)}</div>
          ${slide.who ? `<div class="who">${esc(slide.who)}</div>` : ''}
        </div>
        ${pageno}`
      break

    case 'cta':
      inner = `
        ${kicker}
        <div class="mid">
          <div class="stack">
            <h2${fitH2(slide.title)}>${esc(slide.title)}</h2>
            ${slide.body ? `<div class="sub">${esc(slide.body)}</div>` : ''}
          </div>
          <div style="margin-top:56px">
            <div class="cta">${esc(slide.button ?? brandUrl)} ${icon('arrow', 34, '#0b0f17')}</div>
            ${slide.note ? `<div class="free">${esc(slide.note)}</div>` : ''}
          </div>
        </div>
        ${brand}`
      break

    default:
      inner = `<div class="body">неизвестный тип слайда: ${esc(slide.type)}</div>`
  }

  return `<div class="slide">${inner}</div>`
}

function renderHtml(slide, ctx) {
  return `<!doctype html><html lang="${ctx.lang}"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>${css(ctx.accent, ctx.size)}</style></head><body>${renderSlide(slide, ctx)}</body></html>`
}

// ── Подпись к посту ──────────────────────────────────────────────────────────
function renderCaption(post) {
  const lines = []
  if (post.caption) lines.push(post.caption.trim())
  if (post.cta) lines.push('', post.cta.trim())
  if (post.hashtags?.length) lines.push('', post.hashtags.map(h => (h.startsWith('#') ? h : `#${h}`)).join(' '))
  return lines.join('\n')
}

// ── Основной цикл ────────────────────────────────────────────────────────────
if (!existsSync(POSTS_DIR)) {
  console.error(`[studio] нет папки с постами: ${POSTS_DIR}`)
  process.exit(1)
}

const files = readdirSync(POSTS_DIR).filter(f => f.endsWith('.json'))
  .filter(f => !only.length || only.includes(basename(f, '.json')))

if (!files.length) {
  console.error(`[studio] постов не найдено${only.length ? ` по фильтру: ${only.join(', ')}` : ''}`)
  process.exit(1)
}

// Playwright подключаем лениво: без него студия всё равно собирает HTML.
let browser = null
if (!HTML_ONLY) {
  try {
    const { chromium } = await import('playwright')
    browser = await chromium.launch()
  } catch {
    console.log('[studio] playwright не найден — собираю только HTML.')
    console.log('[studio] чтобы получать PNG:  npm i -D playwright && npx playwright install chromium\n')
  }
}

let totalPng = 0
const missingShots = []
for (const file of files) {
  const post = JSON.parse(readFileSync(join(POSTS_DIR, file), 'utf8'))
  for (const s of post.slides) {
    if (s.type === 'screenshot' && (!s.src || !existsSync(resolve(ROOT, s.src)))) {
      missingShots.push(`${post.slug ?? basename(file, '.json')} → ${s.src ?? '(src не задан)'}`)
    }
  }
  const slug = post.slug ?? basename(file, '.json')
  const accent = ACCENTS[post.accent ?? 'green'] ?? ACCENTS.green
  const size = SIZES[post.size ?? 'post'] ?? SIZES.post
  const ctx = {
    accent, size,
    lang: post.lang ?? 'ru',
    total: post.slides.length,
    brandUrl: post.brandUrl ?? 'tournable.app',
  }

  const dir = join(OUT_DIR, slug)
  mkdirSync(dir, { recursive: true })

  const page = browser
    ? await browser.newPage({ viewport: { width: size.w, height: size.h }, deviceScaleFactor: 1 })
    : null

  for (let i = 0; i < post.slides.length; i++) {
    const html = renderHtml(post.slides[i], { ...ctx, index: i })
    const n = String(i + 1).padStart(2, '0')
    writeFileSync(join(dir, `${n}.html`), html, 'utf8')

    if (page) {
      // Именно goto по file://, а не setContent: страница, собранная через
      // setContent, живёт на origin about:blank, и Chromium блокирует ей
      // подгрузку локальных картинок — логотип и скрины продукта пропадали.
      await page.goto(pathToFileURL(join(dir, `${n}.html`)).href, { waitUntil: 'load' })
      // Даём подгрузиться шрифту — иначе первый слайд снимается системным.
      await page.evaluate(() => document.fonts.ready)
      await page.screenshot({ path: join(dir, `${n}.png`), type: 'png' })
      totalPng++
    }
  }
  if (page) await page.close()

  writeFileSync(join(dir, 'caption.txt'), renderCaption(post), 'utf8')
  console.log(`[studio] ${slug}: ${post.slides.length} слайдов${page ? ' → PNG' : ' → HTML'} + caption.txt`)
}

if (browser) await browser.close()
console.log(`\n[studio] готово. Папка: marketing/out/${totalPng ? `  (PNG: ${totalPng})` : ''}`)
if (!browser && !HTML_ONLY) {
  console.log('[studio] PNG не собраны — установите playwright (команда выше) и запустите снова.')
}
if (missingShots.length) {
  console.log(`\n[studio] осталось доснять скринов: ${missingShots.length}`)
  for (const m of missingShots) console.log(`  · ${m}`)
  console.log('  Снять: node scripts/seed-demo.mjs → npm run dev → скриншот нужного экрана.')
}

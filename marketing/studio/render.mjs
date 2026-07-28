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

// ── Фотографии ───────────────────────────────────────────────────────────────
// Реестр собирает fetch-photos.mjs. Он же помечает файлы, у которых лицензия
// требует указать автора: подпись выводится прямо на слайде, иначе публикация
// нарушает условия CC BY.
const PHOTOS_DIR = join(ROOT, 'marketing', 'photos')
const CREDITS_FILE = join(PHOTOS_DIR, 'credits.json')
const PHOTO_CREDITS = existsSync(CREDITS_FILE)
  ? JSON.parse(readFileSync(CREDITS_FILE, 'utf8'))
  : []

function photoFor(name) {
  if (!name) return null
  const entry = PHOTO_CREDITS.find(c => c.file === name || c.slot === name)
  if (!entry) return null
  const file = join(PHOTOS_DIR, entry.file)
  if (!existsSync(file)) return null
  return {
    url: pathToFileURL(file).href,
    credit: entry.attributionRequired ? `${entry.author} · ${entry.license}` : null,
  }
}

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
  chevrons:'<path d="m7 6 6 6-6 6M14 6l6 6-6 6"/>',
  warn:   '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
  star:   '<path d="m12 2 2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z"/>',
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
  /* Угловые элементы описываются с префиксом .slide, а не просто по классу:
     правило .slide > * имеет ту же специфичность и, стоя ниже, сбрасывало бы
     им position:absolute — подпись и нумерация уезжали в поток. */
  .slide .pageno { position:absolute; right:88px; bottom:54px; font-size:26px; color:#ffffff70;
            font-variant-numeric: tabular-nums; z-index:2; }

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

  /* ── Мокап смартфона ──
     Геометрия пересчитана из реального устройства 430×932 CSS-пикселей
     (соотношение 2.167) с коэффициентом 340/430. Раньше экран был 368×610 —
     соотношение 1.66, из-за чего кадр обрезался по высоте и выглядел как
     неправильный телефон.

     Строка статуса и полоса жеста вынесены В ПОТОК над и под кадром, а не
     положены поверх него. Playwright снимает страницу без вырезов, поэтому
     любой островок, наложенный сверху, закрыл бы реальное содержимое шапки. */
  .phone { width:364px; margin:0 auto; position:relative;
           border-radius:56px; padding:12px; background:linear-gradient(160deg,#39424f,#0b0f17 62%);
           box-shadow:0 60px 130px -34px #000000e6, 0 0 0 2px #ffffff1f inset; }
  .phone .screen { position:relative; width:340px; height:737px; overflow:hidden;
                   border-radius:44px; background:#047857;
                   display:flex; flex-direction:column; }
  /* Цвет строки статуса совпадает с шапкой приложения (#047857) — переход
     от рамки к содержимому получается бесшовным, как на живом телефоне. */
  .phone .statusbar { position:relative; height:47px; flex:0 0 47px; background:#047857; }
  .phone .island { position:absolute; top:9px; left:50%; transform:translateX(-50%);
                   width:99px; height:29px; border-radius:15px; background:#05070b; }
  .phone .sigs { position:absolute; right:22px; top:19px; display:flex; align-items:flex-end; gap:3px; }
  .phone .sigs i { display:block; width:4px; background:#ffffffd8; border-radius:1px; }
  .phone .sigs i:nth-child(1) { height:5px } .phone .sigs i:nth-child(2) { height:8px }
  .phone .sigs i:nth-child(3) { height:11px } .phone .sigs i:nth-child(4) { height:14px }
  .phone .shotwrap { flex:1; min-height:0; overflow:hidden; }
  .phone .shotwrap img { display:block; width:100%; height:100%;
                         object-fit:cover; object-position:top center; }
  .phone .homebar { flex:0 0 27px; background:#ffffff; position:relative; }
  .phone .homebar::after { content:''; position:absolute; left:50%; bottom:8px;
                           transform:translateX(-50%); width:112px; height:5px;
                           border-radius:3px; background:#00000038; }
  .phone .btn-r { position:absolute; right:-3px; top:210px; width:3px; height:96px;
                  border-radius:2px; background:#ffffff33; }
  .phone .btn-l { position:absolute; left:-3px; top:186px; width:3px; height:60px;
                  border-radius:2px; background:#ffffff33; }

  /* ── Мокап десктопа ──
     Второй вариант того же поста: часть аудитории работает с компьютера,
     и таблица на широком экране им понятнее. */
  .win { border-radius:20px; overflow:hidden; background:#0b0f17;
         border:1px solid #ffffff24; box-shadow:0 50px 120px -32px #000000e0; }
  .win .bar { height:42px; display:flex; align-items:center; gap:9px; padding:0 18px; background:#141b26; }
  .win .dot { width:11px; height:11px; border-radius:50%; background:#ffffff2b; }
  .win .shotwrap { height:560px; overflow:hidden; }
  .win .shotwrap img { display:block; width:100%; height:100%;
                       object-fit:cover; object-position:top center; }

  .shotcap { font-size:30px; color:#ffffffa8; margin-top:26px; line-height:1.35; text-align:center; }
  /* Заглушка вместо неснятого кадра: слайд остаётся собранным, а в консоли
     печатается список того, что осталось доснять. */
  .shot-missing { height:100%; display:flex; align-items:center; justify-content:center;
                  text-align:center; padding:0 40px; color:#ffffff5c; font-size:28px; line-height:1.4; }

  /* ── Фотофон ── */
  .photo-bg { position:absolute; inset:0; z-index:0; }
  .photo-bg img { width:100%; height:100%; object-fit:cover; }
  /* Три слоя поверх фото: затемнение снизу под текст, общий брендовый тон
     и лёгкое обесцвечивание — иначе чужая палитра спорит с нашей. */
  .photo-bg::after { content:''; position:absolute; inset:0;
    background:
      linear-gradient(180deg, #04120ddd 0%, #04120d99 30%, #04120dee 78%, #04120dfa 100%),
      linear-gradient(160deg, ${a.c}4d 0%, transparent 55%); }
  /* Содержимое поднимается над фото. Фотослой и угловые элементы перечислены
     в :not явно: у правил одинаковая специфичность, и без этого они получали бы
     position:relative и уезжали в поток вместо своих углов. */
  .slide > *:not(.photo-bg):not(.pat):not(.pageno):not(.nextcue):not(.credit) {
    position:relative; z-index:1;
  }
  .slide .credit { position:absolute; left:88px; bottom:18px; z-index:2;
            font-size:17px; color:#ffffff5e; letter-spacing:.01em; }

  /* ── Рисованные фоны ──
     Фотобанк ограничен, и одна и та же картинка на нескольких постах бросается
     в глаза. Эти фоны рисуются кодом: их бесконечно много, они всегда в палитре
     бренда и не требуют лицензий. */
  .pat { position:absolute; inset:0; z-index:0; opacity:.5; }
  /* Разметка поля: центральный круг и линии. */
  .pat.pitch {
    background-image:
      radial-gradient(circle at 50% 42%, transparent 0 178px, ${a.soft}2e 178px 182px, transparent 183px),
      linear-gradient(90deg, transparent 0 calc(50% - 2px), ${a.soft}26 calc(50% - 2px) calc(50% + 2px), transparent calc(50% + 2px)),
      linear-gradient(180deg, transparent 0 calc(42% - 2px), ${a.soft}26 calc(42% - 2px) calc(42% + 2px), transparent calc(42% + 2px));
  }
  /* Турнирная сетка: вертикали и горизонтали, сходящиеся вправо. */
  .pat.bracket {
    background-image:
      repeating-linear-gradient(90deg, ${a.soft}1f 0 2px, transparent 2px 176px),
      repeating-linear-gradient(180deg, ${a.soft}17 0 2px, transparent 2px 132px);
    -webkit-mask-image:radial-gradient(120% 90% at 12% 50%, #000 10%, transparent 78%);
            mask-image:radial-gradient(120% 90% at 12% 50%, #000 10%, transparent 78%);
  }
  /* Мелкая сетка — под таблицы и цифры. */
  .pat.grid {
    background-image:
      repeating-linear-gradient(90deg, ${a.soft}14 0 1px, transparent 1px 54px),
      repeating-linear-gradient(180deg, ${a.soft}14 0 1px, transparent 1px 54px);
  }
  /* Лучи от угла — динамика, под «скорость» и «за 3 минуты». */
  .pat.rays {
    background-image:repeating-conic-gradient(from 200deg at 108% -8%,
      ${a.soft}1c 0deg 3deg, transparent 3deg 9deg);
  }
  /* Точечный растр — спокойный фон под длинный текст. */
  .pat.dots {
    background-image:radial-gradient(${a.soft}26 1.6px, transparent 1.7px);
    background-size:34px 34px;
  }
  /* Диагональные полосы — под списки ошибок и «до/после». */
  .pat.stripes {
    background-image:repeating-linear-gradient(118deg,
      ${a.soft}14 0 18px, transparent 18px 44px);
  }

  /* ── Сравнение «было / стало» ── */
  .cmp { display:grid; grid-template-columns:1fr 1fr; gap:26px; margin-top:52px; }
  .cmp .col { border-radius:24px; padding:30px 28px; border:2px solid #ffffff1c; background:#ffffff0a; }
  .cmp .col.good { border-color:${a.c}80; background:${a.c}1f; }
  .cmp .col h4 { margin:0 0 18px; font-size:26px; letter-spacing:.1em; text-transform:uppercase;
                 font-weight:700; color:#ffffff96; }
  .cmp .col.good h4 { color:${a.soft}; }
  .cmp .col ul { list-style:none; display:flex; flex-direction:column; gap:16px; }
  .cmp .col li { font-size:31px; line-height:1.3; color:#ffffffe0; display:flex; gap:12px; }
  .cmp .col li b { color:${a.soft}; font-weight:700; flex:none; }

  /* ── Плитки с числами ── */
  .tiles { display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-top:52px; }
  .tile { border-radius:24px; padding:30px 28px; background:#ffffff0d; border:1px solid #ffffff1f; }
  .tile .n { font-family:'Geist',Inter,sans-serif; font-size:78px; font-weight:800; line-height:1;
             letter-spacing:-.04em; color:${a.soft}; font-variant-numeric:tabular-nums; }
  .tile .l { font-size:27px; line-height:1.3; color:#ffffffb5; margin-top:14px; }

  /* ── Шаги ── */
  .steps { display:flex; flex-direction:column; gap:28px; margin-top:52px; }
  .step { display:flex; gap:26px; align-items:flex-start; }
  .step .no { flex:0 0 62px; height:62px; border-radius:50%; display:flex; align-items:center;
              justify-content:center; background:${a.c}; color:#fff; font-weight:800; font-size:28px;
              font-variant-numeric:tabular-nums; }
  .step .tx { font-size:34px; line-height:1.3; color:#fff; padding-top:10px; }
  .step .tx small { display:block; font-size:28px; color:#ffffff9e; margin-top:8px; line-height:1.35; }

  /* ── Указатель свайпа ── */
  .swipe { display:inline-flex; align-items:center; gap:14px; align-self:flex-start;
           padding:16px 26px; border-radius:100px; background:#ffffff14;
           border:1px solid #ffffff2b; font-size:26px; font-weight:600;
           letter-spacing:.02em; color:#ffffffdd; }
  .swipe svg { color:${a.soft}; }
  /* Тонкая стрелка внизу слева, напротив нумерации: подсказывает листать дальше. */
  .slide .nextcue { position:absolute; left:88px; bottom:54px; z-index:2;
             display:flex; align-items:center; gap:10px;
             font-size:22px; color:#ffffff6b; letter-spacing:.06em; text-transform:uppercase; }

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

  // Фон слайда: либо фотография из банка, либо рисованный паттерн. Фото имеет
  // приоритет, если задано и то и другое.
  const photo = photoFor(slide.photo)
  const photoLayer = photo ? `<div class="photo-bg"><img src="${photo.url}" alt=""></div>` : ''
  const creditLine = photo?.credit ? `<div class="credit">Фото: ${esc(photo.credit)}</div>` : ''
  const PATTERNS = ['pitch', 'bracket', 'grid', 'rays', 'dots', 'stripes']
  const patLayer = (!photo && PATTERNS.includes(slide.pattern))
    ? `<div class="pat ${slide.pattern}"></div>` : ''

  // Подсказка «листайте дальше»: на обложке — крупная, на остальных — тонкая
  // стрелка в углу. Последний слайд её не получает, листать дальше нечего.
  const isLast = index === total - 1
  const swipe = `<div class="swipe">${esc(slide.swipe ?? 'Листайте')} ${icon('chevrons', 30)}</div>`
  const nextcue = (total > 1 && !isLast && slide.type !== 'cover')
    ? `<div class="nextcue">Дальше ${icon('arrow', 22)}</div>` : ''

  let inner = ''

  switch (slide.type) {
    case 'cover':
      inner = `
        ${kicker}
        <div class="mid">
          <div class="stack">
            <h1${fitH1(slide.title)}>${esc(slide.title)}</h1>
            ${slide.subtitle ? `<div class="sub">${esc(slide.subtitle)}</div>` : ''}
            ${total > 1 ? swipe : ''}
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
      // Пост рендерится дважды: телефонный кадр и десктопный. Поле выбирается
      // по варианту, а не по типу слайда, поэтому текст остаётся общим.
      const rel = ctx.device === 'desktop' ? (slide.srcDesktop ?? slide.src) : slide.src
      const src = rel ? pathToFileURL(resolve(ROOT, rel)).href : ''
      const missing = !src || !existsSync(resolve(ROOT, rel ?? ''))
      const shotBody = missing
        ? `<div class="shot-missing">нет кадра: ${esc(rel ?? 'поле "src" не задано')}</div>`
        : `<img src="${src}" alt="">`

      const mockup = ctx.device === 'desktop'
        ? `<div class="win">
             <div class="bar"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>
             <div class="shotwrap">${shotBody}</div>
           </div>`
        : `<div class="phone">
             <div class="btn-l"></div><div class="btn-r"></div>
             <div class="screen">
               <div class="statusbar">
                 <div class="island"></div>
                 <div class="sigs"><i></i><i></i><i></i><i></i></div>
               </div>
               <div class="shotwrap">${shotBody}</div>
               <div class="homebar"></div>
             </div>
           </div>`

      inner = `
        ${kicker}
        <div class="mid">
          <h2${fitH2(slide.title)}>${esc(slide.title)}</h2>
          <div style="margin-top:44px">
            ${mockup}
            ${slide.caption ? `<div class="shotcap">${esc(slide.caption)}</div>` : ''}
          </div>
        </div>
        ${pageno}`
      break
    }

    case 'compare':
      inner = `
        ${kicker}
        <div class="mid">
          <h2${fitH2(slide.title)}>${esc(slide.title)}</h2>
          <div class="cmp">
            <div class="col">
              <h4>${esc(slide.leftTitle ?? 'Было')}</h4>
              <ul>${(slide.left ?? []).map(t => `<li><b>—</b><span>${esc(t)}</span></li>`).join('')}</ul>
            </div>
            <div class="col good">
              <h4>${esc(slide.rightTitle ?? 'Стало')}</h4>
              <ul>${(slide.right ?? []).map(t => `<li><b>+</b><span>${esc(t)}</span></li>`).join('')}</ul>
            </div>
          </div>
        </div>
        ${pageno}`
      break

    case 'numbers':
      inner = `
        ${kicker}
        <div class="mid">
          <h2${fitH2(slide.title)}>${esc(slide.title)}</h2>
          <div class="tiles">
            ${(slide.tiles ?? []).map(([n, l]) =>
              `<div class="tile"><div class="n">${esc(n)}</div><div class="l">${esc(l)}</div></div>`).join('')}
          </div>
          ${slide.body ? `<div class="sub" style="margin-top:36px">${esc(slide.body)}</div>` : ''}
        </div>
        ${pageno}`
      break

    case 'steps':
      inner = `
        ${kicker}
        <div class="mid">
          <h2${fitH2(slide.title)}>${esc(slide.title)}</h2>
          <div class="steps">
            ${(slide.steps ?? []).map((s, i) => {
              const [t, sub] = Array.isArray(s) ? s : [s, null]
              return `<div class="step">
                <div class="no">${i + 1}</div>
                <div class="tx">${esc(t)}${sub ? `<small>${esc(sub)}</small>` : ''}</div>
              </div>`
            }).join('')}
          </div>
        </div>
        ${pageno}`
      break

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

  return `<div class="slide">${photoLayer}${patLayer}${inner}${nextcue}${creditLine}</div>`
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

  // Если хоть у одного кадра задан десктопный дубль, пост собирается дважды.
  // Один и тот же текст, разные мокапы: телефон для ленты, десктоп для тех,
  // кто ведёт соревнование с компьютера.
  const hasDesktop = post.slides.some(s => s.type === 'screenshot' && s.srcDesktop)
  const variants = hasDesktop ? ['phone', 'desktop'] : ['phone']

  const page = browser
    ? await browser.newPage({ viewport: { width: size.w, height: size.h }, deviceScaleFactor: 1 })
    : null

  for (const device of variants) {
    const outSlug = device === 'desktop' ? `${slug}-desktop` : slug
    const dir = join(OUT_DIR, outSlug)
    mkdirSync(dir, { recursive: true })

    for (let i = 0; i < post.slides.length; i++) {
      const html = renderHtml(post.slides[i], { ...ctx, index: i, device })
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

    writeFileSync(join(dir, 'caption.txt'), renderCaption(post), 'utf8')
    const label = device === 'desktop' ? `${slug} (десктоп)` : slug
    console.log(`[studio] ${label}: ${post.slides.length} слайдов${page ? ' → PNG' : ' → HTML'} + caption.txt`)
  }
  if (page) await page.close()
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

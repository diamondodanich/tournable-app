// ─────────────────────────────────────────────────────────────────────────────
// Собирает страницу-ревью: все готовые карусели, подписи, сценарии роликов и
// список того, что заблокировано, в один самодостаточный HTML.
//
// Страница публикуется как приватный Artifact, поэтому внешние запросы в ней
// запрещены: картинки и шрифт вшиваются как data URI.
//
//   node marketing/studio/build-review.mjs   →  marketing/out/review.html
// ─────────────────────────────────────────────────────────────────────────────

import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs'
import { join, basename } from 'node:path'
import sharp from 'sharp'
import { clipNote } from './clip-notes.mjs'

const ROOT = process.cwd()
const POSTS_DIR = join(ROOT, 'marketing', 'studio', 'posts')
const OUT_DIR = join(ROOT, 'marketing', 'out')

// Ширина превью: вдвое меньше исходных 1080, текст на слайде остаётся читаемым,
// а страница целиком укладывается в разумный вес.
const PREVIEW_W = 430

// Постов стало 26; вшить все слайды целиком — это восемь мегабайт на страницу.
// Здесь показываем начало каждой карусели, полный набор живёт в разделе
// «Контент» внутри платформы.
const MAX_PREVIEW_SLIDES = 3

const esc = (s = '') => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// ── Шрифт ────────────────────────────────────────────────────────────────────
// Geist — тот же гротеск, что рисует OG-карточки продукта (src/lib/og.tsx).
const fontPath = join(ROOT, 'assets', 'Geist-Regular.ttf')
const fontData = existsSync(fontPath)
  ? `data:font/ttf;base64,${readFileSync(fontPath).toString('base64')}`
  : null

// ── Метаданные постов, которых нет в JSON ────────────────────────────────────
const AUDIENCE_LABEL = {
  ru: 'русский',
  kz: 'қазақша',
  en: 'english',
}

// ── Сборка данных ────────────────────────────────────────────────────────────
const postFiles = readdirSync(POSTS_DIR).filter(f => f.endsWith('.json')).sort()
const posts = []

for (const file of postFiles) {
  const post = JSON.parse(readFileSync(join(POSTS_DIR, file), 'utf8'))
  const slug = post.slug ?? file.replace(/\.json$/, '')
  const dir = join(OUT_DIR, slug)
  if (!existsSync(dir)) {
    console.log(`[review] пропуск ${slug}: не отрисован (node marketing/studio/render.mjs ${slug})`)
    continue
  }

  const allPngs = readdirSync(dir).filter(f => /^\d+\.png$/.test(f)).sort()
  const pngs = allPngs.slice(0, MAX_PREVIEW_SLIDES)
  const previews = []
  for (const png of pngs) {
    const buf = await sharp(join(dir, png)).resize({ width: PREVIEW_W }).webp({ quality: 70 }).toBuffer()
    previews.push(`data:image/webp;base64,${buf.toString('base64')}`)
  }

  const missing = post.slides
    .filter(s => s.type === 'screenshot' && (!s.src || !existsSync(join(ROOT, s.src))))
    .map(s => s.src ?? 'src не задан')

  const captionPath = join(dir, 'caption.txt')
  posts.push({
    slug,
    totalSlides: allPngs.length,
    order: post.order ?? 99,
    lang: post.lang ?? 'ru',
    audience: post.audience ?? '',
    goal: post.goal ?? '',
    title: post.slides[0]?.title ?? slug,
    previews,
    caption: existsSync(captionPath) ? readFileSync(captionPath, 'utf8').trim() : '',
    missing,
  })
}

// Порядок в ревью — это предлагаемая очередь публикации (поле `order` в JSON),
// а не алфавит имён файлов.
posts.sort((a, b) => a.order - b.order)

// ── Сценарии роликов ─────────────────────────────────────────────────────────
// Держим здесь короткую сводку; полные раскадровки — в marketing/video/scenarios.md.
const SCENARIOS = [
  { id: '1.1', lang: 'ru', block: 'Школы', sec: 35, hook: 'Чемпионат на 16 команд. Соберу его прямо сейчас, при вас, и засеку время.' },
  { id: '1.2', lang: 'kz', block: 'Мектептер', sec: 35, hook: '16 командаға арналған чемпионат. Дәл қазір, көз алдыңызда жинаймын.' },
  { id: '1.3', lang: 'ru', block: 'Школы', sec: 30, hook: 'Чемпионат в Excel вести можно. Вопрос — сколько это стоит вам лично.' },
  { id: '1.4', lang: 'ru', block: 'Школы', sec: 25, hook: 'Главная мотивация ребёнка на школьном соревновании — не первое место команды.' },
  { id: '2.1', lang: 'ru', block: 'HR', sec: 35, hook: 'Корпоративное соревнование умирает не от скуки. Оно умирает, когда организатор уходит в отпуск.' },
  { id: '2.2', lang: 'ru', block: 'HR', sec: 30, hook: 'Три вопроса в общем чате, после которых корпоративное соревнование заканчивается.' },
  { id: '3.1', lang: 'ru', block: 'Короткие', sec: 18, hook: 'Почему в вашей группе оказались две сильнейшие команды.' },
  { id: '3.2', lang: 'ru', block: 'Короткие', sec: 15, hook: 'Спор, который каждый год ломает школьное соревнование.' },
  { id: '3.3', lang: 'ru', block: 'Короткие', sec: 20, hook: 'Матч идёт — счёт видят все, кто открыл ссылку.' },
  { id: '3.4', lang: 'kz', block: 'Қысқа', sec: 15, hook: 'Мектеп жарысын жыл сайын бұзатын дау.' },
  { id: '3.5', lang: 'ru', block: 'Короткие', sec: 18, hook: 'Сколько раз вы пересылали расписание в чат?' },
  { id: '3.6', lang: 'ru', block: 'Короткие', sec: 20, hook: 'Отчёт о соревновании, который обычно собирают ночью.' },
]

// ── Видеоклипы ───────────────────────────────────────────────────────────────
const FOOTAGE = join(ROOT, 'marketing', 'footage')
const clips = (existsSync(FOOTAGE) ? readdirSync(FOOTAGE).filter(f => f.endsWith('.webm')).sort() : [])
  .map(file => {
    const name = basename(file, '.webm')
    const mb = statSync(join(FOOTAGE, file)).size / (1024 * 1024)
    return { name, size: `${mb.toFixed(1).replace('.', ',')} МБ`, ...clipNote(name) }
  })

// ── Что осталось за вами ─────────────────────────────────────────────────────
const BLOCKED = [
  {
    what: 'Казахский нуждается в вашей правке',
    why: 'Тексты переписаны в разговорный регистр и вычищены от кальки с русского, но живой почерк носителя они не заменяют.',
    need: 'Пройтись по трём казахским постам в marketing/studio/posts/kz-*.json',
  },
  {
    what: 'Съёмка себя',
    why: 'Кадры и видео продукта сняты автоматически. Единственное, что нельзя автоматизировать, — вы в кадре.',
    need: '6–8 дублей подряд по хукам из таблицы выше, в одной футболке',
  },
  {
    what: 'Оформление пустых аккаунтов',
    why: 'Аватар, шапка, описание и закреплённый пост влияют на конверсию сильнее, чем первые три поста.',
    need: 'Сделать до первой публикации',
  },
  {
    what: 'Перевыпустить service_role ключ',
    why: 'Ключ полного доступа к базе засветился в переписке. Всё, для чего он был нужен, уже сделано.',
    need: 'Supabase → Settings → API → Rotate',
  },
]

// ── HTML ─────────────────────────────────────────────────────────────────────
const totalSlides = posts.reduce((n, p) => n + p.previews.length, 0)
const totalMissing = posts.reduce((n, p) => n + p.missing.length, 0)

const html = `<title>Контент-машина Tournable — материалы на согласование</title>
<style>
${fontData ? `@font-face { font-family: 'Geist'; src: url('${fontData}') format('truetype'); font-weight: 400; font-display: swap; }` : ''}

:root {
  --ground: #F6F8F7;
  --surface: #FFFFFF;
  --surface-2: #EFF3F1;
  --ink: #0B1512;
  --muted: #5C6E68;
  --line: #DCE5E1;
  --accent: #059669;
  --accent-ink: #04543C;
  --accent-wash: #E7F5EF;
  --flag: #B45309;
  --flag-wash: #FBF0E2;
  --shadow: 0 1px 2px rgba(11,21,18,.05), 0 12px 32px -20px rgba(11,21,18,.28);
}
@media (prefers-color-scheme: dark) {
  :root {
    --ground: #070C0A;
    --surface: #0E1614;
    --surface-2: #141E1B;
    --ink: #E7EEEB;
    --muted: #879992;
    --line: #1D2A26;
    --accent: #34D399;
    --accent-ink: #6EE7B7;
    --accent-wash: #0C2B21;
    --flag: #F0A046;
    --flag-wash: #2A1C0C;
    --shadow: 0 1px 2px rgba(0,0,0,.5), 0 16px 40px -24px rgba(0,0,0,.9);
  }
}
:root[data-theme="dark"] {
  --ground: #070C0A; --surface: #0E1614; --surface-2: #141E1B;
  --ink: #E7EEEB; --muted: #879992; --line: #1D2A26;
  --accent: #34D399; --accent-ink: #6EE7B7; --accent-wash: #0C2B21;
  --flag: #F0A046; --flag-wash: #2A1C0C;
  --shadow: 0 1px 2px rgba(0,0,0,.5), 0 16px 40px -24px rgba(0,0,0,.9);
}
:root[data-theme="light"] {
  --ground: #F6F8F7; --surface: #FFFFFF; --surface-2: #EFF3F1;
  --ink: #0B1512; --muted: #5C6E68; --line: #DCE5E1;
  --accent: #059669; --accent-ink: #04543C; --accent-wash: #E7F5EF;
  --flag: #B45309; --flag-wash: #FBF0E2;
  --shadow: 0 1px 2px rgba(11,21,18,.05), 0 12px 32px -20px rgba(11,21,18,.28);
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--ground);
  color: var(--ink);
  font-family: system-ui, 'Segoe UI Variable Text', 'Segoe UI', sans-serif;
  font-size: 16px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

.wrap { max-width: 1080px; margin: 0 auto; padding: 0 24px 96px; }

/* Утилитарная гарнитура для меток и чисел: всё, что читается как данные. */
.mono {
  font-family: ui-monospace, 'Cascadia Code', 'Consolas', monospace;
  font-variant-numeric: tabular-nums;
}
.label {
  font-family: ui-monospace, 'Cascadia Code', 'Consolas', monospace;
  font-size: 11px; letter-spacing: .13em; text-transform: uppercase;
  color: var(--muted);
}

h1, h2, h3 { font-family: 'Geist', system-ui, sans-serif; font-weight: 400; text-wrap: balance; margin: 0; }
h1 { font-size: clamp(30px, 4.6vw, 46px); line-height: 1.1; letter-spacing: -.025em; }
h2 { font-size: clamp(21px, 2.6vw, 27px); line-height: 1.2; letter-spacing: -.018em; }
h3 { font-size: 19px; line-height: 1.3; letter-spacing: -.012em; }
p { margin: 0; max-width: 68ch; }

/* ── Шапка ── */
.masthead { padding: 64px 0 40px; border-bottom: 1px solid var(--line); }
.masthead .eyebrow { display: flex; align-items: center; gap: 12px; margin-bottom: 22px; }
.dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); flex: none; }
.masthead p { margin-top: 18px; color: var(--muted); font-size: 17px; }

.runbar {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
  gap: 1px; background: var(--line); border: 1px solid var(--line);
  border-radius: 10px; overflow: hidden; margin-top: 34px;
}
.runbar div { background: var(--surface); padding: 15px 17px; }
.runbar .n { font-family: 'Geist', system-ui, sans-serif; font-size: 27px; line-height: 1.1;
             font-variant-numeric: tabular-nums; display: block; margin-bottom: 5px; }
.runbar .n.flagged { color: var(--flag); }

/* ── Секции ── */
section { padding-top: 64px; }
.sechead { display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap; margin-bottom: 8px; }
.sechead + p { color: var(--muted); margin-bottom: 30px; }

/* ── Пост ── */
.post {
  background: var(--surface); border: 1px solid var(--line); border-radius: 14px;
  box-shadow: var(--shadow); overflow: hidden; margin-bottom: 22px;
}
.post-head { padding: 22px 24px 18px; display: flex; flex-direction: column; gap: 11px; }
.post-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.seq {
  font-family: ui-monospace, 'Cascadia Code', monospace; font-size: 12px;
  color: var(--accent-ink); background: var(--accent-wash);
  padding: 3px 8px; border-radius: 5px; letter-spacing: .05em;
}
.chip {
  font-family: ui-monospace, 'Cascadia Code', monospace; font-size: 11.5px;
  letter-spacing: .05em; padding: 3px 9px; border-radius: 5px;
  border: 1px solid var(--line); color: var(--muted); background: var(--surface-2);
}
.chip.ok { color: var(--accent-ink); border-color: transparent; background: var(--accent-wash); }
.chip.flag { color: var(--flag); border-color: transparent; background: var(--flag-wash); }
.post-goal { color: var(--muted); font-size: 14.5px; }

/* Полоса слайдов: прокручивается внутри себя, страница вбок не едет. */
.strip {
  display: flex; gap: 12px; overflow-x: auto; padding: 4px 24px 24px;
  scroll-snap-type: x proximity; scrollbar-width: thin;
}
.strip figure { margin: 0; flex: none; scroll-snap-align: start; }
.strip button {
  display: block; padding: 0; border: 1px solid var(--line); border-radius: 8px;
  overflow: hidden; background: none; cursor: zoom-in; line-height: 0;
}
.strip button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.strip img { display: block; width: 176px; height: auto; }
.strip figcaption { margin-top: 7px; font-size: 11px; letter-spacing: .1em; color: var(--muted);
                    font-family: ui-monospace, monospace; }

.caption-box { border-top: 1px solid var(--line); background: var(--surface-2); padding: 20px 24px; }
.caption-box pre {
  margin: 10px 0 0; white-space: pre-wrap; font-size: 14px; line-height: 1.62;
  font-family: system-ui, 'Segoe UI', sans-serif; color: var(--ink); max-width: 68ch;
}
.gap-note {
  border-top: 1px solid var(--line); padding: 15px 24px; background: var(--flag-wash);
  color: var(--flag); font-size: 14px;
}
.gap-note ul { margin: 8px 0 0; padding-left: 20px; }
.gap-note li { font-family: ui-monospace, monospace; font-size: 12.5px; }

/* ── Таблица сценариев ── */
.tablewrap { overflow-x: auto; border: 1px solid var(--line); border-radius: 12px; background: var(--surface); }
table { border-collapse: collapse; width: 100%; min-width: 640px; }
th, td { text-align: left; padding: 12px 16px; border-bottom: 1px solid var(--line); vertical-align: top; }
th { font-family: ui-monospace, monospace; font-size: 11px; letter-spacing: .12em;
     text-transform: uppercase; color: var(--muted); font-weight: 400; }
tr:last-child td { border-bottom: none; }
td.num { font-family: ui-monospace, monospace; font-variant-numeric: tabular-nums; color: var(--muted); white-space: nowrap; }
td.hook { font-size: 14.5px; }

/* ── Блокеры ── */
.blocked { display: flex; flex-direction: column; gap: 12px; }
.block-item {
  background: var(--surface); border: 1px solid var(--line); border-left: 3px solid var(--flag);
  border-radius: 10px; padding: 18px 22px; display: flex; flex-direction: column; gap: 9px;
}
.block-item p { font-size: 14.5px; color: var(--muted); }
.block-item .need { font-family: ui-monospace, monospace; font-size: 12.5px; color: var(--ink); }

/* ── Согласование ── */
.approve {
  background: var(--surface); border: 1px solid var(--line); border-radius: 14px;
  padding: 28px 26px; box-shadow: var(--shadow); display: flex; flex-direction: column; gap: 18px;
}
.approve ol { margin: 0; padding-left: 22px; display: flex; flex-direction: column; gap: 10px; }
.approve li { max-width: 66ch; }
.approve code {
  font-family: ui-monospace, monospace; font-size: 13px; background: var(--surface-2);
  padding: 2px 6px; border-radius: 4px; border: 1px solid var(--line);
}

footer { margin-top: 64px; padding-top: 26px; border-top: 1px solid var(--line); color: var(--muted); font-size: 13.5px; }

/* ── Просмотр слайда крупно ── */
dialog {
  border: none; padding: 0; background: none; max-width: 96vw; max-height: 94vh;
}
dialog::backdrop { background: rgba(4,10,8,.82); }
dialog img { display: block; max-width: 96vw; max-height: 94vh; width: auto; border-radius: 10px; }

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
@media (max-width: 640px) {
  .wrap { padding: 0 16px 72px; }
  .post-head, .caption-box, .gap-note { padding-left: 18px; padding-right: 18px; }
  .strip { padding-left: 18px; padding-right: 18px; }
  .strip img { width: 148px; }
}
</style>

<div class="wrap">

  <header class="masthead">
    <div class="eyebrow"><span class="dot"></span><span class="label">Tournable · контент-машина · на согласование</span></div>
    <h1>Материалы к публикации</h1>
    <p>Всё ниже собрано автоматически из репозитория и готово к выкладке. Посмотрите, отметьте что править — и скажите, что можно публиковать.</p>
    <div class="runbar">
      <div><span class="n">${posts.length}</span><span class="label">карусели</span></div>
      <div><span class="n">${totalSlides}</span><span class="label">слайдов</span></div>
      <div><span class="n">${clips.length}</span><span class="label">видеоклипов</span></div>
      <div><span class="n">${SCENARIOS.length}</span><span class="label">сценариев</span></div>
      <div><span class="n ${totalMissing ? 'flagged' : ''}">${totalMissing}</span><span class="label">скринов нужно</span></div>
    </div>
  </header>

  <section>
    <div class="sechead"><h2>Карусели</h2><span class="label">первые ${MAX_PREVIEW_SLIDES} слайда каждой</span></div>
    <p>Здесь начало каждой карусели, чтобы страница оставалась лёгкой. Полностью, с переключателем «Телефон / Десктоп» и отметкой «использовано», — в разделе <strong>Контент</strong> внутри платформы. Нажмите на слайд, чтобы увеличить.</p>
${posts.map((p, i) => `
    <article class="post">
      <div class="post-head">
        <div class="post-meta">
          <span class="seq">${String(i + 1).padStart(2, '0')}</span>
          <span class="chip">${esc(AUDIENCE_LABEL[p.lang] ?? p.lang)}</span>
          ${p.audience ? `<span class="chip">${esc(p.audience)}</span>` : ''}
          <span class="chip">${p.totalSlides} слайдов</span>
          ${p.missing.length
            ? `<span class="chip flag">нужно ${p.missing.length} скрин${p.missing.length === 1 ? '' : 'ов'}</span>`
            : `<span class="chip ok">готово к публикации</span>`}
        </div>
        <h3>${esc(p.title)}</h3>
        ${p.goal ? `<div class="post-goal">${esc(p.goal)}</div>` : ''}
      </div>
      <div class="strip">
${p.previews.map((src, n) => `        <figure>
          <button type="button" data-full="${src}" aria-label="Слайд ${n + 1} крупно"><img src="${src}" alt="Слайд ${n + 1}: ${esc(p.title)}" loading="lazy"></button>
          <figcaption>${String(n + 1).padStart(2, '0')}</figcaption>
        </figure>`).join('\n')}
      </div>
      <div class="caption-box">
        <span class="label">Подпись к посту</span>
        <pre>${esc(p.caption)}</pre>
      </div>
${p.missing.length ? `      <div class="gap-note">
        Слайды со скринами продукта собраны с заглушками — снять после заливки демо-данных:
        <ul>${p.missing.map(m => `<li>${esc(m)}</li>`).join('')}</ul>
      </div>` : ''}
    </article>`).join('\n')}
  </section>

  <section>
    <div class="sechead"><h2>Видеоклипы продукта</h2><span class="label">записаны автоматически</span></div>
    <p>Запись экрана уже сделана — снимать в приложении ничего не нужно. Смотреть и скачивать: раздел <strong>Контент</strong> в платформе, вкладка «Видео». Единственное, что снимаете вы, — себя.</p>
    <div class="tablewrap">
      <table>
        <thead><tr><th>Файл</th><th>Что на кадре</th><th>Как использовать</th><th>Вес</th></tr></thead>
        <tbody>
${clips.map(c => `          <tr>
            <td class="num">${esc(c.name)}</td>
            <td class="hook"><strong>${esc(c.title)}</strong></td>
            <td class="hook">${esc(c.use)}</td>
            <td class="num">${esc(c.size)}</td>
          </tr>`).join('\n')}
        </tbody>
      </table>
    </div>
  </section>

  <section>
    <div class="sechead"><h2>Сценарии роликов</h2><span class="label">reels · shorts · tiktok</span></div>
    <p>Покадровые раскадровки с титрами и текстом озвучки лежат в <code style="font-family:ui-monospace,monospace;font-size:13px">marketing/video/scenarios.md</code>. Здесь — хуки: именно они решают, досмотрят ролик или пролистают.</p>
    <div class="tablewrap">
      <table>
        <thead><tr><th>№</th><th>Блок</th><th>Яз.</th><th>Хрон.</th><th>Хук — первые две секунды</th></tr></thead>
        <tbody>
${SCENARIOS.map(s => `          <tr>
            <td class="num">${s.id}</td>
            <td class="num">${esc(s.block)}</td>
            <td class="num">${esc(s.lang)}</td>
            <td class="num">${s.sec} с</td>
            <td class="hook">${esc(s.hook)}</td>
          </tr>`).join('\n')}
        </tbody>
      </table>
    </div>
  </section>

  <section>
    <div class="sechead"><h2>Что осталось за вами</h2></div>
    <p>Демо-данные залиты, кадры сняты, клипы записаны, материалы лежат в платформе. Остались четыре вещи, которые может сделать только человек.</p>
    <div class="blocked">
${BLOCKED.map(b => `      <div class="block-item">
        <h3>${esc(b.what)}</h3>
        <p>${esc(b.why)}</p>
        <div class="need">→ ${esc(b.need)}</div>
      </div>`).join('\n')}
    </div>
  </section>

  <section>
    <div class="sechead"><h2>Как согласовать</h2></div>
    <div class="approve">
      <ol>
        <li>Пройдите по каруселям. Если текст на слайде нужно поменять — назовите номер поста и номер слайда, правку внесу в исходник и пересоберу.</li>
        <li>Просмотрите хуки роликов. Хук — единственное, что нельзя отдать на автомат: он должен звучать вашим голосом, а не моим. Отметьте те, что звучат не по-вашему.</li>
        <li>Скажите, какие материалы можно публиковать. Автопостинг остановлен по вашему решению — всё выкладывается вручную из раздела <strong>Контент</strong> в платформе.</li>
        <li>Правьте казахский прямо в JSON, если формулировки звучат не по-вашему: пересборка занимает секунды.</li>
      </ol>
      <p style="color:var(--muted);font-size:14.5px">Порядок выкладки предлагаю по номерам: спартакиада на русском, затем на казахском, затем демонстрация продукта. Посты про HR и чемпионат с сезонами — на вторую неделю, когда станет видно, какая тема заходит.</p>
    </div>
  </section>

  <footer>
    Собрано автоматически из репозитория tournable-next. Названия школ, компаний и игроков в демо-данных вымышленные.
  </footer>
</div>

<dialog id="viewer"><img alt=""></dialog>

<script>
  // Просмотр слайда крупно. Картинка одна и та же — подменяется src, чтобы
  // не держать в памяти тридцать открытых диалогов.
  const viewer = document.getElementById('viewer')
  const viewerImg = viewer.querySelector('img')
  document.querySelectorAll('.strip button').forEach(btn => {
    btn.addEventListener('click', () => {
      viewerImg.src = btn.dataset.full
      viewerImg.alt = btn.querySelector('img').alt
      viewer.showModal()
    })
  })
  viewer.addEventListener('click', () => viewer.close())
</script>
`

writeFileSync(join(OUT_DIR, 'review.html'), html, 'utf8')
const kb = Math.round(Buffer.byteLength(html) / 1024)
console.log(`[review] marketing/out/review.html — ${posts.length} постов, ${totalSlides} слайдов, ${kb} КБ`)

// ─────────────────────────────────────────────────────────────────────────────
// Автосъёмка продукта: скриншоты для каруселей и видеоклипы для монтажа.
//
// Решает главную проблему производства: «не представляю, что именно снимать».
// Скрипт сам заходит в приложение под владельцем демо-данных, обходит все
// экраны и складывает готовые файлы:
//
//   marketing/shots/*.png       кадры для слайдов каруселей
//   marketing/footage/*.webm    клипы записи экрана — их и тащите в CapCut
//
// ── Запуск ───────────────────────────────────────────────────────────────────
//   1) поднимите приложение:  npm run dev
//   2) в другом окне:         node marketing/studio/capture.mjs
//
//   node marketing/studio/capture.mjs --shots     только скриншоты
//   node marketing/studio/capture.mjs --clips     только видео
//   CAPTURE_URL=https://tournable.app node marketing/studio/capture.mjs
//
// ── Как устроен вход ─────────────────────────────────────────────────────────
// Пароль владельца скрипту не нужен и не запрашивается. Service-role ключ
// выпускает одноразовую ссылку входа, она тут же гасится в обмен на сессию,
// а сессия кладётся в куку в том формате, который читает @supabase/ssr:
// `base64-` + base64url(JSON), разрезанный на куски по 3180 символов.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync, mkdirSync, renameSync, rmSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const SHOTS = join(ROOT, 'marketing', 'shots')
const FOOTAGE = join(ROOT, 'marketing', 'footage')

function loadEnv() {
  const p = join(ROOT, '.env.local')
  if (!existsSync(p)) return
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
loadEnv()

const args = process.argv.slice(2)
const DO_SHOTS = !args.includes('--clips')
const DO_CLIPS = !args.includes('--shots')
const BASE = (process.env.CAPTURE_URL || 'http://localhost:3000').replace(/\/$/, '')

const URL_SB = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY

const fail = (m) => { console.error(`\n[capture] ${m}\n`); process.exit(1) }
const log = (...a) => console.log('[capture]', ...a)

if (!URL_SB || !ANON) fail('нет NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY в .env.local')
if (!SERVICE) fail('нет SUPABASE_SERVICE_ROLE_KEY в .env.local — без него не выпустить ссылку входа')

const SLUG_SCHOOL = 'demo-chempionat-shkol-astana-2026'
const SLUG_CORPORATE = 'demo-corporate-league-astana-2026'
const SLUG_LEAGUE = 'demo-school-football-league-astana'

mkdirSync(SHOTS, { recursive: true })
mkdirSync(FOOTAGE, { recursive: true })

// ── Сессия владельца ─────────────────────────────────────────────────────────
const admin = createClient(URL_SB, SERVICE, { auth: { persistSession: false } })

const { data: users, error: usersErr } = await admin.auth.admin.listUsers({ perPage: 1000 })
if (usersErr) fail(`не получить список пользователей: ${usersErr.message}`)

const { data: profiles } = await admin.from('profiles').select('id, is_admin')
const adminIds = new Set((profiles ?? []).filter(p => p.is_admin).map(p => p.id))
const pool = users.users.filter(u => adminIds.has(u.id))
const candidates = pool.length ? pool : users.users
if (!candidates.length) fail('в проекте нет пользователей')
const owner = candidates.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0]

const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
  type: 'magiclink', email: owner.email,
})
if (linkErr) fail(`не выпустить ссылку входа: ${linkErr.message}`)

const asUser = createClient(URL_SB, ANON, { auth: { persistSession: false } })
const { data: authed, error: otpErr } = await asUser.auth.verifyOtp({
  token_hash: link.properties.hashed_token, type: 'magiclink',
})
if (otpErr) fail(`не войти под владельцем: ${otpErr.message}`)
log(`вошёл как ${owner.email}`)

// Кука в формате @supabase/ssr. base64url состоит из URL-безопасных символов,
// поэтому дополнительное экранирование значения не требуется.
const projectRef = new URL(URL_SB).hostname.split('.')[0]
const COOKIE_KEY = `sb-${projectRef}-auth-token`
const MAX_CHUNK = 3180

function sessionCookies(session, domain) {
  const raw = 'base64-' + Buffer.from(JSON.stringify(session), 'utf8').toString('base64url')
  const chunks = []
  for (let i = 0; i < raw.length; i += MAX_CHUNK) chunks.push(raw.slice(i, i + MAX_CHUNK))
  return chunks.map((value, i) => ({
    name: `${COOKIE_KEY}.${i}`,
    value,
    domain,
    path: '/',
    httpOnly: false,
    secure: false,
    sameSite: 'Lax',
  }))
}

// ── Что снимаем ──────────────────────────────────────────────────────────────
const { data: tSchool } = await asUser.from('tournaments').select('id').eq('slug', SLUG_SCHOOL).maybeSingle()
const { data: tCorp } = await asUser.from('tournaments').select('id').eq('slug', SLUG_CORPORATE).maybeSingle()
const { data: lg } = await asUser.from('leagues').select('id').eq('slug', SLUG_LEAGUE).maybeSingle()

if (!tSchool) fail(`демо-данных нет в базе. Сначала: node scripts/seed-demo.mjs`)
log(`чемпионат школ ${tSchool.id}, корпоративное ${tCorp?.id ?? '—'}, чемпионат ${lg?.id ?? '—'}`)

// ── Playwright ───────────────────────────────────────────────────────────────
let chromium
try { ({ chromium } = await import('playwright')) }
catch { fail('нет playwright: npm i -D playwright && npx playwright install chromium') }

const browser = await chromium.launch()
const domain = new URL(BASE).hostname

async function newContext(opts = {}) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    locale: 'ru-RU',
    ...opts,
  })
  await ctx.addCookies(sessionCookies(authed.session, domain))
  return ctx
}

// Приложение анимирует появление карточек; без паузы в кадр попадает
// полупрозрачное промежуточное состояние.
async function settle(page, ms = 900) {
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(ms)
  await declutter(page)
}

// Убираем из кадра всё, что не является продуктом: плавающий виджет поддержки,
// его пульсирующее кольцо и индикатор дев-сервера Next. В рекламном кадре они
// читаются как мусор, а на проде виджет всё равно выглядит иначе.
async function declutter(page) {
  await page.addStyleTag({
    content: `
      [aria-label="Support"], [aria-label="Support"] + div { display: none !important; }
      nextjs-portal, [data-nextjs-dev-tools-button], #__next-build-watcher { display: none !important; }
      .animate-ping { display: none !important; }
    `,
  }).catch(() => {})

  // Шапка показывает почту вошедшего. Кадры уходят в публичные посты, поэтому
  // личный адрес основателя из них вычищается — в текстовых узлах, а не CSS,
  // чтобы он не остался в разметке.
  await page.evaluate(() => {
    const re = /[\w.+-]+@[\w-]+\.[\w.]+/g
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    const hits = []
    while (walker.nextNode()) {
      if (re.test(walker.currentNode.nodeValue ?? '')) hits.push(walker.currentNode)
      re.lastIndex = 0
    }
    for (const node of hits) node.nodeValue = node.nodeValue.replace(re, 'Организатор')
  }).catch(() => {})

  // Баннер чемпиона перекрывает первый экран целиком. Для обзорного кадра он
  // хорош, но вкладки из-за него уходят под сгиб — закрываем.
  const close = page.getByRole('button', { name: /закрыть|жабу|close/i }).first()
  if (await close.count().catch(() => 0)) {
    await close.click({ timeout: 1500 }).catch(() => {})
    await page.waitForTimeout(400)
  }
}

// Подводит полосу вкладок под верх экрана, оставляя немного шапки для контекста.
async function focusTabs(page) {
  await page.evaluate(() => {
    const list = document.querySelector('[role="tablist"]')
    if (!list) return
    const y = list.getBoundingClientRect().top + window.scrollY - 96
    window.scrollTo({ top: Math.max(0, y), behavior: 'instant' })
  }).catch(() => {})
  await page.waitForTimeout(500)
}

const shot = async (page, name, opts = {}) => {
  const path = join(SHOTS, `${name}.png`)
  await page.screenshot({ path, ...opts })
  log(`  снято ${name}.png`)
}

// Транслитерация подписи вкладки в имя файла.
const CYR = { а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'c',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',ә:'a',ғ:'g',қ:'k',ң:'n',ө:'o',ұ:'u',ү:'u',һ:'h',і:'i' }
const slugify = (s) => s.toLowerCase().split('').map(c => CYR[c] ?? c).join('')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 28)

// ── Скриншоты ────────────────────────────────────────────────────────────────
async function captureShots() {
  const ctx = await newContext()
  const page = await ctx.newPage()

  const safely = async (label, fn) => {
    try { await fn() } catch (e) { log(`  пропуск ${label}: ${e.message.split('\n')[0]}`) }
  }

  // Список соревнований
  await safely('дашборд', async () => {
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' })
    await settle(page)
    await shot(page, '00-dashboard')
  })

  // Мастер создания — первый экран
  await safely('мастер', async () => {
    await page.goto(`${BASE}/dashboard/new`, { waitUntil: 'domcontentloaded' })
    await settle(page)
    await shot(page, '01-wizard-start')
  })

  // Соревнование: проходим по всем вкладкам, снимая каждую.
  await safely('вкладки соревнования', async () => {
    await page.goto(`${BASE}/dashboard/tournament/${tSchool.id}`, { waitUntil: 'domcontentloaded' })
    await settle(page, 1400)
    await shot(page, '02-tournament-top')

    const tabs = page.getByRole('tab')
    const count = await tabs.count()
    log(`  вкладок найдено: ${count}`)
    for (let i = 0; i < count; i++) {
      const tab = tabs.nth(i)
      const label = (await tab.innerText().catch(() => `tab-${i}`)).split('\n')[0].trim()
      await tab.click()
      await settle(page, 800)
      await focusTabs(page)
      await shot(page, `03-${String(i + 1).padStart(2, '0')}-${slugify(label) || `tab-${i}`}`)
    }
  })

  // Корпоративное соревнование — таблица в разгаре
  if (tCorp) {
    await safely('корпоративное', async () => {
      await page.goto(`${BASE}/dashboard/tournament/${tCorp.id}`, { waitUntil: 'domcontentloaded' })
      await settle(page, 1200)
      await shot(page, '04-corporate-top')
    })
  }

  // Чемпионат в дашборде
  if (lg) {
    await safely('чемпионат', async () => {
      await page.goto(`${BASE}/dashboard/leagues/${lg.id}`, { waitUntil: 'domcontentloaded' })
      await settle(page, 1000)
      await shot(page, '05-championship')
    })
  }

  // Публичные страницы — то, что видит зритель по ссылке.
  await safely('публичная страница', async () => {
    await page.goto(`${BASE}/t/${SLUG_SCHOOL}`, { waitUntil: 'domcontentloaded' })
    await settle(page, 1200)
    await shot(page, '06-public-desktop')
  })
  await safely('публичный чемпионат', async () => {
    await page.goto(`${BASE}/leagues/${SLUG_LEAGUE}`, { waitUntil: 'domcontentloaded' })
    await settle(page, 1000)
    await shot(page, '07-public-league')
  })

  await ctx.close()

  // Телефонные кадры: именно так материал видит зритель в ленте.
  const mob = await newContext({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  })
  const mpage = await mob.newPage()

  for (const [name, url] of [
    ['10-phone-public', `${BASE}/t/${SLUG_SCHOOL}`],
    ['11-phone-league', `${BASE}/leagues/${SLUG_LEAGUE}`],
    ['12-phone-dashboard', `${BASE}/dashboard`],
    ['13-phone-wizard', `${BASE}/dashboard/new`],
  ]) {
    try {
      await mpage.goto(url, { waitUntil: 'domcontentloaded' })
      await settle(mpage, 1100)
      await shot(mpage, name)
    } catch (e) { log(`  пропуск ${name}: ${e.message.split('\n')[0]}`) }
  }

  // Телефонные версии всех вкладок соревнования — именно они идут в мокап
  // смартфона на слайдах, поэтому нужны все, а не только публичная страница.
  try {
    await mpage.goto(`${BASE}/dashboard/tournament/${tSchool.id}`, { waitUntil: 'domcontentloaded' })
    await settle(mpage, 1500)
    const tabs = mpage.getByRole('tab')
    const count = await tabs.count()
    for (let i = 0; i < count; i++) {
      const tab = tabs.nth(i)
      const label = (await tab.innerText().catch(() => `tab-${i}`)).split('\n')[0].trim()
      await tab.click()
      await settle(mpage, 900)
      await focusTabs(mpage)
      await shot(mpage, `14-${String(i + 1).padStart(2, '0')}-phone-${slugify(label) || `tab-${i}`}`)
    }
  } catch (e) { log(`  пропуск телефонных вкладок: ${e.message.split('\n')[0]}`) }

  await mob.close()
}

// ── Видеоклипы ───────────────────────────────────────────────────────────────
// Каждый клип — отдельный контекст с записью. Playwright кладёт webm со
// случайным именем, поэтому после закрытия файл переименовывается в осмысленный.
// Playwright пишет видео ровно в размер вьюпорта: deviceScaleFactor на запись
// не влияет. Отсюда единственный способ поднять качество — снимать в большем
// вьюпорте. Для телефонных клипов это конфликтует с вёрсткой: при ширине 1080
// включается десктопная раскладка.
//
// Решение — CSS-зум. Вьюпорт 1080×2340 пишет 1080p, а `zoom: 2.5` сжимает
// расчётную ширину макета до 432 CSS-пикселей, и медиазапросы отрабатывают как
// на телефоне. Картинка при этом рисуется в реальные 1080 пикселей, а не
// растягивается из 430 при монтаже.
async function clip(name, size, fn, { zoom = 1 } = {}) {
  const tmp = join(FOOTAGE, `.tmp-${name}`)
  rmSync(tmp, { recursive: true, force: true })
  mkdirSync(tmp, { recursive: true })

  const mobileLayout = size.width / zoom < 640
  const ctx = await newContext({
    viewport: size,
    deviceScaleFactor: 1,
    recordVideo: { dir: tmp, size },
    ...(mobileLayout ? { isMobile: true, hasTouch: true } : {}),
  })
  const page = await ctx.newPage()
  if (zoom !== 1) {
    await page.addInitScript((z) => {
      document.addEventListener('DOMContentLoaded', () => {
        document.documentElement.style.zoom = String(z)
      })
    }, zoom)
  }
  try {
    await fn(page)
  } catch (e) {
    log(`  клип ${name}: оборвался — ${e.message.split('\n')[0]}`)
  }
  await ctx.close()

  const produced = readdirSync(tmp).filter(f => f.endsWith('.webm'))
  if (!produced.length) { log(`  клип ${name}: файл не записался`); return }
  const dest = join(FOOTAGE, `${name}.webm`)
  rmSync(dest, { force: true })
  renameSync(join(tmp, produced[0]), dest)
  rmSync(tmp, { recursive: true, force: true })
  log(`  записан ${name}.webm`)
}

// Плавная прокрутка: резкие скачки в кадре читаются как баг, а не как съёмка.
async function smoothScroll(page, distance, steps = 60) {
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, distance / steps)
    await page.waitForTimeout(28)
  }
}

async function captureClips() {
  // Телефон: пишем 1080×2340 (вертикаль под Reels один в один) с зумом 2.5 —
  // макет считается по 432 CSS-пикселям, то есть остаётся мобильным.
  const PHONE = { width: 1080, height: 2340 }
  const PHONE_ZOOM = 2.5
  // Десктоп: 1600×1000 вместо прежних 1280×800 — при монтаже в 1080p кадр
  // уменьшается, а не растягивается, и текст таблиц остаётся читаемым.
  const DESK = { width: 1600, height: 1000 }

  // 01 — публичная страница на телефоне: главный кадр «одна ссылка на всё».
  await clip('01-public-phone', PHONE, async (page) => {
    await page.goto(`${BASE}/t/${SLUG_SCHOOL}`, { waitUntil: 'domcontentloaded' })
    await settle(page, 1500)
    await smoothScroll(page, 2200, 90)
    await page.waitForTimeout(900)
  }, { zoom: PHONE_ZOOM })

  // 02 — обход вкладок соревнования: расписание, таблица, сетка, статистика.
  await clip('02-tabs-walkthrough', DESK, async (page) => {
    await page.goto(`${BASE}/dashboard/tournament/${tSchool.id}`, { waitUntil: 'domcontentloaded' })
    await settle(page, 1800)
    const tabs = page.getByRole('tab')
    const count = await tabs.count()
    for (let i = 0; i < count; i++) {
      await tabs.nth(i).click()
      await page.waitForTimeout(1500)
      await smoothScroll(page, 700, 40)
      await page.waitForTimeout(600)
      await page.mouse.wheel(0, -700)
      await page.waitForTimeout(400)
    }
  })

  // 03 — сетка плей-офф: медленная прокрутка от четвертьфиналов к финалу.
  await clip('03-bracket', DESK, async (page) => {
    await page.goto(`${BASE}/dashboard/tournament/${tSchool.id}`, { waitUntil: 'domcontentloaded' })
    await settle(page, 1600)
    const tabs = page.getByRole('tab')
    const count = await tabs.count()
    for (let i = 0; i < count; i++) {
      const label = (await tabs.nth(i).innerText().catch(() => '')).toLowerCase()
      if (label.includes('сетк') || label.includes('тор') || label.includes('bracket')) {
        await tabs.nth(i).click()
        break
      }
    }
    await page.waitForTimeout(1800)
    await smoothScroll(page, 1200, 70)
    await page.waitForTimeout(1000)
  })

  // 04 — чемпионат: страница лиги с командами и сезоном.
  if (lg) {
    await clip('04-championship', DESK, async (page) => {
      await page.goto(`${BASE}/leagues/${SLUG_LEAGUE}`, { waitUntil: 'domcontentloaded' })
      await settle(page, 1600)
      await smoothScroll(page, 1600, 80)
      await page.waitForTimeout(900)
    })
  }

  // 05 — корпоративное соревнование в разгаре: таблица после шести туров.
  if (tCorp) {
    await clip('05-corporate', DESK, async (page) => {
      await page.goto(`${BASE}/dashboard/tournament/${tCorp.id}`, { waitUntil: 'domcontentloaded' })
      await settle(page, 1600)
      await smoothScroll(page, 1100, 60)
      await page.waitForTimeout(800)
    })
  }

  // 06 — мастер создания: с чего начинается оцифровка соревнования.
  await clip('06-wizard', DESK, async (page) => {
    await page.goto(`${BASE}/dashboard/new`, { waitUntil: 'domcontentloaded' })
    await settle(page, 1500)
    await smoothScroll(page, 900, 50)
    await page.waitForTimeout(1200)
  })
}

// ── Разовый снимок произвольной страницы ─────────────────────────────────────
// `--page=/admin/content` кладёт кадр в scratch вместо marketing/shots: удобно
// проверить закрытый раздел, не подмешивая служебный кадр к рекламным.
async function capturePage(rawPath) {
  // Git Bash на Windows превращает аргумент вида /admin/content в путь диска
  // (C:/Program Files/...). Отрезаем всё до последнего вхождения нужного корня
  // и допускаем запись без ведущего слеша.
  const cleaned = rawPath.replace(/^.*?(?=\/(?:admin|dashboard|account|t|leagues)\/)/, '')
  const path = cleaned.startsWith('/') ? cleaned : `/${cleaned}`

  // --viewport=1080x2340 --zoom=2.5 повторяет условия записи клипа: так видно,
  // осталась ли вёрстка мобильной при увеличенном вьюпорте.
  const vpArg = args.find(a => a.startsWith('--viewport='))
  const zoomArg = args.find(a => a.startsWith('--zoom='))
  const zoom = zoomArg ? parseFloat(zoomArg.slice('--zoom='.length)) : 1
  const opts = {}
  if (vpArg) {
    const [w, h] = vpArg.slice('--viewport='.length).split('x').map(Number)
    opts.viewport = { width: w, height: h }
    if (w / zoom < 640) { opts.isMobile = true; opts.hasTouch = true }
  }

  const ctx = await newContext(opts)
  const page = await ctx.newPage()
  if (zoom !== 1) {
    await page.addInitScript((z) => {
      document.addEventListener('DOMContentLoaded', () => {
        document.documentElement.style.zoom = String(z)
      })
    }, zoom)
  }
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' })
  await settle(page, 1500)

  // `--click=Видео` — снять состояние после нажатия на кнопку с таким текстом.
  const clickArg = args.find(a => a.startsWith('--click='))
  if (clickArg) {
    const name = clickArg.slice('--click='.length)
    await page.getByRole('button', { name }).first().click({ timeout: 4000 }).catch(
      (e) => log(`клик по «${name}» не прошёл: ${e.message.split('\n')[0]}`))
    await page.waitForTimeout(2500)
  }
  const file = join(ROOT, 'marketing', 'out', `verify-${slugify(path) || 'page'}.png`)
  await page.screenshot({ path: file, fullPage: true })
  log(`снят ${file}`)
  await ctx.close()
}

// ── Прогон ───────────────────────────────────────────────────────────────────
try {
  const probe = await fetch(`${BASE}/`, { method: 'HEAD' }).catch(() => null)
  if (!probe) fail(`приложение не отвечает на ${BASE} — поднимите его: npm run dev`)

  const pageArg = args.find(a => a.startsWith('--page='))
  if (pageArg) {
    await capturePage(pageArg.slice('--page='.length))
  } else {
    if (DO_SHOTS) { log('снимаю скриншоты…'); await captureShots() }
    if (DO_CLIPS) { log('записываю клипы…'); await captureClips() }
  }
} finally {
  await browser.close()
}

const shotFiles = existsSync(SHOTS) ? readdirSync(SHOTS).filter(f => f.endsWith('.png')) : []
const clipFiles = existsSync(FOOTAGE) ? readdirSync(FOOTAGE).filter(f => f.endsWith('.webm')) : []
console.log(`\n[capture] готово: ${shotFiles.length} кадров в marketing/shots, ${clipFiles.length} клипов в marketing/footage\n`)

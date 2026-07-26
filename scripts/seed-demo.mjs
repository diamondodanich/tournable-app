// ─────────────────────────────────────────────────────────────────────────────
// Демо-данные для маркетинга.
//
// Наливает два эталонных, полностью заполненных турнира, с которых снимаются
// скрины и видео для соцсетей:
//
//   1. «Чемпионат школ Астаны 2026» — groups_playoff, футбол, 16 команд,
//      4 группы, сыгранная групповая стадия + плей-офф до финала, составы,
//      голы/ассисты/карточки, чемпионат (лига) с сезоном.
//   2. «Корпоративная лига Астаны 2026» — round_robin, футзал, 10 команд,
//      ~70% туров сыграно — вид «турнир в разгаре», а не архив.
//
// Все названия команд, школ, компаний и игроков ВЫМЫШЛЕНЫ. Совпадения
// с реальными организациями случайны — это витрина продукта, а не отчёт
// о реальных соревнованиях.
//
// Данные детерминированы: повторный запуск даёт те же счета и тех же
// бомбардиров, поэтому скрины, снятые в разные дни, не противоречат друг другу.
//
// ── Запуск ───────────────────────────────────────────────────────────────────
//   node scripts/seed-demo.mjs           создать (пропускает уже созданное)
//   node scripts/seed-demo.mjs --reset   удалить старое демо и создать заново
//
// ── Доступ (одно из двух) ────────────────────────────────────────────────────
//   A. SUPABASE_SERVICE_ROLE_KEY + SEED_OWNER_EMAIL  — предпочтительно,
//      обходит RLS и лимиты плана. Ключ: Supabase → Project Settings → API.
//   B. SEED_EMAIL + SEED_PASSWORD — вход обычным пользователем. Требует
//      план Pro/Enterprise на этом аккаунте: на Free разрешён 1 турнир.
//
// Значения кладутся в .env.local и НЕ попадают в git.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

// ── env ──────────────────────────────────────────────────────────────────────
function loadEnv() {
  const p = join(process.cwd(), '.env.local')
  if (!existsSync(p)) return
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
loadEnv()

const RESET = process.argv.includes('--reset')
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!URL) fail('NEXT_PUBLIC_SUPABASE_URL не задан в .env.local')

function fail(msg) {
  console.error(`\n[seed] ${msg}\n`)
  process.exit(1)
}

// ── детерминированный ГПСЧ ───────────────────────────────────────────────────
// Один и тот же seed → одни и те же счета. Скрины, снятые в разные дни,
// показывают одинаковые цифры.
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rnd = mulberry32(20260726)
const pick = (arr) => arr[Math.floor(rnd() * arr.length)]
const int = (min, max) => min + Math.floor(rnd() * (max - min + 1))

// ── справочники (всё вымышленное) ────────────────────────────────────────────
const SCHOOLS = [
  'Гимназия «Арман»', 'Лицей «Жігер»', 'Школа «Ұлытау»', 'Гимназия «Сарыарқа»',
  'Лицей «Тұлпар»', 'Школа «Алатау»', 'Гимназия «Керуен»', 'Лицей «Қыран»',
  'Школа «Есіл»', 'Гимназия «Нұрлы жол»', 'Лицей «Дала»', 'Школа «Самғау»',
  'Гимназия «Мұзбалақ»', 'Лицей «Ақжайық»', 'Школа «Байсын»', 'Гимназия «Жетісу»',
]

const COMPANIES = [
  '«Астана Диджитал»', '«Темір Логистик»', '«Сарыарқа Строй»', '«Алтын Финанс»',
  '«Көкжиек Ритейл»', '«Есіл Агро»', '«Тұран Медиа»', '«Алаш Инжиниринг»',
  '«Дала Энерго»', '«Самал Девелопмент»',
]

const FIRST = [
  'Айдар', 'Нурлан', 'Ерасыл', 'Данияр', 'Алишер', 'Тимур', 'Санжар', 'Арман',
  'Дамир', 'Бекзат', 'Ислам', 'Ержан', 'Мирас', 'Алдияр', 'Диас', 'Рамазан',
  'Асылбек', 'Нурсултан', 'Темирлан', 'Аян', 'Жандос', 'Азамат', 'Олжас', 'Дастан',
]
const LAST = [
  'Ахметов', 'Сериков', 'Бекболат', 'Жумабаев', 'Оспанов', 'Калиев', 'Нургалиев',
  'Тлеубаев', 'Сатпаев', 'Абилов', 'Мукашев', 'Дуйсенов', 'Ержанов', 'Каримов',
  'Смагулов', 'Токтаров', 'Байболов', 'Искаков', 'Нурпеисов', 'Жаксылыков',
]
const POSITIONS = ['goalkeeper', 'defender', 'defender', 'defender', 'midfielder', 'midfielder', 'midfielder', 'forward', 'forward']

// ── алгоритмы турнирной сетки (портированы из src/, поведение 1-в-1) ─────────
function generateRoundRobin(teams) {
  const working = [...teams]
  if (working.length % 2 === 1) working.push(null)
  const n = working.length
  const half = n / 2
  const result = []
  const fixed = working[0]
  const rotating = working.slice(1)
  for (let r = 0; r < n - 1; r++) {
    const roundMatches = []
    const arr = [fixed, ...rotating]
    for (let i = 0; i < half; i++) {
      const home = arr[i]
      const away = arr[n - 1 - i]
      if (r % 2 === 1 && i === 0) roundMatches.push([away, home])
      else roundMatches.push([home, away])
    }
    result.push(roundMatches)
    rotating.unshift(rotating.pop())
  }
  return result
}

function buildRoundRobinFixtures(tournamentId, teamIds, numRounds) {
  const baseRounds = generateRoundRobin(teamIds)
  const fixtures = []
  let matchday = 0
  for (let cycle = 0; cycle < numRounds; cycle++) {
    for (let ri = 0; ri < baseRounds.length; ri++) {
      matchday++
      for (const [homeId, awayId] of baseRounds[ri]) {
        if (awayId === null) {
          fixtures.push({ tournament_id: tournamentId, matchday, round: cycle + 1, cycle_round: ri + 1, home_team_id: homeId, away_team_id: null, is_bye: true, played: false })
        } else {
          const [h, a] = cycle % 2 === 0 ? [homeId, awayId] : [awayId, homeId]
          fixtures.push({ tournament_id: tournamentId, matchday, round: cycle + 1, cycle_round: ri + 1, home_team_id: h, away_team_id: a, is_bye: false, played: false })
        }
      }
    }
  }
  return fixtures
}

function buildGroupsFixtures(tournamentId, groups) {
  const groupRounds = groups.map(g => (g.length >= 2 ? generateRoundRobin(g) : []))
  const maxRounds = Math.max(...groupRounds.map(r => r.length), 0)
  const fixtures = []
  let matchday = 0
  for (let ri = 0; ri < maxRounds; ri++) {
    matchday++
    for (let g = 0; g < groups.length; g++) {
      const baseRounds = groupRounds[g]
      if (ri >= baseRounds.length) continue
      for (const [homeId, awayId] of baseRounds[ri]) {
        if (awayId === null) {
          fixtures.push({ tournament_id: tournamentId, matchday, round: g + 1, cycle_round: ri + 1, home_team_id: homeId, away_team_id: null, is_bye: true, played: false })
        } else {
          fixtures.push({ tournament_id: tournamentId, matchday, round: g + 1, cycle_round: ri + 1, home_team_id: homeId, away_team_id: awayId, is_bye: false, played: false })
        }
      }
    }
  }
  return fixtures
}

function seededBracketPositions(size) {
  if (size === 2) return [0, 1]
  const half = seededBracketPositions(size / 2)
  const result = []
  for (const p of half) result.push(p, size - 1 - p)
  return result
}

function generatePlayoffBracket(teamIds) {
  let size = 1
  while (size < teamIds.length) size <<= 1
  const seeded = [...teamIds]
  while (seeded.length < size) seeded.push('')
  const positions = seededBracketPositions(size)
  const matches = []
  let roundOrder = size / 2
  let teamsInRound = size
  while (teamsInRound >= 2) {
    const matchCount = teamsInRound / 2
    const prevRoundOrder = roundOrder / 2
    for (let i = 0; i < matchCount; i++) {
      const isFirstRound = teamsInRound === size
      matches.push({
        round_order: roundOrder,
        match_order: i + 1,
        home_team_id: isFirstRound ? (seeded[positions[i * 2]] || null) : null,
        away_team_id: isFirstRound ? (seeded[positions[i * 2 + 1]] || null) : null,
        winner_to_match: roundOrder > 1 ? prevRoundOrder : null,
        winner_slot: (i % 2 === 0) ? 'home' : 'away',
      })
    }
    teamsInRound /= 2
    roundOrder /= 2
  }
  return matches
}

// ── слаг (совпадает с логикой src/app/actions/tournaments.ts) ────────────────
const CYRILLIC = {
  а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'y',
  к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',
  х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',
  ә:'a',ғ:'g',қ:'k',ң:'n',ө:'o',ұ:'u',ү:'u',һ:'h',і:'i',
}
const slugify = (name) => name.toLowerCase().split('').map(c => CYRILLIC[c] ?? c).join('')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50)

// Фиксированные слаги — по ним --reset находит и сносит прошлое демо.
const SLUG_SCHOOL = 'demo-chempionat-shkol-astana-2026'
const SLUG_CORPORATE = 'demo-corporate-league-astana-2026'
const SLUG_LEAGUE = 'demo-school-football-league-astana'

// Слаги прошлых поколений демо: их тоже надо снести при --reset, иначе в
// дашборде копятся соревнования от прежних прогонов.
const LEGACY_SLUGS = ['demo-spartakiada-astana-2026']

// ── генерация результата матча ───────────────────────────────────────────────
// Сила команды (1..5) смещает счёт: таблица получается осмысленной, а не шумом.
function playMatch(strengthHome, strengthAway, { drawAllowed = true } = {}) {
  const base = (s) => {
    const roll = rnd() + (s - 3) * 0.13
    if (roll < 0.18) return 0
    if (roll < 0.48) return 1
    if (roll < 0.75) return 2
    if (roll < 0.92) return 3
    return int(4, 5)
  }
  let h = base(strengthHome + 0.3)  // небольшое преимущество дома
  let a = base(strengthAway)
  if (!drawAllowed && h === a) {
    if (strengthHome >= strengthAway) h += 1
    else a += 1
  }
  return [h, a]
}

// Раскладывает голы по минутам и авторам, добавляет ассисты и карточки.
function buildEvents(fixtureKey, homeTeam, awayTeam, hs, as) {
  const events = []
  const scorersFor = (team, count) => {
    const attackers = team.players.filter(p => p.position === 'forward' || p.position === 'midfielder')
    const pool = attackers.length ? attackers : team.players
    for (let i = 0; i < count; i++) {
      const scorer = pick(pool)
      const minute = int(2, 89)
      events.push({ ...fixtureKey, team_id: team.id, player_name: scorer.name, type: 'goal', minute })
      // Ассист примерно в 60% голов — как в реальной статистике.
      if (rnd() < 0.6) {
        const mates = team.players.filter(p => p.name !== scorer.name)
        if (mates.length) {
          events.push({ ...fixtureKey, team_id: team.id, player_name: pick(mates).name, type: 'assist', minute })
        }
      }
    }
  }
  scorersFor(homeTeam, hs)
  scorersFor(awayTeam, as)

  for (const team of [homeTeam, awayTeam]) {
    const yellows = rnd() < 0.55 ? int(1, 2) : 0
    for (let i = 0; i < yellows; i++) {
      events.push({ ...fixtureKey, team_id: team.id, player_name: pick(team.players).name, type: 'yellow_card', minute: int(15, 88) })
    }
    if (rnd() < 0.07) {
      events.push({ ...fixtureKey, team_id: team.id, player_name: pick(team.players).name, type: 'red_card', minute: int(55, 90) })
    }
  }
  return events.sort((x, y) => (x.minute ?? 0) - (y.minute ?? 0))
}

// ── подключение ──────────────────────────────────────────────────────────────
async function connect() {
  if (SERVICE_KEY) {
    const supabase = createClient(URL, SERVICE_KEY, { auth: { persistSession: false } })
    const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    if (error) fail(`не удалось получить список пользователей: ${error.message}`)

    const ownerEmail = process.env.SEED_OWNER_EMAIL
    let user
    if (ownerEmail) {
      user = data.users.find(u => u.email?.toLowerCase() === ownerEmail.toLowerCase())
      if (!user) fail(`пользователь ${ownerEmail} не найден в проекте Supabase`)
    } else {
      // SEED_OWNER_EMAIL не задан — выбираем владельца сами. Демо-турниры должны
      // лежать на админском аккаунте: он видит их в дашборде и не упирается
      // в лимит бесплатного плана.
      const { data: profiles } = await supabase.from('profiles').select('id, is_admin')
      const adminIds = new Set((profiles ?? []).filter(p => p.is_admin).map(p => p.id))
      const admins = data.users.filter(u => adminIds.has(u.id))
      const pool = admins.length ? admins : data.users
      if (!pool.length) fail('в проекте нет ни одного пользователя — сначала зарегистрируйтесь в приложении')
      // Из нескольких кандидатов берём самый старый аккаунт: это почти всегда
      // аккаунт основателя, а не тестовая регистрация.
      user = pool.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0]
      console.log(`[seed] SEED_OWNER_EMAIL не задан — выбран ${admins.length ? 'админ' : 'самый старый аккаунт'}: ${user.email}`)
    }

    // Писать данные под service_role нельзя: миграция 041 выдала ему гранты
    // только на profiles/subscriptions/payment_orders/tournaments/tournament_members,
    // а teams, fixtures, match_events и остальное отвечают 42501. Вместо правки
    // схемы входим под самим владельцем: service_role выпускает ему magic link,
    // мы его тут же гасим и получаем обычную сессию с ролью authenticated —
    // у неё гранты и RLS-политики на всё, что нужно сиду.
    const { data: link, error: linkErr } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email,
    })
    if (linkErr) fail(`не удалось выпустить ссылку для входа: ${linkErr.message}`)

    if (!ANON_KEY) fail('NEXT_PUBLIC_SUPABASE_ANON_KEY не задан в .env.local')
    const asUser = createClient(URL, ANON_KEY, { auth: { persistSession: false } })
    const { error: otpErr } = await asUser.auth.verifyOtp({
      token_hash: link.properties.hashed_token,
      type: 'magiclink',
    })
    if (otpErr) fail(`не удалось войти под владельцем: ${otpErr.message}`)

    console.log(`[seed] режим: service_role + сессия владельца ${user.email}`)
    return { supabase: asUser, admin: supabase, userId: user.id }
  }

  const email = process.env.SEED_EMAIL
  const password = process.env.SEED_PASSWORD
  if (!email || !password) {
    fail(
      'нет доступа к базе. Добавьте в .env.local ОДНО из двух:\n' +
      '  SUPABASE_SERVICE_ROLE_KEY=...  и  SEED_OWNER_EMAIL=ваш@email\n' +
      '  либо  SEED_EMAIL=ваш@email  и  SEED_PASSWORD=пароль'
    )
  }
  if (!ANON_KEY) fail('NEXT_PUBLIC_SUPABASE_ANON_KEY не задан в .env.local')
  const supabase = createClient(URL, ANON_KEY, { auth: { persistSession: false } })
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) fail(`вход не удался: ${error.message}`)
  console.log(`[seed] режим: обычный пользователь ${email}`)
  console.log('[seed] напоминание: на плане Free разрешён 1 турнир — скрипт создаёт 2.')
  return { supabase, admin: null, userId: data.user.id }
}

// ── гербы команд ─────────────────────────────────────────────────────────────
// Пустой кружок вместо логотипа сразу выдаёт демо-данные, поэтому каждой команде
// рисуется свой герб: круг с градиентом, инициалы и тонкое кольцо. Рисуем в
// Chromium через Playwright — librsvg на Windows не гарантирует кириллицу
// в SVG-тексте, а браузер рендерит её всегда.
const CREST_PALETTE = [
  ['#065F46', '#10B981'], ['#1E3A8A', '#3B82F6'], ['#7C2D12', '#F97316'],
  ['#4C1D95', '#8B5CF6'], ['#831843', '#EC4899'], ['#134E4A', '#14B8A6'],
  ['#713F12', '#EAB308'], ['#1E293B', '#64748B'], ['#7F1D1D', '#EF4444'],
  ['#164E63', '#06B6D4'], ['#3F1D38', '#C026D3'], ['#14532D', '#22C55E'],
  ['#312E81', '#6366F1'], ['#78350F', '#D97706'], ['#0C4A6E', '#0EA5E9'],
  ['#4A044E', '#A21CAF'],
]

// Инициалы: из названия выбрасываем кавычки и родовые слова, берём первые буквы
// значимых слов — «Гимназия «Арман»» даёт АР, а не ГА.
const STOPWORDS = new Set(['гимназия', 'лицей', 'школа', 'ои', 'the'])
function initials(name) {
  const words = name
    .replace(/[«»"']/g, ' ')
    .split(/[\s-]+/)
    .map(w => w.trim())
    .filter(w => w && !STOPWORDS.has(w.toLowerCase()))
  if (!words.length) return name.slice(0, 2).toUpperCase()
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

function crestHtml(name, index) {
  const [deep, bright] = CREST_PALETTE[index % CREST_PALETTE.length]
  return `<!doctype html><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@700;800&display=swap" rel="stylesheet">
<style>
  html,body{margin:0;width:256px;height:256px;background:transparent}
  .c{width:256px;height:256px;border-radius:50%;
     background:linear-gradient(145deg,${deep} 0%,${bright} 100%);
     display:flex;align-items:center;justify-content:center;position:relative}
  .c::after{content:'';position:absolute;inset:14px;border-radius:50%;
     border:3px solid rgba(255,255,255,.34)}
  span{font-family:Inter,'Segoe UI',system-ui,sans-serif;font-weight:800;
     font-size:96px;color:#fff;letter-spacing:-.03em;line-height:1;
     text-shadow:0 3px 10px rgba(0,0,0,.28);z-index:1}
</style>
<div class="c"><span>${initials(name).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</span></div>`
}

// Рисует и заливает гербы, возвращает Map<имя команды, публичный URL>.
// При любой проблеме возвращает пустую Map — сид продолжается без логотипов.
async function makeCrests(supabase, names) {
  let chromium
  try {
    ({ chromium } = await import('playwright'))
  } catch {
    console.log('[seed] playwright не установлен — команды останутся без гербов')
    console.log('[seed]   поставить:  npm i -D playwright && npx playwright install chromium')
    return new Map()
  }

  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 256, height: 256 } })
  const urls = new Map()

  for (let i = 0; i < names.length; i++) {
    const name = names[i]
    await page.setContent(crestHtml(name, i), { waitUntil: 'load' })
    await page.evaluate(() => document.fonts.ready)
    const png = await page.screenshot({ type: 'png', omitBackground: true })

    const path = `demo/${slugify(name) || `team-${i}`}.png`
    const { error } = await supabase.storage.from('logos')
      .upload(path, png, { contentType: 'image/png', upsert: true })
    if (error) {
      console.log(`[seed] герб «${name}» не залился: ${error.message}`)
      continue
    }
    urls.set(name, supabase.storage.from('logos').getPublicUrl(path).data.publicUrl)
  }

  await browser.close()
  console.log(`[seed] гербов нарисовано и залито: ${urls.size} из ${names.length}`)
  return urls
}

// ── вставка пачками (PostgREST не любит гигантские тела запроса) ─────────────
async function insertChunked(supabase, table, rows, chunk = 400) {
  for (let i = 0; i < rows.length; i += chunk) {
    const { error } = await supabase.from(table).insert(rows.slice(i, i + chunk))
    if (error) fail(`вставка в ${table} не удалась: ${error.message}`)
  }
}

// ── удаление прошлого демо ───────────────────────────────────────────────────
async function resetDemo(supabase) {
  console.log('[seed] --reset: удаляю прошлое демо…')
  const { data: ts } = await supabase.from('tournaments').select('id')
    .in('slug', [SLUG_SCHOOL, SLUG_CORPORATE, ...LEGACY_SLUGS])
  for (const t of ts ?? []) {
    // Каскады в схеме сносят fixtures/teams/match_events/playoff_matches сами.
    await supabase.from('tournaments').delete().eq('id', t.id)
  }
  const { data: ls } = await supabase.from('leagues').select('id').eq('slug', SLUG_LEAGUE)
  for (const l of ls ?? []) await supabase.from('leagues').delete().eq('id', l.id)
  console.log(`[seed] удалено турниров: ${(ts ?? []).length}, чемпионатов: ${(ls ?? []).length}`)
}

// ── соревнование 1: чемпионат школ (группы + плей-офф) ────────────────────────────────
async function seedSpartakiada(supabase, userId, crests) {
  const { data: existing } = await supabase.from('tournaments').select('id').eq('slug', SLUG_SCHOOL).maybeSingle()
  if (existing) {
    console.log('[seed] чемпионат школ уже есть — пропускаю (перезалить: --reset)')
    return existing.id
  }

  const GROUPS_COUNT = 4
  const tournamentId = randomUUID()

  const { error: tErr } = await supabase.from('tournaments').insert({
    id: tournamentId,
    user_id: userId,
    name: 'Чемпионат школ Астаны 2026',
    slug: SLUG_SCHOOL,
    num_rounds: 1,
    format: 'groups_playoff',
    sport: 'football',
    match_periods: 2,
    match_duration_mins: 30,
    extra_time: false,
    points_win: 3, points_draw: 1, points_loss: 0,
    groups_count: GROUPS_COUNT,
    teams_advance: 2,
    generated: true,
  })
  if (tErr) fail(`не удалось создать чемпионат школ: ${tErr.message}`)

  // Serpentine seeding — та же раскладка, что в мастере создания турнира.
  const teamRows = SCHOOLS.map((name, i) => {
    const pot = Math.floor(i / GROUPS_COUNT)
    const posInPot = i % GROUPS_COUNT
    const groupIdx = pot % 2 === 0 ? posInPot : (GROUPS_COUNT - 1 - posInPot)
    return {
      tournament_id: tournamentId,
      name,
      group_name: String.fromCharCode(65 + groupIdx),
      logo_url: crests.get(name) ?? null,
    }
  })
  const { data: teams, error: teamsErr } = await supabase.from('teams').insert(teamRows).select('id, name, group_name')
  if (teamsErr) fail(`не удалось создать команды: ${teamsErr.message}`)

  // Составы: 11 игроков на команду, в team_players (ростер турнирной команды).
  const rosters = new Map()
  const playerRows = []
  for (const team of teams) {
    const players = []
    const used = new Set()
    for (let i = 0; i < 11; i++) {
      let name
      do { name = `${pick(FIRST)} ${pick(LAST)}` } while (used.has(name))
      used.add(name)
      const position = POSITIONS[Math.min(i, POSITIONS.length - 1)]
      players.push({ name, position })
      playerRows.push({ team_id: team.id, name, number: i + 1, position })
    }
    rosters.set(team.id, { ...team, players, strength: int(2, 5) })
  }
  await insertChunked(supabase, 'team_players', playerRows)

  // Групповой этап: круговой в каждой группе, все матчи сыграны.
  const groups = Array.from({ length: GROUPS_COUNT }, (_, g) =>
    teams.filter(t => t.group_name === String.fromCharCode(65 + g)).map(t => t.id))

  const fixtures = buildGroupsFixtures(tournamentId, groups).map(f => ({ ...f, id: randomUUID() }))
  const events = []
  for (const f of fixtures) {
    if (f.is_bye || !f.away_team_id) continue
    const home = rosters.get(f.home_team_id)
    const away = rosters.get(f.away_team_id)
    const [hs, as] = playMatch(home.strength, away.strength)
    f.home_score = hs
    f.away_score = as
    f.played = true
    events.push(...buildEvents({ fixture_id: f.id }, home, away, hs, as))
  }
  await insertChunked(supabase, 'fixtures', fixtures)
  await insertChunked(supabase, 'match_events', events)

  // Кто вышел из групп: 2 лучших по очкам, затем разнице мячей.
  const table = new Map(teams.map(t => [t.id, { id: t.id, group: t.group_name, pts: 0, gf: 0, ga: 0 }]))
  for (const f of fixtures) {
    if (!f.played || !f.away_team_id) continue
    const h = table.get(f.home_team_id), a = table.get(f.away_team_id)
    h.gf += f.home_score; h.ga += f.away_score
    a.gf += f.away_score; a.ga += f.home_score
    if (f.home_score > f.away_score) h.pts += 3
    else if (f.home_score < f.away_score) a.pts += 3
    else { h.pts += 1; a.pts += 1 }
  }
  const advancing = []
  for (let g = 0; g < GROUPS_COUNT; g++) {
    const letter = String.fromCharCode(65 + g)
    const sorted = [...table.values()].filter(r => r.group === letter)
      .sort((x, y) => (y.pts - x.pts) || ((y.gf - y.ga) - (x.gf - x.ga)) || (y.gf - x.gf))
    advancing.push(sorted[0], sorted[1])
  }
  // Посев для сетки: победители групп — верхние номера, вторые места — нижние.
  const seedOrder = [
    ...advancing.filter((_, i) => i % 2 === 0),
    ...advancing.filter((_, i) => i % 2 === 1),
  ].map(r => r.id)

  // Плей-офф: 1/4 → 1/2 → финал, все матчи сыграны, победители проброшены дальше.
  const bracket = generatePlayoffBracket(seedOrder)
  const ids = bracket.map(() => randomUUID())
  const idByKey = new Map()
  bracket.forEach((m, i) => idByKey.set(`${m.round_order}:${m.match_order}`, ids[i]))

  const poRows = bracket.map((m, i) => ({
    id: ids[i],
    tournament_id: tournamentId,
    round_order: m.round_order,
    match_order: m.match_order,
    home_team_id: m.home_team_id || null,
    away_team_id: m.away_team_id || null,
    home_score: null, away_score: null, winner_id: null,
    winner_slot: m.winner_slot,
    winner_to_match: m.winner_to_match !== null
      ? (idByKey.get(`${m.winner_to_match}:${Math.ceil(m.match_order / 2)}`) ?? null)
      : null,
  }))

  // Играем раунды от 1/4 к финалу: round_order убывает 4 → 2 → 1.
  const byId = new Map(poRows.map(r => [r.id, r]))
  const poEvents = []
  for (const roundOrder of [...new Set(poRows.map(r => r.round_order))].sort((a, b) => b - a)) {
    for (const m of poRows.filter(r => r.round_order === roundOrder)) {
      if (!m.home_team_id || !m.away_team_id) continue
      const home = rosters.get(m.home_team_id)
      const away = rosters.get(m.away_team_id)
      const [hs, as] = playMatch(home.strength, away.strength, { drawAllowed: false })
      m.home_score = hs
      m.away_score = as
      m.winner_id = hs > as ? m.home_team_id : m.away_team_id
      poEvents.push(...buildEvents({ playoff_match_id: m.id }, home, away, hs, as))
      if (m.winner_to_match) {
        const next = byId.get(m.winner_to_match)
        if (next) next[m.winner_slot === 'home' ? 'home_team_id' : 'away_team_id'] = m.winner_id
      }
    }
  }
  await insertChunked(supabase, 'playoff_matches', poRows)
  // match_events для плей-офф появились в миграции 009; если её нет — не роняем сид.
  const { error: poEvErr } = await supabase.from('match_events').insert(poEvents.slice(0, 400))
  if (poEvErr) console.log(`[seed] события плей-офф пропущены: ${poEvErr.message}`)
  else if (poEvents.length > 400) await insertChunked(supabase, 'match_events', poEvents.slice(400))

  const champion = rosters.get(poRows.find(r => r.round_order === 1)?.winner_id)
  console.log(`[seed] чемпионат школ готов: 16 команд, ${fixtures.length} матчей группы, ${poRows.length} матчей плей-офф`)
  console.log(`[seed]   чемпион: ${champion?.name ?? '—'}`)
  return tournamentId
}

// ── турнир 2: корпоративная лига (круговой, в разгаре) ───────────────────────
async function seedCorporate(supabase, userId, crests) {
  const { data: existing } = await supabase.from('tournaments').select('id').eq('slug', SLUG_CORPORATE).maybeSingle()
  if (existing) {
    console.log('[seed] корпоративная лига уже есть — пропускаю (перезалить: --reset)')
    return existing.id
  }

  const tournamentId = randomUUID()
  const { error: tErr } = await supabase.from('tournaments').insert({
    id: tournamentId,
    user_id: userId,
    name: 'Корпоративная лига Астаны 2026',
    slug: SLUG_CORPORATE,
    num_rounds: 1,
    format: 'round_robin',
    sport: 'futsal',
    match_periods: 2,
    match_duration_mins: 20,
    extra_time: false,
    points_win: 3, points_draw: 1, points_loss: 0,
    generated: true,
  })
  if (tErr) fail(`не удалось создать корпоративную лигу: ${tErr.message}`)

  const { data: teams, error: teamsErr } = await supabase
    .from('teams')
    .insert(COMPANIES.map(name => ({
      tournament_id: tournamentId, name, group_name: null, logo_url: crests.get(name) ?? null,
    })))
    .select('id, name')
  if (teamsErr) fail(`не удалось создать команды: ${teamsErr.message}`)

  const rosters = new Map()
  const playerRows = []
  for (const team of teams) {
    const players = []
    const used = new Set()
    for (let i = 0; i < 8; i++) {
      let name
      do { name = `${pick(FIRST)} ${pick(LAST)}` } while (used.has(name))
      used.add(name)
      players.push({ name, position: POSITIONS[Math.min(i, POSITIONS.length - 1)] })
      playerRows.push({ team_id: team.id, name, number: i + 1, position: players[i].position })
    }
    rosters.set(team.id, { ...team, players, strength: int(2, 5) })
  }
  await insertChunked(supabase, 'team_players', playerRows)

  const fixtures = buildRoundRobinFixtures(tournamentId, teams.map(t => t.id), 1)
    .map(f => ({ ...f, id: randomUUID() }))

  // Сыграно 6 туров из 9 — на скринах видно и таблицу, и ближайшие матчи.
  const PLAYED_UNTIL = 6
  const events = []
  for (const f of fixtures) {
    if (f.matchday > PLAYED_UNTIL || f.is_bye || !f.away_team_id) continue
    const home = rosters.get(f.home_team_id)
    const away = rosters.get(f.away_team_id)
    const [hs, as] = playMatch(home.strength, away.strength)
    f.home_score = hs
    f.away_score = as
    f.played = true
    events.push(...buildEvents({ fixture_id: f.id }, home, away, hs, as))
  }
  await insertChunked(supabase, 'fixtures', fixtures)
  await insertChunked(supabase, 'match_events', events)

  console.log(`[seed] корпоративная лига готова: 10 команд, сыграно ${PLAYED_UNTIL} туров из ${Math.max(...fixtures.map(f => f.matchday))}`)
  return tournamentId
}

// ── чемпионат (лига) поверх школьного соревнования ──────────────────────────────────────
// Даёт публичные страницы лиги/команд/игроков — это то, что индексируется
// поисковиками и что показываем как «ваш турнир живёт по своей ссылке».
async function seedLeague(supabase, userId, spartakiadaId, crests) {
  const { data: existing } = await supabase.from('leagues').select('id').eq('slug', SLUG_LEAGUE).maybeSingle()
  if (existing) {
    console.log('[seed] чемпионат уже есть — пропускаю (перезалить: --reset)')
    return existing.id
  }

  const leagueId = randomUUID()
  const { error: lErr } = await supabase.from('leagues').insert({
    id: leagueId,
    owner_id: userId,
    name: 'Школьная футбольная лига Астаны',
    slug: SLUG_LEAGUE,
    sport: 'football',
    city: 'Астана',
    description: 'Межшкольные соревнования по футболу среди 8–11 классов. Осенний и весенний сезоны, таблица, статистика игроков.',
    is_public: true,
  })
  if (lErr) {
    console.log(`[seed] чемпионат пропущен: ${lErr.message}`)
    return null
  }

  const { data: leagueTeams, error: ltErr } = await supabase
    .from('league_teams')
    .insert(SCHOOLS.map(name => ({
      league_id: leagueId, name, slug: slugify(name), city: 'Астана', logo_url: crests.get(name) ?? null,
    })))
    .select('id, name')
  if (ltErr) {
    // Колонки logo_url у league_teams может не быть — повторяем без неё,
    // чтобы отсутствие логотипа не срывало создание чемпионата.
    const { data: retry, error: retryErr } = await supabase
      .from('league_teams')
      .insert(SCHOOLS.map(name => ({ league_id: leagueId, name, slug: slugify(name), city: 'Астана' })))
      .select('id, name')
    if (retryErr) {
      console.log(`[seed] команды чемпионата пропущены: ${retryErr.message}`)
      return leagueId
    }
    return finishLeague(supabase, leagueId, retry, spartakiadaId)
  }
  return finishLeague(supabase, leagueId, leagueTeams, spartakiadaId)
}

// Ростеры, сезон и связка турнирных команд с командами чемпионата.
async function finishLeague(supabase, leagueId, leagueTeams, spartakiadaId) {

  // Ростеры чемпионата (таблица players) — отдельно от турнирных team_players.
  const players = []
  for (const lt of leagueTeams) {
    const used = new Set()
    for (let i = 0; i < 11; i++) {
      let name
      do { name = `${pick(FIRST)} ${pick(LAST)}` } while (used.has(name))
      used.add(name)
      players.push({ league_team_id: lt.id, name, number: i + 1, position: POSITIONS[Math.min(i, POSITIONS.length - 1)] })
    }
  }
  await insertChunked(supabase, 'players', players)

  const { error: sErr } = await supabase.from('seasons').insert({
    league_id: leagueId,
    tournament_id: spartakiadaId,
    name: 'Сезон 2026',
    status: 'active',
  })
  if (sErr) console.log(`[seed] сезон пропущен: ${sErr.message}`)

  // Привязываем турнирные команды к командам чемпионата — статистика игроков
  // начинает переходить между сезонами.
  const { data: tTeams } = await supabase.from('teams').select('id, name').eq('tournament_id', spartakiadaId)
  const byName = new Map(leagueTeams.map(t => [t.name, t.id]))
  for (const t of tTeams ?? []) {
    const ltId = byName.get(t.name)
    if (ltId) await supabase.from('teams').update({ league_team_id: ltId }).eq('id', t.id)
  }

  console.log(`[seed] чемпионат готов: ${leagueTeams.length} команд, ${players.length} игроков, 1 сезон`)
  return leagueId
}

// ── main ─────────────────────────────────────────────────────────────────────
const { supabase, admin, userId } = await connect()
if (RESET) await resetDemo(supabase)

// Гербы рисуются один раз на все команды обоих соревнований.
// Заливаем под service_role, если он есть: у него нет ограничений бакета.
const crests = await makeCrests(admin ?? supabase, [...SCHOOLS, ...COMPANIES])

const spartakiadaId = await seedSpartakiada(supabase, userId, crests)
const corporateId = await seedCorporate(supabase, userId, crests)
const leagueId = await seedLeague(supabase, userId, spartakiadaId, crests)

const APP = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
console.log('\n[seed] готово. Что снимать:')
console.log(`  Чемпионат школ (группы + сетка): ${APP}/dashboard/tournament/${spartakiadaId}`)
console.log(`  Корпоративная лига (в разгаре): ${APP}/dashboard/tournament/${corporateId}`)
if (leagueId) console.log(`  Чемпионат (дашборд):           ${APP}/dashboard/leagues/${leagueId}`)
console.log(`  Публичная страница турнира:     ${APP}/t/${SLUG_SCHOOL}`)
console.log(`  Публичная страница чемпионата:  ${APP}/leagues/${SLUG_LEAGUE}`)
console.log('\n  Названия школ, компаний и игроков вымышленные.\n')

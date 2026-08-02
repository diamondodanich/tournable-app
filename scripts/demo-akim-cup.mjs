// Демо-турнир «Кубок акима Астаны» для показа SPORT PROJECTS.
// Команды — реальные корпоративные команды Астаны из открытой таблицы Высшей лиги AFL (astfl.kz).
// Результаты матчей — демонстрационные. В названии турнира это указано явно.
import crypto from 'node:crypto'
import { createRequire } from 'node:module'

const require = createRequire('C:/Users/user/Documents/tournable-next/package.json')
require('dotenv').config({ path: 'C:/Users/user/Documents/tournable-next/.env.local' })
const { createClient } = require('@supabase/supabase-js')

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const OWNER = 'b8f69bc3-d55d-4b5c-b61e-eb181e074560' // ilgeriustaz@gmail.com
const NAME = 'Кубок акима Астаны — демо-образец Tournable'
const GROUPS = 4
const ADVANCE = 2

// 12 команд из открытой турнирной таблицы Высшей лиги AFL, Астана
const TEAMS = [
  'KazEuroTrans', 'Oma.kz', 'Allur', 'BI GROUP', 'BEK-SULTAN', 'Сайран',
  'DoDo', 'MultiPortSystems', 'ДП BI Group', 'ELIM-AI', 'Федерация Проф', 'ZhaStar FC',
]

const CYR = { а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',ә:'a',ғ:'g',қ:'k',ң:'n',ө:'o',ұ:'u',ү:'u',һ:'h',і:'i' }
const toSlug = (n, id) => `${n.toLowerCase().split('').map(c => CYR[c] ?? c).join('').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50)}-${id.slice(0, 6)}`

// ── Зеркала алгоритмов приложения ────────────────────────────────────────────
function roundRobin(teams) {
  const w = [...teams]
  if (w.length % 2 === 1) w.push(null)
  const n = w.length, rounds = n - 1, half = n / 2
  const res = [], fixed = w[0], rot = w.slice(1)
  for (let r = 0; r < rounds; r++) {
    const rm = [], arr = [fixed, ...rot]
    for (let i = 0; i < half; i++) {
      const home = arr[i], away = arr[n - 1 - i]
      if (r % 2 === 1 && i === 0) rm.push([away, home]); else rm.push([home, away])
    }
    res.push(rm); rot.unshift(rot.pop())
  }
  return res
}
const nextPow2 = (n) => { let p = 1; while (p < n) p <<= 1; return p }
function seededPositions(size) {
  if (size === 2) return [0, 1]
  const half = seededPositions(size / 2), res = []
  for (const p of half) res.push(p, size - 1 - p)
  return res
}
function playoffBracket(count) {
  const size = nextPow2(count)
  const seeded = Array(size).fill('')
  const positions = seededPositions(size)
  const matches = []
  let roundOrder = size / 2, teamsInRound = size
  while (teamsInRound >= 2) {
    const matchCount = teamsInRound / 2
    const prev = roundOrder / 2
    for (let i = 0; i < matchCount; i++) {
      matches.push({
        round_order: roundOrder, match_order: i + 1,
        winner_to_match: roundOrder > 1 ? prev : null,
        winner_slot: i % 2 === 0 ? 'home' : 'away',
      })
    }
    teamsInRound /= 2; roundOrder /= 2
  }
  return matches
}

// ── Предполётная проверка ────────────────────────────────────────────────────
for (const t of ['teams', 'fixtures', 'playoff_matches']) {
  const { error } = await db.from(t).select('id').limit(1)
  if (error) {
    console.error(`\nНЕТ ДОСТУПА к таблице ${t}: ${error.message}`)
    console.error('Примени supabase/migrations/047_service_role_grants_rest.sql и запусти снова.\n')
    process.exit(1)
  }
}

// ── Турнир ───────────────────────────────────────────────────────────────────
const tid = crypto.randomUUID()
const { error: tErr } = await db.from('tournaments').insert({
  id: tid, user_id: OWNER, name: NAME, slug: toSlug(NAME, tid),
  format: 'groups_playoff', num_rounds: 1, sport: 'football',
  groups_count: GROUPS, teams_advance: ADVANCE,
  match_periods: 2, match_duration_mins: 45, extra_time: false,
  points_win: 3, points_draw: 1, points_loss: 0,
  is_public: false, generated: false,
})
if (tErr) { console.error('Турнир:', tErr.message); process.exit(1) }
console.log('Турнир создан:', tid)

// ── Команды с змейкой по группам (как в приложении) ─────────────────────────
const rows = TEAMS.map((name, i) => {
  const pot = Math.floor(i / GROUPS), pos = i % GROUPS
  const gi = pot % 2 === 0 ? pos : (GROUPS - 1 - pos)
  return { id: crypto.randomUUID(), tournament_id: tid, name, group_name: String.fromCharCode(65 + gi) }
})
const { error: teamErr } = await db.from('teams').insert(rows)
if (teamErr) { console.error('Команды:', teamErr.message); process.exit(1) }
const teamIds = rows.map(r => r.id)
console.log('Команд:', rows.length, '| группы:', rows.map(r => r.group_name).join(''))

// ── Матчи группового этапа ───────────────────────────────────────────────────
const groups = Array.from({ length: GROUPS }, () => [])
teamIds.forEach((id, i) => {
  const pot = Math.floor(i / GROUPS), pos = i % GROUPS
  groups[pot % 2 === 0 ? pos : (GROUPS - 1 - pos)].push(id)
})
const groupRounds = groups.map(g => (g.length >= 2 ? roundRobin(g) : []))
const maxRounds = Math.max(...groupRounds.map(r => r.length), 0)

// Демонстрационные счета: детерминированные, без случайных чисел
const SCORES = [[2,1],[3,0],[1,1],[0,2],[4,2],[2,2],[1,0],[3,1],[2,0],[1,3],[5,1],[0,0],[2,3],[1,2],[3,3],[4,0],[2,1],[0,1]]
const fixtures = []
let matchday = 0, si = 0
for (let ri = 0; ri < maxRounds; ri++) {
  matchday++
  for (let g = 0; g < groups.length; g++) {
    const base = groupRounds[g]
    if (ri >= base.length) continue
    for (const [home, away] of base[ri]) {
      if (away === null) {
        fixtures.push({ tournament_id: tid, matchday, round: g + 1, cycle_round: ri + 1, home_team_id: home, away_team_id: null, is_bye: true, played: false })
      } else {
        const [hs, as] = SCORES[si++ % SCORES.length]
        fixtures.push({ tournament_id: tid, matchday, round: g + 1, cycle_round: ri + 1, home_team_id: home, away_team_id: away, is_bye: false, played: true, home_score: hs, away_score: as, status: 'finished' })
      }
    }
  }
}
const { error: fErr } = await db.from('fixtures').insert(fixtures)
if (fErr) { console.error('Матчи:', fErr.message); process.exit(1) }
console.log('Матчей группового этапа:', fixtures.filter(f => !f.is_bye).length, '(все сыграны)')

// ── Заготовка сетки плей-офф ─────────────────────────────────────────────────
const bracket = playoffBracket(GROUPS * ADVANCE)
const ids = bracket.map(() => crypto.randomUUID())
const byKey = new Map()
bracket.forEach((m, i) => byKey.set(`${m.round_order}:${m.match_order}`, ids[i]))
const pmRows = bracket.map((m, i) => ({
  id: ids[i], tournament_id: tid, round_order: m.round_order, match_order: m.match_order,
  home_team_id: null, away_team_id: null, winner_slot: m.winner_slot,
  winner_to_match: m.winner_to_match === null ? null : (byKey.get(`${m.winner_to_match}:${Math.ceil(m.match_order / 2)}`) ?? null),
}))
const { error: pErr } = await db.from('playoff_matches').insert(pmRows)
if (pErr) console.error('Сетка:', pErr.message)
else console.log('Матчей в сетке плей-офф:', pmRows.length)

await db.from('tournaments').update({ generated: true }).eq('id', tid)
const { data: fin } = await db.from('tournaments').select('slug').eq('id', tid).single()
console.log('\nПанель:   https://tournable.app/dashboard/tournament/' + tid)
console.log('Публично: https://tournable.app/t/' + (fin?.slug ?? tid))

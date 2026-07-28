// ─────────────────────────────────────────────────────────────────────────────
// Подбирает настоящие спортивные фотографии для фонов слайдов.
//
// Источник — Wikimedia Commons: единственная крупная база, где лицензия каждого
// файла указана машиночитаемо и её можно проверить, а не принять на веру.
//
//   node marketing/studio/fetch-photos.mjs
//   node marketing/studio/fetch-photos.mjs --list     показать что уже скачано
//
// ── Что берём и почему именно это ────────────────────────────────────────────
// Допускаются только public domain, CC0 и CC BY. Отдельно ОТКЛОНЯЕТСЯ CC BY-SA:
// её share-alike требует лицензировать производное произведение на тех же
// условиях, а слайд с наложенным текстом — производное. Для коммерческого
// аккаунта это неприемлемо.
//
// Пресс-фото с чемпионатов (Getty, AP, FIFA) не используются: они лицензионные,
// а к авторскому праву добавляется товарный знак организатора.
//
// Предпочитаем общие планы — поле, трибуны, свет — а не крупные портреты:
// узнаваемое лицо в рекламе задевает право на изображение независимо от
// лицензии на саму фотографию.
// ─────────────────────────────────────────────────────────────────────────────

import { writeFileSync, mkdirSync, existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'

const ROOT = process.cwd()
const PHOTOS = join(ROOT, 'marketing', 'photos')
const CREDITS = join(PHOTOS, 'credits.json')
const UA = 'TournableContentBot/1.0 (https://tournable.app; marketing assets)'

mkdirSync(PHOTOS, { recursive: true })

if (process.argv.includes('--list')) {
  const credits = existsSync(CREDITS) ? JSON.parse(readFileSync(CREDITS, 'utf8')) : []
  for (const c of credits) console.log(`${c.file}\n  ${c.license} · ${c.author || 'без автора'}\n  ${c.source}`)
  console.log(`\nвсего: ${credits.length}`)
  process.exit(0)
}

// Лицензии, под которыми фон можно ставить в коммерческий пост.
const ALLOWED = [
  /^public domain$/i, /^cc0/i, /^cc pd/i, /^pd-/i,
  /^cc by \d/i, /^cc by$/i,
]
const isAllowed = (name = '') => ALLOWED.some(re => re.test(name.trim()))

// Что ищем: атмосфера соревнования, а не конкретные люди.
// В англоязычных источниках «football» — это и американский футбол, поэтому
// для нашего вида спорта запросы идут через «soccer» и «association football».
//
// `take` — сколько подходящих файлов брать из выдачи. Один снимок на тему
// приводит к тому, что одна и та же картинка кочует по всем постам; банк должен
// быть достаточно широким, чтобы у каждого поста был свой фон.
const QUERIES = [
  // Поле и стадион
  { q: 'soccer stadium floodlights night match', slot: 'floodlights', take: 2 },
  { q: 'association football pitch grass lines', slot: 'pitch', take: 2 },
  { q: 'soccer goal net penalty area', slot: 'goal', take: 2 },
  { q: 'soccer stadium empty seats', slot: 'seats', take: 2 },
  { q: 'football supporters stand terraces', slot: 'stands', take: 2 },
  { q: 'soccer corner flag pitch', slot: 'corner', take: 1 },
  { q: 'soccer ball on grass', slot: 'ball', take: 2 },
  // Люди и игра — общими планами
  { q: 'youth soccer training session', slot: 'youth', take: 2 },
  { q: 'school sports day children running', slot: 'school', take: 2 },
  { q: 'football team huddle players', slot: 'team', take: 1 },
  { q: 'football referee whistle match', slot: 'referee', take: 1 },
  // Залы и другие дисциплины
  { q: 'sports hall indoor futsal court', slot: 'indoor', take: 2 },
  { q: 'basketball court outdoor city', slot: 'basketball', take: 2 },
  { q: 'volleyball court net indoor', slot: 'volleyball', take: 1 },
  { q: 'school gymnasium sports hall', slot: 'gym', take: 2 },
  // Награждение и итоги
  { q: 'trophy cup silver award object', slot: 'trophy', take: 2 },
  { q: 'gold medal ribbon award object', slot: 'medals', take: 2 },
  { q: 'soccer scoreboard football ground', slot: 'scoreboard', take: 1 },
  { q: 'winners podium sport ceremony', slot: 'podium', take: 1 },
  // Работа организатора — под посты про бумагу, таблицы и планирование
  { q: 'spreadsheet paper documents desk', slot: 'paper', take: 2 },
  { q: 'notebook pen planning desk', slot: 'notebook', take: 1 },
  { q: 'stopwatch timer sport', slot: 'stopwatch', take: 1 },
  { q: 'office meeting room colleagues', slot: 'office', take: 1 },
]

// Названия, по которым сразу видно чужой вид спорта или неподходящий сюжет.
const REJECT_SPORT = /american football|gridiron|NFL|rugby|cricket|baseball|helmet|touchdown|superbowl|super bowl/i

// Кадры с турниров и сборных: даже под свободной лицензией на них видны
// эмблемы FIFA, УЕФА, федераций и олимпийского движения. Свободная лицензия
// на фотографию не даёт права использовать чужой товарный знак в рекламе.
const REJECT_BRAND = /FIFA|UEFA|world cup|champions league|olympi|euro 20|copa |premier league|bundesliga|la liga|serie a|national team|Nations League/i

const REJECT_TITLE = new RegExp(`${REJECT_SPORT.source}|${REJECT_BRAND.source}`, 'i')

const strip = (html = '') => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

async function search(query, limit = 25) {
  const url = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({
    action: 'query', format: 'json', generator: 'search',
    gsrsearch: `filetype:bitmap ${query}`,
    gsrnamespace: '6', gsrlimit: String(limit),
    prop: 'imageinfo', iiprop: 'url|size|extmetadata', iiurlwidth: '1600',
  })
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) return []
  const json = await res.json()
  return Object.values(json.query?.pages ?? [])
}

const credits = []
const seenTitles = new Set()
let index = 0

for (const { q, slot, take = 1 } of QUERIES) {
  const pages = await search(q, 40)
  const picked = []

  for (const page of pages) {
    if (picked.length >= take) break
    const info = page.imageinfo?.[0]
    if (!info) continue
    const meta = info.extmetadata ?? {}
    const license = strip(meta.LicenseShortName?.value ?? '')
    if (!isAllowed(license)) continue
    if (REJECT_TITLE.test(page.title)) continue
    // Один и тот же файл вылезает в нескольких запросах — берём его один раз.
    if (seenTitles.has(page.title)) continue
    // Узкие и мелкие кадры на фон 1080×1350 не растянуть без каши.
    if ((info.width ?? 0) < 1200) continue
    if ((info.width ?? 0) / (info.height ?? 1) < 1.2) continue
    seenTitles.add(page.title)
    picked.push({ page, info, meta, license })
  }

  if (!picked.length) { console.log(`[photos] ${slot}: подходящего файла не нашлось`); continue }

  let n = 0
  for (const { page, info, meta, license } of picked) {
    const src = info.thumburl ?? info.url
    const res = await fetch(src, { headers: { 'User-Agent': UA } })
    if (!res.ok) { console.log(`[photos] ${slot}: не скачалось (${res.status})`); continue }

    // Слоты с несколькими картинками нумеруются: pitch, pitch-2, pitch-3.
    const key = n === 0 ? slot : `${slot}-${n + 1}`
    n++

    const buf = Buffer.from(await res.arrayBuffer())
    const file = `${String(++index).padStart(2, '0')}-${key}.jpg`
    // Приводим к одному размеру и весу: фон всё равно уходит под затемнение.
    await sharp(buf).resize({ width: 1400, height: 1000, fit: 'cover' })
      .jpeg({ quality: 82 }).toFile(join(PHOTOS, file))

    const author = strip(meta.Artist?.value ?? '')
    credits.push({
      file,
      slot: key,
      title: page.title.replace(/^File:/, ''),
      license,
      author,
      // CC BY требует указания автора рядом с изображением; public domain — нет.
      attributionRequired: /^cc by/i.test(license),
      source: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`,
    })
    console.log(`[photos] ${file}  ${license}${author ? ` · ${author}` : ''}`)
  }
}

writeFileSync(CREDITS, JSON.stringify(credits, null, 2), 'utf8')

const needAttr = credits.filter(c => c.attributionRequired).length
console.log(`\n[photos] скачано ${credits.length}, из них с обязательным указанием автора: ${needAttr}`)
console.log(`[photos] реестр лицензий: marketing/photos/credits.json`)
console.log('[photos] CC BY-SA и пресс-фото отклоняются намеренно — см. шапку файла.\n')

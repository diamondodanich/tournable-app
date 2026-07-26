// ─────────────────────────────────────────────────────────────────────────────
// Выгружает готовые материалы в платформу.
//
// Всё, что собрали студия и автосъёмка, уезжает в бакет Supabase Storage
// `marketing` вместе с манифестом. Раздел /admin/content читает манифест и
// показывает контент прямо в интерфейсе — с превью и кнопками скачивания.
//
//   node marketing/studio/publish-to-app.mjs
//
// Ключ: SUPABASE_SERVICE_ROLE_KEY в .env.local.
//
// Бакет публичный: это материалы, которые и так предназначены для публикации,
// а публичные ссылки позволяют показывать превью без подписанных URL.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, basename, extname } from 'node:path'
import { clipNote } from './clip-notes.mjs'

const ROOT = process.cwd()
const OUT = join(ROOT, 'marketing', 'out')
const POSTS = join(ROOT, 'marketing', 'studio', 'posts')
const FOOTAGE = join(ROOT, 'marketing', 'footage')
const SHOTS = join(ROOT, 'marketing', 'shots')
const BUCKET = 'marketing'

function loadEnv() {
  const p = join(ROOT, '.env.local')
  if (!existsSync(p)) return
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
loadEnv()

const fail = (m) => { console.error(`\n[app] ${m}\n`); process.exit(1) }
const log = (...a) => console.log('[app]', ...a)

const URL_SB = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!URL_SB || !SERVICE) fail('нужны NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в .env.local')

const supabase = createClient(URL_SB, SERVICE, { auth: { persistSession: false } })

const contentTypeFor = (file) => ({
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.webm': 'video/webm', '.mp4': 'video/mp4', '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
}[extname(file).toLowerCase()] ?? 'application/octet-stream')

async function ensureBucket() {
  const { error } = await supabase.storage.createBucket(BUCKET, { public: true })
  if (error && !/exist/i.test(error.message)) fail(`не создать бакет: ${error.message}`)
  // На случай, если бакет уже был приватным — материалы должны открываться по ссылке.
  await supabase.storage.updateBucket(BUCKET, { public: true }).catch(() => {})
}

async function upload(path, body, contentType) {
  const { error } = await supabase.storage.from(BUCKET)
    .upload(path, body, { contentType, upsert: true })
  if (error) { log(`  не залилось ${path}: ${error.message}`); return null }
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

await ensureBucket()

// ── Карусели ─────────────────────────────────────────────────────────────────
const posts = []
const postFiles = existsSync(POSTS) ? readdirSync(POSTS).filter(f => f.endsWith('.json')) : []

// Слайды одного варианта поста: заливает PNG и возвращает список ссылок.
async function uploadVariant(slug, dir, prefix) {
  const pngs = readdirSync(dir).filter(f => /^\d+\.png$/.test(f)).sort()
  const slides = []
  for (const png of pngs) {
    const url = await upload(`posts/${prefix}/${png}`, readFileSync(join(dir, png)), 'image/png')
    if (url) slides.push({ n: parseInt(png, 10), name: png, url })
  }
  return slides
}

for (const file of postFiles) {
  const meta = JSON.parse(readFileSync(join(POSTS, file), 'utf8'))
  const slug = meta.slug ?? basename(file, '.json')
  const dir = join(OUT, slug)
  if (!existsSync(dir)) { log(`пропуск ${slug}: не отрисован`); continue }

  // Телефонный и десктопный варианты — это один пост с одним текстом, а не два
  // разных. В разделе они переключаются тумблером, поэтому и в манифесте живут
  // вместе, а не двумя карточками.
  const slides = await uploadVariant(slug, dir, slug)
  const deskDir = join(OUT, `${slug}-desktop`)
  const slidesDesktop = existsSync(deskDir)
    ? await uploadVariant(slug, deskDir, `${slug}-desktop`)
    : []

  // В caption.txt хештеги уже вшиты в конец — для выгрузки в платформу текст и
  // хештеги разводятся, иначе в разделе они показываются дважды.
  const captionPath = join(dir, 'caption.txt')
  if (existsSync(captionPath)) {
    await upload(`posts/${slug}/caption.txt`, readFileSync(captionPath), 'text/plain; charset=utf-8')
  }
  const caption = [meta.caption, meta.cta].filter(Boolean).map(s => s.trim()).join('\n\n')

  posts.push({
    slug,
    order: meta.order ?? 99,
    lang: meta.lang ?? 'ru',
    audience: meta.audience ?? '',
    goal: meta.goal ?? '',
    title: meta.slides?.[0]?.title ?? slug,
    slides,
    slidesDesktop,
    caption,
    hashtags: meta.hashtags ?? [],
  })
  log(`карусель ${slug}: ${slides.length} слайдов${slidesDesktop.length ? ` + ${slidesDesktop.length} десктоп` : ''}`)
}
posts.sort((a, b) => a.order - b.order)

// ── Видеоклипы ───────────────────────────────────────────────────────────────
const clips = []
const clipFiles = existsSync(FOOTAGE) ? readdirSync(FOOTAGE).filter(f => f.endsWith('.webm')).sort() : []
for (const file of clipFiles) {
  const name = basename(file, '.webm')
  const url = await upload(`footage/${file}`, readFileSync(join(FOOTAGE, file)), 'video/webm')
  if (!url) continue
  clips.push({ name, url, bytes: statSync(join(FOOTAGE, file)).size, ...clipNote(name) })
  log(`клип ${name}`)
}

// ── Кадры продукта ───────────────────────────────────────────────────────────
const shots = []
const shotFiles = existsSync(SHOTS) ? readdirSync(SHOTS).filter(f => f.endsWith('.png')).sort() : []
for (const file of shotFiles) {
  const url = await upload(`shots/${file}`, readFileSync(join(SHOTS, file)), 'image/png')
  if (url) shots.push({ name: basename(file, '.png'), url })
}
log(`кадров продукта: ${shots.length}`)

// ── Манифест ─────────────────────────────────────────────────────────────────
const manifest = {
  builtAt: new Date().toISOString(),
  posts,
  clips,
  shots,
}
const manifestUrl = await upload(
  'manifest.json',
  Buffer.from(JSON.stringify(manifest, null, 2), 'utf8'),
  'application/json; charset=utf-8',
)

console.log(`\n[app] выгружено: ${posts.length} каруселей, ${clips.length} клипов, ${shots.length} кадров`)
console.log(`[app] манифест: ${manifestUrl}`)
console.log('[app] смотреть в платформе: /admin/content\n')

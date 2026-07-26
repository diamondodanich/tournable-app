// ─────────────────────────────────────────────────────────────────────────────
// Публикация готовой карусели из marketing/out/<slug>/ в соцсети.
//
// Работает по официальным бесплатным API. Ничего не публикует без явного
// флага --publish: без него это сухой прогон, который печатает, что и куда
// ушло бы. Публикация необратима, поэтому подтверждение — всегда осознанное.
//
// ── Запуск ───────────────────────────────────────────────────────────────────
//   node scripts/publish.mjs ru-5-oshibok-spartakiada                 сухой прогон
//   node scripts/publish.mjs ru-5-oshibok-spartakiada --publish       публикация
//   node scripts/publish.mjs <slug> --only=telegram --publish         один канал
//
// ── Как устроено ─────────────────────────────────────────────────────────────
// Telegram принимает файлы напрямую. Threads — нет: он сам ходит за картинкой
// по публичному URL, поэтому PNG сначала заливаются в публичный бакет Supabase
// Storage (`marketing`), и уже эти ссылки уходят в Threads.
//
// ── Ключи (.env.local) ───────────────────────────────────────────────────────
//   TELEGRAM_BOT_TOKEN      бот из @BotFather, добавленный в канал админом
//   TELEGRAM_CHANNEL_ID     @имя_канала или числовой id (-100…)
//   THREADS_USER_ID         id пользователя Threads
//   THREADS_ACCESS_TOKEN    долгоживущий токен (60 дней, продлевается)
//   SUPABASE_SERVICE_ROLE_KEY   для заливки картинок в Storage
//
// Канал молча пропускается, если его ключей нет.
// ─────────────────────────────────────────────────────────────────────────────

import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

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

const args = process.argv.slice(2)
const slug = args.find(a => !a.startsWith('--'))
const PUBLISH = args.includes('--publish')
const onlyArg = args.find(a => a.startsWith('--only='))
const ONLY = onlyArg ? onlyArg.slice('--only='.length).split(',') : null

if (!slug) {
  console.error('[publish] укажите slug поста: node scripts/publish.mjs ru-5-oshibok-spartakiada')
  process.exit(1)
}

const DIR = join(process.cwd(), 'marketing', 'out', slug)
if (!existsSync(DIR)) {
  console.error(`[publish] нет папки ${DIR} — сначала соберите пост: node marketing/studio/render.mjs ${slug}`)
  process.exit(1)
}

const images = readdirSync(DIR).filter(f => /^\d+\.png$/.test(f)).sort()
if (!images.length) {
  console.error(`[publish] в ${DIR} нет PNG. Соберите их: node marketing/studio/render.mjs ${slug}`)
  process.exit(1)
}

const captionPath = join(DIR, 'caption.txt')
const caption = existsSync(captionPath) ? readFileSync(captionPath, 'utf8').trim() : ''

const enabled = (name) => !ONLY || ONLY.includes(name)
const log = (...a) => console.log('[publish]', ...a)

log(`пост: ${slug}`)
log(`слайдов: ${images.length}, подпись: ${caption.length} символов`)
if (!PUBLISH) log('РЕЖИМ СУХОГО ПРОГОНА — ничего не публикуется. Для реальной отправки добавьте --publish')

// ── Заливка картинок в публичный бакет (нужна Threads и любому API по URL) ───
async function uploadToStorage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    log('storage: пропуск — нет SUPABASE_SERVICE_ROLE_KEY (Threads без публичных URL работать не сможет)')
    return null
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } })

  // Бакет создаётся один раз; повторный вызов вернёт ошибку «уже существует» — это норма.
  const { error: bucketErr } = await supabase.storage.createBucket('marketing', { public: true })
  if (bucketErr && !/exist/i.test(bucketErr.message)) {
    log(`storage: не удалось создать бакет: ${bucketErr.message}`)
    return null
  }

  const urls = []
  for (const file of images) {
    const path = `${slug}/${file}`
    const body = readFileSync(join(DIR, file))
    const { error } = await supabase.storage.from('marketing')
      .upload(path, body, { contentType: 'image/png', upsert: true })
    if (error) {
      log(`storage: ошибка заливки ${file}: ${error.message}`)
      return null
    }
    urls.push(supabase.storage.from('marketing').getPublicUrl(path).data.publicUrl)
  }
  log(`storage: залито ${urls.length} картинок в публичный бакет marketing`)
  return urls
}

// ── Telegram ─────────────────────────────────────────────────────────────────
// Альбом до 10 фото одним сообщением; подпись ставится на первое фото.
async function publishTelegram() {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chat = process.env.TELEGRAM_CHANNEL_ID
  if (!token || !chat) {
    log('telegram: пропуск — нет TELEGRAM_BOT_TOKEN или TELEGRAM_CHANNEL_ID')
    return
  }

  const batch = images.slice(0, 10)
  if (images.length > 10) log(`telegram: в альбом уйдут первые 10 из ${images.length} слайдов (лимит Telegram)`)

  const media = batch.map((file, i) => ({
    type: 'photo',
    media: `attach://${file.replace('.', '_')}`,
    ...(i === 0 && caption ? { caption: caption.slice(0, 1024), parse_mode: 'HTML' } : {}),
  }))
  if (caption.length > 1024) log('telegram: подпись длиннее 1024 символов — обрезана (лимит Telegram)')

  if (!PUBLISH) {
    log(`telegram: отправил бы альбом из ${batch.length} фото в ${chat}`)
    return
  }

  const form = new FormData()
  form.append('chat_id', chat)
  form.append('media', JSON.stringify(media))
  for (const file of batch) {
    form.append(file.replace('.', '_'), new Blob([readFileSync(join(DIR, file))], { type: 'image/png' }), file)
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMediaGroup`, { method: 'POST', body: form })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || !json.ok) {
    log(`telegram: ОШИБКА ${res.status} — ${json.description ?? 'ответ без описания'}`)
    return
  }
  log(`telegram: опубликовано, сообщений в альбоме: ${json.result?.length ?? batch.length}`)
}

// ── Threads ──────────────────────────────────────────────────────────────────
// Три шага: контейнер на каждую картинку → контейнер карусели → публикация.
async function publishThreads(publicUrls) {
  const userId = process.env.THREADS_USER_ID
  const token = process.env.THREADS_ACCESS_TOKEN
  if (!userId || !token) {
    log('threads: пропуск — нет THREADS_USER_ID или THREADS_ACCESS_TOKEN')
    return
  }
  if (!publicUrls) {
    log('threads: пропуск — нет публичных URL картинок (нужен SUPABASE_SERVICE_ROLE_KEY)')
    return
  }

  const batch = publicUrls.slice(0, 20)
  if (publicUrls.length > 20) log(`threads: в карусель уйдут первые 20 из ${publicUrls.length} (лимит Threads)`)

  if (!PUBLISH) {
    log(`threads: собрал бы карусель из ${batch.length} картинок для пользователя ${userId}`)
    return
  }

  const api = async (path, params) => {
    const qs = new URLSearchParams({ ...params, access_token: token })
    const res = await fetch(`https://graph.threads.net/v1.0/${path}?${qs}`, { method: 'POST' })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || json.error) {
      throw new Error(json.error?.message ?? `HTTP ${res.status}`)
    }
    return json
  }

  try {
    // 1. Контейнер на каждую картинку.
    const children = []
    for (const imageUrl of batch) {
      const item = await api(`${userId}/threads`, {
        media_type: 'IMAGE',
        image_url: imageUrl,
        is_carousel_item: 'true',
      })
      children.push(item.id)
    }

    // 2. Контейнер карусели с текстом поста.
    const carousel = await api(`${userId}/threads`, {
      media_type: 'CAROUSEL',
      children: children.join(','),
      ...(caption ? { text: caption.slice(0, 500) } : {}),
    })
    if (caption.length > 500) log('threads: текст длиннее 500 символов — обрезан (лимит Threads)')

    // 3. Публикация. Threads просит выждать паузу между сборкой и публикацией —
    //    контейнер должен успеть перейти в состояние FINISHED.
    await new Promise(r => setTimeout(r, 5000))
    const published = await api(`${userId}/threads_publish`, { creation_id: carousel.id })
    log(`threads: опубликовано, id ${published.id}`)
  } catch (e) {
    log(`threads: ОШИБКА — ${e.message}`)
  }
}

// ── Каналы без бесплатного API ───────────────────────────────────────────────
function reportManualChannels() {
  const manual = []
  if (enabled('instagram')) manual.push('Instagram — публикация каруселей идёт через Instagram Graph API, а он требует бизнес-аккаунт, привязанную страницу Facebook и разрешение instagram_content_publish. До прохождения проверки заливаем вручную.')
  if (enabled('tiktok')) manual.push('TikTok — Content Posting API открывается только после ревью приложения, и для неаудированных приложений посты уходят в черновики. Заливаем вручную.')
  if (enabled('youtube')) manual.push('YouTube — загрузка через Data API возможна, но квота на загрузку тратится быстро и требует OAuth-приложения. Для Shorts проще заливать вручную.')
  if (manual.length) {
    console.log('\n[publish] каналы, которые остаются ручными:')
    for (const m of manual) console.log(`  · ${m}`)
  }
}

// ── main ─────────────────────────────────────────────────────────────────────
const needsUrls = enabled('threads') && process.env.THREADS_USER_ID && process.env.THREADS_ACCESS_TOKEN
const publicUrls = (needsUrls && PUBLISH) ? await uploadToStorage() : null

if (enabled('telegram')) await publishTelegram()
if (enabled('threads')) await publishThreads(publicUrls)
reportManualChannels()

console.log(`\n[publish] ${PUBLISH ? 'готово' : 'сухой прогон завершён'}. Файлы: marketing/out/${slug}/`)

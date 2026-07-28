// Типы манифеста контент-машины.
//
// Манифест собирает `marketing/studio/publish-to-app.mjs` и кладёт в публичный
// бакет Supabase Storage `marketing`. Раздел /admin/content читает его и
// показывает готовые материалы прямо в платформе.

export interface ContentSlide {
  n: number
  name: string
  url: string
}

export interface ContentPost {
  slug: string
  order: number
  lang: 'ru' | 'kz' | 'en' | string
  audience: string
  goal: string
  title: string
  /** Телефонный вариант — основной. */
  slides: ContentSlide[]
  /** Десктопный дубль того же поста. Пустой, если у поста нет кадров. */
  slidesDesktop?: ContentSlide[]
  caption: string
  hashtags: string[]
}

export interface ContentClip {
  name: string
  url: string
  bytes: number
  title: string
  /** Как использовать клип при монтаже — пишется в publish-to-app.mjs. */
  use: string
}

export interface ContentShot {
  name: string
  url: string
}

/** Ветка для Threads: цепочка постов до 500 знаков каждый. */
export interface ContentThread {
  slug: string
  order: number
  lang: string
  topic: string
  audience: string
  /** Почему ветка может разойтись — заметка для себя, не для публикации. */
  why: string
  posts: string[]
  hashtags: string[]
}

/** Один кадр ролика: что показывать и что при этом произносится. */
export interface ContentShotPlan {
  from: number
  to: number
  source: string
  voice: string
  title: string
}

export interface ContentVideo {
  slug: string
  order: number
  lang: string
  title: string
  idea: string
  hook: string
  audience: string
  duration: number
  shots: ContentShotPlan[]
  caption: string
  hashtags: string[]
}

export interface ContentManifest {
  builtAt: string
  posts: ContentPost[]
  threads?: ContentThread[]
  videos?: ContentVideo[]
  clips: ContentClip[]
  shots: ContentShot[]
}

/**
 * Supabase Storage отдаёт файл с `Content-Disposition: attachment`, если в
 * запросе есть `?download=<имя>`. Без этого браузер уходит по ссылке вместо
 * скачивания: атрибут `download` на кросс-доменных ссылках игнорируется.
 */
export function downloadUrl(url: string, filename: string): string {
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}download=${encodeURIComponent(filename)}`
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} МБ`
}

export const LANG_LABEL: Record<string, string> = {
  ru: 'русский',
  kz: 'қазақша',
  en: 'english',
}

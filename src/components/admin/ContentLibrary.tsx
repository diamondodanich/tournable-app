'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import {
  Copy, Check, Download, Images, Film, Monitor, Smartphone, X, ChevronLeft, ChevronRight,
  Archive, Undo2,
} from 'lucide-react'
import { setPostUsed } from '@/app/actions/contentLibrary'
import {
  type ContentManifest, type ContentPost, type ContentSlide,
  downloadUrl, formatBytes, LANG_LABEL,
} from '@/lib/contentLibrary'

type Tab = 'posts' | 'used' | 'clips' | 'shots'
type Device = 'phone' | 'desktop'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'posts', label: 'В работе', icon: Images },
  { id: 'used', label: 'Использованные', icon: Archive },
  { id: 'clips', label: 'Видео', icon: Film },
  { id: 'shots', label: 'Кадры продукта', icon: Monitor },
]

/** Что сейчас открыто во весь экран: набор картинок и позиция в нём. */
interface Viewer {
  items: { url: string; label: string }[]
  index: number
}

function CopyButton({ text, label = 'Скопировать' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Буфер недоступен (нет https или отказ в правах) — кладём через
      // временное поле, иначе кнопка молча не сработает.
      const area = document.createElement('textarea')
      area.value = text
      document.body.appendChild(area)
      area.select()
      document.execCommand('copy')
      area.remove()
    }
    setDone(true)
    setTimeout(() => setDone(false), 1800)
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-bold
        bg-gray-900 text-white hover:bg-gray-800 transition-colors"
    >
      {done ? <Check size={13} /> : <Copy size={13} />}
      {done ? 'Скопировано' : label}
    </button>
  )
}

/** Скачивает пачку файлов по очереди: браузер блокирует залп одновременных загрузок. */
function DownloadAllButton({ slug, slides, suffix }: { slug: string; slides: ContentSlide[]; suffix: string }) {
  const [busy, setBusy] = useState(false)

  async function run() {
    setBusy(true)
    for (const slide of slides) {
      const a = document.createElement('a')
      a.href = downloadUrl(slide.url, `${slug}-${suffix}-${slide.name}`)
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      a.remove()
      await new Promise(r => setTimeout(r, 350))
    }
    setBusy(false)
  }

  return (
    <button
      type="button"
      onClick={run}
      disabled={busy}
      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-bold
        bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors"
    >
      <Download size={13} />
      {busy ? 'Скачиваю…' : `Скачать все ${slides.length}`}
    </button>
  )
}

function PostCard({ post, onOpen, used, onToggleUsed }: {
  post: ContentPost
  onOpen: (v: Viewer) => void
  used: boolean
  onToggleUsed: (slug: string, used: boolean) => void
}) {
  const hasDesktop = (post.slidesDesktop?.length ?? 0) > 0
  const [device, setDevice] = useState<Device>('phone')
  const [pending, startTransition] = useTransition()
  const slides = device === 'desktop' ? (post.slidesDesktop ?? []) : post.slides
  const hashtags = post.hashtags.map(h => (h.startsWith('#') ? h : `#${h}`)).join(' ')

  return (
    <article className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${
      used ? 'opacity-70' : ''
    }`}>
      <div className="p-4 sm:p-5 flex flex-col gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-black tabular-nums px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
            {String(post.order).padStart(2, '0')}
          </span>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
            {LANG_LABEL[post.lang] ?? post.lang}
          </span>
          {post.audience && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
              {post.audience}
            </span>
          )}
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
            {slides.length} слайдов
          </span>
        </div>

        <h3 className="font-black text-gray-900 leading-snug">{post.title}</h3>
        {post.goal && <p className="text-xs text-gray-500 leading-snug">{post.goal}</p>}

        {hasDesktop && (
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit mt-1">
            {([
              { id: 'phone' as Device, label: 'Телефон', icon: Smartphone },
              { id: 'desktop' as Device, label: 'Десктоп', icon: Monitor },
            ]).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setDevice(id)}
                className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold transition-colors ${
                  device === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Полоса слайдов прокручивается внутри себя — страница вбок не едет. */}
      <div className="flex gap-2.5 overflow-x-auto px-4 sm:px-5 pb-4">
        {slides.map((slide, i) => (
          <button
            key={`${device}-${slide.name}`}
            type="button"
            onClick={() => onOpen({
              items: slides.map(s => ({ url: s.url, label: `Слайд ${s.n}` })),
              index: i,
            })}
            className="shrink-0 rounded-lg overflow-hidden border border-gray-200 hover:border-emerald-400
              transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            title={`Слайд ${slide.n} — открыть крупно`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={slide.url} alt={`Слайд ${slide.n}`} loading="lazy" className="block w-[124px] h-auto" />
          </button>
        ))}
      </div>

      <div className="border-t border-gray-100 bg-gray-50/70 p-4 sm:p-5 flex flex-col gap-3">
        <div className="text-[11px] font-black uppercase tracking-widest text-gray-400">Подпись к посту</div>
        <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-sans m-0">
          {post.caption}
        </pre>
        {hashtags && <div className="text-sm text-emerald-700 break-words">{hashtags}</div>}

        <div className="flex items-center gap-2 flex-wrap pt-1">
          <CopyButton text={`${post.caption}\n\n${hashtags}`} label="Скопировать текст" />
          <DownloadAllButton slug={post.slug} slides={slides} suffix={device} />
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => onToggleUsed(post.slug, !used))}
            className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-bold
              transition-colors disabled:opacity-60 ${
                used
                  ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            {used ? <Undo2 size={13} /> : <Archive size={13} />}
            {pending ? 'Сохраняю…' : used ? 'Вернуть в работу' : 'Использовано'}
          </button>
        </div>
      </div>
    </article>
  )
}

/**
 * Просмотр во весь экран поверх страницы. Открывается на месте, листается
 * стрелками и колесом, закрывается Escape — уходить со страницы и возвращаться
 * назад ради каждой картинки не нужно.
 */
function Lightbox({ viewer, onClose, onMove }: {
  viewer: Viewer
  onClose: () => void
  onMove: (delta: number) => void
}) {
  const current = viewer.items[viewer.index]
  // Портал в body обязателен: у макета дашборда есть предок со своим контекстом
  // наложения, и просто fixed + большой z-index не поднимает просмотр над
  // шапкой сайта — она остаётся сверху.
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onMove(1)
      if (e.key === 'ArrowLeft') onMove(-1)
    }
    document.addEventListener('keydown', onKey)
    // Фон не должен прокручиваться под открытым просмотром.
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose, onMove])

  if (!mounted) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] bg-gray-950/90 backdrop-blur-sm flex flex-col"
      onClick={onClose}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white shrink-0">
        <span className="text-sm font-bold tabular-nums">
          {current.label} · {viewer.index + 1} / {viewer.items.length}
        </span>
        <div className="flex items-center gap-2">
          <a
            href={downloadUrl(current.url, `${current.label.replace(/\s+/g, '-').toLowerCase()}.png`)}
            onClick={e => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-bold
              bg-emerald-600 hover:bg-emerald-700 transition-colors"
          >
            <Download size={13} />
            Скачать
          </a>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Высокая картинка прокручивается внутри просмотра, а не обрезается. */}
      <div className="flex-1 min-h-0 overflow-auto px-4 pb-4" onClick={onClose}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.url}
          alt={current.label}
          onClick={e => e.stopPropagation()}
          className="mx-auto max-w-full w-auto rounded-xl shadow-2xl"
        />
      </div>

      {viewer.items.length > 1 && (
        <>
          <NavButton side="left" onClick={() => onMove(-1)} />
          <NavButton side="right" onClick={() => onMove(1)} />
        </>
      )}
    </div>,
    document.body,
  )
}

function NavButton({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      aria-label={side === 'left' ? 'Предыдущая' : 'Следующая'}
      onClick={e => { e.stopPropagation(); onClick() }}
      className={`fixed top-1/2 -translate-y-1/2 ${side === 'left' ? 'left-3' : 'right-3'}
        w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white
        flex items-center justify-center transition-colors`}
    >
      <Icon size={20} />
    </button>
  )
}

export default function ContentLibrary({ manifest, initialUsed }: {
  manifest: ContentManifest
  initialUsed: string[]
}) {
  const [tab, setTab] = useState<Tab>('posts')
  const [viewer, setViewer] = useState<Viewer | null>(null)
  // Локальная копия отметок: список перестраивается сразу по клику, не дожидаясь
  // ответа сервера, иначе карточка «зависает» на месте до перезагрузки.
  const [used, setUsed] = useState<string[]>(initialUsed)

  const toggleUsed = useCallback(async (slug: string, next: boolean) => {
    setUsed(prev => (next ? [...new Set([...prev, slug])] : prev.filter(s => s !== slug)))
    const res = await setPostUsed(slug, next)
    if (res.error) {
      // Откатываем: раз на сервере не сохранилось, показывать как сохранённое нельзя.
      setUsed(prev => (next ? prev.filter(s => s !== slug) : [...new Set([...prev, slug])]))
      alert(`Не удалось сохранить отметку: ${res.error}`)
    }
  }, [])

  const usedSet = new Set(used)
  const active = manifest.posts.filter(p => !usedSet.has(p.slug))
  const archived = manifest.posts.filter(p => usedSet.has(p.slug))

  const move = useCallback((delta: number) => {
    setViewer(v => {
      if (!v) return v
      const next = (v.index + delta + v.items.length) % v.items.length
      return { ...v, index: next }
    })
  }, [])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-1.5 p-1 bg-white rounded-xl border border-gray-100 shadow-sm w-fit max-w-full overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => {
          const count = id === 'posts' ? active.length
            : id === 'used' ? archived.length
            : id === 'clips' ? manifest.clips.length
            : manifest.shots.length
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-1.5 h-9 px-3 sm:px-4 rounded-lg text-xs sm:text-sm
                font-bold whitespace-nowrap transition-colors ${
                  tab === id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
            >
              <Icon size={14} className="shrink-0" />
              {label}
              <span className={`tabular-nums text-[11px] ${tab === id ? 'text-white/70' : 'text-gray-400'}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {tab === 'posts' && (
        <div className="flex flex-col gap-4">
          {active.length === 0 && <Empty>Все карусели отмечены как использованные.</Empty>}
          {active.map(post => (
            <PostCard
              key={post.slug} post={post} onOpen={setViewer}
              used={false} onToggleUsed={toggleUsed}
            />
          ))}
        </div>
      )}

      {tab === 'used' && (
        <div className="flex flex-col gap-4">
          {archived.length === 0 && (
            <Empty>Пока ничего не отмечено. Кнопка «Использовано» есть под каждой каруселью.</Empty>
          )}
          {archived.map(post => (
            <PostCard
              key={post.slug} post={post} onOpen={setViewer}
              used onToggleUsed={toggleUsed}
            />
          ))}
        </div>
      )}

      {tab === 'clips' && (
        <div className="grid gap-4 sm:grid-cols-2">
          {manifest.clips.length === 0 && <Empty>Клипов пока нет.</Empty>}
          {manifest.clips.map(clip => (
            <div key={clip.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              <video
                src={clip.url}
                controls
                muted
                loop
                playsInline
                preload="metadata"
                className="w-full bg-gray-900 max-h-[380px] object-contain"
              >
                Браузер не воспроизводит webm. Скачайте файл — в CapCut он открывается.
              </video>
              <div className="p-4 flex flex-col gap-2 flex-1">
                <h3 className="font-black text-gray-900 text-sm leading-snug">{clip.title}</h3>
                {clip.use && <p className="text-xs text-gray-500 leading-relaxed flex-1">{clip.use}</p>}
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <a
                    href={downloadUrl(clip.url, `${clip.name}.webm`)}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-bold
                      bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                  >
                    <Download size={13} />
                    Скачать
                  </a>
                  <span className="text-[11px] text-gray-400 tabular-nums">
                    {formatBytes(clip.bytes)} · webm
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'shots' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {manifest.shots.length === 0 && <Empty>Кадров пока нет.</Empty>}
          {manifest.shots.map((shot, i) => (
            <div key={shot.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              <button
                type="button"
                onClick={() => setViewer({
                  items: manifest.shots.map(s => ({ url: s.url, label: s.name })),
                  index: i,
                })}
                className="block bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={shot.url} alt={shot.name} loading="lazy" className="block w-full h-auto" />
              </button>
              <div className="p-3 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-gray-700 truncate">{shot.name}</span>
                <a
                  href={downloadUrl(shot.url, `${shot.name}.png`)}
                  className="w-8 h-8 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center shrink-0"
                  title="Скачать"
                >
                  <Download size={14} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewer && <Lightbox viewer={viewer} onClose={() => setViewer(null)} onMove={move} />}
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500">
      {children}
    </div>
  )
}

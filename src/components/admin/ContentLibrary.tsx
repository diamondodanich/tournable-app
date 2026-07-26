'use client'

import { useState } from 'react'
import { Copy, Check, Download, Images, Film, Monitor, ExternalLink } from 'lucide-react'
import {
  type ContentManifest, type ContentPost, downloadUrl, formatBytes, LANG_LABEL,
} from '@/lib/contentLibrary'

type Tab = 'posts' | 'clips' | 'shots'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'posts', label: 'Карусели', icon: Images },
  { id: 'clips', label: 'Видео', icon: Film },
  { id: 'shots', label: 'Кадры продукта', icon: Monitor },
]

function CopyButton({ text, label = 'Скопировать' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setDone(true)
      setTimeout(() => setDone(false), 1800)
    } catch {
      // Буфер недоступен (нет https или отказ в правах) — выделяем текст,
      // чтобы скопировать вручную, вместо молчаливого ничего.
      const area = document.createElement('textarea')
      area.value = text
      document.body.appendChild(area)
      area.select()
      document.execCommand('copy')
      area.remove()
      setDone(true)
      setTimeout(() => setDone(false), 1800)
    }
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
function DownloadAllButton({ post }: { post: ContentPost }) {
  const [busy, setBusy] = useState(false)

  async function run() {
    setBusy(true)
    for (const slide of post.slides) {
      const a = document.createElement('a')
      a.href = downloadUrl(slide.url, `${post.slug}-${slide.name}`)
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
      {busy ? 'Скачиваю…' : `Скачать все ${post.slides.length}`}
    </button>
  )
}

function PostCard({ post }: { post: ContentPost }) {
  const hashtags = post.hashtags.map(h => (h.startsWith('#') ? h : `#${h}`)).join(' ')

  return (
    <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
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
            {post.slides.length} слайдов
          </span>
        </div>

        <h3 className="font-black text-gray-900 leading-snug">{post.title}</h3>
        {post.goal && <p className="text-xs text-gray-500 leading-snug">{post.goal}</p>}
      </div>

      {/* Полоса слайдов прокручивается внутри себя — страница вбок не едет. */}
      <div className="flex gap-2.5 overflow-x-auto px-4 sm:px-5 pb-4">
        {post.slides.map(slide => (
          <a
            key={slide.name}
            href={slide.url}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-lg overflow-hidden border border-gray-200 hover:border-emerald-400
              transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            title={`Слайд ${slide.n} — открыть в полном размере`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={slide.url} alt={`Слайд ${slide.n}`} loading="lazy" className="block w-[124px] h-auto" />
          </a>
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
          <DownloadAllButton post={post} />
        </div>
      </div>
    </article>
  )
}

export default function ContentLibrary({ manifest }: { manifest: ContentManifest }) {
  const [tab, setTab] = useState<Tab>('posts')

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-1.5 p-1 bg-white rounded-xl border border-gray-100 shadow-sm w-fit max-w-full overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
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
          </button>
        ))}
      </div>

      {tab === 'posts' && (
        <div className="flex flex-col gap-4">
          {manifest.posts.length === 0 && <Empty>Каруселей пока нет.</Empty>}
          {manifest.posts.map(post => <PostCard key={post.slug} post={post} />)}
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
                preload="metadata"
                className="w-full bg-gray-900 max-h-[320px]"
              />
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
          {manifest.shots.map(shot => (
            <div key={shot.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              <a href={shot.url} target="_blank" rel="noreferrer" className="block bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={shot.url} alt={shot.name} loading="lazy" className="block w-full h-auto" />
              </a>
              <div className="p-3 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-gray-700 truncate">{shot.name}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={shot.url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 hover:text-gray-800 flex items-center justify-center"
                    title="Открыть"
                  >
                    <ExternalLink size={14} />
                  </a>
                  <a
                    href={downloadUrl(shot.url, `${shot.name}.png`)}
                    className="w-8 h-8 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center"
                    title="Скачать"
                  >
                    <Download size={14} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
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

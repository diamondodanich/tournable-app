import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Images, Film, Monitor, RefreshCw } from 'lucide-react'
import type { ContentManifest } from '@/lib/contentLibrary'
import ContentLibrary from '@/components/admin/ContentLibrary'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Контент', robots: { index: false, follow: false } }

/**
 * Материалы контент-машины внутри платформы.
 *
 * Источник — манифест в публичном бакете Supabase Storage `marketing`, который
 * пишет `marketing/studio/publish-to-app.mjs`. Отдельной таблицы намеренно нет:
 * материалы пересобираются целиком при каждой выгрузке, и держать под них схему
 * значило бы поддерживать миграции ради данных, живущих в файлах.
 */
async function loadManifest(): Promise<ContentManifest | null> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return null
  try {
    const res = await fetch(`${base}/storage/v1/object/public/marketing/manifest.json`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    return (await res.json()) as ContentManifest
  } catch {
    return null
  }
}

function Stat({ icon: Icon, value, label }: { icon: React.ElementType; value: number; label: string }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5">
        <Icon size={17} />
      </div>
      <div className="text-2xl font-black tabular-nums text-gray-900">{value}</div>
      <div className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mt-0.5">{label}</div>
    </div>
  )
}

export default async function AdminContentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()

  // Не 403, а 404 — страница не должна выдавать факт своего существования.
  if (!profile?.is_admin) notFound()

  const manifest = await loadManifest()

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col gap-6">

        <div className="flex flex-col gap-3">
          <Link
            href="/account"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors w-fit"
          >
            <ArrowLeft size={15} />
            Личный кабинет
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Контент</h1>
            <p className="text-sm text-gray-500 mt-1">
              Готовые материалы для соцсетей: карусели с подписями, видеоклипы продукта и кадры для монтажа.
            </p>
          </div>
        </div>

        {!manifest ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 flex flex-col gap-3">
            <h2 className="font-black text-gray-900">Материалов пока нет</h2>
            <p className="text-sm text-gray-600 leading-relaxed max-w-prose">
              Раздел читает манифест из хранилища. Соберите и выгрузите материалы командами:
            </p>
            <pre className="text-xs bg-gray-900 text-gray-100 rounded-xl p-4 overflow-x-auto m-0">
{`npm run seed:demo
node marketing/studio/capture.mjs
npm run studio
node marketing/studio/publish-to-app.mjs`}
            </pre>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <Stat icon={Images} value={manifest.posts.length} label="каруселей" />
              <Stat icon={Film} value={manifest.clips.length} label="видеоклипов" />
              <Stat icon={Monitor} value={manifest.shots.length} label="кадров" />
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400">
              <RefreshCw size={13} className="shrink-0" />
              <span>
                Обновлено{' '}
                {new Date(manifest.builtAt).toLocaleString('ru-RU', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
                {' · пересобрать: '}
                <code className="text-gray-500">node marketing/studio/publish-to-app.mjs</code>
              </span>
            </div>

            <ContentLibrary manifest={manifest} />
          </>
        )}
      </div>
    </div>
  )
}

'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Отметки «использовано» для материалов контент-машины.
 *
 * Хранятся файлом `used.json` в бакете `marketing` рядом с самими материалами.
 * Отдельной таблицы нет намеренно: это список из десятка строк, который живёт
 * ровно столько же, сколько манифест, и заводить под него схему с миграцией
 * значило бы поддерживать её ради одного массива.
 *
 * Писать в бакет может только service_role, поэтому отметку ставит серверное
 * действие, а не браузер: клиенту такой ключ отдавать нельзя.
 */

const BUCKET = 'marketing'
const FILE = 'used.json'

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) return null
  return createAdminClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

/** Прочитать список использованных слагов. Пустой список, если файла ещё нет. */
export async function getUsedPosts(): Promise<string[]> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return []
  try {
    const res = await fetch(`${base}/storage/v1/object/public/${BUCKET}/${FILE}`, { cache: 'no-store' })
    if (!res.ok) return []
    const json = await res.json()
    return Array.isArray(json) ? json.filter((s): s is string => typeof s === 'string') : []
  } catch {
    return []
  }
}

/**
 * Пометить пост использованным или вернуть его в работу.
 * Права проверяются здесь же: действие вызывается из браузера.
 */
export async function setPostUsed(slug: string, used: boolean): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile?.is_admin) return { error: 'Нет доступа' }

  const admin = getAdmin()
  if (!admin) return { error: 'На сервере не задан SUPABASE_SERVICE_ROLE_KEY' }

  const current = new Set(await getUsedPosts())
  if (used) current.add(slug)
  else current.delete(slug)

  const { error } = await admin.storage.from(BUCKET).upload(
    FILE,
    Buffer.from(JSON.stringify([...current], null, 2), 'utf8'),
    { contentType: 'application/json; charset=utf-8', upsert: true },
  )
  if (error) return { error: error.message }

  revalidatePath('/admin/content')
  return {}
}

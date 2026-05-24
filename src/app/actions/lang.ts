'use server'
import { cookies } from 'next/headers'

export async function setLangCookie(lang: string) {
  const store = await cookies()
  store.set('lang', lang, { path: '/', maxAge: 60 * 60 * 24 * 365 })
}

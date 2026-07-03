import LoginForm from './LoginForm'

type Lang = 'ru' | 'kz' | 'en'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; next?: string; add?: string }>
}) {
  const params = await searchParams
  const lang: Lang = (params.lang === 'kz' || params.lang === 'en') ? params.lang : 'ru'
  const next = params.next ?? ''
  const add = params.add === '1'
  return <LoginForm lang={lang} next={next} add={add} />
}

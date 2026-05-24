import LoginForm from './LoginForm'

type Lang = 'ru' | 'kz' | 'en'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; next?: string }>
}) {
  const params = await searchParams
  const lang: Lang = (params.lang === 'kz' || params.lang === 'en') ? params.lang : 'ru'
  const next = params.next ?? ''
  return <LoginForm lang={lang} next={next} />
}

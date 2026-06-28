import RegisterForm from './RegisterForm'

type Lang = 'ru' | 'kz' | 'en'

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; next?: string }>
}) {
  const params = await searchParams
  const lang: Lang = (params.lang === 'kz' || params.lang === 'en') ? params.lang : 'ru'
  const next = params.next ?? ''
  return <RegisterForm lang={lang} next={next} />
}

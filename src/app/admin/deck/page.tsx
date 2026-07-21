import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Oswald } from 'next/font/google'
import { MonitorPlay } from 'lucide-react'
import DeckThemeToggle from './DeckThemeToggle'
import FormatDiagram from './FormatDiagram'
import {
  SCREENS, COMPARISON, PILLARS, FORMATS, CAPABILITIES, STAGES, PLANS,
  type Screen,
} from './content'
import s from './deck.module.css'

const oswald = Oswald({
  subsets: ['latin', 'cyrillic'],
  weight: ['600'],
  variable: '--font-oswald',
})

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'Презентация для организаций',
  robots: { index: false, follow: false },
}

function ScreenBlock({ shot }: { shot: Screen }) {
  return (
    <div className={`${s.screen} ${s.bleed}`}>
      <figure>
        <div className={s.frame}>
          <div className={s.bar}>
            <i /><i /><i />
            <span>{shot.chrome}</span>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shot.src} alt={shot.alt} width={1500} height={937} />
        </div>
        <figcaption>
          <div className={s.tag}>{shot.tag}</div>
          <p>{shot.text}</p>
        </figcaption>
      </figure>
    </div>
  )
}

export default async function AdminDeckPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/admin/deck')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()

  // Не 403, а 404 — страница не должна выдавать факт своего существования
  if (!profile?.is_admin) notFound()

  const theme = (await cookies()).get('theme')?.value === 'light' ? 'light' : 'dark'

  return (
    <div className={`${s.deck} ${oswald.variable}`} data-deck-root data-deck-theme={theme}>

      <div className={s.toolbar}>
        <Link href="/admin/deck/slides" className={s.toolBtn}>
          <MonitorPlay size={16} /> Слайды
        </Link>
        <DeckThemeToggle initialTheme={theme} className={s.toolBtn} />
      </div>

      <header className={s.hero}>
        <div
          className={s.heroBg}
          role="img"
          aria-label="Светодиодное табло Tournable на стадионе во время матча"
        />
        <div className={s.heroInner}>
          <div className={s.wrap}>
            <p className={s.brandline}>
              <b>Tournable</b> <span>Платформа соревнований</span> <span className={s.num}>2026</span>
            </p>
            <h1 className={s.display}>
              Соревнование<br />
              как <span className={s.lit}>управляемый<br />процесс</span>
            </h1>
            <p className={s.lede}>
              Расписание, счёт, таблица, плей-офф, статистика и публичная страница турнира —
              в одной системе. Организатор ведёт игру, всё остальное считается само.
            </p>
          </div>
        </div>
      </header>

      <section className={s.section}>
        <div className={s.wrap}>
          <p className={s.eyebrow}>Исходная ситуация</p>
          <div className={s.col}>
            <h2 className={s.display}>Турнир живёт в переписке</h2>
            <p className={s.lede}>
              У большинства организаторов соревнование существует в трёх местах сразу: таблица
              в Excel, расписание в мессенджере, результаты в голове у одного человека. Это
              работает ровно до момента, пока не выросло количество команд.
            </p>
          </div>

          <div className={s.tblscroll}>
            <table className={s.standings} style={{ marginTop: '2.8rem' }}>
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>Задача</th>
                  <th style={{ width: '35%' }}>Как это происходит сейчас</th>
                  <th style={{ width: '35%' }}>Как это происходит в Tournable</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.task}>
                    <td><strong>{row.task}</strong></td>
                    <td className={s.now}>
                      <span className={`${s.mark} ${s.markL}`}>П</span>{row.now}
                    </td>
                    <td>
                      <span className={`${s.mark} ${s.markW}`}>В</span>{row.then}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className={s.section}>
        <div className={s.wrap}>
          <p className={s.eyebrow}>Что это</p>
          <div className={s.col}>
            <h2 className={s.display}>Одна система<br />на весь цикл</h2>
            <p className={s.lede}>
              Tournable закрывает соревнование целиком: от настройки формата до публичной
              страницы с итогами. Веб-платформа, без установки, работает в браузере на телефоне
              и компьютере.
            </p>
          </div>

          <div className={`${s.grid} ${s.c2}`}>
            {PILLARS.map((c) => (
              <div className={s.cell} key={c.k}>
                <span className={s.k}>{c.k}</span>
                <h3>{c.h}</h3>
                <p>{c.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={s.section}>
        <div className={s.wrap}>
          <p className={s.eyebrow}>Форматы</p>
          <div className={s.col}>
            <h2 className={s.display}>Регламент<br />выбирается, не пишется</h2>
            <p className={s.lede}>
              Пять схем розыгрыша покрывают почти любое соревнование. Формат задаётся при
              создании турнира — расписание и сетка строятся под него сами.
            </p>
          </div>
          <div className={s.formats}>
            {FORMATS.map((f) => (
              <div className={s.format} key={f.key}>
                <FormatDiagram format={f.key} className={s.formatSvg} />
                <span className={s.formatName}>{f.name}</span>
                <p>{f.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={s.section}>
        <div className={s.wrap}>
          <p className={s.eyebrow}>Экраны</p>
          <div className={s.col}>
            <h2 className={s.display}>Как это выглядит</h2>
            <p className={s.lede}>
              Ниже — реальные экраны платформы, а не концепты. Данные в кадрах демонстрационные.
            </p>
          </div>
          {SCREENS.map((shot) => <ScreenBlock shot={shot} key={shot.src} />)}
        </div>
      </section>

      <section className={s.section}>
        <div className={s.wrap}>
          <p className={s.eyebrow}>На площадке</p>
          <div className={s.col}>
            <h2 className={s.display}>Табло<br />на любом экране</h2>
            <p className={s.lede}>
              Счёт, таймер, периоды и события матча выводятся на экран площадки — телевизор,
              проектор или светодиодный экран. Обновление идёт в реальном времени с того же
              устройства, с которого судья ведёт матч.
            </p>
          </div>
          <div className={s.screen}>
            <figure>
              <div className={s.frame}>
                <div
                  className={s.shotBoard}
                  role="img"
                  aria-label="Табло Tournable на светодиодном экране стадиона: счёт, таймер, лента событий матча"
                />
              </div>
              <figcaption>
                <div className={s.tag}>Табло</div>
                <p>
                  Отдельный полноэкранный режим без интерфейса управления. Зрителю видны команды
                  с логотипами, счёт, время матча и лента событий.
                </p>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className={s.section}>
        <div className={s.wrap}>
          <p className={s.eyebrow}>Организация работы</p>
          <div className={s.col}>
            <h2 className={s.display}>Роли, доступы,<br />несколько турниров</h2>
          </div>
          <div className={`${s.grid} ${s.c3}`}>
            {CAPABILITIES.map((c) => (
              <div className={s.cell} key={c.k}>
                <span className={s.k}>{c.k}</span>
                <h3>{c.h}</h3>
                <p>{c.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={s.section}>
        <div className={s.wrap}>
          <p className={s.eyebrow}>Внедрение</p>
          <div className={s.col}>
            <h2 className={s.display}>Запуск<br />за один цикл</h2>
            <p className={s.lede}>
              Платформа не требует интеграции с внутренними системами, установки и обучения.
              Реальный срок от первого разговора до первого сыгранного тура — недели,
              а не кварталы.
            </p>
          </div>
          <div className={s.stages}>
            {STAGES.map((st) => (
              <div className={s.stage} key={st.no}>
                <div className={`${s.no} ${s.num}`}>{st.no}</div>
                <div>
                  <h3>{st.h}</h3>
                  <p>{st.p}</p>
                </div>
                <div className={s.when}>{st.when}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={s.section}>
        <div className={s.wrap}>
          <p className={s.eyebrow}>Условия</p>
          <div className={s.col}>
            <h2 className={s.display}>Тарифы</h2>
            <p className={s.lede}>
              Оплата в тенге, договор с казахстанским юридическим лицом, закрывающие документы.
              Годовая оплата — со скидкой 25%.
            </p>
          </div>

          <div className={s.plans}>
            {PLANS.map((p) => (
              <div className={`${s.plan} ${p.lead ? s.planLead : ''}`} key={p.name}>
                <div className={s.planName}>{p.name}</div>
                <div className={`${s.price} ${s.num}`}>{p.price}</div>
                <div className={s.sub}>{p.sub}</div>
                <ul>
                  {p.items.map((i) => <li key={i}>{i}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`${s.section} ${s.close}`}>
        <div className={s.wrap}>
          <p className={s.eyebrow}>Следующий шаг</p>
          <div className={s.col}>
            <h2 className={s.display}>Проведём<br />один тур вместе</h2>
            <p className={s.lede}>
              Самый короткий способ проверить платформу — взять ближайший тур вашего
              соревнования и провести его в Tournable. Настройку берём на себя.
            </p>
            <a className={s.cta} href="https://tournable.app">Открыть tournable.app</a>
          </div>

          <div className={s.meta}>
            <div><b>Платформа</b>tournable.app<br />Веб-приложение, без установки</div>
            <div><b>Связь</b><a href="https://wa.me/message/YHLE2IFII4MSJ1">WhatsApp для организаций</a></div>
            <div><b>Оператор</b>ИП «Tournable.app»<br />Республика Казахстан, Астана</div>
          </div>
        </div>
      </section>

    </div>
  )
}

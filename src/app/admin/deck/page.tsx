import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Oswald } from 'next/font/google'
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

type Screen = {
  src: string
  chrome: string
  tag: string
  alt: string
  text: string
}

const SCREENS: Screen[] = [
  {
    src: '/deck/table.webp',
    chrome: 'tournable.app — турнирная таблица',
    tag: 'Таблица',
    alt: 'Турнирная таблица: игры, победы, ничьи, поражения, форма, разница мячей и очки',
    text: 'Позиции, форма последних матчей, разница мячей и очки. Зона выхода в плей-офф выделена линией. Ниже таблицы — матрица личных встреч. Выгрузка в PNG и PDF в один клик.',
  },
  {
    src: '/deck/matches.webp',
    chrome: 'tournable.app — расписание и результаты',
    tag: 'Матчи',
    alt: 'Расписание матчей по турам с результатами и авторами голов',
    text: 'Расписание разбито по турам. У каждого сыгранного матча — счёт и события с авторами и минутами. Несыгранные матчи остаются в календаре с датой и временем.',
  },
  {
    src: '/deck/bracket.webp',
    chrome: 'tournable.app — сетка плей-офф',
    tag: 'Плей-офф',
    alt: 'Сетка плей-офф с полуфиналами и финалом, победители отмечены',
    text: 'Сетка строится по итогам группового этапа или посева. Победитель матча переходит в следующий раунд автоматически — переносить пары руками не нужно.',
  },
  {
    src: '/deck/groups.webp',
    chrome: 'tournable.app — групповой этап',
    tag: 'Группы',
    alt: 'Групповой этап: отдельные таблицы по группам A и B с матрицей встреч',
    text: 'Команды распределяются по группам змейкой, каждая группа считается отдельной таблицей. Заданное число команд из каждой группы выходит в сетку.',
  },
  {
    src: '/deck/stats.webp',
    chrome: 'tournable.app — статистика игроков',
    tag: 'Статистика',
    alt: 'Рейтинг бомбардиров с переключателями голов, ассистов и карточек',
    text: 'Бомбардиры, ассистенты, жёлтые и красные карточки. Считается из событий матчей, отдельного учёта вести не нужно. Набор показателей зависит от вида спорта.',
  },
  {
    src: '/deck/league.webp',
    chrome: 'tournable.app — публичная страница чемпионата',
    tag: 'Чемпионат',
    alt: 'Публичная страница чемпионата с сезоном, таблицей и вкладками матчей и статистики',
    text: 'Многосезонный формат: чемпионат живёт годами, каждый сезон хранится отдельно. Публичная страница с собственным адресом, профилями команд и историей результатов.',
  },
]

const COMPARISON: { task: string; now: string; then: string }[] = [
  {
    task: 'Расписание',
    now: 'Составляется вручную, пересобирается при каждом изменении состава',
    then: 'Генерируется по выбранному формату, пересчитывается автоматически',
  },
  {
    task: 'Турнирная таблица',
    now: 'Считается формулами, расходится с фактическими результатами',
    then: 'Пересчитывается при каждом внесённом счёте, включая разницу мячей и форму',
  },
  {
    task: 'Плей-офф',
    now: 'Сетка рисуется отдельно, победители переносятся руками',
    then: 'Сетка заполняется автоматически, победитель переходит в следующий раунд',
  },
  {
    task: 'Доступ участников',
    now: 'Скриншоты таблицы рассылаются в чаты после каждого тура',
    then: 'Одна ссылка, открытая без регистрации, всегда с актуальными данными',
  },
  {
    task: 'Итоги',
    now: 'Отчёт собирается вручную под конец сезона',
    then: 'Отчёт по турниру выгружается в PDF в любой момент',
  },
]

const PILLARS: { k: string; h: string; p: string }[] = [
  {
    k: 'Настройка',
    h: 'Формат задаётся один раз',
    p: 'Круговой турнир, плей-офф, группы с выходом в сетку, лига с плей-офф, швейцарская система. Очки за победу и ничью, число периодов, длительность матча, количество выходящих команд — всё настраивается под регламент.',
  },
  {
    k: 'Ведение',
    h: 'Счёт вносится по ходу матча',
    p: 'Голы, ассисты, карточки с указанием минуты и игрока. Таблица, статистика и сетка обновляются сразу, без отдельного пересчёта.',
  },
  {
    k: 'Показ',
    h: 'Публичная страница и табло',
    p: 'Ссылка на турнир открывается без регистрации: таблица, расписание, сетка, бомбардиры. Отдельный режим табло выводится на экран или проектор на площадке.',
  },
  {
    k: 'Итог',
    h: 'Отчётность и история',
    p: 'Выгрузка таблицы в PNG и полного отчёта в PDF. Чемпионаты с сезонами хранят историю: составы, результаты и статистику прошлых лет.',
  },
]

const CAPABILITIES: { k: string; h: string; p: string }[] = [
  {
    k: 'Со-редакторы',
    h: 'Матчи ведёт не один человек',
    p: 'Организатор приглашает со-редакторов по ссылке. Судья на площадке вносит счёт, администратор отвечает за расписание, руководитель смотрит итоги.',
  },
  {
    k: 'Зрители',
    h: 'Доступ без регистрации',
    p: 'Участникам и болельщикам не нужны аккаунты. Публичная ссылка открывается с телефона и показывает актуальные данные.',
  },
  {
    k: 'Языки',
    h: 'Русский, казахский, английский',
    p: 'Интерфейс и публичные страницы переключаются между тремя языками — важно для смешанных составов и международных турниров.',
  },
  {
    k: 'Виды спорта',
    h: 'Не только футбол',
    p: 'Футбол, футзал, баскетбол, стритбол, волейбол, пляжный волейбол, хоккей, единоборства и киберспортивные дисциплины. Термины, события и оформление подстраиваются под вид спорта.',
  },
  {
    k: 'Масштаб',
    h: 'От одного турнира до сезона',
    p: 'Разовое соревнование, серия турниров или чемпионат с сезонами и постоянными командами — в одном аккаунте организации.',
  },
  {
    k: 'Данные',
    h: 'Выгрузка в любой момент',
    p: 'Таблица в PNG, полный отчёт по турниру в PDF. Данные соревнования не заперты внутри платформы.',
  },
]

const STAGES: { no: string; h: string; p: string; when: string }[] = [
  {
    no: '01',
    h: 'Разбор регламента',
    p: 'Смотрим формат вашего соревнования: число команд, этапы, начисление очков, критерии выхода дальше. Проверяем, что формат поддерживается платформой как есть.',
    when: 'Встреча',
  },
  {
    no: '02',
    h: 'Настройка турнира',
    p: 'Заводим команды, логотипы, состав групп и календарь. Расписание генерируется автоматически по выбранному формату.',
    when: '1 день',
  },
  {
    no: '03',
    h: 'Пилотный тур',
    p: 'Проводим один реальный тур: судьи вносят счёт, зрители открывают публичную ссылку, при необходимости подключаем табло на площадке.',
    when: 'Ближайший тур',
  },
  {
    no: '04',
    h: 'Полный сезон',
    p: 'После пилота соревнование ведётся целиком в платформе. Итоги сезона выгружаются в отчёт, история сохраняется для следующего розыгрыша.',
    when: 'Сезон',
  },
]

const PLANS: { name: string; price: string; sub: string; lead?: boolean; items: string[] }[] = [
  {
    name: 'Старт',
    price: '0 ₸',
    sub: 'Всегда бесплатно',
    items: [
      '1 активный турнир',
      'До 16 команд',
      'Круговой и плей-офф форматы',
      'Публичная страница',
      'Статистика игроков и команд',
      'Табло в реальном времени',
      'Экспорт PDF и PNG',
    ],
  },
  {
    name: 'Про',
    price: '4 990 ₸',
    sub: 'в месяц · 44 990 ₸ в год',
    lead: true,
    items: [
      'Неограниченные турниры',
      'До 64 команд в турнире',
      'Все форматы, включая групповой',
      'До 3 со-редакторов',
      'Приоритетная поддержка',
      'Всё из тарифа Старт',
    ],
  },
  {
    name: 'Enterprise',
    price: 'от 39 990 ₸',
    sub: 'в месяц · 349 990 ₸ в год',
    items: [
      'Чемпионаты с сезонами',
      'Публичные страницы чемпионата',
      'Профили команд и игроков',
      'Составы и история сезонов',
      'Таблица бомбардиров по сезонам',
      'Выделенная поддержка',
      'Всё из тарифа Про',
    ],
  },
]

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

  return (
    <div className={`${s.deck} ${oswald.variable}`}>

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

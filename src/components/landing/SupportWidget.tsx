'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { X, ArrowRight, ChevronRight, Send } from 'lucide-react'

type Lang = 'ru' | 'kz' | 'en'

function IconWhatsApp({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.38 1.26 4.81L2.05 22l5.35-1.38c1.38.73 2.93 1.14 4.64 1.14 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.52 14.15c-.23.64-1.36 1.22-1.87 1.3-.48.08-1.08.11-1.74-.11-.4-.13-.92-.3-1.58-.58-2.78-1.2-4.6-4-4.74-4.19-.14-.19-1.1-1.47-1.1-2.8 0-1.33.7-1.98 1.0-2.25.26-.27.57-.34.75-.34.19 0 .38.01.54.01.17 0 .41-.06.63.48.23.56.77 1.88.84 2.01.07.14.11.3.02.48-.09.18-.14.29-.28.45-.14.16-.29.35-.41.47-.14.13-.28.27-.12.53.16.26.71 1.17 1.52 1.89.97.87 1.79 1.14 2.05 1.26.25.12.4.1.55-.06.15-.16.64-.75.81-1.01.17-.26.34-.21.57-.13.23.08 1.48.7 1.73.82.25.12.42.18.48.28.06.1.06.56-.17 1.2z"/>
    </svg>
  )
}

// ── FAQ database ─────────────────────────────────────────────────────────────

type FaqItem = {
  q: string
  tags: string[]
  steps: string[]
}

const FAQ: Record<Lang, FaqItem[]> = {
  ru: [
    {
      q: 'Как создать турнир?',
      tags: ['создать', 'создание', 'турнир', 'новый', 'начать', 'запустить', 'основать'],
      steps: [
        '1. Нажмите «Новый турнир» на главной панели.',
        '2. Выберите формат: Круговой, Плей-офф, Групповой+Плей-офф или Лига+Плей-офф.',
        '3. Введите названия команд и загрузите логотипы по желанию.',
        '4. Настройте очки, длительность матча и другие параметры.',
        '5. Нажмите «Создать турнир» — расписание готово автоматически.',
      ],
    },
    {
      q: 'Как вести счёт в реальном времени (Live)?',
      tags: ['live', 'лайв', 'счёт', 'результат', 'реальное', 'время', 'онлайн', 'трансляция', 'начать матч'],
      steps: [
        '1. Откройте турнир и перейдите на вкладку «Матчи».',
        '2. Найдите нужный матч и нажмите «Начать матч».',
        '3. Откроется Live-табло — вносите голы, ассисты и карточки.',
        '4. После матча нажмите «Завершить» → «Сохранить и завершить».',
        '5. Табло автоматически закроется через 3 секунды и обновит турнир.',
      ],
    },
    {
      q: 'Как завершить матч в Live-режиме?',
      tags: ['завершить', 'закрыть', 'конец', 'финиш', 'live', 'лайв', 'матч'],
      steps: [
        '1. На Live-табло нажмите кнопку «Завершить» внизу экрана.',
        '2. Подтвердите: «Сохранить и завершить».',
        '3. Результат сохраняется автоматически.',
        '4. Страница закроется через 3 секунды и вернёт вас в турнир.',
        '5. Завершённый матч будет показан первым в разделе «Матчи».',
      ],
    },
    {
      q: 'Как посмотреть групповые таблицы?',
      tags: ['группы', 'групп', 'таблица', 'standings', 'групповой', 'этап', 'просмотр'],
      steps: [
        '1. Откройте турнир формата «Групповой + Плей-офф».',
        '2. Перейдите на вкладку «Группы».',
        '3. Вы увидите отдельные таблицы для каждой группы.',
        '4. Зелёная линия показывает зону выхода в плей-офф.',
      ],
    },
    {
      q: 'Как поменять язык интерфейса?',
      tags: ['язык', 'language', 'перевод', 'русский', 'казахский', 'английский', 'поменять', 'изменить'],
      steps: [
        '1. Найдите переключатель языка в верхней панели (RU / KZ / EN).',
        '2. Нажмите нужный язык — страница обновится мгновенно.',
        '3. Все тексты внутри турниров тоже обновятся.',
        '4. Выбор сохраняется в вашем браузере автоматически.',
      ],
    },
    {
      q: 'Можно ли пригласить помощника?',
      tags: ['пригласить', 'помощник', 'редактор', 'совместный', 'соредактор', 'поделиться', 'доступ'],
      steps: [
        '1. Откройте турнир и нажмите «Поделиться».',
        '2. Выберите «Пригласить редактора».',
        '3. Скопируйте ссылку и отправьте коллеге.',
        '4. До 3 соредакторов могут вводить результаты одновременно.',
      ],
    },
    {
      q: 'Как поделиться турниром с участниками?',
      tags: ['поделиться', 'ссылка', 'участники', 'публичная', 'просмотр', 'зрители'],
      steps: [
        '1. Откройте турнир и нажмите «Поделиться» в шапке.',
        '2. Скопируйте публичную ссылку.',
        '3. Участники открывают её в любом браузере — без регистрации.',
        '4. Они видят таблицы, расписание и статистику в реальном времени.',
      ],
    },
    {
      q: 'Какие тарифы и цены?',
      tags: ['тариф', 'цена', 'стоимость', 'про', 'бесплатный', 'оплата', 'подписка', 'купить', '4990', 'деньги'],
      steps: [
        'Бесплатный план: 1 активный турнир, до 16 команд, базовые функции.',
        'Pro — 4 990 ₸/мес или 44 990 ₸/год (выгоднее на 25%).',
        'Pro включает: безлимитные турниры, до 64 команд.',
        'Pro включает: Live-табло, приоритетную поддержку 24/7.',
        'Pro включает: экспорт PDF, расширенная статистика.',
      ],
    },
    {
      q: 'Как экспортировать таблицу или отчёт?',
      tags: ['экспорт', 'скачать', 'pdf', 'png', 'отчёт', 'таблица', 'изображение'],
      steps: [
        '1. Откройте нужную вкладку (Таблица, Статистика, Группы и т.д.).',
        '2. Нажмите иконку PNG или PDF рядом с таблицей.',
        '3. Для полного отчёта турнира — кнопка «Скачать отчёт» (Pro).',
      ],
    },
    {
      q: 'Что означают иконки событий в матче?',
      tags: ['иконки', 'событие', 'мяч', 'гол', 'ассист', 'карточка', 'обозначение', 'значки'],
      steps: [
        'Мяч (зелёный) — гол.',
        'Мяч (красный) — автогол.',
        'Буква «А» (синяя) — ассист.',
        'Жёлтый прямоугольник — жёлтая карточка.',
        'Красный прямоугольник — красная карточка.',
      ],
    },
    {
      q: 'Какие форматы турниров поддерживаются?',
      tags: ['формат', 'круговой', 'плей-офф', 'групповой', 'лига', 'тип', 'виды'],
      steps: [
        'Круговой — все играют друг с другом (1 или 2 круга).',
        'Плей-офф — прямое выбывание, сетка.',
        'Групповой + Плей-офф — как на Чемпионате мира.',
        'Лига + Плей-офф — как новая Лига чемпионов УЕФА.',
      ],
    },
    {
      q: 'Как расположены туры (matchdays)?',
      tags: ['тур', 'матчдей', 'расписание', 'порядок', 'расставлены', 'matchday'],
      steps: [
        '1. Тур = игровой день, где все команды сыграли по одному матчу.',
        '2. Последний сыгранный тур показывается первым.',
        '3. Live-матч всегда наверху списка.',
        '4. В «Групповой + Плей-офф» каждый тур содержит матчи из всех групп.',
      ],
    },
  ],
  kz: [
    {
      q: 'Турнирді қалай жасауға болады?',
      tags: ['жасау', 'турнир', 'жаңа', 'бастау', 'создать'],
      steps: [
        '1. Бас панелде «Жаңа турнир» батырмасын басыңыз.',
        '2. Формат таңдаңыз: Дөңгелек, Плей-офф, Топтар+Плей-офф немесе Лига+Плей-офф.',
        '3. Команда атауларын енгізіп, логотиптер жүктеңіз.',
        '4. Ұпайларды, ойын ұзақтығын және басқа параметрлерді реттеңіз.',
        '5. «Турнир жасау» батырмасын басыңыз — кесте автоматты дайын.',
      ],
    },
    {
      q: 'Нақты уақытта есеп қалай жүргізіледі?',
      tags: ['live', 'лайв', 'есеп', 'нәтиже', 'онлайн', 'трансляция', 'ойын'],
      steps: [
        '1. Турнирді ашып, «Ойындар» қойындысына өтіңіз.',
        '2. Ойынды тауып, «Ойынды бастау» батырмасын басыңыз.',
        '3. Live-тақта ашылады — голдарды, ассисттерді, карточкаларды енгізіңіз.',
        '4. Ойын аяқталған соң «Аяқтау» → «Сақтап аяқтау».',
        '5. Тақта 3 секундтан соң өздігінен жабылады.',
      ],
    },
    {
      q: 'Топтық кестелерді қалай қарауға болады?',
      tags: ['топтар', 'кесте', 'топтық', 'кезең', 'группы'],
      steps: [
        '1. «Топтық кезең + Плей-офф» форматындағы турнирді ашыңыз.',
        '2. «Топтар» қойындысына өтіңіз.',
        '3. Әр топ үшін жеке кестелер көрсетіледі.',
        '4. Жасыл сызық плей-офф аймағын белгілейді.',
      ],
    },
    {
      q: 'Тілді қалай ауыстыруға болады?',
      tags: ['тіл', 'язык', 'аудару', 'ауыстыру', 'ру', 'қаз', 'ен'],
      steps: [
        '1. Жоғарғы панелде тіл ауыстырғышты тауып алыңыз (RU / KZ / EN).',
        '2. Қажетті тілді басыңыз — бет бірден жаңарады.',
        '3. Барлық мәтіндер жаңа тілде көрсетіледі.',
      ],
    },
    {
      q: 'Тарифтер мен бағалар қандай?',
      tags: ['тариф', 'баға', 'про', 'тегін', 'төлем', 'жазылым', '4990'],
      steps: [
        'Тегін: 1 белсенді турнир, 16 командаға дейін.',
        'Pro — 4 990 ₸/ай немесе 44 990 ₸/жыл.',
        'Pro: шексіз турнирлер, 64 командаға дейін.',
        'Pro: Live-тақта, басым қолдау 24/7.',
        'Pro: PDF экспорт, кеңейтілген статистика.',
      ],
    },
    {
      q: 'Турнирді қатысушылармен қалай бөлісуге болады?',
      tags: ['бөлісу', 'сілтеме', 'қатысушылар', 'жалпыға', 'шақыру', 'поделиться'],
      steps: [
        '1. Турнирді ашып, тақырыптағы «Бөлісу» батырмасын басыңыз.',
        '2. Жалпыға ортақ сілтемені көшіріңіз.',
        '3. Қатысушылар кез келген браузерде тіркелусіз ашады.',
        '4. Олар кестелерді, кестені және статистиканы нақты уақытта көреді.',
      ],
    },
    {
      q: 'Турнир форматтары қандай?',
      tags: ['формат', 'дөңгелек', 'плей-офф', 'топтар', 'лига', 'тип'],
      steps: [
        'Дөңгелек — барлығы бір-бірімен ойнайды (1 немесе 2 айналым).',
        'Плей-офф — тікелей жеңілген шығады.',
        'Топтар + Плей-офф — Әлем чемпионаты сияқты.',
        'Лига + Плей-офф — жаңа УЕФА Чемпиондар лигасы сияқты.',
      ],
    },
    {
      q: 'Оқиға белгішелері не білдіреді?',
      tags: ['белгіше', 'оқиға', 'доп', 'гол', 'ассист', 'карточка'],
      steps: [
        'Жасыл доп — гол.',
        'Қызыл доп — өз қақпасына гол.',
        '«А» әрпі (көк) — ассист.',
        'Сары тіктөртбұрыш — сары карточка.',
        'Қызыл тіктөртбұрыш — қызыл карточка.',
      ],
    },
  ],
  en: [
    {
      q: 'How do I create a tournament?',
      tags: ['create', 'tournament', 'new', 'start', 'setup', 'begin'],
      steps: [
        '1. Click "New Tournament" on the dashboard.',
        '2. Choose a format: Round-robin, Playoff, Groups+Playoff or League+Playoff.',
        '3. Enter team names and upload logos if you like.',
        '4. Configure points, match duration and other settings.',
        '5. Click "Create Tournament" — the schedule is generated automatically.',
      ],
    },
    {
      q: 'How do I track scores in real time (Live)?',
      tags: ['live', 'score', 'result', 'real', 'time', 'online', 'stream'],
      steps: [
        '1. Open the tournament and go to the "Matches" tab.',
        '2. Find the match and click "Start match".',
        '3. The Live board opens — enter goals, assists and cards.',
        '4. When done, click "Finish" → "Save and finish".',
        '5. The board auto-closes after 3 seconds and refreshes the tournament.',
      ],
    },
    {
      q: 'How do I finish a Live match?',
      tags: ['finish', 'end', 'close', 'complete', 'live', 'match'],
      steps: [
        '1. On the Live board, tap "Finish" at the bottom.',
        '2. Confirm with "Save and finish".',
        '3. The result is saved automatically.',
        '4. The page closes after 3 seconds and returns you to the tournament.',
        '5. The finished match appears first in the Matches tab.',
      ],
    },
    {
      q: 'How do I view group standings?',
      tags: ['groups', 'group', 'standings', 'table', 'stage', 'view'],
      steps: [
        '1. Open a tournament with "Group Stage + Playoff" format.',
        '2. Go to the "Groups" tab.',
        '3. You will see separate standings for each group.',
        '4. The green line marks the playoff qualification zone.',
      ],
    },
    {
      q: 'How do I switch the language?',
      tags: ['language', 'switch', 'ru', 'kz', 'en', 'translate', 'change'],
      steps: [
        '1. Find the language switcher in the top navigation bar (RU / KZ / EN).',
        '2. Click your preferred language — the page updates instantly.',
        '3. All tournament text updates too.',
        '4. Your choice is saved automatically in your browser.',
      ],
    },
    {
      q: 'Can I invite a helper?',
      tags: ['invite', 'helper', 'editor', 'co-editor', 'share', 'access', 'collaborate'],
      steps: [
        '1. Open the tournament and click "Share".',
        '2. Select "Invite Editor".',
        '3. Copy the link and send it to your colleague.',
        '4. Up to 3 co-editors can enter results at the same time.',
      ],
    },
    {
      q: 'How do I share a tournament with participants?',
      tags: ['share', 'link', 'participants', 'public', 'viewers', 'spectators'],
      steps: [
        '1. Open the tournament and tap "Share" in the header.',
        '2. Copy the public link.',
        '3. Participants open it in any browser — no account needed.',
        '4. They see standings, schedule and stats in real time.',
      ],
    },
    {
      q: 'What are the plans and pricing?',
      tags: ['plan', 'price', 'cost', 'pro', 'free', 'payment', 'subscription', '4990'],
      steps: [
        'Free plan: 1 active tournament, up to 16 teams.',
        'Pro — 4,990 ₸/month or 44,990 ₸/year (save 25%).',
        'Pro includes: unlimited tournaments, up to 64 teams.',
        'Pro includes: Live scoreboard, priority support 24/7.',
        'Pro includes: PDF export, advanced statistics.',
      ],
    },
    {
      q: 'What do the match event icons mean?',
      tags: ['icon', 'icons', 'event', 'ball', 'goal', 'assist', 'card', 'symbols'],
      steps: [
        'Green ball — goal.',
        'Red ball — own goal.',
        'Letter "A" (blue) — assist.',
        'Yellow rectangle — yellow card.',
        'Red rectangle — red card.',
      ],
    },
    {
      q: 'Which tournament formats are supported?',
      tags: ['format', 'type', 'round-robin', 'playoff', 'groups', 'league'],
      steps: [
        'Round-robin — everyone plays each other (1 or 2 legs).',
        'Playoff — single elimination bracket.',
        'Groups + Playoff — like the FIFA World Cup.',
        'League + Playoff — like the new UEFA Champions League.',
      ],
    },
  ],
}

// ── Keyword matching ──────────────────────────────────────────────────────────

function matchFaq(query: string, items: FaqItem[]): FaqItem | null {
  const words = query.toLowerCase().split(/[\s,.!?]+/).filter(w => w.length > 2)
  if (words.length === 0) return null

  let best = 0
  let bestItem: FaqItem | null = null

  for (const item of items) {
    // Tags count double, question title counts single — steps are excluded to avoid false positives
    const tagHaystack  = item.tags.join(' ')
    const titleHaystack = item.q.toLowerCase()

    const score = words.reduce((acc, w) => {
      const inTag   = tagHaystack.includes(w) ? 2 : 0
      const inTitle = titleHaystack.includes(w) ? 1 : 0
      return acc + inTag + inTitle
    }, 0)

    if (score > best) {
      best = score
      bestItem = item
    }
  }

  // Require at least one word hit; for single-word queries require score ≥ 2 (tag match)
  const minScore = words.length === 1 ? 2 : 1
  return best >= minScore ? bestItem : null
}

// ── UI strings ────────────────────────────────────────────────────────────────

const UI: Record<Lang, {
  greeting: string; header: string; online: string; faqTitle: string; wa: string
  inputPlaceholder: string; notFound: string
}> = {
  ru: {
    greeting: 'Привет! Помогу разобраться с Tournable. Выберите вопрос ниже или напишите свой.',
    header: 'Поддержка Tournable',
    online: 'Онлайн — отвечаем быстро',
    faqTitle: 'Частые вопросы',
    wa: 'Написать в WhatsApp',
    inputPlaceholder: 'Задайте вопрос…',
    notFound: 'Не нашёл ответа на этот вопрос. Напишите нам в WhatsApp — ответим быстро.',
  },
  kz: {
    greeting: 'Сәлем! Tournable-мен жұмыс істеуге көмектесемін. Төменнен сұрақ таңдаңыз немесе өзіңіздікін жазыңыз.',
    header: 'Tournable қолдауы',
    online: 'Онлайн — тез жауап береміз',
    faqTitle: 'Жиі сұрақтар',
    wa: 'WhatsApp-қа жазу',
    inputPlaceholder: 'Сұрақ қою…',
    notFound: 'Бұл сұраққа жауап таппадым. Бізге WhatsApp-та жазыңыз.',
  },
  en: {
    greeting: 'Hey! Happy to help with Tournable. Pick a question below or type your own.',
    header: 'Tournable Support',
    online: 'Online — fast response',
    faqTitle: 'FAQ',
    wa: 'Message on WhatsApp',
    inputPlaceholder: 'Ask a question…',
    notFound: "Couldn't find an answer. Write to us on WhatsApp — we reply fast.",
  },
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Msg = { text?: string; steps?: string[]; isBot: boolean }

const WA_URL = 'https://wa.me/message/YHLE2IFII4MSJ1'

// ── Component ─────────────────────────────────────────────────────────────────

export default function SupportWidget({ lang = 'ru' }: { lang?: Lang }) {
  const faq = FAQ[lang]
  const ui = UI[lang]

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([{ text: ui.greeting, isBot: true }])
  const [answered, setAnswered] = useState<Set<number>>(new Set())
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMessages([{ text: UI[lang].greeting, isBot: true }])
    setAnswered(new Set())
    setInput('')
  }, [lang])

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      if (input === '') setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [messages, open])

  function sendFaq(idx: number) {
    if (answered.has(idx)) return
    const item = faq[idx]
    setMessages(prev => [
      ...prev,
      { text: item.q, isBot: false },
      { steps: item.steps, isBot: true },
    ])
    setAnswered(prev => new Set(prev).add(idx))
  }

  function sendQuery() {
    const query = input.trim()
    if (!query) return
    setInput('')
    const found = matchFaq(query, faq)
    setMessages(prev => [
      ...prev,
      { text: query, isBot: false },
      found
        ? { steps: found.steps, isBot: true }
        : { text: ui.notFound, isBot: true },
    ])
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') sendQuery()
  }

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-20 right-4 sm:right-6 z-[100] w-[calc(100vw-2rem)] sm:w-[360px] max-h-[560px] flex flex-col rounded-2xl shadow-2xl overflow-hidden"
          style={{ background: '#fff', border: '1px solid #e5e7eb' }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ background: 'linear-gradient(90deg,#047857,#059669)' }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-white text-sm font-black">T</span>
              </div>
              <div>
                <div className="font-black text-white text-sm">{ui.header}</div>
                <div className="flex items-center gap-1 text-emerald-200 text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse inline-block" />
                  {ui.online}
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 min-h-0">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.isBot
                      ? 'bg-white border border-gray-100 text-gray-700 shadow-sm'
                      : 'text-white font-medium'
                  }`}
                  style={!msg.isBot ? { background: 'linear-gradient(135deg,#047857,#059669)' } : {}}
                >
                  {msg.steps ? (
                    <ol className="space-y-1.5 list-none m-0 p-0">
                      {msg.steps.map((step, si) => (
                        <li key={si} className="text-sm text-gray-700 leading-snug">{step}</li>
                      ))}
                    </ol>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Text input */}
          <div className="shrink-0 px-3 pt-2.5 pb-2 border-t border-gray-100 bg-white">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={ui.inputPlaceholder}
                className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-400 focus:bg-white transition-all placeholder:text-gray-400"
              />
              <button
                onClick={sendQuery}
                disabled={!input.trim()}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
                style={{ background: 'linear-gradient(135deg,#047857,#059669)' }}
              >
                <Send size={15} className="text-white" />
              </button>
            </div>
          </div>

          {/* FAQ quick replies */}
          <div className="p-3 border-t border-gray-100 bg-white shrink-0">
            <p className="text-[10px] text-gray-400 mb-2 font-medium uppercase tracking-wide">{ui.faqTitle}</p>
            <div className="space-y-1.5 max-h-[110px] overflow-y-auto">
              {faq.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => sendFaq(idx)}
                  className={`w-full text-left text-xs px-3 py-2 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                    answered.has(idx)
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-emerald-300 hover:bg-emerald-50'
                  }`}
                >
                  <span className="truncate">{item.q}</span>
                  <ChevronRight className="w-3 h-3 shrink-0 opacity-50" />
                </button>
              ))}
            </div>

            {/* WhatsApp CTA */}
            <a
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:scale-[1.02]"
              style={{ background: 'linear-gradient(90deg,#128C7E,#25D366)', boxShadow: '0 4px 15px rgba(37,211,102,.3)' }}
            >
              <IconWhatsApp className="w-4 h-4" />
              {ui.wa}
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-4 right-4 sm:right-6 z-[100] w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95"
        style={{ background: 'linear-gradient(135deg,#047857,#25D366)', boxShadow: '0 8px 30px rgba(37,211,102,.4)' }}
        aria-label="Support"
      >
        {open
          ? <X className="w-6 h-6 text-white" />
          : <IconWhatsApp className="w-7 h-7 text-white" />
        }
      </button>

      {/* Pulse ring */}
      {!open && (
        <span
          className="fixed bottom-4 right-4 sm:right-6 z-[99] w-14 h-14 rounded-full animate-ping opacity-20 pointer-events-none"
          style={{ background: '#25D366' }}
        />
      )}
    </>
  )
}

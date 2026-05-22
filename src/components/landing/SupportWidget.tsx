'use client'

import { useState, useRef, useEffect } from 'react'
import { X, ArrowRight, ChevronRight } from 'lucide-react'

function IconWhatsApp({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.38 1.26 4.81L2.05 22l5.35-1.38c1.38.73 2.93 1.14 4.64 1.14 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.52 14.15c-.23.64-1.36 1.22-1.87 1.3-.48.08-1.08.11-1.74-.11-.4-.13-.92-.3-1.58-.58-2.78-1.2-4.6-4-4.74-4.19-.14-.19-1.1-1.47-1.1-2.8 0-1.33.7-1.98 1.0-2.25.26-.27.57-.34.75-.34.19 0 .38.01.54.01.17 0 .41-.06.63.48.23.56.77 1.88.84 2.01.07.14.11.3.02.48-.09.18-.14.29-.28.45-.14.16-.29.35-.41.47-.14.13-.28.27-.12.53.16.26.71 1.17 1.52 1.89.97.87 1.79 1.14 2.05 1.26.25.12.4.1.55-.06.15-.16.64-.75.81-1.01.17-.26.34-.21.57-.13.23.08 1.48.7 1.73.82.25.12.42.18.48.28.06.1.06.56-.17 1.2z"/>
    </svg>
  )
}

const FAQ = [
  {
    q: '🏆 Как создать турнир?',
    a: 'Зарегистрируйтесь, нажмите «Новый турнир», выберите формат (Круговой, Плей-офф или Группы+Плей-офф), добавьте команды — расписание сгенерируется автоматически. Занимает около 30 секунд.',
  },
  {
    q: '📊 Какие форматы поддерживаются?',
    a: 'Круговой (все играют со всеми), Плей-офф (сетка на выбывание), Группы + Плей-офф (как Лига чемпионов или ЧМ). Очки, время матча и другие параметры полностью настраиваются.',
  },
  {
    q: '📱 Как вести счёт в реальном времени?',
    a: 'Зайдите в турнир → выберите матч → нажмите «Начать». Вносите голы и события с телефона. Участники видят счёт по публичной ссылке без регистрации.',
  },
  {
    q: '👥 Можно ли пригласить помощника?',
    a: 'Да! В разделе «Поделиться» турнира выберите «Пригласить редактора» — скопируйте ссылку и отправьте. До 3 соредакторов могут вводить результаты одновременно.',
  },
  {
    q: '💳 Какие тарифы и что входит?',
    a: 'Бесплатный план: до 3 турниров, до 16 команд. Про (4 990 ₸/мес или 44 990 ₸/год): безлимитные турниры, до 64 команд, Live-табло, приоритетная поддержка.',
  },
  {
    q: '🔗 Как поделиться турниром?',
    a: 'В любом турнире кнопка «Поделиться» → скопируйте публичную ссылку. Участники открывают её в браузере и видят таблицу, расписание и статистику без регистрации.',
  },
]

type Msg = { text: string; isBot: boolean }

const GREETING = 'Привет! 👋 Я помогу разобраться с платформой. Выберите вопрос или напишите в WhatsApp для живого общения.'
const WA_URL = 'https://wa.me/message/YHLE2IFII4MSJ1'

export default function SupportWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([{ text: GREETING, isBot: true }])
  const [answered, setAnswered] = useState<Set<number>>(new Set())
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  function handleFaq(idx: number) {
    if (answered.has(idx)) return
    const faq = FAQ[idx]
    setMessages(prev => [
      ...prev,
      { text: faq.q, isBot: false },
      { text: faq.a, isBot: true },
    ])
    setAnswered(prev => new Set(prev).add(idx))
  }

  return (
    <>
      {/* Panel */}
      {open && (
        <div
          className="fixed bottom-20 right-4 sm:right-6 z-[100] w-[calc(100vw-2rem)] sm:w-[360px] max-h-[540px] flex flex-col rounded-2xl shadow-2xl overflow-hidden"
          style={{ background: '#fff', border: '1px solid #e5e7eb' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ background: 'linear-gradient(90deg,#047857,#059669)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-white text-sm font-black">T</span>
              </div>
              <div>
                <div className="font-black text-white text-sm">Поддержка Tournable</div>
                <div className="flex items-center gap-1 text-emerald-200 text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse inline-block" />
                  Онлайн
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.isBot
                    ? 'bg-white border border-gray-100 text-gray-700 shadow-sm'
                    : 'text-white font-medium'
                }`}
                  style={!msg.isBot ? { background: 'linear-gradient(135deg,#047857,#059669)' } : {}}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* FAQ quick replies */}
          <div className="p-3 border-t border-gray-100 bg-white shrink-0">
            <p className="text-[10px] text-gray-400 mb-2 font-medium uppercase tracking-wide">Частые вопросы</p>
            <div className="space-y-1.5 max-h-[130px] overflow-y-auto">
              {FAQ.map((faq, idx) => (
                <button
                  key={idx}
                  onClick={() => handleFaq(idx)}
                  className={`w-full text-left text-xs px-3 py-2 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                    answered.has(idx)
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-emerald-300 hover:bg-emerald-50'
                  }`}
                >
                  <span>{faq.q}</span>
                  <ChevronRight className="w-3 h-3 shrink-0 opacity-50" />
                </button>
              ))}
            </div>

            {/* WA CTA */}
            <a
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:scale-[1.02]"
              style={{ background: 'linear-gradient(90deg,#128C7E,#25D366)', boxShadow: '0 4px 15px rgba(37,211,102,.3)' }}
            >
              <IconWhatsApp className="w-4 h-4" />
              Написать в WhatsApp
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-4 right-4 sm:right-6 z-[100] w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95"
        style={{ background: 'linear-gradient(135deg,#047857,#25D366)', boxShadow: '0 8px 30px rgba(37,211,102,.4)' }}
        aria-label="Открыть поддержку"
      >
        {open
          ? <X className="w-6 h-6 text-white" />
          : <IconWhatsApp className="w-7 h-7 text-white" />
        }
      </button>

      {/* Pulse ring when closed */}
      {!open && (
        <span className="fixed bottom-4 right-4 sm:right-6 z-[99] w-14 h-14 rounded-full animate-ping opacity-20 pointer-events-none"
          style={{ background: '#25D366' }} />
      )}
    </>
  )
}

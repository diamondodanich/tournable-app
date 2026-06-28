'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Check, ArrowRight, Phone, ChevronRight, Zap, BarChart3, Trophy, Share2, Globe, Download, Video, Star, Menu, X } from 'lucide-react'
import SupportWidget from './SupportWidget'
import { setLangCookie } from '@/app/actions/lang'

// ─── Types ────────────────────────────────────────────────────────────────────
type Lang = 'ru' | 'kz' | 'en'

// ─── Translations ─────────────────────────────────────────────────────────────
const T = {
  ru: {
    label: 'RU',
    nav: { features: 'Возможности', pricing: 'Тарифы', contact: 'Контакты', login: 'Войти', start: 'Начать бесплатно', dashboard: 'Мои турниры' },
    hero: {
      badge: 'Для организаторов лиг и турниров',
      h1: ['Счёт у всех — онлайн.', 'Статистика считается сама.', 'Турнир за 2 минуты.'],
      sub: 'Создайте расписание, поделитесь ссылкой — и живая страница вашего турнира уже у каждого участника. Голы, таблица, плей-офф и бомбардиры считаются сами. Вы просто ведёте игру.',
      cta: 'Создать турнир бесплатно', cta2: 'Как это работает',
      proof: [['1 турнир бесплатно', 'все функции включены'], ['Готово', 'за 2 минуты'], ['Живая ссылка', 'без приложений']],
    },
    live: {
      badge: 'Live-табло',
      h2: ['Живой счёт —', 'на любом экране.'],
      sub: 'Запустите Live-режим до матча — счёт, голы и карточки мгновенно появляются на экране у каждого зрителя. Проецируйте на телевизор или большой экран. Без приложений, без регистрации, без задержки.',
      items: [
        'Таймер в реальном времени — накопленное время, пауза, дополнительное',
        'Голы и ассисты мгновенно появляются у всех зрителей',
        'Полноэкранный режим — проецируйте на телевизор или LED-экран',
        'Достаточно одной ссылки — команды и болельщики следят без регистрации',
      ],
    },
    stats: {
      h2: ['Конец ручному счёту.', 'Всё считается само.'],
      sub: 'После каждого результата — бомбардиры, разница мячей, дисциплина обновляются мгновенно. Ноль ручного труда.',
      items: [
        'Живая таблица бомбардиров и ассистентов',
        'Карточки и предупреждения по каждой команде',
        'Автоматический расчёт очков и разницы мячей',
        'Экспорт итогов в PDF — для печати, чата или соцсетей',
      ],
    },
    features: {
      tag: 'Возможности',
      h2: 'Всё для турнира.\nУже внутри.',
      sub: 'То, что раньше занимало вечер — теперь занимает минуту.',
      items: [
        { title: 'Расписание за 30 секунд', desc: 'Выберите формат, добавьте команды — все матчи готовы автоматически. Круговой, плей-офф, групповой этап, лига с плей-оффом.' },
        { title: 'Живой счёт без приложений', desc: 'Голы с телефона — счёт у всех мгновенно. Больше никто не ждёт скрин из WhatsApp. Просто ссылка.' },
        { title: 'Статистика, которая не ждёт', desc: 'Очки, разница мячей, бомбардиры — обновляются сами после каждого матча. Всегда точно, всегда вовремя.' },
        { title: 'Плей-офф без головной боли', desc: 'Победители переходят дальше автоматически. До 64 команд — от 1/8 до финала.' },
        { title: 'Живая страница турнира', desc: 'Каждый турнир получает публичный URL. Поделитесь с командами до игры — все следят за таблицей и счётом онлайн без регистрации.' },
        { title: 'PDF и PNG в один клик', desc: 'Таблица, сетка, статистика — готовы для печати, соцсетей или чата. Красиво с первого раза.' },
      ],
      sportsLabel: 'Работает для любого командного спорта',
      sports: ['Футбол', 'Мини-футбол', 'Баскетбол', 'Волейбол', 'Хоккей', 'Теннис', 'Настольный теннис', 'Бадминтон'],
    },
    pricing: {
      h2: 'Выберите свой формат.',
      sub: 'Начните бесплатно. Масштабируйтесь без ограничений.',
      freeFeatures: [
        'Все форматы турниров',
        'Автоматизированная статистика',
        'Публичная страница турнира',
        'Отчёты в PDF и PNG',
        'LIVE-режим с табло',
      ],
      proFeatures: [
        'Активных турниров — без лимита',
        'Команд — без лимита',
        'Отчёты без водяного знака',
        'Приглашение соредакторов (до 3)',
        'Приоритетная поддержка',
      ],
      enterpriseFeatures: [
        'Постоянные лиги с сезонами',
        'Подробная статистика и аналитика',
        'Профили команд и игроков',
        'Составы к матчам',
        'SEO-страницы для лиги и команд',
      ],
      free: {
        name: 'Старт', price: '0 ₸',
        limit: '1 турнир · до 16 команд',
        cta: 'Начать бесплатно',
      },
      pro: {
        name: 'Про', badge: 'Выбор организаторов',
        monthly: '4 990 ₸', monthlyPer: '/ мес',
        annual: '44 990 ₸', annualPer: '/ год',
        annualMonthly: '3 749 ₸', discount: 'Скидка 25% при оплате за год',
        saving: 'Экономия 14 890 ₸',
        includeLabel: 'Всё из тарифа Старт',
        cta: 'Перейти на Про',
      },
      enterprise: {
        name: 'Enterprise', sub: 'Для федераций и лиг',
        price: 'от 39 990 ₸/мес',
        includeLabel: 'Всё из тарифа Про',
        cta: 'Написать в WhatsApp',
      },
      more: 'Нужно больше? ', moreLink: 'Напишите — решим.',
    },
    services: {
      h2: 'Мы берём на себя всё',
      sub: 'Хотите полностью делегировать? Наши специалисты выедут к вам и возьмут технику в свои руки.',
      items: [
        { icon: 'video', title: 'Профессиональная видеосъёмка', desc: 'Наша команда приедет на турнир и профессионально снимет каждый матч. Видеозаписи появятся в вашем аккаунте автоматически.', price: null, pricePer: null, badge: 'Скоро', badgeColor: 'blue' },
        { icon: 'trophy', title: 'Оператор на турнир', desc: 'Наш специалист приедет и возьмёт на себя все результаты — вводит матчи прямо в платформу в реальном времени. Вы ведёте игру — мы за экраном.', price: '19 990 ₸', pricePer: 'в день', badge: null, badgeColor: null },
      ],
    },
    contact: { h2: 'Есть вопрос? Пишите.', sub: 'Отвечаем быстро. Живые люди, не боты.', wa: 'Написать в WhatsApp', phone: '+7 (706) 409-20-21' },
    cta: { h2: 'Ваш следующий турнир — уже сегодня.', sub: 'Минута на регистрацию. Турнир готов. Участники в шоке от уровня.', btn: 'Начать бесплатно' },
    footer: {
      tagline: 'Профессиональные турниры по любому командному спорту — от двора до финала.',
      cols: { product: 'Продукт', platform: 'Платформа', connect: 'Связь' },
      links: { features: 'Возможности', pricing: 'Тарифы', contact: 'Контакты', login: 'Войти', register: 'Регистрация', pro: 'Тариф Про' },
      legal: '© 2026 Tournable. Все права защищены.',
      privacy: 'Политика конфиденциальности', terms: 'Пользовательское соглашение',
    },
  },

  kz: {
    label: 'KZ',
    nav: { features: 'Мүмкіндіктер', pricing: 'Тарифтер', contact: 'Байланыс', login: 'Кіру', start: 'Тегін бастау', dashboard: 'Менің турнирларым' },
    hero: {
      badge: 'Лигалар мен турнирлер ұйымдастырушыларына',
      h1: ['Есеп барлығында — онлайн.', 'Статистика өздігінен есептеледі.', 'Турнир — 2 минутта.'],
      sub: 'Кесте жасаңыз, сілтемемен бөлісіңіз — және турниріңіздің тірі беті әрбір қатысушыда. Голдар, кесте, плей-офф және бомбардирлер өздігінен есептеледі. Сіз тек турнирді өткізесіз.',
      cta: 'Турнирді тегін жасау', cta2: 'Қалай жұмыс істейді',
      proof: [['1 турнир тегін', 'барлық мүмкіндіктер'], ['Дайын', '2 минутта'], ['Тірі сілтеме', 'қосымшасыз']],
    },
    live: {
      badge: 'Live-тақта',
      h2: ['Тірі есеп —', 'кез келген экранда.'],
      sub: 'Live-режимді матчқа дейін іске қосыңыз — есеп, голдар мен карточкалар барлық тамашалаушылардың экранында лезде пайда болады. Теледидарға немесе экранға проекциялаңыз. Қосымшасыз, тіркелусіз, кешіктірусіз.',
      items: [
        'Нақты уақытта таймер — жинақталған уақыт, үзіліс, қосымша уақыт',
        'Голдар мен ассисттер барлық тамашалаушыларға лезде жетеді',
        'Толық экран режимі — теледидарда немесе LED-экранда проекциялаңыз',
        'Бір сілтеме жеткілікті — тіркелмей қарай алады',
      ],
    },
    stats: {
      h2: ['Қолмен есептеу артта қалды.', 'Бәрі өздігінен есептеледі.'],
      sub: 'Әр нәтиже енгізілгеннен кейін — бомбардирлер, доп айырмасы, тәртіп лезде жаңарады. Ешқандай қолмен есептеу жоқ.',
      items: [
        'Бомбардирлер мен ассисттердің тірі кестесі',
        'Карточкалар мен ескертулер — әр команда бойынша',
        'Ұпайлар мен доп айырмасын автоматты есептеу',
        'Қорытындыны PDF-ке экспорттау — басып шығаруға, чатқа немесе әлеуметтік желілерге',
      ],
    },
    features: {
      tag: 'Мүмкіндіктер',
      h2: 'Турнир үшін бәрі.\nДайын күйде.',
      sub: 'Бұрын кешке алатын нәрсе — енді бір минутта.',
      items: [
        { title: '30 секундта кесте', desc: 'Форматты таңдаңыз, командаларды қосыңыз — барлық матчтар автоматты дайын. Дөңгелек, плей-офф, топтық кезең, лига + плей-офф.' },
        { title: 'Қосымшасыз тірі есеп', desc: 'Телефоннан голдар — есеп барлығына лезде. Ешкім WhatsApp скриншотын күтпейді. Тек сілтеме.' },
        { title: 'Жаңарып тұратын статистика', desc: 'Ұпайлар, доп айырмасы, бомбардирлер — әр матчтан кейін өздігінен жаңарады. Әрқашан дәл, әрқашан уақытында.' },
        { title: 'Бас ауыртпайтын плей-офф', desc: 'Жеңімпаздар автоматты алға өтеді. 64 командаға дейін — 1/8-ден финалға.' },
        { title: 'Турнирдің тірі беті', desc: 'Әрбір турнир жалпыға ортақ URL алады. Матчқа дейін командаларға сілтемені жіберіңіз — барлығы тіркелмей кестені онлайн қарайды.' },
        { title: 'PDF және PNG бір шертумен', desc: 'Кесте, тор, статистика — басып шығаруға, әлеуметтік желілерге немесе чатқа дайын. Бірден сұлу шығады.' },
      ],
      sportsLabel: 'Кез келген командалық спорт үшін жұмыс істейді',
      sports: ['Футбол', 'Мини-футбол', 'Баскетбол', 'Волейбол', 'Хоккей', 'Теннис', 'Үстел тенисі', 'Бадминтон'],
    },
    pricing: {
      h2: 'Өз форматыңызды таңдаңыз.',
      sub: 'Тегін бастаңыз. Шектеусіз масштабтаңыз.',
      freeFeatures: [
        'Барлық турнир форматтары',
        'Автоматтандырылған статистика',
        'Турнирдің жалпыға ортақ беті',
        'PDF және PNG есептері',
        'LIVE-режим тақтасы',
      ],
      proFeatures: [
        'Белсенді турнирлер — шексіз',
        'Командалар — шексіз',
        'Су белгісіз есептер',
        'Соредакторларды шақыру (3-ке дейін)',
        'Басым қолдау',
      ],
      enterpriseFeatures: [
        'Маусымдары бар тұрақты лигалар',
        'Толық статистика және аналитика',
        'Команда мен ойыншы профильдері',
        'Матчқа арналған құрамдар',
        'Лига мен командаларға арналған SEO-беттер',
      ],
      free: {
        name: 'Старт', price: '0 ₸',
        limit: '1 турнир · 16 командаға дейін',
        cta: 'Тегін бастау',
      },
      pro: {
        name: 'Про', badge: 'Ұйымдастырушылардың таңдауы',
        monthly: '4 990 ₸', monthlyPer: '/ ай',
        annual: '44 990 ₸', annualPer: '/ жыл',
        annualMonthly: '3 749 ₸', discount: 'Жылдық төлемде −25% жеңілдік',
        saving: '14 890 ₸ үнемдеу',
        includeLabel: 'Старт тарифінің барлығы',
        cta: 'Про-ға өту',
      },
      enterprise: {
        name: 'Enterprise', sub: 'Федерациялар мен лигалар үшін',
        price: '39 990 ₸/айдан бастап',
        includeLabel: 'Про тарифінің барлығы',
        cta: 'WhatsApp-қа жазу',
      },
      more: 'Көбірек керек пе? ', moreLink: 'Жазыңыз — шешеміз.',
    },
    services: {
      h2: 'Барлығын біз аламыз',
      sub: 'Толықтай тапсырғыңыз келе ме? Мамандарымыз сізге барып, техниканы өз қолдарына алады.',
      items: [
        { icon: 'video', title: 'Кәсіби бейнетүсіру', desc: 'Командамыз турнирге келіп, алаңдағы әр матчты кәсіби түрде түсіреді. Бейнежазбалар аккаунтыңызда автоматты пайда болады.', price: null, pricePer: null, badge: 'Жақында', badgeColor: 'blue' },
        { icon: 'trophy', title: 'Турниріңізге оператор', desc: 'Маманымыз келіп, барлық матч нәтижелерін тікелей платформаға нақты уақытта енгізеді. Сіз ойынды жүргізесіз — біз экран алдындамыз.', price: '19 990 ₸', pricePer: 'күніне', badge: null, badgeColor: null },
      ],
    },
    contact: { h2: 'Сұрағыңыз бар ма? Жазыңыз.', sub: 'Жылдам жауап береміз. Тірі адамдар, роботтар емес.', wa: 'WhatsApp-қа жазу', phone: '+7 (706) 409-20-21' },
    cta: { h2: 'Келесі турниріңіз — бүгін.', sub: 'Тіркелу — бір минут. Турнир дайын. Қатысушылар деңгейден таң қалады.', btn: 'Тегін бастау' },
    footer: {
      tagline: 'Кез келген командалық спорт бойынша кәсіби турнирлер — алаңнан финалға дейін.',
      cols: { product: 'Өнім', platform: 'Платформа', connect: 'Байланыс' },
      links: { features: 'Мүмкіндіктер', pricing: 'Тарифтер', contact: 'Байланыс', login: 'Кіру', register: 'Тіркелу', pro: 'Про тарифі' },
      legal: '© 2026 Tournable. Барлық құқықтар қорғалған.',
      privacy: 'Құпиялылық саясаты', terms: 'Пайдаланушы келісімі',
    },
  },

  en: {
    label: 'EN',
    nav: { features: 'Features', pricing: 'Pricing', contact: 'Contact', login: 'Sign In', start: 'Start Free', dashboard: 'My Tournaments' },
    hero: {
      badge: 'For league & tournament organisers',
      h1: ['Live scores for everyone.', 'Stats calculate themselves.', 'Tournament in 2 minutes.'],
      sub: 'Build the schedule, share the link — and every participant instantly has a live tournament page. Goals, standings, playoff and top scorers update on their own. You just run the game.',
      cta: 'Create a tournament — free', cta2: 'See how it works',
      proof: [['1 tournament free', 'all features included'], ['Ready', 'in 2 minutes'], ['Live link', 'no app needed']],
    },
    live: {
      badge: 'Live scoreboard',
      h2: ['Live scores —', 'on every screen.'],
      sub: 'Start Live mode before the match — scores, goals and cards appear instantly on every spectator\'s screen. Project onto a TV or big screen. No app, no sign-up, no delay.',
      items: [
        'Real-time match timer — running time, pause, extra time',
        'Goals and assists appear instantly for all spectators',
        'Full-screen mode — project onto a TV or LED display',
        'One link is enough — teams and fans follow without signing up',
      ],
    },
    stats: {
      h2: ['No more manual counting.', 'Everything calculates itself.'],
      sub: 'After every result — top scorers, goal difference, discipline update instantly. Zero manual work.',
      items: [
        'Live top scorers and assists table',
        'Cards and warnings tracked per team',
        'Automatic points and goal difference calculation',
        'Export full standings to PDF — for print, chat or social media',
      ],
    },
    features: {
      tag: 'Features',
      h2: 'Everything for your tournament.\nAlready inside.',
      sub: 'What used to take an evening now takes a minute.',
      items: [
        { title: 'Schedule in 30 seconds', desc: 'Pick a format, add teams — all matches generated automatically. Round-robin, playoff, group stage, league with playoff.' },
        { title: 'Live scoreboard without apps', desc: 'Enter goals on your phone — everyone sees the update instantly. No more waiting for a WhatsApp screenshot. Just a link.' },
        { title: 'Stats that never wait', desc: 'Points, goal difference, top scorers — refreshed after every match. Always accurate. Always live.' },
        { title: 'Playoff without the headache', desc: 'Winners advance automatically. Up to 64 teams, from round of 16 to the final.' },
        { title: 'Live tournament page', desc: 'Every tournament gets its own public URL. Share with teams before the game — everyone follows standings and live scores without signing up.' },
        { title: 'PDF & PNG in one click', desc: 'Standings, bracket, stats — ready for print, social media or chat. Looks sharp every time.' },
      ],
      sportsLabel: 'Works for any team sport',
      sports: ['Football', 'Futsal', 'Basketball', 'Volleyball', 'Hockey', 'Tennis', 'Table Tennis', 'Badminton'],
    },
    pricing: {
      h2: 'Choose your format.',
      sub: 'Start free. Scale without limits.',
      freeFeatures: [
        'All tournament formats',
        'Automated statistics',
        'Public tournament page',
        'PDF and PNG reports',
        'LIVE scoreboard',
      ],
      proFeatures: [
        'Unlimited active tournaments',
        'Unlimited teams',
        'Reports without watermark',
        'Co-editors (up to 3)',
        'Priority support',
      ],
      enterpriseFeatures: [
        'Permanent leagues with seasons',
        'Detailed statistics & analytics',
        'Team and player profiles',
        'Match lineups',
        'SEO pages for leagues & teams',
      ],
      free: {
        name: 'Starter', price: '0 ₸',
        limit: '1 tournament · up to 16 teams',
        cta: 'Start free',
      },
      pro: {
        name: 'Pro', badge: 'Organizers\' choice',
        monthly: '4,990 ₸', monthlyPer: '/ mo',
        annual: '44,990 ₸', annualPer: '/ yr',
        annualMonthly: '3,749 ₸', discount: 'Save 25% with annual billing',
        saving: 'Save 14,890 ₸',
        includeLabel: 'Everything in Starter',
        cta: 'Go Pro',
      },
      enterprise: {
        name: 'Enterprise', sub: 'For federations & leagues',
        price: 'from 39,990 ₸/mo',
        includeLabel: 'Everything in Pro',
        cta: 'Message on WhatsApp',
      },
      more: 'Need more? ', moreLink: 'Write to us — we\'ll sort it out.',
    },
    services: {
      h2: 'We handle everything',
      sub: 'Want to fully delegate? Our specialists come to you and take care of all the technical side.',
      items: [
        { icon: 'video', title: 'Professional video recording', desc: 'Our team comes to your tournament and professionally films every match on the pitch. Videos appear in your account automatically.', price: null, pricePer: null, badge: 'Coming Soon', badgeColor: 'blue' },
        { icon: 'trophy', title: 'On-site results operator', desc: 'Our specialist arrives and enters all match results directly into the platform in real time. You run the game — we handle the screen.', price: '19,990 ₸', pricePer: 'per day', badge: null, badgeColor: null },
      ],
    },
    contact: { h2: 'Got a question? Write to us.', sub: 'Fast responses. Real people, no bots.', wa: 'Message on WhatsApp', phone: '+7 (706) 409-20-21' },
    cta: { h2: 'Your next tournament starts today.', sub: 'One minute to sign up. Tournament ready. Participants blown away by the level.', btn: 'Start for free' },
    footer: {
      tagline: 'Professional tournaments for any team sport — from the street to the final.',
      cols: { product: 'Product', platform: 'Platform', connect: 'Connect' },
      links: { features: 'Features', pricing: 'Pricing', contact: 'Contact', login: 'Sign In', register: 'Sign Up', pro: 'Pro Plan' },
      legal: '© 2026 Tournable. All rights reserved.',
      privacy: 'Privacy Policy', terms: 'Terms of Service',
    },
  },
} as const

// ─── WhatsApp icon ────────────────────────────────────────────────────────────
function IconWhatsApp({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.38 1.26 4.81L2.05 22l5.35-1.38c1.38.73 2.93 1.14 4.64 1.14 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.52 14.15c-.23.64-1.36 1.22-1.87 1.3-.48.08-1.08.11-1.74-.11-.4-.13-.92-.3-1.58-.58-2.78-1.2-4.6-4-4.74-4.19-.14-.19-1.1-1.47-1.1-2.8 0-1.33.7-1.98 1.0-2.25.26-.27.57-.34.75-.34.19 0 .38.01.54.01.17 0 .41-.06.63.48.23.56.77 1.88.84 2.01.07.14.11.3.02.48-.09.18-.14.29-.28.45-.14.16-.29.35-.41.47-.14.13-.28.27-.12.53.16.26.71 1.17 1.52 1.89.97.87 1.79 1.14 2.05 1.26.25.12.4.1.55-.06.15-.16.64-.75.81-1.01.17-.26.34-.21.57-.13.23.08 1.48.7 1.73.82.25.12.42.18.48.28.06.1.06.56-.17 1.2z"/>
    </svg>
  )
}

// ─── Social icons ─────────────────────────────────────────────────────────────
function IconTelegram({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z"/></svg>
}
function IconInstagram({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
}
function IconTikTok({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.84 4.84 0 01-1.01-.07z"/></svg>
}

// ─── Feature icons map ────────────────────────────────────────────────────────
const FEAT_ICONS = [Zap, BarChart3, Trophy, Share2, Globe, Download]
const FEAT_STYLES = [
  { bg: 'bg-emerald-500/15', icon: 'text-emerald-400', accent: 'bg-emerald-400' },
  { bg: 'bg-blue-500/15',    icon: 'text-blue-400',    accent: 'bg-blue-400' },
  { bg: 'bg-violet-500/15',  icon: 'text-violet-400',  accent: 'bg-violet-400' },
  { bg: 'bg-orange-500/15',  icon: 'text-orange-400',  accent: 'bg-orange-400' },
  { bg: 'bg-pink-500/15',    icon: 'text-pink-400',    accent: 'bg-pink-400' },
  { bg: 'bg-cyan-500/15',    icon: 'text-cyan-400',    accent: 'bg-cyan-400' },
]

// ─── Audience cases ───────────────────────────────────────────────────────────
const AUDIENCE: Record<Lang, { tag: string; h2: string; sub: string; cases: { tag: string; title: string; desc: string; cta: string; href: string }[] }> = {
  ru: {
    tag: 'Для кого',
    h2: 'Tournable — для каждого, кто организует.',
    sub: 'Любитель, клуб или федерация — платформа подстраивается под вас.',
    cases: [
      { tag: 'Любительские турниры', title: 'Организуешь турнир среди друзей, команд района или офиса?', desc: 'Создай расписание за 2 минуты, поделись ссылкой в чат — участники сами следят за таблицей и счётом. Без Excel, без скринов из WhatsApp.', cta: 'Начать бесплатно', href: '/register' },
      { tag: 'Спортивные клубы', title: 'Ведёшь регулярные соревнования внутри клуба?', desc: 'Несколько турниров одновременно, несколько редакторов, PDF-отчёт в один клик. История матчей всегда под рукой.', cta: 'Попробовать Pro', href: '/register?plan=pro' },
      { tag: 'Федерации и лиги', title: 'Проводишь городской чемпионат или официальную лигу?', desc: 'Постоянная лига с архивом сезонов, профилями команд и игроков, публичным SEO-сайтом — как у профессиональных лиг. Без технической команды.', cta: 'Enterprise — от 39 990 ₸', href: '#contact' },
    ],
  },
  kz: {
    tag: 'Кім үшін',
    h2: 'Tournable — ұйымдастырушы үшін.',
    sub: 'Хобби, клуб немесе федерация — платформа сізге бейімделеді.',
    cases: [
      { tag: 'Хобби турнирлер', title: 'Достар арасында немесе аудандағы командалар турнирін ұйымдастырасың ба?', desc: 'Кестені 2 минутта жасаңыз, чатқа сілтемені жіберіңіз — қатысушылар кестені және есепті өздері қадағалайды. Excel жоқ, WhatsApp скриншоты жоқ.', cta: 'Тегін бастау', href: '/register' },
      { tag: 'Спорт клубтары', title: 'Клуб ішінде жүйелі жарыстар өткізесің бе?', desc: 'Бірнеше турнир бір уақытта, бірнеше редактор, PDF-есеп бір шертумен. Матч тарихы әрқашан қолда.', cta: 'Pro-ды қолданып көру', href: '/register?plan=pro' },
      { tag: 'Федерациялар мен лигалар', title: 'Қалалық чемпионат немесе ресми лига өткізесің бе?', desc: 'Маусымдары бар тұрақты лига, команда мен ойыншы профильдері, жалпыға ортақ SEO-сайт — кәсіби лигалар сияқты. Техникалық команда жоқ.', cta: 'Enterprise — 39 990 ₸-дан', href: '#contact' },
    ],
  },
  en: {
    tag: 'Who it\'s for',
    h2: 'Tournable is for everyone who organises.',
    sub: 'Amateur, club or federation — the platform adapts to you.',
    cases: [
      { tag: 'Amateur tournaments', title: 'Organising a tournament with friends, your neighbourhood or the office?', desc: 'Build the schedule in 2 minutes, share the link — participants track standings and scores themselves. No Excel, no WhatsApp screenshots.', cta: 'Start free', href: '/register' },
      { tag: 'Sports clubs', title: 'Running regular competitions within your club?', desc: 'Multiple tournaments at once, multiple editors, PDF report in one click. Match history always at hand.', cta: 'Try Pro', href: '/register?plan=pro' },
      { tag: 'Federations & leagues', title: 'Running a city championship or an official league?', desc: 'Permanent league with season archive, team and player profiles, public SEO site — like professional leagues. No technical team needed.', cta: 'Enterprise — from 39,990 ₸', href: '#contact' },
    ],
  },
}

// ─── Main component ───────────────────────────────────────────────────────────
export function LandingPage({ isLoggedIn = false, defaultLang = 'ru', userInitials }: { isLoggedIn?: boolean; defaultLang?: Lang; userInitials?: string }) {
  const [lang, setLang] = useState<Lang>(defaultLang)
  const [mobileOpen, setMobileOpen] = useState(false)
  const tx = T[lang]
  const audience = AUDIENCE[lang]

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: 'Inter,sans-serif' }}>

      {/* ── Topbar ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50" style={{ background: 'linear-gradient(90deg,#047857 0%,#059669 100%)', boxShadow: '0 2px 20px rgba(4,120,87,.25)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Image src="/logo-white.png" alt="Tournable" width={36} height={36} className="w-9 h-9 object-contain" />
            <span className="font-black text-[17px] tracking-tight text-white" style={{ letterSpacing: '-.02em' }}>TOURNABLE</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {([['#features', tx.nav.features], ['#pricing', tx.nav.pricing], ['#contact', tx.nav.contact]] as [string, string][]).map(([href, label]) => (
              <a key={href} href={href} className="px-3.5 py-2 text-sm text-emerald-100 hover:text-white hover:bg-white/10 rounded-lg transition-all font-medium">{label}</a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* Language switcher — always visible */}
            <div className="flex items-center bg-white/15 rounded-lg p-0.5 gap-0.5">
              {(['ru', 'kz', 'en'] as Lang[]).map(l => (
                <button key={l} onClick={() => { setLang(l); setLangCookie(l) }}
                  className={`px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-bold rounded-md transition-all ${lang === l ? 'bg-white text-emerald-700 shadow-sm' : 'text-emerald-100 hover:text-white hover:bg-white/10'}`}>
                  {T[l].label}
                </button>
              ))}
            </div>

            {/* Desktop CTA */}
            {isLoggedIn ? (
              <div className="hidden lg:flex items-center gap-2">
                <Link href="/dashboard" className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                  {tx.nav.dashboard}
                </Link>
                <Link href="/account" className="flex items-center justify-center w-9 h-9 rounded-xl bg-white text-emerald-700 font-black text-sm hover:bg-emerald-50 transition-colors shadow-md" title="Личный кабинет">
                  {userInitials ?? '?'}
                </Link>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-2">
                <Link href={`/login${lang !== 'ru' ? `?lang=${lang}` : ''}`} className="text-sm font-medium text-emerald-100 hover:text-white px-3 py-2 transition-colors">{tx.nav.login}</Link>
                <Link href={`/register${lang !== 'ru' ? `?lang=${lang}` : ''}`} className="bg-white hover:bg-emerald-50 text-emerald-700 text-sm font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-md">
                  {tx.nav.start} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {/* Hamburger — mobile/tablet */}
            <button
              onClick={() => setMobileOpen(o => !o)}
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors"
              aria-label="Меню"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* ── Mobile drawer ────────────────────────────────────────────────── */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-white/15" style={{ background: 'linear-gradient(180deg,#047857 0%,#059669 100%)' }}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-1">

              {/* Nav links */}
              {([['#features', tx.nav.features], ['#pricing', tx.nav.pricing], ['#contact', tx.nav.contact]] as [string, string][]).map(([href, label]) => (
                <a key={href} href={href} onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 text-base text-emerald-100 hover:text-white hover:bg-white/10 rounded-xl transition-all font-medium">
                  {label}
                </a>
              ))}

              <div className="my-2 border-t border-white/15" />

              {/* CTA */}
              {isLoggedIn ? (
                <div className="flex flex-col gap-2 pt-1">
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 bg-white/15 text-white font-semibold py-3 rounded-xl transition-colors text-base hover:bg-white/25">
                    {tx.nav.dashboard}
                  </Link>
                  <Link href="/account" onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 bg-white hover:bg-emerald-50 text-emerald-700 font-black py-3.5 rounded-xl transition-colors shadow-md text-base">
                    {userInitials ? `${userInitials} · ` : ''}Личный кабинет
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-2 pt-1">
                  <Link href={`/login${lang !== 'ru' ? `?lang=${lang}` : ''}`} onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center text-base font-semibold text-emerald-100 hover:text-white py-3 rounded-xl hover:bg-white/10 transition-colors">
                    {tx.nav.login}
                  </Link>
                  <Link href={`/register${lang !== 'ru' ? `?lang=${lang}` : ''}`} onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 bg-white hover:bg-emerald-50 text-emerald-700 font-black py-3.5 rounded-xl transition-colors shadow-md text-base">
                    {tx.nav.start} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0a2218] min-h-[500px] lg:min-h-[600px]">
        {/* Desktop background */}
        <Image src="/screens/hero-desktop.png" alt="" fill sizes="100vw"
          className="object-cover object-center hidden lg:block" priority />
        {/* Mobile background */}
        <Image src="/screens/hero-mobile.png" alt="" fill sizes="100vw"
          className="object-cover object-center block lg:hidden" priority />
        {/* Gradient overlay — ensures text legibility on left (desktop) / top (mobile) */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a2218]/85 via-[#0a2218]/40 to-transparent hidden lg:block pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a2218]/80 via-[#0a2218]/30 to-transparent block lg:hidden pointer-events-none" />
        {/* Content */}
        <div className="relative pt-14 pb-20 lg:pt-20 lg:pb-32">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="lg:max-w-[52%]">
              <div className="inline-flex items-center gap-2 bg-white/10 text-emerald-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-7 border border-white/15">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                {tx.hero.badge}
              </div>
              <h1 className="text-[1.7rem] sm:text-[2.1rem] lg:text-[2.5rem] font-black leading-[1.08] tracking-tight text-white mb-5" style={{ letterSpacing: '-.03em' }}>
                {tx.hero.h1[0]}<br />
                {tx.hero.h1[1]}<br />
                <span className="text-emerald-400">{tx.hero.h1[2]}</span>
              </h1>
              <p className="text-base text-white/70 leading-relaxed mb-8 max-w-md">{tx.hero.sub}</p>
              <div className="flex flex-wrap items-center gap-3">
                <Link href={`/register${lang !== 'ru' ? `?lang=${lang}` : ''}`} className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-[15px] px-6 py-3.5 rounded-xl transition-colors shadow-lg shadow-black/30">
                  {tx.hero.cta} <ArrowRight className="w-4 h-4" />
                </Link>
                <a href="#how" className="inline-flex items-center gap-1.5 text-white/60 hover:text-white font-medium text-sm px-4 py-3.5 transition-colors">
                  {tx.hero.cta2} <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Audience Cases ──────────────────────────────────────────────────── */}
      <section id="how" className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 bg-emerald-100 rounded-full px-4 py-1.5 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-widest">{audience.tag}</span>
            </span>
            <h2 className="text-[2rem] sm:text-[2.6rem] font-black tracking-tight text-gray-900 mb-3" style={{ letterSpacing: '-.03em' }}>{audience.h2}</h2>
            <p className="text-gray-400 text-base max-w-lg mx-auto">{audience.sub}</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {audience.cases.map((c, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-7 flex flex-col group hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center mb-5 shrink-0">
                  <span className="text-[11px] font-black text-emerald-600">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">{c.tag}</div>
                <h3 className="font-black text-[17px] text-gray-900 leading-snug mb-3">{c.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed flex-1 mb-6">{c.desc}</p>
                <a href={c.href} className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                  {c.cta} <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live section — dark ─────────────────────────────────────────────── */}
      <section className="bg-[#030712] py-20 lg:py-28 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            {/* Text */}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <Image src="/logo-white.png" alt="Tournable" width={36} height={36} className="w-8 h-8 object-contain rounded-lg" />
                <span className="font-black text-white text-base tracking-tight">TOURNABLE</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold px-3 py-1.5 rounded-full mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                {tx.live.badge}
              </div>
              <h2 className="text-[2rem] sm:text-[2.6rem] font-black text-white leading-[1.08] tracking-tight mb-5" style={{ letterSpacing: '-.03em' }}>
                {tx.live.h2[0]}<br /><span className="text-emerald-400">{tx.live.h2[1]}</span>
              </h2>
              <p className="text-gray-400 text-base leading-relaxed mb-7">{tx.live.sub}</p>
              <ul className="space-y-3.5">
                {tx.live.items.map(item => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mt-0.5 shrink-0">
                      <Check className="w-3 h-3 text-emerald-400" />
                    </div>
                    <span className="text-sm text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Real LED photo */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-2xl" style={{ background: 'radial-gradient(ellipse at center, rgba(5,150,105,.15) 0%, transparent 70%)' }} />
              <Image
                src="/screens/led.png"
                alt="Tournable LIVE — онлайн-табло"
                width={900} height={600}
                className="w-full rounded-2xl shadow-2xl shadow-black/50"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats / phone section ────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            {/* Real phone photo */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <div className="absolute -inset-6 bg-emerald-50 rounded-3xl -z-10" />
                <Image
                  src="/screens/phone.png"
                  alt="Tournable — таблица бомбардиров"
                  width={400} height={700}
                  className="w-64 sm:w-72 rounded-2xl shadow-2xl shadow-gray-300/60"
                />
              </div>
            </div>
            {/* Text */}
            <div>
              <h2 className="text-[2rem] sm:text-[2.6rem] font-black tracking-tight leading-[1.08] mb-5" style={{ letterSpacing: '-.03em' }}>
                {tx.stats.h2[0]}<br /><span className="text-emerald-600">{tx.stats.h2[1]}</span>
              </h2>
              <p className="text-gray-500 text-base leading-relaxed mb-7">{tx.stats.sub}</p>
              <ul className="space-y-3">
                {tx.stats.items.map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />{item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 lg:py-32 bg-[#030712]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">{tx.features.tag}</span>
            </span>
            <h2
              className="text-[2.4rem] sm:text-[3.2rem] font-black text-white mb-5 whitespace-pre-line"
              style={{ letterSpacing: '-.04em', lineHeight: 1.1 }}
            >{tx.features.h2}</h2>
            <p className="text-gray-400 text-base max-w-lg mx-auto leading-relaxed">{tx.features.sub}</p>
          </div>

          {/* Cards: scroll on mobile, 3-col grid on sm+ */}
          <div className="-mx-4 sm:mx-0">
            <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-5 overflow-x-auto sm:overflow-visible snap-x snap-mandatory sm:snap-none px-4 sm:px-0 pb-4 sm:pb-0">
              {tx.features.items.map((feat, i) => {
                const Icon = FEAT_ICONS[i]
                const s = FEAT_STYLES[i]
                return (
                  <div key={i} className="snap-start shrink-0 w-[78vw] sm:w-auto sm:shrink relative bg-white/[0.03] border border-white/[0.07] rounded-2xl p-7 flex flex-col hover:bg-white/[0.06] hover:border-white/[0.15] hover:-translate-y-1.5 transition-all duration-300 group overflow-hidden cursor-default">
                    {/* Number watermark */}
                    <span
                      className="absolute -top-2 right-4 font-black text-white/[0.05] select-none"
                      style={{ fontSize: '5rem', letterSpacing: '-.04em', lineHeight: 1 }}
                    >{String(i + 1).padStart(2, '0')}</span>
                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-2xl ${s.bg} flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300 shrink-0`}>
                      <Icon className={`w-7 h-7 ${s.icon}`} />
                    </div>
                    {/* Text */}
                    <h3 className="font-black text-[17px] sm:text-lg text-white leading-snug mb-3">{feat.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed flex-1">{feat.desc}</p>
                    {/* Bottom accent */}
                    <div className={`mt-6 h-[2px] w-8 rounded-full ${s.accent} group-hover:w-14 transition-all duration-500`} />
                  </div>
                )
              })}
            </div>
            {/* Scroll dots — mobile only */}
            <div className="flex justify-center gap-1.5 mt-5 sm:hidden">
              {tx.features.items.map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-emerald-400' : 'bg-white/20'}`} />
              ))}
            </div>
          </div>

          {/* Sports compatibility row */}
          <div className="mt-14 border-t border-white/[0.06] pt-10 text-center">
            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-5">{tx.features.sportsLabel}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {tx.features.sports.map((sport) => (
                <span key={sport} className="text-xs text-gray-500 bg-white/[0.04] border border-white/[0.08] rounded-full px-4 py-1.5 font-medium">{sport}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────────── */}
      <section id="pricing" className="bg-gray-50 py-24 lg:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-[2rem] sm:text-[2.4rem] font-black tracking-tight mb-3" style={{ letterSpacing: '-.03em' }}>{tx.pricing.h2}</h2>
            <p className="text-gray-400 text-base">{tx.pricing.sub}</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5 items-start">
            {/* ── Free ── */}
            <div className="bg-white border border-gray-200 rounded-3xl p-7 flex flex-col">
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-[.12em] mb-3">{tx.pricing.free.name}</div>
              <div className="mb-2">
                <span className="text-5xl font-black text-gray-900 tracking-tight">{tx.pricing.free.price}</span>
              </div>
              <span className="inline-block text-xs font-semibold text-gray-500 bg-gray-100 rounded-lg px-3 py-1.5 mb-7 self-start">{tx.pricing.free.limit}</span>
              {/* Active */}
              <ul className="space-y-2.5 mb-3">
                {tx.pricing.freeFeatures.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />{f}
                  </li>
                ))}
              </ul>
              {/* Locked (Pro only) */}
              <div className="border-t border-gray-100 pt-3 mb-8 space-y-2">
                {tx.pricing.proFeatures.map(f => (
                  <div key={f} className="flex items-start gap-2.5 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-gray-200 mt-0.5 shrink-0" />{f}
                  </div>
                ))}
              </div>
              <Link href="/register" className="block text-center bg-gray-900 hover:bg-gray-700 text-white font-bold py-3.5 rounded-2xl transition-colors">
                {tx.pricing.free.cta}
              </Link>
            </div>

            {/* ── Pro ── */}
            <div className="relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap">
                <span className="bg-emerald-950 text-emerald-200 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                  {tx.pricing.pro.badge}
                </span>
              </div>
              <div className="relative rounded-3xl p-7 flex flex-col overflow-hidden" style={{ background: 'linear-gradient(145deg,#047857 0%,#059669 60%,#10b981 100%)' }}>
                <div className="absolute inset-0 pointer-events-none opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                <div className="relative z-10 flex flex-col">
                  <div className="text-[10px] font-black text-emerald-300 uppercase tracking-[.12em] mb-3">{tx.pricing.pro.name}</div>
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-4xl font-black text-white tracking-tight">{tx.pricing.pro.monthly}</span>
                    <span className="text-sm text-emerald-200 font-medium">{tx.pricing.pro.monthlyPer}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-px flex-1 bg-emerald-400/30" />
                    <span className="text-xs text-emerald-300 font-medium whitespace-nowrap">{lang === 'en' ? 'or' : lang === 'kz' ? 'немесе' : 'или'}</span>
                    <div className="h-px flex-1 bg-emerald-400/30" />
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-2xl font-black text-white tracking-tight">{tx.pricing.pro.annualMonthly}</span>
                    <span className="text-xs text-emerald-200">{tx.pricing.pro.monthlyPer}</span>
                    <span className="text-xs text-emerald-300 ml-1">({tx.pricing.pro.annual}{tx.pricing.pro.annualPer})</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 self-start bg-emerald-950/40 rounded-xl px-3 py-1.5 mb-5">
                    <Star className="w-3 h-3 text-yellow-400" fill="currentColor" />
                    <span className="text-xs font-bold text-emerald-100">{tx.pricing.pro.discount}</span>
                  </div>
                  {/* Active: include label + pro features */}
                  <ul className="space-y-2.5 mb-3">
                    <li className="flex items-start gap-2.5 text-sm font-semibold text-emerald-200">
                      <Check className="w-4 h-4 text-emerald-300 mt-0.5 shrink-0" />{tx.pricing.pro.includeLabel}
                    </li>
                    {tx.pricing.proFeatures.map(f => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <Check className="w-4 h-4 text-emerald-300 mt-0.5 shrink-0" />
                        <span className="text-emerald-50">{f}</span>
                      </li>
                    ))}
                  </ul>
                  {/* Locked (Enterprise) */}
                  <div className="border-t border-emerald-400/20 pt-3 mb-8 space-y-2">
                    {tx.pricing.enterpriseFeatures.map(f => (
                      <div key={f} className="flex items-start gap-2.5 text-sm text-emerald-300/35">
                        <Check className="w-4 h-4 text-emerald-300/25 mt-0.5 shrink-0" />{f}
                      </div>
                    ))}
                  </div>
                  <Link href="/register?plan=pro" className="block text-center bg-white text-emerald-700 hover:bg-emerald-50 font-black py-3.5 rounded-2xl transition-colors shadow-xl shadow-black/20">
                    {tx.pricing.pro.cta}
                  </Link>
                </div>
              </div>
            </div>

            {/* ── Enterprise ── */}
            <div className="bg-white border-2 border-purple-200 rounded-3xl p-7 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl" style={{ background: 'linear-gradient(90deg,#7c3aed,#a855f7)' }} />
              <div className="text-[10px] font-black text-purple-500 uppercase tracking-[.12em] mb-3">{tx.pricing.enterprise.name}</div>
              <div className="mb-1">
                <span className="text-2xl font-black text-gray-900 tracking-tight">{tx.pricing.enterprise.price}</span>
              </div>
              <p className="text-sm text-gray-400 mb-6 mt-1">{tx.pricing.enterprise.sub}</p>
              <ul className="space-y-2.5 mb-8 flex-1">
                <li className="flex items-start gap-2.5 text-sm font-semibold text-gray-700">
                  <Check className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />{tx.pricing.enterprise.includeLabel}
                </li>
                {tx.pricing.enterpriseFeatures.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <a
                href="https://wa.me/message/YHLE2IFII4MSJ1"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center font-black py-3.5 rounded-2xl transition-colors text-white"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}
              >
                {tx.pricing.enterprise.cta}
              </a>
            </div>
          </div>

          <p className="text-center mt-8 text-sm text-gray-400">
            {tx.pricing.more}
            <a href="#contact" className="text-emerald-600 font-semibold hover:underline">{tx.pricing.moreLink}</a>
          </p>
        </div>
      </section>

      {/* ── Additional Services ──────────────────────────────────────────────── */}
      <section className="py-24 lg:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-[2rem] sm:text-[2.5rem] font-black tracking-tight mb-4" style={{ letterSpacing: '-.03em' }}>{tx.services.h2}</h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">{tx.services.sub}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {tx.services.items.map((svc) => (
              <div key={svc.title} className="relative group bg-white border border-gray-100 rounded-3xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden">
                {/* Subtle bg gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/40 to-transparent pointer-events-none" />
                {svc.badge && (
                  <span className="absolute top-5 right-5 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest bg-blue-100 text-blue-600">{svc.badge}</span>
                )}
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 bg-emerald-50">
                    {svc.icon === 'video'
                      ? <Video className="w-6 h-6 text-blue-500" />
                      : <Trophy className="w-6 h-6 text-emerald-600" />}
                  </div>
                  <h3 className="font-black text-xl text-gray-900 mb-3 leading-tight">{svc.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-6">{svc.desc}</p>
                  {svc.price ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-emerald-600">{svc.price}</span>
                      <span className="text-sm text-gray-400 font-medium">{svc.pricePer}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-blue-500 font-semibold">{svc.badge}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ─────────────────────────────────────────────────────────── */}
      <section id="contact" className="py-20 lg:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-[2rem] sm:text-[2.5rem] font-black tracking-tight mb-4" style={{ letterSpacing: '-.03em' }}>{tx.contact.h2}</h2>
            <p className="text-gray-400 text-lg">{tx.contact.sub}</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {/* WhatsApp card */}
            <a href="https://wa.me/message/YHLE2IFII4MSJ1" target="_blank" rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-3xl p-8 flex flex-col gap-6 transition-all hover:scale-[1.02] hover:shadow-2xl"
              style={{ background: 'linear-gradient(135deg,#128C7E 0%,#25D366 100%)', boxShadow: '0 8px 40px rgba(37,211,102,.2)' }}>
              <div className="absolute inset-0 pointer-events-none opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
              <div className="relative z-10 flex-1">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <IconWhatsApp className="w-8 h-8 text-white" />
                </div>
                <div className="font-black text-2xl text-white">WhatsApp</div>
              </div>
              <div className="relative z-10 inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors self-start">
                {tx.contact.wa} <ArrowRight className="w-4 h-4" />
              </div>
            </a>

            {/* Phone card */}
            <a href="tel:+77064092021"
              className="group relative overflow-hidden bg-gray-900 rounded-3xl p-8 flex flex-col gap-6 transition-all hover:scale-[1.02] hover:shadow-2xl hover:bg-gray-800">
              <div className="absolute inset-0 pointer-events-none opacity-5" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
              <div className="relative z-10 flex-1">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Phone className="w-7 h-7 text-emerald-400" />
                </div>
                <div className="font-black text-2xl text-white">{lang === 'en' ? 'Call us' : lang === 'kz' ? 'Қоңырау шалу' : 'Позвонить'}</div>
              </div>
              <div className="relative z-10 inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors self-start">
                {tx.contact.phone} <ArrowRight className="w-4 h-4" />
              </div>
            </a>
          </div>

          {/* Email line */}
          <p className="text-center mt-8 text-sm text-gray-400">
            {lang === 'en' ? 'Or write to us by email:' : lang === 'kz' ? 'Немесе электронды поштамен жазыңыз:' : 'Или напишите на почту:'}{' '}
            <a href="mailto:hello@tournable.app" className="text-emerald-600 font-semibold hover:underline">hello@tournable.app</a>
          </p>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#047857 0%,#059669 50%,#10b981 100%)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,.07) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 py-24 text-center">
          <h2 className="text-[2rem] sm:text-[2.5rem] font-black text-white mb-4 tracking-tight" style={{ letterSpacing: '-.03em' }}>{tx.cta.h2}</h2>
          <p className="text-emerald-100 text-lg mb-10">{tx.cta.sub}</p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 font-black px-10 py-4 rounded-2xl transition-colors text-base shadow-2xl shadow-black/20">
            {tx.cta.btn} <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="bg-gray-950 text-gray-400">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">

            {/* Brand */}
            <div className="lg:col-span-1">
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <Image src="/logo-white.png" alt="Tournable" width={36} height={36} className="w-9 h-9 object-contain rounded-xl" />
                <span className="font-black text-white text-lg tracking-tight">TOURNABLE</span>
              </Link>
              <p className="text-sm leading-relaxed text-gray-500 mb-6">{tx.footer.tagline}</p>
              <div className="flex items-center gap-3">
                {[
                  { href: 'https://instagram.com/tournable_app', Icon: IconInstagram },
                  { href: 'https://tiktok.com/@tournable', Icon: IconTikTok },
                  { href: 'https://t.me/tournable', Icon: IconTelegram },
                ].map(({ href, Icon }) => (
                  <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors">
                    <Icon className="w-4 h-4 text-gray-400" />
                  </a>
                ))}
                <a href="mailto:hello@tournable.app" className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-xs font-black text-white mb-5 uppercase tracking-widest">{tx.footer.cols.product}</h4>
              <ul className="space-y-3">
                {([['#features', tx.footer.links.features], ['#pricing', tx.footer.links.pricing], ['#contact', tx.footer.links.contact]] as [string,string][]).map(([href, label]) => (
                  <li key={href}><a href={href} className="text-sm text-gray-500 hover:text-white transition-colors">{label}</a></li>
                ))}
              </ul>
            </div>

            {/* Platform */}
            <div>
              <h4 className="text-xs font-black text-white mb-5 uppercase tracking-widest">{tx.footer.cols.platform}</h4>
              <ul className="space-y-3">
                {([['/login', tx.footer.links.login], ['/register', tx.footer.links.register], ['/register?plan=pro', tx.footer.links.pro]] as [string,string][]).map(([href, label]) => (
                  <li key={href}><Link href={href} className="text-sm text-gray-500 hover:text-white transition-colors">{label}</Link></li>
                ))}
              </ul>
            </div>

            {/* Connect */}
            <div>
              <h4 className="text-xs font-black text-white mb-5 uppercase tracking-widest">{tx.footer.cols.connect}</h4>
              <ul className="space-y-3">
                <li><a href="https://wa.me/message/YHLE2IFII4MSJ1" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-white transition-colors flex items-center gap-2"><IconWhatsApp className="w-3.5 h-3.5" />WhatsApp</a></li>
                <li><a href="tel:+77064092021" className="text-sm text-gray-500 hover:text-white transition-colors flex items-center gap-2"><Phone className="w-3.5 h-3.5" />+7 (706) 409-20-21</a></li>
                <li><a href="mailto:hello@tournable.app" className="text-sm text-gray-500 hover:text-white transition-colors">hello@tournable.app</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-600">{tx.footer.legal}</p>
            <div className="flex items-center gap-6 text-xs text-gray-600">
              <Link href="/privacy" className="hover:text-gray-400 transition-colors">{tx.footer.privacy}</Link>
              <Link href="/terms" className="hover:text-gray-400 transition-colors">{tx.footer.terms}</Link>
            </div>
          </div>
        </div>
      </footer>

      <SupportWidget lang={lang} />
    </div>
  )
}

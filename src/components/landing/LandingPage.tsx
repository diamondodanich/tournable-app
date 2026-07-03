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
    nav: { features: 'Возможности', pricing: 'Тарифы', contact: 'Контакты', login: 'Войти', start: 'Начать бесплатно', dashboard: 'Все турниры', account: 'Личный кабинет', accountTitle: 'Личный кабинет', menu: 'Меню' },
    hero: {
      badge: 'Соревнования любого масштаба — от двора до федерации',
      h1: ['Счёт у всех — онлайн.', 'Статистика считается сама.', 'Турнир — меньше 1 минуты.'],
      sub: 'Создайте расписание, поделитесь ссылкой — и живая страница вашего турнира уже у каждого участника. Счёт, таблица, плей-офф и лучшие игроки считаются сами. Вы просто ведёте игру.',
      cta: 'Создать турнир бесплатно', cta2: 'Как это работает',
      proof: [['1 турнир бесплатно', 'все функции включены'], ['Готово', 'за 2 минуты'], ['Живая ссылка', 'без приложений']],
    },
    live: {
      badge: 'Live-табло',
      h2: ['Живой счёт —', 'на любом экране.'],
      sub: 'Запустите Live-режим до матча — счёт, голы и карточки мгновенно появляются на экране у каждого зрителя. Проецируйте на телевизор или большой экран. Без приложений, без регистрации, без задержки.',
      items: [
        'Таймер в реальном времени — накопленное время, пауза, дополнительное',
        'События матча мгновенно появляются у всех зрителей',
        'Полноэкранный режим — проецируйте на телевизор или LED-экран',
        'Достаточно одной ссылки — команды и болельщики следят без регистрации',
      ],
      imgAlt: 'Tournable LIVE — онлайн-табло',
    },
    stats: {
      h2: ['Конец ручному счёту.', 'Всё считается само.'],
      sub: 'После каждого результата статистика пересчитывается мгновенно, а любые итоги скачиваются в один клик — от полного отчёта турнира до отдельной таблицы.',
      items: [
        'Полный брендированный отчёт турнира — одним файлом PDF',
        'Частичные выгрузки: таблица, сетка, лидеры — PNG для чата и соцсетей',
        'Очки, разница, дисциплина — считаются сами после каждого матча',
        'Живой рейтинг результативности и матрица встреч',
      ],
      imgAlt: 'Tournable — статистика и отчёты турнира',
    },
    features: {
      tag: 'Возможности',
      h2: 'Всё для турнира.\nУже внутри.',
      sub: 'То, что раньше занимало вечер — теперь занимает минуту.',
      items: [
        { title: 'Турнир за минуту, а не за вечер', desc: 'Формат, команды — готово: расписание, сетка и таблица создаются сами. Круговой, плей-офф, группы, лига.' },
        { title: 'Live-табло на любом экране', desc: 'Счёт, таймер и события матча — в реальном времени у каждого зрителя. Проецируйте на телевизор: выглядит как трансляция.' },
        { title: 'Честный жребий по силе команд', desc: 'Оцените силу участников — платформа разведёт фаворитов по разным группам и частям сетки.' },
        { title: 'Статистика без калькулятора', desc: 'Очки, разница, форма команд, лидеры результативности, матрица встреч — всё считается само.' },
        { title: 'Отчёты, которые не стыдно печатать', desc: 'Полный брендированный PDF-отчёт или отдельные таблицы в PNG — одним кликом, для печати и соцсетей.' },
        { title: 'Одна ссылка вместо ста сообщений', desc: 'Публичная страница турнира: участники и болельщики следят без регистрации и приложений.' },
      ],
      sportsLabel: 'Работает для любого вида спорта',
      sports: ['Футбол', 'Мини-футбол', 'Баскетбол', 'Волейбол', 'Хоккей', 'Теннис', 'Настольный теннис', 'Бадминтон', 'Шахматы', 'Тогуз-кумалак', 'Киберспорт'],
    },
    pricing: {
      h2: 'Выберите свой формат.',
      sub: 'Начните бесплатно. Масштабируйтесь без ограничений.',
      tabs: { monthly: 'Ежемесячно', annual: 'Ежегодно' },
      annualBadge: '−25%',
      groupLabels: { pro: 'Открывается в PRO', enterprise: 'Только в Enterprise' },
      features: [
        { label: 'Все форматы турниров', free: true, pro: true, enterprise: true },
        { label: 'Автоматизированная статистика', free: true, pro: true, enterprise: true },
        { label: 'Публичная страница турнира', free: true, pro: true, enterprise: true },
        { label: 'Отчёты в PDF и PNG', free: true, pro: true, enterprise: true },
        { label: 'LIVE-режим с табло', free: true, pro: true, enterprise: true },
        { label: 'Неограниченное количество турниров и команд', free: false, pro: true, enterprise: true },
        { label: 'Брендированные отчёты', free: false, pro: true, enterprise: true },
        { label: 'Добавление соредакторов', free: false, pro: true, enterprise: true },
        { label: 'Приоритетная поддержка', free: false, pro: true, enterprise: true },
        { label: 'Чемпионаты с сезонами', free: false, pro: false, enterprise: true },
        { label: 'Углублённая статистика и аналитика', free: false, pro: false, enterprise: true },
        { label: 'Профили команд и игроков', free: false, pro: false, enterprise: true },
        { label: 'Составы к матчам', free: false, pro: false, enterprise: true },
        { label: 'Доступность в поисковых системах', free: false, pro: false, enterprise: true },
      ],
      free: {
        name: 'Старт',
        priceMonthly: '0 ₸',
        limit: '1 турнир · до 16 команд',
        cta: 'Начать бесплатно',
      },
      pro: {
        name: 'PRO', badge: 'Выбор организаторов',
        priceMonthly: '4 990 ₸', perMonthly: '/ мес',
        priceAnnual: '44 990 ₸', perAnnual: '/ год',
        priceOriginalAnnual: 'Вместо 59 880 ₸', savingAnnual: 'Экономия 14 890 ₸',
        cta: 'Перейти на PRO',
      },
      enterprise: {
        name: 'Enterprise', badge: 'Для федераций и лиг', sub: 'Полный функционал платформы',
        priceMonthly: 'от 39 990 ₸', perMonthly: '/ мес',
        priceAnnual: '349 990 ₸', perAnnual: '/ год',
        priceOriginalAnnual: 'Вместо 479 880 ₸', savingAnnual: 'Экономия 129 890 ₸',
        cta: 'Подключить Enterprise',
      },
    },
    services: {
      h2: 'Мы берём на себя всё',
      sub: 'Хотите полностью делегировать? Наши специалисты выедут к вам и возьмут технику в свои руки.',
      items: [
        { icon: 'video', title: 'Профессиональная видеосъёмка', desc: 'Наша команда приедет на турнир и профессионально снимет каждый матч. Видеозаписи появятся в вашем аккаунте автоматически.', price: null, pricePer: null, badge: 'Скоро', badgeColor: 'blue' },
        { icon: 'trophy', title: 'Оператор на турнир', desc: 'Наш специалист приедет и возьмёт на себя все результаты — вводит матчи прямо в платформу в реальном времени. Вы ведёте игру — мы за экраном.', price: '19 990 ₸', pricePer: 'в день', badge: null, badgeColor: null },
      ],
      cta: 'Оставить заявку',
      waMessage: 'Здравствуйте! Хочу заказать услугу для турнира.',
    },
    contact: { h2: 'Есть вопрос? Пишите.', sub: 'Отвечаем быстро — обычно в течение часа.', wa: 'Написать в WhatsApp', phone: '+7 (706) 409-20-21', callUs: 'Позвонить', orEmail: 'Или напишите на почту:' },
    cta: { h2: 'Ваш следующий турнир — уже сегодня.', sub: 'Минута на регистрацию. Турнир готов. Участники в шоке от уровня.', btn: 'Начать бесплатно' },
    footer: {
      tagline: 'Создайте первый турнир меньше 1 минуты. Статистика, Live-табло и плей-офф — всё считается само.',
      cols: { product: 'Продукт', platform: 'Платформа', connect: 'Связь' },
      links: { features: 'Возможности', pricing: 'Тарифы', contact: 'Контакты', login: 'Войти', register: 'Регистрация', pro: 'Тариф PRO' },
      legal: '© 2026 Tournable. Все права защищены.',
      privacy: 'Политика конфиденциальности', terms: 'Пользовательское соглашение',
    },
  },

  kz: {
    label: 'KZ',
    nav: { features: 'Мүмкіндіктер', pricing: 'Тарифтер', contact: 'Байланыс', login: 'Кіру', start: 'Тегін бастау', dashboard: 'Барлық турнирлер', account: 'Жеке кабинет', accountTitle: 'Жеке кабинет', menu: 'Мәзір' },
    hero: {
      badge: 'Кез келген деңгейдегі жарыстар — ауладан федерацияға дейін',
      h1: ['Есеп барлығында — онлайн.', 'Статистика өздігінен есептеледі.', 'Турнир — 1 минуттан аз.'],
      sub: 'Кесте жасаңыз, сілтемемен бөлісіңіз — және турниріңіздің тірі беті әрбір қатысушыда. Есеп, кесте, плей-офф және үздік ойыншылар өздігінен есептеледі. Сіз тек турнирді өткізесіз.',
      cta: 'Турнирді тегін жасау', cta2: 'Қалай жұмыс істейді',
      proof: [['1 турнир тегін', 'барлық мүмкіндіктер'], ['Дайын', '2 минутта'], ['Тірі сілтеме', 'қосымшасыз']],
    },
    live: {
      badge: 'Live-тақта',
      h2: ['Тірі есеп —', 'кез келген экранда.'],
      sub: 'Live-режимді матчқа дейін іске қосыңыз — есеп, голдар мен карточкалар барлық тамашалаушылардың экранында лезде пайда болады. Теледидарға немесе экранға проекциялаңыз. Қосымшасыз, тіркелусіз, кешіктірусіз.',
      items: [
        'Нақты уақытта таймер — жинақталған уақыт, үзіліс, қосымша уақыт',
        'Матч оқиғалары барлық тамашалаушыларға лезде жетеді',
        'Толық экран режимі — теледидарда немесе LED-экранда проекциялаңыз',
        'Бір сілтеме жеткілікті — тіркелмей қарай алады',
      ],
      imgAlt: 'Tournable LIVE — онлайн-табло',
    },
    stats: {
      h2: ['Қолмен есептеу артта қалды.', 'Бәрі өздігінен есептеледі.'],
      sub: 'Әр нәтижеден кейін статистика лезде қайта есептеледі, ал кез келген қорытынды бір шертумен жүктеледі — толық турнир есебінен жеке кестеге дейін.',
      items: [
        'Толық брендтелген турнир есебі — бір PDF файлмен',
        'Жеке жүктеулер: кесте, тор, үздіктер — чат пен әлеуметтік желіге PNG',
        'Ұпайлар, айырма, тәртіп — әр матчтан кейін өздігінен есептеледі',
        'Нәтижелілік рейтингі мен кездесулер матрицасы — тірі күйде',
      ],
      imgAlt: 'Tournable — турнир статистикасы мен есептері',
    },
    features: {
      tag: 'Мүмкіндіктер',
      h2: 'Турнир үшін бәрі.\nДайын күйде.',
      sub: 'Бұрын кешке алатын нәрсе — енді бір минутта.',
      items: [
        { title: 'Турнир — кешке емес, бір минутқа', desc: 'Формат, командалар — дайын: кесте, тор және таблица өздігінен жасалады. Дөңгелек, плей-офф, топтар, лига.' },
        { title: 'Кез келген экрандағы Live-тақта', desc: 'Есеп, таймер және матч оқиғалары — әр көрерменде нақты уақытта. Теледидарға шығарыңыз: трансляция сияқты көрінеді.' },
        { title: 'Командалар күшіне қарай әділ жеребе', desc: 'Қатысушылардың күшін бағалаңыз — платформа фавориттерді әртүрлі топтар мен тордың бөліктеріне бөледі.' },
        { title: 'Калькуляторсыз статистика', desc: 'Ұпайлар, айырма, командалар формасы, нәтижелілік көшбасшылары, кездесулер матрицасы — бәрі өздігінен есептеледі.' },
        { title: 'Басып шығаруға ұят емес есептер', desc: 'Толық брендтелген PDF-есеп немесе жеке кестелер PNG форматында — бір шертумен, баспаға және әлеуметтік желіге.' },
        { title: 'Жүз хабарламаның орнына бір сілтеме', desc: 'Турнирдің жалпыға ортақ беті: қатысушылар мен жанкүйерлер тіркелусіз және қосымшасыз қадағалайды.' },
      ],
      sportsLabel: 'Кез келген спорт түріне жарайды',
      sports: ['Футбол', 'Мини-футбол', 'Баскетбол', 'Волейбол', 'Хоккей', 'Теннис', 'Үстел тенисі', 'Бадминтон', 'Шахмат', 'Тоғызқұмалақ', 'Киберспорт'],
    },
    pricing: {
      h2: 'Өз форматыңызды таңдаңыз.',
      sub: 'Тегін бастаңыз. Шектеусіз масштабтаңыз.',
      tabs: { monthly: 'Ай сайын', annual: 'Жыл сайын' },
      annualBadge: '−25%',
      groupLabels: { pro: 'PRO-да ашылады', enterprise: 'Тек Enterprise-те' },
      features: [
        { label: 'Барлық турнир форматтары', free: true, pro: true, enterprise: true },
        { label: 'Автоматтандырылған статистика', free: true, pro: true, enterprise: true },
        { label: 'Турнирдің жалпыға ортақ беті', free: true, pro: true, enterprise: true },
        { label: 'PDF және PNG есептері', free: true, pro: true, enterprise: true },
        { label: 'LIVE-режим тақтасы', free: true, pro: true, enterprise: true },
        { label: 'Турнирлер мен командалар — шексіз', free: false, pro: true, enterprise: true },
        { label: 'Брендтелген есептер', free: false, pro: true, enterprise: true },
        { label: 'Соредакторларды қосу', free: false, pro: true, enterprise: true },
        { label: 'Басым қолдау', free: false, pro: true, enterprise: true },
        { label: 'Маусымдары бар чемпионаттар', free: false, pro: false, enterprise: true },
        { label: 'Тереңдетілген статистика және аналитика', free: false, pro: false, enterprise: true },
        { label: 'Команда мен ойыншы профильдері', free: false, pro: false, enterprise: true },
        { label: 'Матчқа арналған құрамдар', free: false, pro: false, enterprise: true },
        { label: 'Іздеу жүйелерінде қолжетімділік', free: false, pro: false, enterprise: true },
      ],
      free: {
        name: 'Старт',
        priceMonthly: '0 ₸',
        limit: '1 турнир · 16 командаға дейін',
        cta: 'Тегін бастау',
      },
      pro: {
        name: 'PRO', badge: 'Ұйымдастырушылардың таңдауы',
        priceMonthly: '4 990 ₸', perMonthly: '/ ай',
        priceAnnual: '44 990 ₸', perAnnual: '/ жыл',
        priceOriginalAnnual: 'Орнына 59 880 ₸', savingAnnual: '14 890 ₸ үнемдеу',
        cta: 'PRO-ға өту',
      },
      enterprise: {
        name: 'Enterprise', badge: 'Федерациялар мен лигалар үшін', sub: 'Платформаның толық мүмкіндіктері',
        priceMonthly: '39 990 ₸-дан', perMonthly: '/ ай',
        priceAnnual: '349 990 ₸', perAnnual: '/ жыл',
        priceOriginalAnnual: 'Орнына 479 880 ₸', savingAnnual: '129 890 ₸ үнемдеу',
        cta: 'ҚОСУ',
      },
    },
    services: {
      h2: 'Барлығын біз аламыз',
      sub: 'Толықтай тапсырғыңыз келе ме? Мамандарымыз сізге барып, техниканы өз қолдарына алады.',
      items: [
        { icon: 'video', title: 'Кәсіби бейнетүсіру', desc: 'Командамыз турнирге келіп, алаңдағы әр матчты кәсіби түрде түсіреді. Бейнежазбалар аккаунтыңызда автоматты пайда болады.', price: null, pricePer: null, badge: 'Жақында', badgeColor: 'blue' },
        { icon: 'trophy', title: 'Турниріңізге оператор', desc: 'Маманымыз келіп, барлық матч нәтижелерін тікелей платформаға нақты уақытта енгізеді. Сіз ойынды жүргізесіз — біз экран алдындамыз.', price: '19 990 ₸', pricePer: 'күніне', badge: null, badgeColor: null },
      ],
      cta: 'Өтінім қалдыру',
      waMessage: 'Сәлеметсіз бе! Турнирге қызмет тапсырыс бергім келеді.',
    },
    contact: { h2: 'Сұрағыңыз бар ма? Жазыңыз.', sub: 'Жылдам жауап береміз — әдетте бір сағат ішінде.', wa: 'WhatsApp-қа жазу', phone: '+7 (706) 409-20-21', callUs: 'Қоңырау шалу', orEmail: 'Немесе электронды поштамен жазыңыз:' },
    cta: { h2: 'Келесі турниріңіз — бүгін.', sub: 'Тіркелу — бір минут. Турнир дайын. Қатысушылар деңгейден таң қалады.', btn: 'Тегін бастау' },
    footer: {
      tagline: 'Алғашқы турнирді 1 минуттан аз уақытта жасаңыз. Статистика, Live-тақта және плей-офф — бәрі автоматты.',
      cols: { product: 'Өнім', platform: 'Платформа', connect: 'Байланыс' },
      links: { features: 'Мүмкіндіктер', pricing: 'Тарифтер', contact: 'Байланыс', login: 'Кіру', register: 'Тіркелу', pro: 'PRO тарифі' },
      legal: '© 2026 Tournable. Барлық құқықтар қорғалған.',
      privacy: 'Құпиялылық саясаты', terms: 'Пайдаланушы келісімі',
    },
  },

  en: {
    label: 'EN',
    nav: { features: 'Features', pricing: 'Pricing', contact: 'Contact', login: 'Sign In', start: 'Start Free', dashboard: 'All tournaments', account: 'Account', accountTitle: 'Account', menu: 'Menu' },
    hero: {
      badge: 'Competitions of any scale — from backyard to federation',
      h1: ['Live scores for everyone.', 'Stats calculate themselves.', 'Tournament in under a minute.'],
      sub: 'Build the schedule, share the link — and every participant instantly has a live tournament page. Scores, standings, playoff and top performers update on their own. You just run the game.',
      cta: 'Create a tournament — free', cta2: 'See how it works',
      proof: [['1 tournament free', 'all features included'], ['Ready', 'in 2 minutes'], ['Live link', 'no app needed']],
    },
    live: {
      badge: 'Live scoreboard',
      h2: ['Live scores —', 'on every screen.'],
      sub: 'Start Live mode before the match — scores, goals and cards appear instantly on every spectator\'s screen. Project onto a TV or big screen. No app, no sign-up, no delay.',
      items: [
        'Real-time match timer — running time, pause, extra time',
        'Match events appear instantly for all spectators',
        'Full-screen mode — project onto a TV or LED display',
        'One link is enough — teams and fans follow without signing up',
      ],
      imgAlt: 'Tournable LIVE — online scoreboard',
    },
    stats: {
      h2: ['No more manual counting.', 'Everything calculates itself.'],
      sub: 'After every result the stats recalculate instantly, and any output is one click away — from a full tournament report to a single table.',
      items: [
        'Full branded tournament report — one PDF file',
        'Partial exports: table, bracket, leaders — PNG for chat and social media',
        'Points, difference, discipline — calculated after every match',
        'Live performance leaders and head-to-head matrix',
      ],
      imgAlt: 'Tournable — tournament stats and reports',
    },
    features: {
      tag: 'Features',
      h2: 'Everything for your tournament.\nAlready inside.',
      sub: 'What used to take an evening now takes a minute.',
      items: [
        { title: 'A tournament in a minute, not an evening', desc: 'Format, teams — done: schedule, bracket and table build themselves. Round-robin, playoff, groups, league.' },
        { title: 'Live scoreboard on any screen', desc: 'Score, timer and match events — in real time for every spectator. Project onto a TV: looks like a broadcast.' },
        { title: 'Fair draw by team strength', desc: 'Rate the participants — the platform spreads the favourites across groups and bracket halves.' },
        { title: 'Statistics without a calculator', desc: 'Points, difference, team form, performance leaders, head-to-head matrix — everything counts itself.' },
        { title: 'Reports you\'re proud to print', desc: 'A full branded PDF report or individual tables as PNG — one click, ready for print and social media.' },
        { title: 'One link instead of a hundred messages', desc: 'A public tournament page: participants and fans follow along with no sign-up and no apps.' },
      ],
      sportsLabel: 'Works for any sport',
      sports: ['Football', 'Futsal', 'Basketball', 'Volleyball', 'Hockey', 'Tennis', 'Table Tennis', 'Badminton', 'Chess', 'Togyzkumalak', 'Esports'],
    },
    pricing: {
      h2: 'Choose your format.',
      sub: 'Start free. Scale without limits.',
      tabs: { monthly: 'Monthly', annual: 'Annual' },
      annualBadge: '−25%',
      groupLabels: { pro: 'Unlocks in PRO', enterprise: 'Enterprise only' },
      features: [
        { label: 'All tournament formats', free: true, pro: true, enterprise: true },
        { label: 'Automated statistics', free: true, pro: true, enterprise: true },
        { label: 'Public tournament page', free: true, pro: true, enterprise: true },
        { label: 'PDF and PNG reports', free: true, pro: true, enterprise: true },
        { label: 'LIVE scoreboard', free: true, pro: true, enterprise: true },
        { label: 'Unlimited tournaments and teams', free: false, pro: true, enterprise: true },
        { label: 'Branded reports', free: false, pro: true, enterprise: true },
        { label: 'Adding co-editors', free: false, pro: true, enterprise: true },
        { label: 'Priority support', free: false, pro: true, enterprise: true },
        { label: 'Championships with seasons', free: false, pro: false, enterprise: true },
        { label: 'Advanced statistics & analytics', free: false, pro: false, enterprise: true },
        { label: 'Team and player profiles', free: false, pro: false, enterprise: true },
        { label: 'Match lineups', free: false, pro: false, enterprise: true },
        { label: 'Search engine visibility', free: false, pro: false, enterprise: true },
      ],
      free: {
        name: 'Starter',
        priceMonthly: '0 ₸',
        limit: '1 tournament · up to 16 teams',
        cta: 'Start free',
      },
      pro: {
        name: 'PRO', badge: 'Organizers\' choice',
        priceMonthly: '4,990 ₸', perMonthly: '/ mo',
        priceAnnual: '44,990 ₸', perAnnual: '/ yr',
        priceOriginalAnnual: 'Instead of 59,880 ₸', savingAnnual: 'Save 14,890 ₸',
        cta: 'Go PRO',
      },
      enterprise: {
        name: 'Enterprise', badge: 'For leagues & federations', sub: 'Full platform capabilities',
        priceMonthly: 'from 39,990 ₸', perMonthly: '/ mo',
        priceAnnual: '349,990 ₸', perAnnual: '/ yr',
        priceOriginalAnnual: 'Instead of 479,880 ₸', savingAnnual: 'Save 129,890 ₸',
        cta: 'Get Enterprise',
      },
    },
    services: {
      h2: 'We handle everything',
      sub: 'Want to fully delegate? Our specialists come to you and take care of all the technical side.',
      items: [
        { icon: 'video', title: 'Professional video recording', desc: 'Our team comes to your tournament and professionally films every match on the pitch. Videos appear in your account automatically.', price: null, pricePer: null, badge: 'Coming Soon', badgeColor: 'blue' },
        { icon: 'trophy', title: 'On-site results operator', desc: 'Our specialist arrives and enters all match results directly into the platform in real time. You run the game — we handle the screen.', price: '19,990 ₸', pricePer: 'per day', badge: null, badgeColor: null },
      ],
      cta: 'Request a callback',
      waMessage: 'Hi! I\'d like to order a service for my tournament.',
    },
    contact: { h2: 'Got a question? Write to us.', sub: 'Fast responses — usually within the hour.', wa: 'Message on WhatsApp', phone: '+7 (706) 409-20-21', callUs: 'Call us', orEmail: 'Or write to us by email:' },
    cta: { h2: 'Your next tournament starts today.', sub: 'One minute to sign up. Tournament ready. Participants blown away by the level.', btn: 'Start for free' },
    footer: {
      tagline: 'Create your first tournament in under a minute. Stats, live scoreboard and playoff — all automated.',
      cols: { product: 'Product', platform: 'Platform', connect: 'Connect' },
      links: { features: 'Features', pricing: 'Pricing', contact: 'Contact', login: 'Sign In', register: 'Sign Up', pro: 'PRO Plan' },
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
      { tag: 'Любительские турниры', title: 'Организуешь турнир среди друзей, команд района или офиса?', desc: 'Создай расписание меньше 1 минуты, поделись ссылкой в чат — участники сами следят за таблицей и счётом. Без Excel, без пересылки скриншотов.', cta: 'Начать бесплатно', href: '/register' },
      { tag: 'Спортивные клубы', title: 'Ведёшь регулярные соревнования внутри клуба?', desc: 'Несколько турниров одновременно, несколько соредакторов, брендированный отчёт в один клик. Статистика по всем сезонам всегда под рукой.', cta: 'Подробнее', href: '#pricing' },
      { tag: 'Федерации и лиги', title: 'Проводишь городской чемпионат или официальную лигу?', desc: 'Постоянная лига с архивом сезонов, профилями команд и игроков, углублённой статистикой и доступностью в поисковых системах. Как у профессиональных лиг — без технической команды.', cta: 'Подробнее', href: '#pricing' },
    ],
  },
  kz: {
    tag: 'Кім үшін',
    h2: 'Tournable — ұйымдастырушы үшін.',
    sub: 'Хобби, клуб немесе федерация — платформа сізге бейімделеді.',
    cases: [
      { tag: 'Хобби турнирлер', title: 'Достар арасында немесе аудандағы командалар турнирін ұйымдастырасың ба?', desc: 'Кестені 1 минуттан аз уақытта жасаңыз, чатқа сілтемені жіберіңіз — қатысушылар кестені және есепті өздері қадағалайды. Excel жоқ, скриншот жіберу жоқ.', cta: 'Тегін бастау', href: '/register' },
      { tag: 'Спорт клубтары', title: 'Клуб ішінде жүйелі жарыстар өткізесің бе?', desc: 'Бірнеше турнир бір уақытта, бірнеше соредактор, брендтелген есеп бір шертумен. Барлық маусымдардың статистикасы әрқашан қолда.', cta: 'Толығырақ', href: '#pricing' },
      { tag: 'Федерациялар мен лигалар', title: 'Қалалық чемпионат немесе ресми лига өткізесің бе?', desc: 'Маусымдары бар тұрақты лига, команда мен ойыншы профильдері, тереңдетілген статистика және іздеу жүйелерінде қолжетімділік — кәсіби лигалар сияқты. Техникалық команда жоқ.', cta: 'Толығырақ', href: '#pricing' },
    ],
  },
  en: {
    tag: 'Who it\'s for',
    h2: 'Tournable is for everyone who organises.',
    sub: 'Amateur, club or federation — the platform adapts to you.',
    cases: [
      { tag: 'Amateur tournaments', title: 'Organising a tournament with friends, your neighbourhood or the office?', desc: 'Build the schedule in under a minute, share the link — participants track standings and scores themselves. No Excel, no screenshot-passing.', cta: 'Start free', href: '/register' },
      { tag: 'Sports clubs', title: 'Running regular competitions within your club?', desc: 'Multiple tournaments at once, multiple co-editors, branded report in one click. Season stats always at hand.', cta: 'Learn more', href: '#pricing' },
      { tag: 'Federations & leagues', title: 'Running a city championship or an official league?', desc: 'Permanent league with season archive, team and player profiles, advanced analytics and search engine visibility — like professional leagues. No technical team needed.', cta: 'Learn more', href: '#pricing' },
    ],
  },
}

// ─── Main component ───────────────────────────────────────────────────────────
export function LandingPage({ isLoggedIn = false, defaultLang = 'ru', userInitials }: { isLoggedIn?: boolean; defaultLang?: Lang; userInitials?: string }) {
  const [lang, setLang] = useState<Lang>(defaultLang)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const [featDot, setFeatDot] = useState(0)
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
                <Link href="/account" className="flex items-center justify-center w-9 h-9 rounded-xl bg-white text-emerald-700 font-black text-sm hover:bg-emerald-50 transition-colors shadow-md" title={tx.nav.accountTitle}>
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
              aria-label={tx.nav.menu}
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
                    {userInitials ? `${userInitials} · ` : ''}{tx.nav.account}
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
      <section className="relative overflow-hidden bg-[#0a2218] min-h-[680px] lg:min-h-[600px]">
        {/* Desktop background */}
        <Image src="/screens/hero-desktop.png" alt="" fill sizes="100vw"
          className="object-contain object-right hidden lg:block" priority />
        {/* Mobile background */}
        <Image src="/screens/hero-mobile.png" alt="" fill sizes="100vw"
          className="object-cover object-bottom block lg:hidden" priority />
        {/* Gradient overlay — ensures text legibility on left (desktop) / top (mobile) */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a2218]/85 via-[#0a2218]/40 to-transparent hidden lg:block pointer-events-none" />
        <div className="absolute inset-0 block lg:hidden pointer-events-none" style={{ background: 'linear-gradient(to bottom, #0a2218 0%, #0a2218 55%, rgba(10,34,24,0.7) 75%, transparent 100%)' }} />
        {/* Content */}
        <div className="relative pt-14 pb-16 lg:pt-20 lg:pb-32">
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
                alt={tx.live.imgAlt}
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
                  alt={tx.stats.imgAlt}
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
            <div
              className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-5 overflow-x-auto sm:overflow-visible snap-x snap-mandatory sm:snap-none px-4 sm:px-0 pb-4 sm:pb-0"
              onScroll={e => {
                const el = e.currentTarget
                const count = tx.features.items.length
                const step = (el.scrollWidth - el.clientWidth) / Math.max(1, count - 1)
                setFeatDot(Math.min(count - 1, Math.max(0, Math.round(el.scrollLeft / Math.max(1, step)))))
              }}
            >
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
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === featDot ? 'bg-emerald-400' : 'bg-white/20'}`} />
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
      <section id="pricing" className="bg-gray-50 py-16 lg:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-[2rem] sm:text-[2.4rem] font-black tracking-tight mb-3" style={{ letterSpacing: '-.03em' }}>{tx.pricing.h2}</h2>
            <p className="text-gray-400 text-base">{tx.pricing.sub}</p>
          </div>

          {/* Billing tabs */}
          <div className="flex justify-center mb-8">
            <div className="flex bg-white border border-gray-200 rounded-2xl p-1 gap-1 shadow-sm">
              {(['monthly', 'annual'] as const).map(b => (
                <button key={b} onClick={() => setBilling(b)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${billing === b ? 'bg-gray-900 text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}>
                  {tx.pricing.tabs[b]}
                  {b === 'annual' && (
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full transition-colors ${billing === 'annual' ? 'bg-emerald-400/20 text-emerald-300' : 'bg-emerald-100 text-emerald-600'}`}>{tx.pricing.annualBadge}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-5 items-stretch mt-5">

            {/* ── Free ── */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 flex flex-col">
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-[.12em] mb-3">{tx.pricing.free.name}</div>
              <div className="flex items-baseline gap-1.5 mb-2">
                <span className="text-4xl font-black text-gray-900 tracking-tight">0 ₸</span>
              </div>
              <span className="inline-block text-xs font-semibold text-gray-500 bg-gray-100 rounded-lg px-3 py-1.5 self-start">{tx.pricing.free.limit}</span>
              <div className="border-t border-gray-100 mt-5 mb-4" />
              <ul className="space-y-2 flex-1 mb-5">
                {tx.pricing.features.map(f => (
                  <li key={f.label} className={`flex items-start gap-2 text-[13px] ${f.free ? 'text-gray-700' : 'text-gray-300'}`}>
                    {f.free
                      ? <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      : <X className="w-3.5 h-3.5 text-gray-200 mt-0.5 shrink-0" />}
                    {f.label}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block text-center bg-gray-900 hover:bg-gray-700 text-white font-bold py-3 rounded-2xl transition-colors text-sm">
                {tx.pricing.free.cta}
              </Link>
            </div>

            {/* ── PRO ── */}
            <div className="relative flex flex-col">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap">
                <span className="bg-emerald-950 text-emerald-200 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                  {tx.pricing.pro.badge}
                </span>
              </div>
              <div className="relative rounded-3xl p-6 flex flex-col flex-1 overflow-hidden" style={{ background: 'linear-gradient(145deg,#047857 0%,#059669 60%,#10b981 100%)' }}>
                <div className="absolute inset-0 pointer-events-none opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                <div className="relative z-10 flex flex-col flex-1">
                  <div className="text-[10px] font-black text-emerald-300 uppercase tracking-[.12em] mb-3">{tx.pricing.pro.name}</div>
                  {billing === 'monthly' ? (
                    <div className="flex items-baseline gap-1.5 mb-2">
                      <span className="text-4xl font-black text-white tracking-tight">{tx.pricing.pro.priceMonthly}</span>
                      <span className="text-sm text-emerald-200 font-medium">{tx.pricing.pro.perMonthly}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-1.5 mb-1">
                        <span className="text-4xl font-black text-white tracking-tight">{tx.pricing.pro.priceAnnual}</span>
                        <span className="text-sm text-emerald-200 font-medium">{tx.pricing.pro.perAnnual}</span>
                      </div>
                      <div className="text-sm text-emerald-200/60 mb-2">{tx.pricing.pro.priceOriginalAnnual}</div>
                      <div className="inline-flex items-center gap-1.5 self-start bg-emerald-950/40 rounded-xl px-3 py-1 mb-1">
                        <Star className="w-3 h-3 text-yellow-400" fill="currentColor" />
                        <span className="text-xs font-bold text-emerald-100">{tx.pricing.pro.savingAnnual}</span>
                      </div>
                    </>
                  )}
                  <div className="border-t border-emerald-400/20 mt-5 mb-4" />
                  <ul className="space-y-2 flex-1 mb-5">
                    {tx.pricing.features.flatMap((f, i) => {
                      const rows = []
                      if (i === 5) rows.push(
                        <li key="sep-pro" className="flex items-center gap-2 pt-2 pb-0.5">
                          <span className="flex-1 h-px bg-emerald-400/20" />
                          <span className="text-[9px] font-black text-emerald-200/60 uppercase tracking-widest">{tx.pricing.groupLabels.pro}</span>
                          <span className="flex-1 h-px bg-emerald-400/20" />
                        </li>
                      )
                      if (i === 9) rows.push(
                        <li key="sep-ent" className="flex items-center gap-2 pt-2 pb-0.5">
                          <span className="flex-1 h-px bg-emerald-400/10" />
                          <span className="text-[9px] font-black text-emerald-300/30 uppercase tracking-widest">{tx.pricing.groupLabels.enterprise}</span>
                          <span className="flex-1 h-px bg-emerald-400/10" />
                        </li>
                      )
                      rows.push(
                        <li key={f.label} className={`flex items-start gap-2 text-[13px] ${f.pro ? 'text-emerald-50' : 'text-emerald-300/35'}`}>
                          {f.pro
                            ? <Check className="w-3.5 h-3.5 text-emerald-300 mt-0.5 shrink-0" />
                            : <X className="w-3.5 h-3.5 text-emerald-300/25 mt-0.5 shrink-0" />}
                          {f.label}
                        </li>
                      )
                      return rows
                    })}
                  </ul>
                  <Link href="/register?next=/checkout" className="block text-center bg-white text-emerald-700 hover:bg-emerald-50 font-black py-3 rounded-2xl transition-colors shadow-xl shadow-black/20 text-sm">
                    {tx.pricing.pro.cta}
                  </Link>
                </div>
              </div>
            </div>

            {/* ── Enterprise ── */}
            <div className="relative flex flex-col">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap">
                <span className="bg-purple-950 text-purple-200 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                  {tx.pricing.enterprise.badge}
                </span>
              </div>
              <div className="bg-white border-2 border-purple-200 rounded-3xl p-6 flex flex-col flex-1 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl" style={{ background: 'linear-gradient(90deg,#7c3aed,#a855f7)' }} />
                <div className="text-[10px] font-black text-purple-500 uppercase tracking-[.12em] mb-3">{tx.pricing.enterprise.name}</div>
                {billing === 'monthly' ? (
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-2xl font-black text-gray-900 tracking-tight">{tx.pricing.enterprise.priceMonthly}</span>
                    <span className="text-sm text-gray-500 font-medium">{tx.pricing.enterprise.perMonthly}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline gap-1.5 mb-1">
                      <span className="text-2xl font-black text-gray-900 tracking-tight">{tx.pricing.enterprise.priceAnnual}</span>
                      <span className="text-sm text-gray-500 font-medium">{tx.pricing.enterprise.perAnnual}</span>
                    </div>
                    <div className="text-sm text-gray-400 mb-2">{tx.pricing.enterprise.priceOriginalAnnual}</div>
                    <div className="inline-flex items-center gap-1.5 self-start bg-purple-50 rounded-xl px-3 py-1 mb-1">
                      <Star className="w-3 h-3 text-purple-400" fill="currentColor" />
                      <span className="text-xs font-bold text-purple-600">{tx.pricing.enterprise.savingAnnual}</span>
                    </div>
                  </>
                )}
                <p className="text-xs text-gray-400 mt-2">{tx.pricing.enterprise.sub}</p>
                <div className="border-t border-purple-100 mt-5 mb-4" />
                <ul className="space-y-2 flex-1 mb-5">
                  {tx.pricing.features.flatMap((f, i) => {
                    const rows = []
                    if (i === 9) rows.push(
                      <li key="sep-ent" className="flex items-center gap-2 pt-2 pb-0.5">
                        <span className="flex-1 h-px bg-purple-200" />
                        <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">{tx.pricing.groupLabels.enterprise}</span>
                        <span className="flex-1 h-px bg-purple-200" />
                      </li>
                    )
                    rows.push(
                      <li key={f.label} className={`flex items-start gap-2 text-[13px] ${f.enterprise ? 'text-gray-700' : 'text-gray-300'}`}>
                        {f.enterprise
                          ? <Check className="w-3.5 h-3.5 text-purple-500 mt-0.5 shrink-0" />
                          : <X className="w-3.5 h-3.5 text-gray-200 mt-0.5 shrink-0" />}
                        {f.label}
                      </li>
                    )
                    return rows
                  })}
                </ul>
                <Link
                  href="/checkout/enterprise"
                  className="block text-center font-black py-3 rounded-2xl transition-colors text-white text-sm"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}
                >
                  {tx.pricing.enterprise.cta}
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Additional Services ──────────────────────────────────────────────── */}
      <section className="py-24 lg:py-28 bg-[#030712]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-[2rem] sm:text-[2.5rem] font-black tracking-tight mb-4 text-white" style={{ letterSpacing: '-.03em' }}>{tx.services.h2}</h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">{tx.services.sub}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 items-stretch">
            {tx.services.items.map((svc) => (
              <div key={svc.title} className="group bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8 hover:bg-white/[0.06] hover:border-white/[0.15] transition-all duration-200 flex flex-col">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 bg-emerald-500/10 shrink-0">
                  {svc.icon === 'video'
                    ? <Video className="w-6 h-6 text-blue-400" />
                    : <Trophy className="w-6 h-6 text-emerald-400" />}
                </div>
                <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                  <h3 className="font-black text-xl text-white leading-tight">{svc.title}</h3>
                  {svc.badge && (
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest bg-blue-500/15 text-blue-300 shrink-0">{svc.badge}</span>
                  )}
                </div>
                <p className="text-gray-400 text-sm leading-relaxed mb-6 flex-1">{svc.desc}</p>
                {svc.price && (
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-3xl font-black text-emerald-400">{svc.price}</span>
                    <span className="text-sm text-gray-500 font-medium">{svc.pricePer}</span>
                  </div>
                )}
                <a
                  href={`https://wa.me/message/YHLE2IFII4MSJ1?text=${encodeURIComponent(`${tx.services.waMessage} — ${svc.title}`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  <IconWhatsApp className="w-4 h-4" /> {tx.services.cta}
                </a>
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
                <div className="font-black text-2xl text-white">{tx.contact.callUs}</div>
              </div>
              <div className="relative z-10 inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors self-start">
                {tx.contact.phone} <ArrowRight className="w-4 h-4" />
              </div>
            </a>
          </div>

          {/* Email line */}
          <p className="text-center mt-8 text-sm text-gray-400">
            {tx.contact.orEmail}{' '}
            <a href="mailto:info@tournable.app" className="text-emerald-600 font-semibold hover:underline">info@tournable.app</a>
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
                  { href: 'https://instagram.com/tournable.app', Icon: IconInstagram },
                  { href: 'https://tiktok.com/@tournable4', Icon: IconTikTok },
                  { href: 'https://t.me/tournable', Icon: IconTelegram },
                ].map(({ href, Icon }) => (
                  <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors">
                    <Icon className="w-4 h-4 text-gray-400" />
                  </a>
                ))}
                <a href="mailto:info@tournable.app" className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors">
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
                {([['/login', tx.footer.links.login], ['/register', tx.footer.links.register], ['/register?next=/checkout', tx.footer.links.pro]] as [string,string][]).map(([href, label]) => (
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
                <li><a href="mailto:info@tournable.app" className="text-sm text-gray-500 hover:text-white transition-colors">info@tournable.app</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-600 flex items-center gap-2">
              {tx.footer.legal}
              <span className="inline-flex items-center gap-1.5 border border-gray-800 rounded-full px-2.5 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />
                <span className="text-gray-500 font-semibold">Made in Kazakhstan</span>
              </span>
            </p>
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

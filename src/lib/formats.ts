// Tournament format names and one-line explanations, shared by the creation
// wizard and the public sport landing pages so both describe a format the same way.

import type { Format, Lang } from '@/lib/sports'

export const FORMAT_LABELS: Record<Format, Record<Lang, string>> = {
  round_robin:    { ru: 'Круговой',              kz: 'Айналмалы',               en: 'Round-robin' },
  playoff:        { ru: 'Плей-офф',              kz: 'Плей-офф',                en: 'Playoff' },
  double_elim:    { ru: 'Двойное выбывание',     kz: 'Қос шығару',              en: 'Double Elimination' },
  groups_playoff: { ru: 'Групповой + Плей-офф',  kz: 'Топтар + Плей-офф',       en: 'Groups + Playoff' },
  league_playoff: { ru: 'Лига + Плей-офф',       kz: 'Лига + Плей-офф',         en: 'League + Playoff' },
  swiss:          { ru: 'Швейцарская система',   kz: 'Швейцариялық жүйе',       en: 'Swiss system' },
  leaderboard:    { ru: 'Рейтинг / очки',        kz: 'Рейтинг / ұпай',          en: 'Leaderboard' },
}

export const FORMAT_DESCS: Record<Format, Record<Lang, string>> = {
  round_robin:    { ru: 'Каждая команда играет с каждой. Идеально для лиг и чемпионатов.',           kz: 'Барлығы барлығымен ойнайды. Лигалар мен чемпионаттарға өте қолайлы.',   en: 'Every team plays each other. Ideal for leagues and championships.' },
  playoff:        { ru: 'Сетка на выбывание. Идеально для кубков и разовых турниров.',               kz: 'Жою сеткасы. Кубоктар мен бір реттік турнирлерге өте қолайлы.',         en: 'Elimination bracket. Perfect for cups and single-event tournaments.' },
  double_elim:    { ru: 'Две сетки: проигравший в верхней падает в нижнюю и получает второй шанс. Стандарт для киберспорта и единоборств. Нужно 4, 8, 16 или 32 участника.', kz: 'Екі тор: жоғарғыда жеңілген төменгіге түсіп, екінші мүмкіндік алады. Киберспорт пен жекпе-жекке стандарт. 4, 8, 16 немесе 32 қатысушы қажет.', en: 'Two brackets: a loss in the upper bracket drops you to the lower one for a second chance. The standard for esports and combat sports. Requires 4, 8, 16 or 32 participants.' },
  groups_playoff: { ru: 'Командки делятся на группы, потом лучшие встречаются в плей-офф.',          kz: 'Командалар топтарға бөлінеді, содан кейін үздіктер плей-оффта кездеседі.', en: 'Teams split into groups, then the best meet in a playoff bracket.' },
  league_playoff: { ru: 'Все играют в единой таблице, топ команды выходят в плей-офф.',             kz: 'Барлығы бір кестеде ойнайды, үздік командалар плей-оффқа шығады.',      en: 'All teams play in one table, top teams advance to playoff bracket.' },
  swiss:          { ru: 'Фиксированное число туров, соперников подбирают по очкам. Для шахмат, киберспорта и большого числа участников — без выбывания.', kz: 'Турлардың белгіленген саны, қарсыластар ұпай бойынша таңдалады. Шахмат, киберспорт және көп қатысушыға — шығарусыз.', en: 'A fixed number of rounds; opponents are matched by score. For chess, esports and large fields — no elimination.' },
  leaderboard:    { ru: 'Ранжирование по сумме очков за раунды — без пар. Для гонок, battle royale, лёгкой атлетики, шахматной «арены».', kz: 'Раундтар бойынша ұпай қосындысымен ранжирлеу — жұпсыз. Жарыстар, battle royale, жеңіл атлетика үшін.', en: 'Ranking by total points across rounds — no head-to-head. For races, battle royale, athletics, chess arena.' },
}

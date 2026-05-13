interface BracketMatch {
  id: string
  round_order: number
  match_order: number
  home_team_id: string | null
  away_team_id: string | null
  winner_to_match: number | null  // target round_order
  winner_slot: 'home' | 'away'
}

function nextPow2(n: number): number {
  let p = 1
  while (p < n) p <<= 1
  return p
}

export function generatePlayoffBracket(teamIds: string[]): BracketMatch[] {
  const size = nextPow2(teamIds.length)
  const seeded = [...teamIds]
  while (seeded.length < size) seeded.push('')  // byes

  const matches: BracketMatch[] = []
  let roundOrder = size / 2  // First round: size/2 (e.g. 8 teams → round_order 4)

  // Build all rounds from first round to final
  let teamsInRound = size
  while (teamsInRound >= 2) {
    const matchCount = teamsInRound / 2
    const prevRoundOrder = roundOrder / 2
    for (let i = 0; i < matchCount; i++) {
      const isFirstRound = teamsInRound === size
      matches.push({
        id: `${roundOrder}:${i + 1}`,
        round_order: roundOrder,
        match_order: i + 1,
        home_team_id: isFirstRound ? (seeded[i * 2] || null) : null,
        away_team_id: isFirstRound ? (seeded[i * 2 + 1] || null) : null,
        winner_to_match: roundOrder > 1 ? prevRoundOrder : null,
        winner_slot: (i % 2 === 0) ? 'home' : 'away',
      })
    }
    teamsInRound /= 2
    roundOrder /= 2
  }

  return matches
}

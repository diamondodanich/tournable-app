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

/**
 * Returns an array of seed-position indices for a fair seeded bracket of the given size.
 * Pairs are (positions[0], positions[1]), (positions[2], positions[3]), etc.
 *
 * Examples:
 *   size=2: [0,1]          → seed1 vs seed2
 *   size=4: [0,3,1,2]      → (1v4), (2v3)
 *   size=8: [0,7,3,4,1,6,2,5] → (1v8), (4v5), (2v7), (3v6)
 *
 * This ensures:
 *  - Strongest seeds only meet in late rounds
 *  - Both halves of the bracket receive the same number of teams
 *  - Byes (appended at the end of seeded[]) go to the highest seeds automatically
 */
export function seededBracketPositions(size: number): number[] {
  if (size === 2) return [0, 1]
  const half = seededBracketPositions(size / 2)
  const result: number[] = []
  for (const p of half) {
    result.push(p, size - 1 - p)
  }
  return result
}

export function generatePlayoffBracket(teamIds: string[]): BracketMatch[] {
  const size = nextPow2(teamIds.length)
  const seeded = [...teamIds]
  // Byes appended at the end → highest seeds receive byes
  while (seeded.length < size) seeded.push('')

  // Fair seeding positions: each pair is one first-round match
  const positions = seededBracketPositions(size)

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
        home_team_id: isFirstRound ? (seeded[positions[i * 2]] || null) : null,
        away_team_id: isFirstRound ? (seeded[positions[i * 2 + 1]] || null) : null,
        winner_to_match: roundOrder > 1 ? prevRoundOrder : null,
        winner_slot: (i % 2 === 0) ? 'home' : 'away',
      })
    }
    teamsInRound /= 2
    roundOrder /= 2
  }

  return matches
}

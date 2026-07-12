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

// ── Double Elimination ──────────────────────────────────────────────────────

export interface DEMatch {
  key: string                       // stable key `WB:r:m` used to resolve cross-links
  bracket: 'WB' | 'LB' | 'GF'
  round_order: number
  match_order: number
  home_team_id: string | null
  away_team_id: string | null
  winner_to_match_key: string | null
  winner_slot: 'home' | 'away'
  loser_to_match_key: string | null
  loser_slot: 'home' | 'away'
}

/**
 * Builds a full double-elimination bracket (Winners + Losers + single Grand Final).
 *
 * Requires an EXACT power of two of at least 4 teams (4, 8, 16, 32, …). Byes in a
 * double-elimination bracket require cascading auto-advances through the losers
 * bracket that are easy to get subtly wrong, so we keep v1 correct-by-construction
 * and let the caller (wizard) enforce the count. Returns [] on an invalid size.
 *
 * Structure for size = 2^k:
 *   • WB has k rounds (round_order size/2 … 1). Standard seeded single-elim bracket.
 *   • LB has 2(k-1) rounds. "Minor" (odd) rounds pair survivors among themselves;
 *     "major" (even) rounds pair a survivor against a fresh WB drop-down.
 *   • The Grand Final is one match: WB champion (home) vs LB champion (away).
 *
 * The Grand Final is a single game — there is no bracket-reset second match.
 */
export function generateDoubleElimBracket(teamIds: string[]): DEMatch[] {
  const n = teamIds.length
  if (n < 4 || (n & (n - 1)) !== 0) return []   // must be a power of two ≥ 4

  const size = n
  const k = Math.log2(size)                       // number of WB rounds
  const positions = seededBracketPositions(size)

  const wbKey = (r: number, m: number) => `WB:${r}:${m}`
  const lbKey = (lb: number, m: number) => `LB:${lb}:${m}`
  const gfKey = 'GF:1:1'

  const matches: DEMatch[] = []

  // ── Winners bracket ──────────────────────────────────────────────────────
  // Round r (1 = first, k = WB final). round_order mirrors single-elim (size/2 … 1).
  for (let r = 1; r <= k; r++) {
    const matchCount = size / 2 ** r
    const roundOrder = size / 2 ** r
    for (let m = 0; m < matchCount; m++) {
      // Winner routing
      let winnerKey: string | null
      let winnerSlot: 'home' | 'away'
      if (r < k) {
        winnerKey = wbKey(r + 1, Math.floor(m / 2))
        winnerSlot = m % 2 === 0 ? 'home' : 'away'
      } else {
        winnerKey = gfKey            // WB champion → Grand Final (home)
        winnerSlot = 'home'
      }
      // Loser routing (drops into the losers bracket)
      let loserKey: string
      let loserSlot: 'home' | 'away'
      if (r === 1) {
        // WB round-1 losers fill both slots of LB round 1
        loserKey = lbKey(1, Math.floor(m / 2))
        loserSlot = m % 2 === 0 ? 'home' : 'away'
      } else {
        // WB round-r (r ≥ 2) losers enter the "away" slot of LB major round 2(r-1)
        loserKey = lbKey(2 * (r - 1), m)
        loserSlot = 'away'
      }
      const isFirst = r === 1
      matches.push({
        key: wbKey(r, m),
        bracket: 'WB',
        round_order: roundOrder,
        match_order: m + 1,
        home_team_id: isFirst ? (teamIds[positions[m * 2]] ?? null) : null,
        away_team_id: isFirst ? (teamIds[positions[m * 2 + 1]] ?? null) : null,
        winner_to_match_key: winnerKey,
        winner_slot: winnerSlot,
        loser_to_match_key: loserKey,
        loser_slot: loserSlot,
      })
    }
  }

  // ── Losers bracket ───────────────────────────────────────────────────────
  const lbRounds = 2 * (k - 1)
  for (let lb = 1; lb <= lbRounds; lb++) {
    const isMinor = lb % 2 === 1
    const j = Math.floor((lb + 1) / 2)     // "pair" index: lb 1,2 → 1 · lb 3,4 → 2 …
    const matchCount = size / 2 ** (j + 1)
    for (let m = 0; m < matchCount; m++) {
      let winnerKey: string | null
      let winnerSlot: 'home' | 'away'
      if (lb < lbRounds) {
        if (isMinor) {
          // Minor-round winner meets a WB drop-down in the next (major) round
          winnerKey = lbKey(lb + 1, m)
          winnerSlot = 'home'
        } else {
          // Major-round winners pair up in the next (minor) round
          winnerKey = lbKey(lb + 1, Math.floor(m / 2))
          winnerSlot = m % 2 === 0 ? 'home' : 'away'
        }
      } else {
        winnerKey = gfKey            // LB champion → Grand Final (away)
        winnerSlot = 'away'
      }
      matches.push({
        key: lbKey(lb, m),
        bracket: 'LB',
        round_order: lb,
        match_order: m + 1,
        home_team_id: null,
        away_team_id: null,
        winner_to_match_key: winnerKey,
        winner_slot: winnerSlot,
        loser_to_match_key: null,     // LB losers are eliminated
        loser_slot: 'home',
      })
    }
  }

  // ── Grand Final ──────────────────────────────────────────────────────────
  matches.push({
    key: gfKey,
    bracket: 'GF',
    round_order: 1,
    match_order: 1,
    home_team_id: null,
    away_team_id: null,
    winner_to_match_key: null,
    winner_slot: 'home',
    loser_to_match_key: null,
    loser_slot: 'home',
  })

  return matches
}

/**
 * Turns a double-elim bracket into DB-ready rows with resolved UUIDs, ready to
 * insert into `playoff_matches`. Returns [] for an invalid team count.
 */
export function buildDoubleElimRows(tournamentId: string, teamIds: string[]): Record<string, unknown>[] {
  const matches = generateDoubleElimBracket(teamIds)
  if (matches.length === 0) return []

  const idByKey = new Map<string, string>()
  matches.forEach(m => idByKey.set(m.key, crypto.randomUUID()))

  return matches.map(m => ({
    id: idByKey.get(m.key),
    tournament_id: tournamentId,
    bracket: m.bracket,
    round_order: m.round_order,
    match_order: m.match_order,
    home_team_id: m.home_team_id,
    away_team_id: m.away_team_id,
    winner_slot: m.winner_slot,
    winner_to_match: m.winner_to_match_key ? idByKey.get(m.winner_to_match_key) ?? null : null,
    loser_slot: m.loser_to_match_key ? m.loser_slot : null,
    loser_to_match: m.loser_to_match_key ? idByKey.get(m.loser_to_match_key) ?? null : null,
  }))
}

export function isPowerOfTwo(n: number): boolean {
  return n >= 4 && (n & (n - 1)) === 0
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

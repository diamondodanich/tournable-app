export type Tournament = {
  id: string
  user_id: string
  name: string
  num_rounds: number
  generated: boolean
  format: 'round_robin' | 'playoff' | 'groups_playoff' | 'league_playoff' | 'swiss' | 'leaderboard' | 'double_elim'
  logo_url: string | null
  // Multi-format fields
  groups_count: number | null   // groups_playoff: number of groups
  teams_advance: number | null  // groups_playoff: per-group advance; league_playoff: total advance
  // Match rules
  match_periods: number       // 1 or 2 halves
  extra_time: boolean         // show OT tab on live board
  match_duration_mins: number // per period
  // Points system
  points_win: number
  points_draw: number
  points_loss: number
  // Sport (subtype value, e.g. 'football', 'basketball', 'efootball')
  sport: string | null
  cover_url: string | null
  slug: string | null
  is_public: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type Team = {
  id: string
  tournament_id: string
  name: string
  logo_url: string | null
  group_name: string | null
  league_team_id: string | null  // persistent championship team this represents (carries stats across seasons)
  created_at: string
}

export type FixtureStatus = 'scheduled' | 'live' | 'finished'

export type Fixture = {
  id: string
  tournament_id: string
  matchday: number
  round: number
  cycle_round: number
  home_team_id: string | null
  away_team_id: string | null
  home_score: number | null
  away_score: number | null
  played: boolean
  is_bye: boolean
  status: FixtureStatus
  created_at: string
  home_team?: Team
  away_team?: Team
  match_events?: MatchEvent[]
}

export type MatchEvent = {
  id: string
  fixture_id: string | null
  playoff_match_id?: string | null
  team_id: string
  player_name: string
  player_id?: string | null
  // Discipline-defined event type (see EventDef in lib/sports.ts). Stored as text;
  // football/hockey use goal/own_goal/assist/cards, other sports use their own set.
  type: string
  minute: number | null
  created_at: string
}

export type StandingRow = {
  teamId: string
  name: string
  logoUrl: string | null
  GP: number
  W: number
  D: number
  L: number
  GF: number
  GA: number
  GD: number
  Pts: number
  form: ('W' | 'D' | 'L')[]
}

export type PlayoffMatch = {
  id: string
  tournament_id: string
  round_order: number
  match_order: number
  home_team_id: string | null
  away_team_id: string | null
  home_score: number | null
  away_score: number | null
  winner_id: string | null
  winner_to_match: string | null
  winner_slot: 'home' | 'away' | null
  best_of?: number
  two_legged?: boolean
  // Double elimination (migration 033) — absent/NULL on single-elim brackets
  bracket?: 'WB' | 'LB' | 'GF' | null
  loser_to_match?: string | null
  loser_slot?: 'home' | 'away' | null
  created_at: string
  match_events?: MatchEvent[]
}

export type LiveGame = {
  id: string
  tournament_id: string
  fixture_id: string | null
  playoff_match_id?: string | null
  home_team_id: string | null
  away_team_id: string | null
  home_score: number
  away_score: number
  period: string
  timer_running: boolean
  accumulated_secs: number
  started_at: string | null
  created_at: string
}

// ── League system ─────────────────────────────────────────────────────────────

export type League = {
  id: string
  owner_id: string
  name: string
  slug: string
  sport: string | null
  logo_url: string | null
  description: string | null
  city: string | null
  country: string
  meta_title: string | null
  meta_description: string | null
  is_public: boolean
  created_at: string
}

export type Season = {
  id: string
  league_id: string
  tournament_id: string | null
  name: string
  status: 'active' | 'finished'
  start_date: string | null
  end_date: string | null
  created_at: string
}

export type LeagueTeam = {
  id: string
  league_id: string
  name: string
  slug: string
  logo_url: string | null
  city: string | null
  created_at: string
}

export type Player = {
  id: string
  league_team_id: string
  name: string
  number: number | null
  position: 'goalkeeper' | 'defender' | 'midfielder' | 'forward' | 'other'
  photo_url: string | null
  created_at: string
}

export type TeamPlayer = {
  id: string
  team_id: string
  name: string
  number: number | null
  position: 'goalkeeper' | 'defender' | 'midfielder' | 'forward' | 'other'
  photo_url: string | null
  created_at: string
}

export type MatchLineup = {
  id: string
  fixture_id: string
  team_id: string
  player_id: string
  role: 'starter' | 'sub'
  slot: number | null
  created_at: string
}

export type TournamentMember = {
  id: string
  tournament_id: string
  user_id: string | null
  role: 'editor' | 'viewer'
  status: 'pending' | 'accepted'
  invite_token: string | null
  invited_email: string | null
  created_at: string
}

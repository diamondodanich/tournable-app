export type Tournament = {
  id: string
  user_id: string
  name: string
  num_rounds: number
  generated: boolean
  format: 'round_robin' | 'playoff' | 'groups_playoff' | 'league_playoff'
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
  created_at: string
  updated_at: string
}

export type Team = {
  id: string
  tournament_id: string
  name: string
  logo_url: string | null
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
  type: 'goal' | 'own_goal' | 'assist' | 'yellow_card' | 'red_card'
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

export type TournamentMember = {
  id: string
  tournament_id: string
  user_id: string | null
  role: 'editor' | 'viewer'
  status: 'pending' | 'accepted'
  invite_token: string | null
  created_at: string
}

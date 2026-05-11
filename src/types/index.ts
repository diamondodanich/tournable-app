export type Tournament = {
  id: string
  user_id: string
  name: string
  num_rounds: number
  generated: boolean
  created_at: string
  updated_at: string
}

export type Team = {
  id: string
  tournament_id: string
  name: string
  created_at: string
}

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
  created_at: string
  home_team?: Team
  away_team?: Team
  scorers?: Scorer[]
}

export type Scorer = {
  id: string
  fixture_id: string
  team_id: string
  player_name: string
  created_at: string
}

export type StandingRow = {
  teamId: string
  name: string
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

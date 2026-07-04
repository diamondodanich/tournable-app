// Automated Supabase migration runner.
//
// Applies pending SQL files from supabase/migrations/ in order, tracking applied
// ones in a public._migrations table. Reads DATABASE_URL (or DIRECT_URL) from env
// — get it from Supabase → Project Settings → Database → Connection string (URI).
//
// Usage:  DATABASE_URL="postgresql://..." node scripts/migrate.mjs
// First run baselines all existing migrations (marks them applied WITHOUT running,
// since they were already applied manually). Set MIGRATE_NO_BASELINE=1 to force-run.

import postgres from 'postgres'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

// Load DATABASE_URL from .env.local if not already in the environment.
function loadEnv() {
  if (process.env.DATABASE_URL || process.env.DIRECT_URL) return
  const p = join(process.cwd(), '.env.local')
  if (!existsSync(p)) return
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*(DATABASE_URL|DIRECT_URL)\s*=\s*(.+?)\s*$/)
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
loadEnv()

const url = process.env.DATABASE_URL || process.env.DIRECT_URL
if (!url) {
  console.log('[migrate] DATABASE_URL not set — skipping (add it to .env.local or the environment).')
  process.exit(0)
}

const dir = join(process.cwd(), 'supabase', 'migrations')
const files = readdirSync(dir).filter(f => f.endsWith('.sql')).sort()
const sql = postgres(url, { max: 1, ssl: 'require', onnotice: () => {} })

try {
  await sql`create table if not exists public._migrations (name text primary key, applied_at timestamptz not null default now())`
  const rows = await sql`select name from public._migrations`
  const applied = new Set(rows.map(r => r.name))

  if (applied.size === 0 && !process.env.MIGRATE_NO_BASELINE) {
    // First run: existing migrations were applied manually — baseline them.
    if (files.length) await sql`insert into public._migrations ${sql(files.map(name => ({ name })))}`
    console.log(`[migrate] baselined ${files.length} existing migration(s) as applied (no SQL run).`)
    console.log('[migrate] future migrations will apply automatically.')
    await sql.end()
    process.exit(0)
  }

  let count = 0
  for (const f of files) {
    if (applied.has(f)) continue
    process.stdout.write(`[migrate] applying ${f} ... `)
    await sql.unsafe(readFileSync(join(dir, f), 'utf8'))
    await sql`insert into public._migrations (name) values (${f})`
    console.log('ok')
    count++
  }
  console.log(count ? `[migrate] applied ${count} migration(s).` : '[migrate] up to date.')
  await sql.end()
} catch (e) {
  console.error('[migrate] FAILED:', e.message)
  await sql.end({ timeout: 5 }).catch(() => {})
  process.exit(1)
}

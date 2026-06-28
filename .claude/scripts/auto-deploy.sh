#!/usr/bin/env bash
# Auto CI/CD pipeline — runs as Stop hook after every Claude session
# Flow: TS check → commit → push → (merge main if on branch) → Vercel deploy

BRANCH=$(git branch --show-current 2>/dev/null)
[ -z "$BRANCH" ] && exit 0

# ── 1. Any uncommitted changes? ───────────────────────────────────────────────
CHANGED=$(git status --porcelain 2>/dev/null)
[ -z "$CHANGED" ] && exit 0

# ── 2. TypeScript check (gate before commit) ──────────────────────────────────
TSC_OUT=$(npx --no-install tsc --noEmit 2>&1)
if [ $? -ne 0 ]; then
  ERRORS=$(echo "$TSC_OUT" | grep "error TS" | head -5 | \
           sed 's/\\/\//g' | tr '\n' ' ')
  printf '{"systemMessage":"[auto-ci] TypeScript ошибки — коммит отменён. Исправь:\n%s"}' "$ERRORS"
  exit 2
fi

# ── 3. Commit ─────────────────────────────────────────────────────────────────
git add -A 2>/dev/null
if ! git diff --staged --quiet 2>/dev/null; then
  STAT=$(git diff --cached --stat 2>/dev/null | tail -1 | xargs)
  git commit --quiet -m "auto: ${STAT:-changes} ($(date '+%H:%M'))" 2>/dev/null
fi

# ── 4. Push ───────────────────────────────────────────────────────────────────
if [ "$BRANCH" = "main" ]; then
  # Working directly on main — just push
  git push origin main --quiet 2>/dev/null || true
  printf '{"systemMessage":"[auto-ci] OK — закоммичено и запушено в main. Vercel деплоит..."}'
  exit 0
fi

# ── 5. Push feature branch ────────────────────────────────────────────────────
git push origin "$BRANCH" --quiet 2>/dev/null || \
  git push --set-upstream origin "$BRANCH" --quiet 2>/dev/null || true

# ── 6. Merge into main via main worktree ─────────────────────────────────────
REVIEW=$(git log main..HEAD --oneline 2>/dev/null | head -10)
MAIN_DIR=$(git worktree list --porcelain 2>/dev/null \
           | grep "^worktree " | head -1 | sed "s/^worktree //")
PUSHED=false

if [ -n "$MAIN_DIR" ] && [ "$MAIN_DIR" != "$(pwd)" ]; then
  git -C "$MAIN_DIR" fetch origin "$BRANCH" --quiet 2>/dev/null || true

  if git -C "$MAIN_DIR" merge "origin/$BRANCH" --no-ff --no-edit \
       --quiet -m "merge: auto $BRANCH -> main" 2>/dev/null; then
    if git -C "$MAIN_DIR" push origin main --quiet 2>/dev/null; then
      PUSHED=true
    fi
  else
    git -C "$MAIN_DIR" merge --abort 2>/dev/null || true
    printf '{"systemMessage":"[auto-ci] Конфликт мёрджа в main! Смержи вручную:\ngit -C \"%s\" merge origin/%s"}' \
      "$MAIN_DIR" "$BRANCH"
    exit 2
  fi
fi

if $PUSHED; then
  COMMITS=$(echo "$REVIEW" | wc -l | xargs)
  printf '{"systemMessage":"[auto-ci] OK — %s commit(s) merged в main. Vercel деплоит..."}' "$COMMITS"
else
  printf '{"systemMessage":"[auto-ci] Закоммичено в %s. Main не обновлён (worktree не найден)."}' "$BRANCH"
fi

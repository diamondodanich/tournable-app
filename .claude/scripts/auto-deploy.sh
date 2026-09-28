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
  # Другая сессия (или этот же хук в другой вкладке) могла запушить в main,
  # пока мы работали, — origin ушёл вперёд нашей локальной ветки. Раньше
  # здесь был голый push с "|| true": при отклонении (non-fast-forward)
  # ошибка проглатывалась, а сообщение всё равно бодро рапортовало "OK",
  # хотя коммит так и оставался только локально и никогда не уезжал на
  # GitHub/Vercel. Теперь: сначала подтягиваем origin/main и перекладываем
  # свой коммит поверх, если он успел устареть.
  git fetch origin main --quiet 2>/dev/null || true

  if ! git merge-base --is-ancestor origin/main HEAD 2>/dev/null; then
    if ! git rebase origin/main --quiet 2>/dev/null; then
      git rebase --abort 2>/dev/null || true
      printf '{"systemMessage":"[auto-ci] main ушёл вперёд (другая сессия запушила раньше), автоматический rebase не удался — разреши конфликт вручную:\ngit fetch origin main && git rebase origin/main"}'
      exit 2
    fi
  fi

  if git push origin main --quiet 2>/dev/null; then
    printf '{"systemMessage":"[auto-ci] OK — закоммичено и запушено в main. Vercel деплоит..."}'
    exit 0
  fi

  # Кто-то запушил в узком окне между fetch и push выше — коммит остался
  # только локально. Честно сообщаем об этом вместо ложного "OK".
  printf '{"systemMessage":"[auto-ci] Коммит сделан локально, но push в main не прошёл (кто-то опередил). Разреши вручную:\ngit fetch origin main && git rebase origin/main && git push origin main"}'
  exit 2
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

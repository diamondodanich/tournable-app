// Canonical spelling for player names.
//
// A player's name is the join key for everything that follows: match events store
// it as text, and the player page, all-time championship stats and the clickable
// links in every stats table match on it. "ДАНИЯР", "данияр" and " Данияр " must
// therefore end up as one player, not three — so every write path normalises to
// "Daniyar" / "Жан-Али" / "O'Brien" shape.

export function normalizePlayerName(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(word =>
      // Split on the separators that carry an internal capital: Жан-Али, O'Brien.
      word.split(/([-'’])/).map(part =>
        /^[-'’]$/.test(part) ? part : part.charAt(0).toLocaleUpperCase() + part.slice(1).toLocaleLowerCase()
      ).join('')
    )
    .join(' ')
}
